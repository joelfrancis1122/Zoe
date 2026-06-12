import { useSelector, useDispatch } from 'react-redux';
import { X, Trophy, Medal } from 'lucide-react';
import { setActiveTitle } from '../features/userSlice';
import { playClickSound } from '../utils/audio';
import './AchievementsOverlay.css';

export default function AchievementsOverlay({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { unlockedTitles = ['Operator'], activeTitle = 'Operator' } = useSelector((state) => state.user);

  if (!isOpen) return null;

  const handleEquipTitle = (title) => {
    playClickSound();
    dispatch(setActiveTitle(title));
  };

  return (
    <div className="overlay-backdrop">
      <div className="overlay-panel achievements-panel">
        
        {/* HEADER */}
        <div className="overlay-header">
          <h2 className="overlay-title achievements-title">
            <Trophy size={24} className="achievements-icon" /> Titles & Achievements
          </h2>
          <button className="overlay-close" onClick={() => { playClickSound(); onClose(); }}>
            <X size={24} />
          </button>
        </div>

        <div className="overlay-content achievements-content">
          <div className="achievements-intro glass-card">
            <Medal size={32} className="text-accent" />
            <div className="intro-text">
              <h3>Active Designation: <span className="text-accent">{activeTitle}</span></h3>
              <p className="text-dim">Your active title is displayed publicly on the Global Leaderboard. Select any unlocked title below to equip it.</p>
            </div>
          </div>

          <div className="titles-container">
            {unlockedTitles.map((title) => (
              <button
                key={title}
                className={`achievement-card ${title === activeTitle ? 'achievement-active' : ''}`}
                onClick={() => handleEquipTitle(title)}
              >
                <Trophy size={20} className={title === activeTitle ? 'text-accent' : 'text-dim'} />
                <span className="achievement-name">{title}</span>
                {title === activeTitle && <span className="equipped-badge">EQUIPPED</span>}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
