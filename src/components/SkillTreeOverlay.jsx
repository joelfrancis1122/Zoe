import { useSelector, useDispatch } from 'react-redux';
import { X, Cpu, Shield, Brain, TrendingDown, Zap } from 'lucide-react';
import { upgradeAugmentation } from '../features/userSlice';
import { playClickSound, playLevelUpSound } from '../utils/audio';
import './SkillTreeOverlay.css';

export default function SkillTreeOverlay({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { augmentPoints = 0, augmentations = {} } = useSelector((state) => state.user);
  
  if (!isOpen) return null;

  const handleUpgrade = (type) => {
    if (augmentPoints > 0) {
      playLevelUpSound();
      dispatch(upgradeAugmentation({ type }));
    }
  };

  const augments = [
    {
      id: 'financial',
      name: 'Financial Subroutines',
      icon: <TrendingDown size={32} />,
      desc: 'Reduces the cost of items in the Reward Shop by 5% per level.',
      level: augmentations.financial || 0,
      colorClass: 'aug-gold'
    },
    {
      id: 'titanium',
      name: 'Titanium Plating',
      icon: <Shield size={32} />,
      desc: 'Reduces health damage taken from missing daily tasks by 10% per level.',
      level: augmentations.titanium || 0,
      colorClass: 'aug-danger'
    },
    {
      id: 'neural',
      name: 'Neural Overclocking',
      icon: <Brain size={32} />,
      desc: 'Grants a 5% chance per level to earn double credits when finishing a task.',
      level: augmentations.neural || 0,
      colorClass: 'aug-accent'
    }
  ];

  return (
    <div className="overlay-backdrop">
      <div className="overlay-panel skilltree-panel">
        
        {/* HEADER */}
        <div className="overlay-header">
          <h2 className="overlay-title skilltree-title"><Cpu size={24} /> Cybernetic Augmentations</h2>
          <div className="skilltree-points">
            <Zap size={16} className="text-accent" />
            <span>{augmentPoints} Augment Points</span>
          </div>
          <button className="overlay-close" onClick={() => { playClickSound(); onClose(); }}>
            <X size={24} />
          </button>
        </div>

        <div className="overlay-content skilltree-content">
          <div className="skilltree-intro">
            <p className="text-dim">Spend Augment Points earned from Leveling Up to enhance your core operational capabilities.</p>
          </div>

          <div className="skilltree-grid">
            {augments.map(aug => (
              <div key={aug.id} className={`aug-card glass-card ${aug.colorClass}`}>
                <div className="aug-icon-wrapper">
                  {aug.icon}
                </div>
                <div className="aug-info">
                  <h3 className="aug-name">{aug.name} <span className="aug-level">Lvl {aug.level}</span></h3>
                  <p className="aug-desc">{aug.desc}</p>
                </div>
                <button 
                  className={`aug-upgrade-btn ${augmentPoints > 0 ? 'can-upgrade' : 'locked'}`}
                  onClick={() => handleUpgrade(aug.id)}
                  disabled={augmentPoints <= 0}
                >
                  UPGRADE
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
