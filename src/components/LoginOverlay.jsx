import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAuth, syncUserState } from '../features/userSlice';
import { syncTasksState } from '../features/tasksSlice';
import { syncRewardsState } from '../features/rewardsSlice';
import { playClickSound, playLevelUpSound } from '../utils/audio';
import './LoginOverlay.css';

export default function LoginOverlay() {
  const dispatch = useDispatch();
  
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    playClickSound();

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isRegister ? 'register' : 'login',
          username,
          password
        })
      });

      const data = await res.json();
      
      if (data.success) {
        playLevelUpSound();
        dispatch(setAuth({
          token: data.token,
          username: data.user.username,
          role: data.user.role
        }));

        // Fetch Cloud Save Data
        try {
          const syncRes = await fetch('/api/sync', {
            headers: { 'Authorization': `Bearer ${data.token}` }
          });
          const syncData = await syncRes.json();
          if (syncData.success) {
            dispatch(syncUserState(syncData.data));
            dispatch(syncTasksState(syncData.data));
            dispatch(syncRewardsState({ items: syncData.data.localRewards || [] }));
          }
        } catch (e) {
          console.error("Failed to load cloud save", e);
        }

      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    }
    setLoading(false);
  };

  return (
    <div className="login-backdrop">
      <div className="login-panel glitch-border">
        <h1 className="login-title">
          <span className="logo-hex">⬡</span> Zoë
        </h1>
        <p className="login-subtitle">NEURAL LINK IDENTIFICATION</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>OPERATOR HANDLE</label>
            <input 
              type="text" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>
          
          <div className="input-group">
            <label>ENCRYPTION KEY</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'INITIALIZING...' : (isRegister ? 'ESTABLISH LINK' : 'AUTHENTICATE')}
          </button>
        </form>

        <button className="toggle-mode-btn" onClick={() => { playClickSound(); setIsRegister(!isRegister); }}>
          {isRegister ? 'Already have a link? Authenticate.' : 'No link established? Register.'}
        </button>
      </div>
    </div>
  );
}
