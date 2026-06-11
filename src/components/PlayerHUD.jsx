import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Coins, Heart, Zap } from 'lucide-react';
import { playLevelUpSound, playDamageSound, playClickSound } from '../utils/audio';
import './PlayerHUD.css';

export default function PlayerHUD({ onOpenStats, onOpenShop }) {
  const { level, exp, maxExp, health, maxHealth, coins } = useSelector((state) => state.user);
  
  const [levelUpAnim, setLevelUpAnim] = useState(false);
  const [damageAnim, setDamageAnim] = useState(false);
  const prevStats = useRef({ level, health });

  useEffect(() => {
    // Check Level Up
    if (level > prevStats.current.level) {
      setLevelUpAnim(true);
      playLevelUpSound();
      setTimeout(() => setLevelUpAnim(false), 2000);
    }
    
    // Check Damage
    if (health < prevStats.current.health) {
      setDamageAnim(true);
      playDamageSound();
      setTimeout(() => setDamageAnim(false), 1000);
    }

    prevStats.current = { level, health };
  }, [level, health]);

  const expPercentage = Math.min(100, (exp / maxExp) * 100);
  const healthPercentage = Math.min(100, (health / maxHealth) * 100);

  return (
    <div className="player-hud">
      {/* Avatar / Level Badge */}
      <div className="hud-avatar clickable" onClick={() => { playClickSound(); onOpenStats(); }}>
        <div className="hud-level-ring">
          <span className="hud-level-text">Lvl {level}</span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="hud-stats">
        
        {/* EXP Bar */}
        <div className="hud-bar-container">
          <div className="hud-bar-label">
            <Zap size={14} className="hud-icon exp-icon" />
            <span>Experience</span>
            <span className="hud-bar-values">{exp} / {maxExp}</span>
          </div>
          <div className="hud-bar-track">
            <div className={`hud-bar-fill exp-fill ${levelUpAnim ? 'level-up-glow' : ''}`} style={{ width: `${expPercentage}%` }}></div>
          </div>
        </div>

        {/* Health Bar */}
        <div className="hud-bar-container">
          <div className="hud-bar-label">
            <Heart size={14} className="hud-icon health-icon" />
            <span>Health</span>
            <span className="hud-bar-values">{health} / {maxHealth}</span>
          </div>
          <div className="hud-bar-track">
            <div className={`hud-bar-fill health-fill ${damageAnim ? 'damage-glow' : ''}`} style={{ width: `${healthPercentage}%` }}></div>
          </div>
        </div>

      </div>

      {/* Currency */}
      <div className="hud-currency glass-card clickable" onClick={() => { playClickSound(); onOpenShop(); }}>
        <Coins size={18} className="hud-icon gold-icon" />
        <span className="hud-coin-text">{coins}</span>
      </div>
    </div>
  );
}
