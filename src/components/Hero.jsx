import { lazy, Suspense } from 'react';
import PlayerHUD from './PlayerHUD';
import TaskBoard from './TaskBoard';
import './Hero.css';

const Spline = lazy(() => import('@splinetool/react-spline'));
const SCENE_URL = 'https://prod.spline.design/nwZEwL0gexp0PpaE/scene.splinecode';

export default function Hero({ onOpenStats, onOpenShop }) {

  return (
    <section className="hero-section">

      {/* BACKGROUND: 3D MODEL FIXED TO RIGHT SIDE */}
      <div className="hero-3d-wrapper">
        <Suspense fallback={<div className="hero-loading">Loading Protocol...</div>}>
          <Spline scene={SCENE_URL} className="hero-spline" />
        </Suspense>
      </div>

      {/* FOREGROUND: SCROLLABLE GAMIFICATION DASHBOARD ON LEFT SIDE */}
      <div className="hero-content container">
        <div className="hero-text-block">
          <PlayerHUD
            onOpenStats={onOpenStats}
            onOpenShop={onOpenShop}
          />
          <TaskBoard />
        </div>
      </div>

    </section>
  );
}
