import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, ShieldAlert, Plus, Film, Gamepad2, Shield, Star, Users, Database, Settings, Power, Trash2, Gift, Heart, Zap, Megaphone } from 'lucide-react';
import { playClickSound, playLevelUpSound, playDamageSound } from '../utils/audio';
import { runAudit } from '../features/userSlice';
import './AdminPanel.css';

export default function AdminPanel({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { token, role, id: myUserId } = useSelector((state) => state.user);
  
  const [activeTab, setActiveTab] = useState('requisitions');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Requisitions State
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState(500);
  const [icon, setIcon] = useState('star');
  const [shopItems, setShopItems] = useState([]);

  // Operator State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // System Settings State
  const [auditEnabled, setAuditEnabled] = useState(true);
  const [doubleXpEnabled, setDoubleXpEnabled] = useState(false);

  // Initial Fetch & Realtime Sync
  useEffect(() => {
    if (isOpen && role === 'admin') {
      fetch('/api/system')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAuditEnabled(data.data.auditEnabled);
            setDoubleXpEnabled(data.data.doubleXpEnabled || false);
          }
        })
        .catch(console.error);

      if (activeTab === 'requisitions') fetchShopItems();
      if (activeTab === 'operators') fetchUsers();

      const handleSync = (e) => {
        if (!loading) { // Don't override if currently toggling
          setAuditEnabled(e.detail.auditEnabled);
          setDoubleXpEnabled(e.detail.doubleXpEnabled || false);
        }
      };
      window.addEventListener('systemSettingsSynced', handleSync);
      return () => window.removeEventListener('systemSettingsSynced', handleSync);
    }
  }, [isOpen, role, activeTab, loading]);

  if (!isOpen || role !== 'admin') return null;

  // --- API CALLS ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) { console.error(err); }
    setLoadingUsers(false);
  };

  const fetchShopItems = async () => {
    try {
      const res = await fetch('/api/shop');
      const data = await res.json();
      if (data.success) setShopItems(data.data);
    } catch (err) { console.error(err); }
  };

  const showMsg = (text, isError = false) => {
    setMsg(`${isError ? 'ERROR: ' : 'SUCCESS: '}${text}`);
    setTimeout(() => setMsg(''), 4000);
  };

  // --- REQUISITIONS (SHOP) ACTIONS ---
  const handleAddGlobalReward = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    playClickSound();

    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, cost: Number(cost), icon })
      });
      const data = await res.json();
      if (data.success) {
        showMsg('Global item added to the Database!');
        playLevelUpSound();
        setTitle('');
        setCost(500);
        fetchShopItems();
      } else showMsg(data.message, true);
    } catch { showMsg('Connection failed.', true); }
    setLoading(false);
  };

  const handleDeleteShopItem = async (id) => {
    playDamageSound();
    try {
      const res = await fetch('/api/shop', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchShopItems();
    } catch (err) { console.error(err); }
  };

  // --- OPERATOR ACTIONS ---
  const handleUpdateUser = async (id, updates, inc) => {
    try {
      const bodyPayload = { id };
      if (updates) bodyPayload.updates = updates;
      if (inc) bodyPayload.inc = inc;

      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(bodyPayload)
      });
      if (res.ok) {
        playLevelUpSound();
        fetchUsers();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (id) => {
    if (id === myUserId) return showMsg("Cannot terminate yourself.", true);
    if (!window.confirm("WARNING: Are you sure you want to PERMANENTLY TERMINATE this operator?")) return;
    
    playDamageSound();
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchUsers();
    } catch (err) { console.error(err); }
  };

  // --- GLOBAL EVENTS & SETTINGS ---
  const handleGlobalEvent = async (action) => {
    if (!window.confirm(`Are you sure you want to trigger GLOBAL ${action.toUpperCase()}?`)) return;
    setLoading(true);
    const idempotencyKey = `${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action, idempotencyKey })
      });
      if (res.ok) {
        showMsg(`Global ${action.toUpperCase()} Deployed!`);
        playLevelUpSound();
        if (activeTab === 'operators') fetchUsers();
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const updateSystemSetting = async (updates) => {
    try {
      const res = await fetch('/api/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updates)
      });
      if (res.ok) return true;
    } catch (err) { console.error(err); }
    return false;
  };

  const handleToggleAudit = async () => {
    if (loading) return;
    setLoading(true);
    const newState = !auditEnabled;
    setAuditEnabled(newState); // Optimistic UI
    
    // Optimistic UI for Navbar
    window.dispatchEvent(new CustomEvent('optimisticSystemSettings', { detail: { auditEnabled: newState } }));
    
    const ok = await updateSystemSetting({ auditEnabled: newState });
    if (ok) {
      if (newState) playLevelUpSound(); else playDamageSound();
    } else {
      setAuditEnabled(!newState); // Revert on failure
      window.dispatchEvent(new CustomEvent('optimisticSystemSettings', { detail: { auditEnabled: !newState } }));
      showMsg("Network error: Failed to sync with server.", true);
    }
    setLoading(false);
  };

  const handleToggleDoubleXp = async () => {
    if (loading) return;
    setLoading(true);
    const newState = !doubleXpEnabled;
    setDoubleXpEnabled(newState); // Optimistic UI
    
    // Optimistic UI for Navbar
    window.dispatchEvent(new CustomEvent('optimisticSystemSettings', { detail: { doubleXpEnabled: newState } }));
    
    const ok = await updateSystemSetting({ doubleXpEnabled: newState });
    if (ok) {
      if (newState) playLevelUpSound(); else playDamageSound();
    } else {
      setDoubleXpEnabled(!newState); // Revert on failure
      window.dispatchEvent(new CustomEvent('optimisticSystemSettings', { detail: { doubleXpEnabled: !newState } }));
      showMsg("Network error: Failed to sync with server.", true);
    }
    setLoading(false);
  };

  return (
    <div className="overlay-backdrop">
      <div className="overlay-panel admin-panel">
        
        <div className="overlay-header">
          <h2 className="overlay-title admin-title"><ShieldAlert size={20} className="admin-icon" /> CONTROL ROOM</h2>
          <button className="overlay-close" onClick={() => { playClickSound(); onClose(); }}>
            <X size={24} />
          </button>
        </div>

        <div className="overlay-content admin-content">
          <div className="admin-tabs">
            <button className={`admin-tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => { playClickSound(); setActiveTab('events'); }}>
              <Zap size={16} /> GLOBAL EVENTS
            </button>
            <button className={`admin-tab-btn ${activeTab === 'operators' ? 'active' : ''}`} onClick={() => { playClickSound(); setActiveTab('operators'); }}>
              <Users size={16} /> OPERATORS
            </button>
            <button className={`admin-tab-btn ${activeTab === 'requisitions' ? 'active' : ''}`} onClick={() => { playClickSound(); setActiveTab('requisitions'); }}>
              <Database size={16} /> REQUISITIONS
            </button>
            <button className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { playClickSound(); setActiveTab('settings'); }}>
              <Settings size={16} /> SYSTEM
            </button>
          </div>

          {activeTab === 'events' && (
            <div className="admin-events-grid">
              {/* <div className="glass-card event-card">
                <h3><Gift size={24} className="text-accent" /> GLOBAL AIRDROP</h3>
                <p className="text-dim text-sm">Instantly grant +1000 Coins and +500 XP to every registered operator in the database.</p>
                <button className="btn-primary w-full mt-4" onClick={() => handleGlobalEvent('airdrop')} disabled={loading}>TRIGGER AIRDROP</button>
              </div> */}
              
              <div className="glass-card event-card">
                <h3><Heart size={24} className="text-danger" /> MASS HEALING</h3>
                <p className="text-dim text-sm">Instantly restore the health of all operators to 100%.</p>
                <button className="btn-secondary w-full mt-4 text-danger border-danger hover-bg-danger" onClick={() => handleGlobalEvent('heal')} disabled={loading}>TRIGGER HEALING</button>
              </div>

              <div className="glass-card event-card" style={{ gridColumn: '1 / -1' }}>
                <h3><ShieldAlert size={24} className="text-danger" /> FORCE SYSTEM AUDIT</h3>
                <p className="text-dim text-sm">Immediately run a system audit, deducting health from all online clients.</p>
                <button className="btn-secondary w-full mt-4 text-danger border-danger hover-bg-danger" onClick={() => dispatch(runAudit())} disabled={loading}>EXECUTE AUDIT NOW</button>
              </div>
            </div>
          )}

          {activeTab === 'operators' && (
            <div className="admin-users-list glass-card">
              <h3><Users size={16} /> Connected Operators</h3>
              {loadingUsers ? <div className="loading-text">Fetching from Database...</div> : (
                <div className="users-table-wrapper">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>HANDLE</th>
                        <th>ROLE</th>
                        <th>STATS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id}>
                          <td className="user-handle">{u.username}</td>
                          <td>
                            <span className={`role-badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="text-sm">
                            <span className="text-accent">{u.coins}C</span> | <span className="text-primary">{u.exp}XP</span> | <span className="text-danger">{u.health}HP</span>
                          </td>
                          <td className="user-actions">
                            {/* <button onClick={() => handleUpdateUser(u._id, null, { coins: 5 })} title="Grant 5 Coins">+5 C</button>
                            <button onClick={() => handleUpdateUser(u._id, null, { exp: 10 })} title="Grant 10 XP">+10 XP</button> */}
                            {u.role === 'user' && <button onClick={() => handleUpdateUser(u._id, { role: 'admin' })} title="Promote to Admin">Promote</button>}
                            {u.role === 'admin' && u._id !== myUserId && <button onClick={() => handleUpdateUser(u._id, { role: 'user' })} title="Demote to User">Demote</button>}
                            <button className="text-danger" onClick={() => handleDeleteUser(u._id)} title="Terminate Account"><Trash2 size={14}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requisitions' && (
            <div className="admin-shop-layout">
              <form onSubmit={handleAddGlobalReward} className="admin-form glass-card">
                <h3><Plus size={16} /> Deploy Global Shop Item</h3>
                
                <div className="admin-input-group">
                  <label>ITEM CLASSIFICATION</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>

                <div className="admin-input-group">
                  <label>CREDIT COST</label>
                  <input type="number" value={cost} onChange={e => setCost(e.target.value)} min="1" required />
                </div>

                <div className="admin-input-group">
                  <label>SYSTEM ICON</label>
                  <div className="admin-icon-select">
                    {['star', 'film', 'gamepad', 'shield'].map(i => (
                      <button key={i} type="button" className={`icon-btn ${icon === i ? 'selected' : ''}`} onClick={() => { playClickSound(); setIcon(i); }}>
                        {i === 'star' && <Star size={20} />}
                        {i === 'film' && <Film size={20} />}
                        {i === 'gamepad' && <Gamepad2 size={20} />}
                        {i === 'shield' && <Shield size={20} />}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="admin-submit" disabled={loading}>
                  {loading ? 'DEPLOYING...' : 'DEPLOY TO DATABASE'}
                </button>
              </form>

              <div className="admin-shop-list glass-card">
                <h3>Current Inventory</h3>
                <div className="shop-list-items">
                  {shopItems.length === 0 ? (
                    <div className="text-dim text-sm text-center mt-4">Inventory is empty.</div>
                  ) : (
                    shopItems.map(item => (
                      <div key={item._id} className="shop-list-item">
                        <div className="shop-list-item-left">
                          <div className="shop-item-icon-wrapper">
                            {item.icon === 'star' && <Star size={18} className="text-accent" />}
                            {item.icon === 'film' && <Film size={18} className="text-accent" />}
                            {item.icon === 'gamepad' && <Gamepad2 size={18} className="text-accent" />}
                            {item.icon === 'shield' && <Shield size={18} className="text-accent" />}
                          </div>
                          <div className="shop-list-item-info">
                            <span className="shop-item-title">{item.title}</span>
                            <span className="shop-item-cost">{item.cost} Coins</span>
                          </div>
                        </div>
                        <button className="delete-shop-btn" onClick={() => handleDeleteShopItem(item._id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="admin-settings glass-card">
              <h3><Settings size={16} /> Global Protocol Settings</h3>

              <div className="setting-toggle-row">
                <div className="setting-info">
                  <h4>Global System Audit</h4>
                  <p className="text-dim text-sm">When enabled, all operators face periodic health deductions.</p>
                </div>
                <button className={`toggle-btn ${auditEnabled ? 'active' : 'inactive'}`} onClick={handleToggleAudit}>
                  <Power size={16} /> {auditEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="setting-toggle-row mt-4">
                <div className="setting-info">
                  <h4>Double XP Mode</h4>
                  <p className="text-dim text-sm">When enabled, all task completions grant 2x EXP globally.</p>
                </div>
                <button className={`toggle-btn ${doubleXpEnabled ? 'active' : 'inactive'}`} onClick={handleToggleDoubleXp}>
                  <Zap size={16} /> {doubleXpEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          )}

          {msg && <div className={`admin-msg ${msg.startsWith('ERROR') ? 'text-danger' : 'text-success'}`}>{msg}</div>}
        </div>
      </div>
    </div>
  );
}
