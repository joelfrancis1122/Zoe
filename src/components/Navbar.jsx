import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, LogOut, Bell } from 'lucide-react';
import { runAudit, logout, setDoubleXp, syncUserState } from '../features/userSlice';
import { playDamageSound, playClickSound, playLevelUpSound } from '../utils/audio';
import './Navbar.css';

const Navbar = memo(function Navbar({ onOpenStats, onOpenShop, onOpenSystems, onOpenBlackMarket, onOpenDarkWeb, onOpenAchievements, onOpenLeaderboard, onOpenAdmin }) {
  const dispatch = useDispatch();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [auditEnabled, setAuditEnabled] = useState(false);
  const [auditStartTime, setAuditStartTime] = useState(0);
  const [auditTimeLeft, setAuditTimeLeft] = useState('');
  
  const { token, role, username, doubleXpEnabled } = useSelector((state) => state.user);
  const { history = [] } = useSelector((state) => state.tasks) || {};

  const [notifications, setNotifications] = useState([]);
  const [showInbox, setShowInbox] = useState(false);
  const lastEventTimestampRef = useRef(null);
  const initialFetchDone = useRef(false);

  // Fetch Global System Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/system', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await res.json();
        if (data.success) {
          setAuditEnabled(data.data.auditEnabled);
          setAuditStartTime(data.data.auditStartTime || Date.now());
          dispatch(setDoubleXp(data.data.doubleXpEnabled || false));

          // Sync with AdminPanel to ensure 2-way perfection
          window.dispatchEvent(new CustomEvent('systemSettingsSynced', { detail: data.data }));

          // Ghost Polling: Check for Real-Time Events
          if (data.data.lastEvent && data.data.lastEvent.timestamp) {
            const ev = data.data.lastEvent;
            if (!initialFetchDone.current) {
              lastEventTimestampRef.current = ev.timestamp;
              initialFetchDone.current = true;
            } else if (ev.timestamp > lastEventTimestampRef.current) {
              lastEventTimestampRef.current = ev.timestamp;
              if (ev.type === 'gift') {
                if (ev.targetUsername === username) {
                  const newNotif = { ...ev, id: ev.timestamp, read: false };
                  setNotifications(prev => [newNotif, ...prev]);
                  playLevelUpSound();
                  if (token) {
                    fetch('/api/sync', { headers: { 'Authorization': `Bearer ${token}` }})
                      .then(r => r.json())
                      .then(syncData => {
                        if (syncData.success) dispatch(syncUserState(syncData.data));
                      }).catch(console.error);
                  }
                }
              } else if (ev.type !== 'doublexp') { // Allow audit and other events into the inbox
                const newNotif = { ...ev, id: ev.timestamp, read: false };
                setNotifications(prev => [newNotif, ...prev]);
                playLevelUpSound();

                // Idempotent State Sync: Pull the new coins/exp/health from the server so the user's HUD instantly updates
                if ((ev.type === 'airdrop' || ev.type === 'heal') && token) {
                  fetch('/api/sync', { headers: { 'Authorization': `Bearer ${token}` }})
                    .then(r => r.json())
                    .then(syncData => {
                      if (syncData.success) {
                        dispatch(syncUserState(syncData.data));
                      }
                    }).catch(console.error);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load system settings", err);
      }
    };
    fetchSettings();
    // Ghost Polling every 1 second for Flawless Real-Time Feel
    const interval = setInterval(fetchSettings, 1000);
    
    window.addEventListener('systemSettingsChanged', fetchSettings);

    const handleOptimistic = (e) => {
      const detail = e.detail || {};
      if (detail.auditEnabled !== undefined) setAuditEnabled(detail.auditEnabled);
      if (detail.doubleXpEnabled !== undefined) dispatch(setDoubleXp(detail.doubleXpEnabled));
    };
    window.addEventListener('optimisticSystemSettings', handleOptimistic);

    return () => {
      clearInterval(interval);
      window.removeEventListener('systemSettingsChanged', fetchSettings);
      window.removeEventListener('optimisticSystemSettings', handleOptimistic);
    };
  }, [dispatch]);

  // Audit Timer Logic
  // Global Deterministic Audit Timer
  useEffect(() => {
    const AUDIT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    let lastAuditedBoundary = Math.floor(Math.max(0, Date.now() - auditStartTime) / AUDIT_INTERVAL_MS);

    const timer = setInterval(() => {
      const now = Date.now();
      // Calculate elapsed time since the audit anchor time
      const elapsed = Math.max(0, now - auditStartTime);
      const currentIntervalCount = Math.floor(elapsed / AUDIT_INTERVAL_MS);
      
      // If we crossed into a new global interval boundary since we started listening, trigger the audit!
      if (currentIntervalCount > lastAuditedBoundary) {
        lastAuditedBoundary = currentIntervalCount;
        if (auditEnabled && elapsed > 1000) { // Ensure we don't trigger immediately on the very first render if elapsed is ~0
          dispatch(runAudit());
          playDamageSound();
        }
      }

      const nextAuditTime = auditStartTime + (currentIntervalCount + 1) * AUDIT_INTERVAL_MS;
      const msLeft = nextAuditTime - now;
      
      const m = Math.floor(msLeft / 60000);
      const s = Math.floor((msLeft % 60000) / 1000);
      setAuditTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch, auditStartTime, auditEnabled]);

  // PERFORMANCE OPTIMIZATION: Guard scroll updates to prevent main thread blocking
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      lastScrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(lastScrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // PERFORMANCE OPTIMIZATION: useCallback for UI event handlers
  const toggleMobileMenu = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    playClickSound();
    dispatch(logout());
  }, [dispatch]);

  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <>
      {doubleXpEnabled && <div className="doublexp-aura" />}
      {doubleXpEnabled && (
        <div className="doublexp-toast glass-card">
          <span className="text-accent" style={{fontWeight: 'bold', letterSpacing: '2px'}}>GLOBAL 2X EXP ACTIVE</span>
        </div>
      )}
      {auditEnabled && <div className="audit-danger-aura" />}
      {auditEnabled && (
        <div className="audit-toast glass-card">
          <Search size={16} className="text-danger" />
          <span className="audit-text">SYSTEM AUDIT IN: {auditTimeLeft}</span>
        </div>
      )}
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="navbar">
      <div className="navbar__inner container">
        <a href="#" className="navbar__logo" id="nav-logo">
          <span className="navbar__logo-mark">⬡</span>
          <span className="navbar__logo-text">Zoë</span>
        </a>

        <ul className="navbar__links" id="nav-links">
          <li><button className="navbar__link" onClick={onOpenStats}>Profile</button></li>
          {/* <li><button className="navbar__link" onClick={onOpenSystems}>Systems</button></li> */}
          <li><button className="navbar__link" onClick={onOpenShop}>Shop</button></li>
          <li><button className="navbar__link" onClick={onOpenLeaderboard}>Leaderboard</button></li>
          {/* <li><button className="navbar__link" onClick={onOpenAchievements}>Achievements</button></li> */}
          <li><button className="navbar__link bm-link" style={{ color: '#a78bfa' }} onClick={onOpenBlackMarket}>Black Market</button></li>
          <li><button className="navbar__link bm-link" style={{ color: '#ef4444', animation: 'pulse-danger 2s infinite' }} onClick={onOpenDarkWeb}>Dark Web</button></li>
          {role === 'admin' && (
            <li><button className="navbar__link admin-link" style={{ color: '#ef4444' }} onClick={onOpenAdmin}>Admin Override</button></li>
          )}
        </ul>

        <div className="navbar__controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center', position: 'relative' }}>
          <div 
            className="navbar__user glass-card" 
            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }} 
            title="Inbox"
            onClick={() => { playClickSound(); setShowInbox(!showInbox); }}
          >
            <Bell size={16} className={notifications.some(n => !n.read) ? 'text-accent' : 'text-primary'} />
            {notifications.some(n => !n.read) && <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 8px #ef4444' }}></span>}
          </div>



          {showInbox && (
            <div className="glass-card" style={{ position: 'absolute', top: '120%', right: '40px', width: '300px', padding: '1rem', zIndex: 100, border: '1px solid rgba(255,255,255,0.1)', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 1rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, color: 'var(--text-main)' }}>INBOX</h4>
                <button onClick={() => setShowInbox(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>&times;</button>
              </div>
              {notifications.length === 0 ? (
                 <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'center' }}>No messages.</div>
              ) : (
                 notifications.map(n => (
                    <div key={n.id} style={{ padding: '0.75rem', background: n.read ? 'rgba(0,0,0,0.2)' : 'rgba(0, 229, 160, 0.05)', border: n.read ? '1px solid transparent' : '1px solid rgba(0, 229, 160, 0.2)', borderRadius: '4px', marginBottom: '0.5rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                         <span style={{ fontSize: '1rem' }}>{n.type === 'airdrop' ? '🎁' : n.type === 'gift' ? '💎' : n.type === 'audit' ? '⚠️' : '💖'}</span>
                         <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: n.read ? 'var(--text-dim)' : n.type === 'audit' ? 'var(--danger)' : 'var(--accent)' }}>SYSTEM MESSAGE</span>
                       </div>
                       <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{n.message}</div>
                       {!n.read && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              playClickSound();
                              // Dismiss the notification completely
                              setNotifications(prev => prev.filter(x => x.id !== n.id));
                            }}
                            style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '2px', cursor: 'pointer' }}
                          >
                            MARK READ
                          </button>
                       )}
                    </div>
                 ))
              )}
            </div>
          )}
          <button className="navbar__logout glass-card" onClick={handleLogout} title="Terminate Link" style={{ cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={14} className="text-danger" />
          </button>
        </div>

        <button
          className={`navbar__burger ${mobileOpen ? 'navbar__burger--open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          id="nav-burger"
        >
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`navbar__mobile ${mobileOpen ? 'navbar__mobile--open' : ''}`}>
        <ul className="navbar__mobile-links">
          <li><button className="navbar__mobile-link" onClick={() => { onOpenStats(); closeMobileMenu(); }}>Profile</button></li>
          {/* <li><button className="navbar__mobile-link" onClick={() => { onOpenSystems(); closeMobileMenu(); }}>Systems</button></li> */}
          <li><button className="navbar__mobile-link" onClick={() => { onOpenShop(); closeMobileMenu(); }}>Shop</button></li>
          <li><button className="navbar__mobile-link" onClick={() => { onOpenLeaderboard(); closeMobileMenu(); }}>Leaderboard</button></li>
          {/* <li><button className="navbar__mobile-link" onClick={() => { onOpenAchievements(); closeMobileMenu(); }}>Achievements</button></li> */}
          <li><button className="navbar__mobile-link bm-link" style={{ color: '#a78bfa' }} onClick={() => { onOpenBlackMarket(); closeMobileMenu(); }}>Black Market</button></li>
          <li><button className="navbar__mobile-link bm-link" style={{ color: '#ef4444' }} onClick={() => { onOpenDarkWeb(); closeMobileMenu(); }}>Dark Web</button></li>
          {role === 'admin' && (
            <li><button className="navbar__mobile-link admin-link" style={{ color: '#ef4444' }} onClick={() => { onOpenAdmin(); closeMobileMenu(); }}>Admin Override</button></li>
          )}
          <li>
            <button className="navbar__mobile-link" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }} onClick={() => { handleLogout(); closeMobileMenu(); }}>
              <LogOut size={16} /> TERMINATE LINK
            </button>
          </li>
        </ul>
      </div>
    </nav>
    </>
  );
});

export default Navbar;
