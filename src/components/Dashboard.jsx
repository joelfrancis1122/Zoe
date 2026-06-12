import PlayerHUD from './PlayerHUD';
import TaskBoard from './TaskBoard';
import './Dashboard.css';

export default function Dashboard({ onOpenStats, onOpenShop }) {
  return (
    <div className="dashboard-page container">
      <div className="dashboard-header" style={{ padding: 'var(--space-6) 0', marginTop: 'var(--nav-height)' }}>
        <PlayerHUD onOpenStats={onOpenStats} onOpenShop={onOpenShop} />
      </div>
      <section className="task-board-section">
        <TaskBoard />
      </section>
    </div>
  );
}
