import { useState, useEffect } from 'react';
import { X, Trophy, Medal } from 'lucide-react';
import { playClickSound } from '../utils/audio';
import './LeaderboardOverlay.css';

export default function LeaderboardOverlay({ isOpen, onClose }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLeaders(data.data);
        } else {
          setError(data.message || 'Failed to fetch leaderboard');
        }
      })
      .catch(() => setError('Connection error.'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="overlay-backdrop">
      <div className="overlay-panel leaderboard-panel">
        
        <div className="overlay-header">
          <h2 className="overlay-title leaderboard-title "><Trophy size={20} className="lb-icon" /> GLOBAL LEADERBOARD</h2>
          <button className="overlay-close" onClick={() => { playClickSound(); onClose(); }}>
            <X size={24} />
          </button>
        </div>

        <div className="overlay-content leaderboard-content">
          {loading ? (
            <div className="lb-loading">Fetching Network Data...</div>
          ) : error ? (
            <div className="lb-error text-danger">{error}</div>
          ) : (
            <div className="lb-list">
              <div className="lb-row lb-header">
                <span className="lb-rank">RANK</span>
                <span className="lb-name">OPERATOR</span>
                <span className="lb-level">LEVEL</span>
                <span className="lb-exp">TOTAL EXP</span>
              </div>
              {leaders.map((user, idx) => {
                const isRank1 = idx === 0;
                const isRank2 = idx === 1;
                const isRank3 = idx === 2;
                
                let rowClass = 'lb-row';
                if (isRank1) rowClass += ' lb-rank-1';
                else if (isRank2) rowClass += ' lb-rank-2';
                else if (isRank3) rowClass += ' lb-rank-3';
                else rowClass += ' lb-regular';

                return (
                  <div key={user._id} className={rowClass}>
                    <span className="lb-rank">
                      {isRank1 && <Medal size={24} className="gold drop-shadow" />}
                      {isRank2 && <Medal size={20} className="silver drop-shadow" />}
                      {isRank3 && <Medal size={20} className="bronze drop-shadow" />}
                      {!isRank1 && !isRank2 && !isRank3 && <span className="rank-num">#{idx + 1}</span>}
                    </span>
                    <span className={`lb-name ${user.role === 'admin' ? 'admin-name' : ''}`}>
                      {user.username} {user.role === 'admin' && <span className="admin-badge">[ADMIN]</span>}
                    </span>
                    <span className="lb-level">
                      <span className="lvl-label">LVL</span> {user.level}
                    </span>
                    <span className="lb-exp">{user.exp.toLocaleString()} <span className="exp-label">XP</span></span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
