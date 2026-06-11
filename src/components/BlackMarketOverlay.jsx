import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Package, Unlock, Skull, Zap, Coins } from 'lucide-react';
import { spendCoins, gainExp, takeDamage } from '../features/userSlice';
import { playPurchaseSound, playClickSound, playLevelUpSound, playDamageSound } from '../utils/audio';
import './BlackMarketOverlay.css';

const DATACORE_COST = 200; // Expensive gamble

export default function BlackMarketOverlay({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { coins } = useSelector((state) => state.user);
  
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [reward, setReward] = useState(null); // { type: 'exp' | 'damage' | 'dud', value: number, text: string }
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleBuy = () => {
    if (coins < DATACORE_COST) {
      setErrorMsg(`INSUFFICIENT FUNDS. REQUIRED: ${DATACORE_COST}`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    playClickSound();
    dispatch(spendCoins({ amount: DATACORE_COST, item: { title: "Encrypted Datacore" } }));
    setIsDecrypting(true);
    setReward(null);

    // Simulate suspenseful decryption
    setTimeout(() => {
      resolveDatacore();
    }, 2500);
  };

  const resolveDatacore = () => {
    setIsDecrypting(false);
    
    const roll = Math.random();
    if (roll < 0.15) {
      // 15% chance: Massive Penalty
      playDamageSound();
      const dmg = 40;
      dispatch(takeDamage({ amount: dmg }));
      setReward({ type: 'damage', value: dmg, text: 'MALWARE DETECTED. MASSIVE DAMAGE SUSTAINED.' });
    } else if (roll < 0.40) {
      // 25% chance: Dud
      playClickSound();
      setReward({ type: 'dud', value: 0, text: 'CORRUPTED ARCHIVE. NO DATA RECOVERED.' });
    } else {
      // 60% chance: Huge EXP
      playLevelUpSound();
      const exp = Math.floor(Math.random() * 500) + 200;
      dispatch(gainExp({ amount: exp }));
      setReward({ type: 'exp', value: exp, text: `DECRYPTION SUCCESS. OVERRIDE EXP GAINED: +${exp}` });
    }
  };

  const resetMarket = () => {
    setReward(null);
    setErrorMsg('');
  };

  const handleClose = () => {
    resetMarket();
    playClickSound();
    onClose();
  };

  return (
    <div className="overlay-backdrop">
      <div className="overlay-panel blackmarket-panel">
        
        <div className="overlay-header">
          <h2 className="overlay-title blackmarket-title"><Package size={20} className="bm-icon" /> UNDERCITY BLACK MARKET</h2>
          <div className="bm-coins">
            <Coins size={16} /> {coins} CREDITS
          </div>
          <button className="overlay-close" onClick={handleClose} disabled={isDecrypting}>
            <X size={24} />
          </button>
        </div>

        <div className="overlay-content blackmarket-content">
          <p className="bm-desc text-dim">
            Purchase highly unstable Encrypted Datacores. They might contain massive experience overrides, or lethal system malware. Purchase at your own risk.
          </p>

          <div className="bm-datacore-stage">
            {isDecrypting ? (
              <div className="bm-decrypting">
                <Unlock size={64} className="bm-decrypt-icon glitch-anim" />
                <h3 className="bm-glitch-text">DECRYPTING ARCHIVE...</h3>
              </div>
            ) : reward ? (
              <div className={`bm-result ${reward.type}`}>
                {reward.type === 'damage' && <Skull size={64} className="bm-result-icon" />}
                {reward.type === 'dud' && <X size={64} className="bm-result-icon" />}
                {reward.type === 'exp' && <Zap size={64} className="bm-result-icon" />}
                
                <h3 className="bm-result-text">{reward.text}</h3>
                
                <button className="bm-btn secondary" onClick={resetMarket}>BACK TO MARKET</button>
              </div>
            ) : (
              <div className="bm-offer">
                <Package size={80} className="bm-offer-icon" />
                <h3>ENCRYPTED DATACORE</h3>
                <button className="bm-buy-btn" onClick={handleBuy}>
                  DECRYPT ({DATACORE_COST} CREDITS)
                </button>
                {errorMsg && <p className="text-danger bm-error">{errorMsg}</p>}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
