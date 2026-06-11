import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, ShieldAlert, Plus, Film, Gamepad2, Shield, Star, Users, Database, Settings, Power } from 'lucide-react';
import { playClickSound, playLevelUpSound, playDamageSound } from '../utils/audio';
import './AdminPanel.css';

export default function AdminPanel({ isOpen, onClose }) {
  const { token, role } = useSelector((state) => state.user);
  
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState(500);
  const [icon, setIcon] = useState('star');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [activeTab, setActiveTab] = useState('requisitions');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // System Settings State
  const [auditEnabled, setAuditEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Fetch users when switching to operators tab
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingUsers(false);
  };

  // Fetch settings when opening panel
  useEffect(() => {
    if (isOpen && role === 'admin') {
      fetch('/api/system')
        .then(res => res.json())
        .then(data => {
          if (data.success) setAuditEnabled(data.data.auditEnabled);
        })
        .catch(console.error);
    }
  }, [isOpen, role]);

  if (!isOpen || role !== 'admin') return null;

  const toggleAudit = async () => {
    setLoadingSettings(true);
    const newState = !auditEnabled;
    try {
      const res = await fetch('/api/system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ auditEnabled: newState })
      });
      const data = await res.json();
      if (data.success) {
        setAuditEnabled(newState);
        window.dispatchEvent(new Event('systemSettingsChanged'));
        if (newState) playLevelUpSound();
        else playDamageSound();
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingSettings(false);
  };

  const handleAddGlobalReward = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    playClickSound();

    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, cost: Number(cost), icon })
      });

      const data = await res.json();
      if (data.success) {
        setMsg('SUCCESS: Global item added to the Database!');
        playLevelUpSound();
        setTitle('');
        setCost(500);
      } else {
        setMsg('ERROR: ' + data.message);
      }
    } catch {
      setMsg('ERROR: Connection failed.');
    }
    
    setLoading(false);
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <div className="overlay-backdrop">
      <div className="overlay-panel admin-panel">
        
        <div className="overlay-header">
          <h2 className="overlay-title admin-title"><ShieldAlert size={20} className="admin-icon" /> ADMIN OVERRIDE</h2>
          <button className="overlay-close" onClick={() => { playClickSound(); onClose(); }}>
            <X size={24} />
          </button>
        </div>

        <div className="overlay-content admin-content">
          <div className="admin-tabs">
            <button 
              className={`admin-tab-btn ${activeTab === 'requisitions' ? 'active' : ''}`}
              onClick={() => { playClickSound(); setActiveTab('requisitions'); }}
            >
              <Database size={16} /> REQUISITIONS
            </button>
            <button 
              className={`admin-tab-btn ${activeTab === 'operators' ? 'active' : ''}`}
              onClick={() => { playClickSound(); setActiveTab('operators'); fetchUsers(); }}
            >
              <Users size={16} /> OPERATOR DATABASE
            </button>
            <button 
              className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => { playClickSound(); setActiveTab('settings'); }}
            >
              <Settings size={16} /> SYSTEM SETTINGS
            </button>
          </div>

          {activeTab === 'requisitions' && (
            <>
              <p className="admin-desc">
                You are authenticated with Administrative privileges. Items created here are written directly to MongoDB Atlas and will instantly appear in the Shop for ALL global users.
              </p>

              <form onSubmit={handleAddGlobalReward} className="admin-form glass-card">
                <h3><Plus size={16} /> Deploy Global Shop Item</h3>
                
                <div className="admin-input-group">
                  <label>ITEM CLASSIFICATION</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="e.g. Rare Anime Episode"
                    required
                  />
                </div>

                <div className="admin-input-group">
                  <label>CREDIT COST</label>
                  <input 
                    type="number" 
                    value={cost} 
                    onChange={e => setCost(e.target.value)} 
                    min="1"
                    required
                  />
                </div>

                <div className="admin-input-group">
                  <label>SYSTEM ICON</label>
                  <div className="admin-icon-select">
                    {['star', 'film', 'gamepad', 'shield'].map(i => (
                      <button 
                        key={i}
                        type="button" 
                        className={`icon-btn ${icon === i ? 'selected' : ''}`}
                        onClick={() => { playClickSound(); setIcon(i); }}
                      >
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

                {msg && <div className={`admin-msg ${msg.startsWith('ERROR') ? 'text-danger' : 'text-success'}`}>{msg}</div>}
              </form>
            </>
          )}

          {activeTab === 'operators' && (
            <div className="admin-users-list glass-card">
              <h3><Users size={16} /> Connected Operators</h3>
              {loadingUsers ? (
                <div className="loading-text">Fetching from Database...</div>
              ) : (
                <div className="users-table-wrapper">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>HANDLE</th>
                        <th>ROLE</th>
                        <th>LVL</th>
                        <th>EXP</th>
                        <th>CREDITS</th>
                        <th>REGISTERED</th>
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
                          <td>{u.level}</td>
                          <td>{u.exp}</td>
                          <td className="text-accent">{u.coins}</td>
                          <td className="text-dim">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan="6" className="text-center text-dim">No operators found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="admin-settings glass-card">
              <h3><Settings size={16} /> Global Protocol Settings</h3>
              <p className="admin-desc" style={{ marginBottom: '24px' }}>
                Toggle core system protocols. Changes applied here immediately affect all connected operators worldwide.
              </p>

              <div className="setting-toggle-row">
                <div className="setting-info">
                  <h4>Global System Audit</h4>
                  <p className="text-dim">When enabled, all operators face periodic health deductions unless mitigated by Titanium Plating.</p>
                </div>
                <button 
                  className={`toggle-btn ${auditEnabled ? 'active' : 'inactive'}`} 
                  onClick={toggleAudit}
                  disabled={loadingSettings}
                >
                  <Power size={20} />
                  {auditEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
