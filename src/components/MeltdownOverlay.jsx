import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { endMeltdown, takeDamage } from '../features/userSlice';
import { playDamageSound, playClickSound } from '../utils/audio';
import { Flame, AlertTriangle } from 'lucide-react';
import './MeltdownOverlay.css';

export default function MeltdownOverlay({ task }) {
  const dispatch = useDispatch();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minute default
  const [isFailed, setIsFailed] = useState(false);

  useEffect(() => {
    if (isFailed) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Punish the user instantly
        setIsFailed(true);
        playDamageSound();
        dispatch(takeDamage({ amount: 20 })); // Massive damage for breaking focus
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [dispatch, isFailed]);

  useEffect(() => {
    if (isFailed) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFailed]);

  const handleBailOut = () => {
    playClickSound();
    dispatch(takeDamage({ amount: 5 })); // Small penalty for bailing early
    dispatch(endMeltdown());
  };

  const handleFinish = () => {
    playClickSound();
    dispatch(endMeltdown());
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!task) return null;

  return (
    <div className={`meltdown-backdrop ${isFailed ? 'meltdown-failed' : ''}`}>
      <div className="meltdown-panel">
        
        {isFailed ? (
          <div className="meltdown-failed-content">
            <AlertTriangle size={64} className="text-danger meltdown-icon" />
            <h1 className="meltdown-title text-danger">FOCUS BROKEN</h1>
            <p className="meltdown-desc">You abandoned your terminal during Meltdown Mode. Massive system damage sustained.</p>
            <button className="meltdown-btn primary danger-hover" onClick={handleFinish}>ACKNOWLEDGE</button>
          </div>
        ) : (
          <div className="meltdown-active-content">
            <Flame size={48} className="text-accent meltdown-icon pulse" />
            <h1 className="meltdown-title">SYSTEM MELTDOWN</h1>
            <p className="meltdown-desc text-accent">DO NOT SWITCH TABS. DO NOT MINIMIZE. FOCUS OR DIE.</p>
            
            <div className="meltdown-timer">{formatTime(timeLeft)}</div>
            
            <div className="meltdown-task-box">
              <span className="meltdown-task-label">CURRENT TARGET</span>
              <span className="meltdown-task-title">{task.title}</span>
            </div>

            <button className="meltdown-btn secondary" onClick={handleBailOut}>EMERGENCY ABORT (5 DMG)</button>
            <button className="meltdown-btn primary" onClick={handleFinish} disabled={timeLeft > 0}>
              {timeLeft > 0 ? 'COMPLETE TASK IN UI FIRST' : 'END MELTDOWN'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
