import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { spendCoins } from '../features/userSlice';
import { playPurchaseSound, playClickSound } from '../utils/audio';
import { X, Film, Gamepad2, Shield, Star, Coins, Zap } from 'lucide-react';
import './ShopOverlay.css';

export default function ShopOverlay({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { coins, augmentations = {} } = useSelector((state) => state.user);
  
  const [globalItems, setGlobalItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Financial Subroutines: 5% discount per level
  const financialLevel = augmentations.financial || 0;
  const discountMultiplier = Math.max(0.1, 1 - (financialLevel * 0.05));

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch('/api/shop')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGlobalItems(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePurchase = (item) => {
    const finalCost = Math.ceil(item.cost * discountMultiplier);

    if (coins < finalCost) {
      setSuccessMsg('');
      setErrorMsg(`Not enough credits! You need ${finalCost - coins} more.`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    playPurchaseSound();
    dispatch(spendCoins({ amount: finalCost, item }));
    setErrorMsg('');
    setSuccessMsg(`Purchased: ${item.title}!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="overlay-backdrop">
      <div className="overlay-panel shop-panel">
        
        {/* HEADER */}
        <div className="overlay-header">
          <h2 className="overlay-title shop-title"><Zap size={20} className="shop-icon" /> Reward Requisitions</h2>
          <div className="shop-header-coins">
            <Coins size={18} className="coin-color" />
            <span>{coins} Coins</span>
          </div>
          <button className="overlay-close" onClick={() => { playClickSound(); onClose(); }}>
            <X size={24} />
          </button>
        </div>

        {/* ERROR/SUCCESS MESSAGE TOAST */}
        {errorMsg && <div className="shop-error-toast">{errorMsg}</div>}
        {successMsg && <div className="shop-success-toast">{successMsg}</div>}

        <div className="overlay-content shop-content">
          
          {/* ITEMS GRID */}
          <div className="shop-grid">
            {loading ? <p className="text-dim">Connecting to Global Database...</p> : 
              globalItems.map((item) => {
              const finalCost = Math.ceil(item.cost * discountMultiplier);
              return (
                <div key={item._id} className="shop-item glass-card">
                  <div className="shop-item-icon">
                    {item.icon === 'film' && <Film size={28} />}
                    {item.icon === 'gamepad' && <Gamepad2 size={28} />}
                    {item.icon === 'shield' && <Shield size={28} />}
                    {item.icon === 'star' && <Star size={28} />}
                  </div>
                  <div className="shop-item-info">
                    <h4>{item.title}</h4>
                    <button 
                      className={`shop-buy-btn ${coins < finalCost ? 'insufficient-funds' : ''}`} 
                      onClick={() => handlePurchase(item)}
                    >
                      {financialLevel > 0 && <span className="discount-strike">{item.cost}</span>}
                      Buy for <Coins size={12} className="inline-icon" /> {finalCost}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
