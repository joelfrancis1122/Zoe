import { useState } from 'react';
import { useSelector } from 'react-redux';
import { ArrowLeft, Activity, CalendarDays, Zap, ShoppingBag, Coins, Flame } from 'lucide-react';
import './ProfilePage.css';

export default function ProfilePage({ onBack }) {
  const { level, exp, maxExp, health, maxHealth, coins, purchases = [], username, role } = useSelector((state) => state.user);
  const { history = [], habits = [] } = useSelector((state) => state.tasks) || {};
  const [activeTab, setActiveTab] = useState('weekly');

  const expPercentage = Math.min(100, (exp / maxExp) * 100);

  // CALCULATE RECORD METRICS
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0;
  const mostProductiveDay = history.length > 0 ? Math.max(...history.map(h => h.tasksCompleted || 0)) : 0;
  const highestExpDay = history.length > 0 ? Math.max(...history.map(h => h.expGained || 0)) : 0;
  const totalTasks = history.reduce((sum, h) => sum + (h.tasksCompleted || 0), 0);

  // REAL DATA GENERATION FROM REDUX HISTORY
  const generateRealData = (type) => {
    const data = [];
    const today = new Date();
    
    if (type === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        const historyEntry = history.find(h => h.date === dateString);
        
        data.push({
          label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
          tooltipDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: historyEntry ? historyEntry.expGained : 0
        });
      }
    } else if (type === 'monthly') {
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Calculate padding to align the 1st of the month with the correct weekday (0 = Sunday, 1 = Monday)
      const firstDayOfWeek = new Date(year, month, 1).getDay();
      
      for (let p = 0; p < firstDayOfWeek; p++) {
        data.push({ isPadding: true });
      }
      
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        // Correct for timezone offset when generating the ISO string date for matching
        const dateString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const historyEntry = history.find(h => h.date === dateString);
        
        data.push({
          isPadding: false,
          label: d.getDate().toString(),
          tooltipDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: historyEntry ? historyEntry.expGained : 0,
          isFuture: d > today
        });
      }
    }
    return data;
  };

  const generateYearlyData = () => {
    const data = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setMonth(i);
      return { 
        label: d.toLocaleDateString('en-US', { month: 'short' }), 
        tooltipDate: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        value: 0 
      };
    });
    
    history.forEach(h => {
      const month = new Date(h.date).getMonth();
      data[month].value += h.expGained;
    });
    return data;
  };

  const chartData = {
    weekly: generateRealData('weekly'),
    monthly: generateRealData('monthly'),
    yearly: generateYearlyData()
  };

  const currentData = chartData[activeTab];
  const maxValue = Math.max(...currentData.map(d => d.value), 1); // Fallback to 1 to prevent NaN height

  return (
    <div className="profile-page fade-in">
      <div className="profile-page-inner">
        
        {/* HEADER */}
        <div className="profile-page-header">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          <h2 className="page-title">Operator Profile</h2>
        </div>

        <div className="profile-page-content">
          
          {/* LEFT: IDENTITY & STATS */}
          <div className="profile-identity">
            <div className="profile-header-info">
              <h1 className="profile-username">{username || 'ANONYMOUS'}</h1>
              <div className="profile-badges">
                <span className={`profile-role ${role === 'admin' ? 'admin-badge' : 'user-badge'}`}>
                  {(role || 'user').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="profile-ring-container">
              <svg className="level-ring" viewBox="0 0 120 120">
                <circle className="ring-bg" cx="60" cy="60" r="54"></circle>
                <circle className="ring-progress" cx="60" cy="60" r="54" style={{ strokeDashoffset: 339.292 * (1 - expPercentage / 100) }}></circle>
              </svg>
              <div className="ring-content">
                <span className="ring-level">LVL {level}</span>
              </div>
            </div>
            
            <div className="profile-metrics">
              <div className="metric-card glass-card">
                <Zap size={20} className="metric-icon xp-color" />
                <div className="metric-info">
                  <span className="metric-label">Experience</span>
                  <span className="metric-value">{exp} / {maxExp}</span>
                </div>
                <div className="metric-bar-bg"><div className="metric-bar-fill xp-color-bg" style={{ width: `${expPercentage}%`}}></div></div>
              </div>

              <div className="metric-card glass-card">
                <Activity size={20} className="metric-icon health-color" />
                <div className="metric-info">
                  <span className="metric-label">System Health</span>
                  <span className="metric-value">{health} / {maxHealth}</span>
                </div>
                <div className="metric-bar-bg"><div className="metric-bar-fill health-color-bg" style={{ width: `${Math.min(100, (health / maxHealth) * 100)}%`}}></div></div>
              </div>

              <div className="metric-card glass-card">
                <Coins size={20} className="metric-icon coin-color" />
                <div className="metric-info">
                  <span className="metric-label">Lifetime Credits</span>
                  <span className="metric-value">{coins}</span>
                </div>
              </div>
            </div>

            {/* RECENT PURCHASES */}
            <div className="profile-purchases glass-card">
              <div className="purchases-header">
                <h3><ShoppingBag size={18} /> Recent Requisitions</h3>
              </div>
              {(!purchases || purchases.length === 0) ? (
                <div className="purchases-empty">
                  <span className="text-dim">No rewards claimed yet.</span>
                </div>
              ) : (
                <ul className="purchases-list">
                  {purchases.slice().reverse().slice(0, 5).map((p, i) => (
                    <li key={i} className="purchase-item">
                      <div className="purchase-info">
                        <span className="purchase-title">{p.title}</span>
                        <span className="purchase-date">{new Date(p.purchasedAt).toLocaleDateString()}</span>
                      </div>
                      <span className="purchase-cost">-{p.cost}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT: ANALYTICS */}
          <div className="profile-analytics glass-card">
            <div className="analytics-header">
              <h3><Activity size={18} /> Performance Analytics</h3>
              <div className="analytics-tabs">
                <button className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`} onClick={() => setActiveTab('weekly')}>Weekly</button>
                <button className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`} onClick={() => setActiveTab('monthly')}>Monthly</button>
                <button className={`tab-btn ${activeTab === 'yearly' ? 'active' : ''}`} onClick={() => setActiveTab('yearly')}>Yearly</button>
              </div>
            </div>

            {/* CONDITIONAL RENDER: CALENDAR OR BAR CHART */}
            {activeTab === 'monthly' ? (
              <div className="calendar-heatmap-container">
                <div className="calendar-heatmap">
                  <div className="calendar-weekdays">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>
                  <div className="calendar-grid">
                    {currentData.map((data, index) => {
                      if (data.isPadding) {
                        return <div key={`pad-${index}`} className="calendar-day padding-day" style={{ opacity: 0, pointerEvents: 'none' }}></div>;
                      }

                      // Calculate intensity of the green color based on EXP
                      const intensity = maxValue > 1 ? data.value / maxValue : (data.value > 0 ? 1 : 0);
                      // Base color is a very faint transparent, active color is neon green
                      const bgStyle = data.value > 0 
                        ? { backgroundColor: `rgba(0, 229, 160, ${intensity * 0.7 + 0.3})`, borderColor: `rgba(0, 229, 160, ${intensity * 0.5 + 0.5})` }
                        : {};
                        
                      if (data.isFuture) {
                        bgStyle.opacity = 0.3;
                        bgStyle.pointerEvents = 'none';
                      }

                      return (
                        <div key={index} className="calendar-day" style={bgStyle}>
                          <span className="chart-tooltip">
                            <strong>{data.tooltipDate}</strong><br/>
                            {data.isFuture ? 'Future' : `${data.value} EXP`}
                          </span>
                          {/* Optional: Show tiny date number inside the box for extreme clarity */}
                          <span className="calendar-date-number">{data.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="chart-container">
                <div className="chart-bars">
                  {currentData.map((data, index) => {
                    const heightPercent = maxValue > 0 ? (data.value / maxValue) * 100 : 0;
                    return (
                      <div key={index} className="chart-bar-wrapper">
                        <div className="chart-bar" style={{ height: `${heightPercent}%` }}>
                          <span className="chart-tooltip">
                            <strong>{data.tooltipDate}</strong><br/>
                            {data.value} EXP
                          </span>
                        </div>
                        <span className="chart-label">{data.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="analytics-summary">
              <CalendarDays size={16} className="text-dim" />
              <span className="text-dim">Tracking real EXP yields from your task completion history.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
