import { useState } from 'react';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProfileOverlay from './components/ProfileOverlay';
import ShopOverlay from './components/ShopOverlay';
import RecordsOverlay from './components/RecordsOverlay';
import ProtocolOverlay from './components/ProtocolOverlay';
import SkillTreeOverlay from './components/SkillTreeOverlay';
import MeltdownOverlay from './components/MeltdownOverlay';
import BlackMarketOverlay from './components/BlackMarketOverlay';
import LoginOverlay from './components/LoginOverlay';
import LeaderboardOverlay from './components/LeaderboardOverlay';
import AdminPanel from './components/AdminPanel';
import DarkWebOverlay from './components/DarkWebOverlay';

export default function App() {
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isRecordsOpen, setIsRecordsOpen] = useState(false);
  const [isSystemsOpen, setIsSystemsOpen] = useState(false);
  const [isBlackMarketOpen, setIsBlackMarketOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDarkWebOpen, setIsDarkWebOpen] = useState(false);

  const { hasCompletedProtocol, meltdownTask, token } = useSelector((state) => state.user);

  return (
    <>
      <Navbar 
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenRecords={() => setIsRecordsOpen(true)}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenSystems={() => setIsSystemsOpen(true)}
        onOpenBlackMarket={() => setIsBlackMarketOpen(true)}
        onOpenDarkWeb={() => setIsDarkWebOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />
      <main>
        <Hero 
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenShop={() => setIsShopOpen(true)}
        />
      </main>
      
      <ProfileOverlay isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
      <ShopOverlay isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
      <RecordsOverlay isOpen={isRecordsOpen} onClose={() => setIsRecordsOpen(false)} />
      <SkillTreeOverlay isOpen={isSystemsOpen} onClose={() => setIsSystemsOpen(false)} />
      <BlackMarketOverlay isOpen={isBlackMarketOpen} onClose={() => setIsBlackMarketOpen(false)} />
      <DarkWebOverlay isOpen={isDarkWebOpen} onClose={() => setIsDarkWebOpen(false)} />
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
