import { useState, useEffect, useCallback, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, LogOut, User as UserIcon } from 'lucide-react';
import { runAudit, logout } from '../features/userSlice';
import { playDamageSound, playClickSound } from '../utils/audio';
import './Navbar.css';

const Navbar = memo(function Navbar({ onOpenStats, onOpenRecords, onOpenShop, onOpenSystems, onOpenBlackMarket, onOpenLeaderboard, onOpenAdmin }) {
  const dispatch = useDispatch();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [auditEnabled, setAuditEnabled] = useState(true);
  const [auditStartTime, setAuditStartTime] = useState(0);
  const [auditTimeLeft, setAuditTimeLeft] = useState('');
  
  const { role, username } = useSelector((state) => state.user);

  // Fetch Global System Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/system');
        const data = await res.json();
        if (data.success) {
          setAuditEnabled(data.data.auditEnabled);
          setAuditStartTime(data.data.auditStartTime || Date.now());
        }
      } catch (err) {
        console.error("Failed to load system settings", err);
      }
    };
    fetchSettings();
    // Re-check every minute just in case admin toggles it while they are connected
    const interval = setInterval(fetchSettings, 60000);
    
    window.addEventListener('systemSettingsChanged', fetchSettings);

    return () => {
      clearInterval(interval);
      window.removeEventListener('systemSettingsChanged', fetchSettings);
    };
  }, []);

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
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="navbar">
      <div className="navbar__inner container">
        <a href="#" className="navbar__logo" id="nav-logo">
          <span className="navbar__logo-mark">⬡</span>
          <span className="navbar__logo-text">Zoë</span>
        </a>

        <ul className="navbar__links" id="nav-links">
          <li><button className="navbar__link" onClick={onOpenStats}>Profile</button></li>
          <li><button className="navbar__link" onClick={onOpenSystems}>Systems</button></li>
          <li><button className="navbar__link" onClick={onOpenRecords}>Records</button></li>
          <li><button className="navbar__link" onClick={onOpenShop}>Shop</button></li>
          <li><button className="navbar__link" onClick={onOpenLeaderboard}>Leaderboard</button></li>
          <li><button className="navbar__link bm-link" style={{ color: '#a78bfa' }} onClick={onOpenBlackMarket}>Black Market</button></li>
          {role === 'admin' && (
            <li><button className="navbar__link admin-link" style={{ color: '#ef4444' }} onClick={onOpenAdmin}>Admin Override</button></li>
          )}
        </ul>

        <div className="navbar__controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {username && (
            <div className="navbar__user glass-card" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserIcon size={14} className="text-primary" />
              <span className="text-sm font-bold" style={{ textTransform: 'uppercase' }}>{username}</span>
            </div>
          )}

          {/* Audit Warning */}
          {auditEnabled && (
            <div className="navbar__audit glass-card">
              <Search size={14} className="text-danger" />
              <span className="audit-text">AUDIT IN: {auditTimeLeft}</span>
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
          <li><button className="navbar__mobile-link" onClick={() => { onOpenSystems(); closeMobileMenu(); }}>Systems</button></li>
          <li><button className="navbar__mobile-link" onClick={() => { onOpenRecords(); closeMobileMenu(); }}>Records</button></li>
          <li><button className="navbar__mobile-link" onClick={() => { onOpenShop(); closeMobileMenu(); }}>Shop</button></li>
          <li><button className="navbar__mobile-link" onClick={() => { onOpenLeaderboard(); closeMobileMenu(); }}>Leaderboard</button></li>
          <li><button className="navbar__mobile-link bm-link" style={{ color: '#a78bfa' }} onClick={() => { onOpenBlackMarket(); closeMobileMenu(); }}>Black Market</button></li>
          {role === 'admin' && (
            <li><button className="navbar__mobile-link admin-link" style={{ color: '#ef4444' }} onClick={() => { onOpenAdmin(); closeMobileMenu(); }}>Admin Override</button></li>
          )}
          {auditEnabled && (
            <li>
              <div className="navbar__mobile-audit glass-card" style={{ marginBottom: '0.5rem' }}>
                <Search size={14} className="text-danger" />
                <span className="audit-text">SYSTEM AUDIT IN: {auditTimeLeft}</span>
              </div>
            </li>
          )}
          <li>
            <button className="navbar__mobile-link" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }} onClick={() => { handleLogout(); closeMobileMenu(); }}>
              <LogOut size={16} /> TERMINATE LINK
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
});

export default Navbar;
