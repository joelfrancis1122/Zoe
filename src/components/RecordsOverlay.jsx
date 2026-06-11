import { useSelector } from 'react-redux';
import { X, Award, Flame, Calendar, Activity, CheckCircle2 } from 'lucide-react';
import './RecordsOverlay.css';

export default function RecordsOverlay({ isOpen, onClose }) {
  const { history = [], habits = [] } = useSelector((state) => state.tasks) || {};
  const { level } = useSelector((state) => state.user);

  if (!isOpen) return null;

  // CALCULATE METRICS
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0;
  
  const mostProductiveDay = history.length > 0 ? Math.max(...history.map(h => h.tasksCompleted || 0)) : 0;
  
  const highestExpDay = history.length > 0 ? Math.max(...history.map(h => h.expGained || 0)) : 0;
  
  const totalTasks = history.reduce((sum, h) => sum + (h.tasksCompleted || 0), 0);

  return (
    <div className="overlay-backdrop">
      <div className="overlay-panel records-panel">
        
        {/* HEADER */}
        <div className="overlay-header">
          <h2 className="overlay-title records-title"><Award size={24} /> Personal Records</h2>
          <button className="overlay-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="overlay-content records-content">
          <div className="records-intro">
            <p className="text-dim">Tracking all-time performance metrics for Operator Lvl {level}.</p>
          </div>

          <div className="records-grid">
            
            {/* RECORD CARD 1: LONGEST STREAK */}
            <div className="record-card glass-card">
              <div className="record-icon-wrapper streak-bg">
                <Flame size={32} className="streak-color" />
              </div>
              <div className="record-details">
                <span className="record-label">Longest Active Streak</span>
                <span className="record-value">{longestStreak} <span className="record-unit">Days</span></span>
              </div>
            </div>

            {/* RECORD CARD 2: MOST PRODUCTIVE DAY */}
            <div className="record-card glass-card">
              <div className="record-icon-wrapper productive-bg">
                <CheckCircle2 size={32} className="productive-color" />
              </div>
              <div className="record-details">
                <span className="record-label">Most Tasks In One Day</span>
                <span className="record-value">{mostProductiveDay} <span className="record-unit">Tasks</span></span>
              </div>
            </div>

            {/* RECORD CARD 3: HIGHEST EXP YIELD */}
            <div className="record-card glass-card">
              <div className="record-icon-wrapper exp-bg">
                <Activity size={32} className="exp-color" />
              </div>
              <div className="record-details">
                <span className="record-label">Highest Daily EXP Yield</span>
                <span className="record-value">{highestExpDay} <span className="record-unit">EXP</span></span>
              </div>
            </div>

            {/* RECORD CARD 4: LIFETIME TASKS */}
            <div className="record-card glass-card">
              <div className="record-icon-wrapper total-bg">
                <Calendar size={32} className="total-color" />
              </div>
              <div className="record-details">
                <span className="record-label">Lifetime Tasks Completed</span>
                <span className="record-value">{totalTasks} <span className="record-unit">Tasks</span></span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
