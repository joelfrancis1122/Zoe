import { useState } from 'react';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProfilePage from './components/ProfilePage';
import ShopOverlay from './components/ShopOverlay';
import ProtocolOverlay from './components/ProtocolOverlay';
import SkillTreeOverlay from './components/SkillTreeOverlay';
import MeltdownOverlay from './components/MeltdownOverlay';
import BlackMarketOverlay from './components/BlackMarketOverlay';
import LoginOverlay from './components/LoginOverlay';
import LeaderboardOverlay from './components/LeaderboardOverlay';
import AdminPanel from './components/AdminPanel';
import DarkWebOverlay from './components/DarkWebOverlay';
import AchievementsOverlay from './components/AchievementsOverlay';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isSystemsOpen, setIsSystemsOpen] = useState(false);
  const [isBlackMarketOpen, setIsBlackMarketOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDarkWebOpen, setIsDarkWebOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

  const { hasCompletedProtocol, meltdownTask, token } = useSelector((state) => state.user);

  return (
    <>
      <Navbar 
        onOpenStats={() => setActiveView('profile')}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenSystems={() => setIsSystemsOpen(true)}
        onOpenBlackMarket={() => setIsBlackMarketOpen(true)}
        onOpenDarkWeb={() => setIsDarkWebOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />
      <main>
        {activeView === 'dashboard' && (
          <Hero 
            onOpenStats={() => setActiveView('profile')}
            onOpenShop={() => setIsShopOpen(true)}
          />
        )}
        {activeView === 'profile' && (
          <ProfilePage onBack={() => setActiveView('dashboard')} />
        )}
      </main>
      
      <ShopOverlay isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
      <SkillTreeOverlay isOpen={isSystemsOpen} onClose={() => setIsSystemsOpen(false)} />
      <BlackMarketOverlay isOpen={isBlackMarketOpen} onClose={() => setIsBlackMarketOpen(false)} />
      <DarkWebOverlay isOpen={isDarkWebOpen} onClose={() => setIsDarkWebOpen(false)} />
      <AchievementsOverlay isOpen={isAchievementsOpen} onClose={() => setIsAchievementsOpen(false)} />
      <LeaderboardOverlay isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />

      {/* LOGIN OVERLAY */}
      {!token && <LoginOverlay />}

      {/* PROTOCOL ONBOARDING OVERLAY */}
      {token && !hasCompletedProtocol && <ProtocolOverlay />}

      {/* MELTDOWN FULLSCREEN MODE */}
      {meltdownTask && <MeltdownOverlay task={meltdownTask} />}
    </>
  );
}
