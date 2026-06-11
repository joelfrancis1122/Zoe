import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Skull, DatabaseZap, Cpu, AlertTriangle, ShieldAlert } from 'lucide-react';
import { spendCoins, gainExp, takeDamage, grantAugmentPoints } from '../features/userSlice';
import { playClickSound, playDamageSound, playLevelUpSound, playPurchaseSound } from '../utils/audio';
import './DarkWebOverlay.css';

export default function DarkWebOverlay({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { coins } = useSelector((state) => state.user);
  
  const [isWeekend, setIsWeekend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const day = new Date().getDay();
      // 0 is Sunday, 6 is Saturday
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsWeekend(day === 0 || day === 6);
      setResultMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePurchase = (itemType, cost) => {
    if (coins < cost) {
      setErrorMsg(`INSUFFICIENT FUNDS. REQUIRED: ${cost}`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    playClickSound();
    setIsGlitching(true);
    setErrorMsg('');
    setResultMsg('');

    setTimeout(() => {
      setIsGlitching(false);
      
      // 25% chance of severe audit penalty
      if (Math.random() < 0.25) {
        playDamageSound();
        dispatch(spendCoins({ amount: cost, item: { title: itemType, isDarkWeb: true } }));
        dispatch(takeDamage({ amount: 50 }));
        setResultMsg('CRITICAL ERROR: ROGUE AUDIT DETECTED. MASSIVE DAMAGE SUSTAINED.');
        return;
      }

      // Success
      playPurchaseSound();
      dispatch(spendCoins({ amount: cost, item: { title: itemType, isDarkWeb: true } }));
      
      if (itemType === 'Stolen Database') {
        playLevelUpSound();
        dispatch(gainExp({ amount: 1000 }));
        setResultMsg('DECRYPTION SUCCESS: 1000 EXP ACQUIRED.');
      } else if (itemType === 'Illegal Chrome') {
        playLevelUpSound();
        dispatch(grantAugmentPoints(2));
        setResultMsg('INSTALLATION SUCCESS: 2 AUGMENT POINTS ACQUIRED.');
      }
    }, 1500);
  };

  return (
    <div className="overlay-backdrop">
      <div className={`overlay-panel darkweb-panel ${isGlitching ? 'glitch-anim' : ''}`}>
        
        <div className="overlay-header darkweb-header">
          <h2 className="overlay-title darkweb-title"><Skull size={20} className="dw-icon" /> THE DARK WEB</h2>
          <div className="dw-coins">
            <DatabaseZap size={16} /> {coins} CREDITS
          </div>
          <button className="overlay-close" onClick={() => { playClickSound(); onClose(); }} disabled={isGlitching}>
            <X size={24} />
          </button>
        </div>

        <div className="overlay-content darkweb-content">
          {!isWeekend ? (
            <div className="dw-locked">
              <ShieldAlert size={80} className="dw-locked-icon text-danger" />
              <h3>SERVER OFFLINE</h3>
              <p className="text-dim">The Dark Web proxy nodes only synchronize on weekends (Saturday/Sunday). Return later.</p>
            </div>
          ) : (
            <>
              <div className="dw-intro">
                <AlertTriangle size={24} className="text-danger" />
                <p><strong>WARNING:</strong> Purchasing illegal contraband carries a 25% risk of triggering an immediate System Audit (50 Damage).</p>
              </div>

              {resultMsg && (
                <div className={`dw-result ${resultMsg.includes('ERROR') ? 'text-danger' : 'text-accent'}`}>
                  {resultMsg}
                </div>
              )}

              {errorMsg && <div className="dw-error text-danger">{errorMsg}</div>}

              <div className="dw-grid">
                
                {/* Item 1 */}
                <div className="dw-card">
                  <DatabaseZap size={48} className="dw-item-icon" />
                  <h4>Stolen Database</h4>
                  <p className="dw-item-desc">Highly classified data archive. Unlocks <strong>1000 EXP</strong> instantly upon decryption.</p>
                  <button 
                    className="dw-buy-btn"
                    onClick={() => handlePurchase('Stolen Database', 300)}
                    disabled={isGlitching}
                  >
                    ACQUIRE (300 CR)
                  </button>
                </div>

                {/* Item 2 */}
                <div className="dw-card">
                  <Cpu size={48} className="dw-item-icon" />
                  <h4>Illegal Chrome</h4>
                  <p className="dw-item-desc">Black market cybernetics. Grants <strong>2 Augment Points</strong> for your Skill Tree.</p>
                  <button 
                    className="dw-buy-btn"
                    onClick={() => handlePurchase('Illegal Chrome', 500)}
                    disabled={isGlitching}
                  >
                    INSTALL (500 CR)
                  </button>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
