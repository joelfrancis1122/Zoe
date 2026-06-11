import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { completeProtocol } from '../features/userSlice';
import { Terminal, ShieldAlert, Crosshair, Fingerprint } from 'lucide-react';
import { playClickSound } from '../utils/audio';
import './ProtocolOverlay.css';

export default function ProtocolOverlay() {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [focus, setFocus] = useState(null);

  // Auto-advance helper
  const nextStep = () => {
    playClickSound();
    setStep(prev => prev + 1);
  };

  const handleInitialize = () => {
    playClickSound();
    dispatch(completeProtocol({ focus: focus || 'General' }));
  };

  return (
    <div className="protocol-backdrop">
      <div className="protocol-panel">
        
        {/* Terminal Header */}
        <div className="protocol-header">
          <Terminal size={18} className="protocol-icon" />
          <span>ZOË.OS_ONBOARDING</span>
        </div>

        <div className="protocol-content">
          
          {step === 1 && (
            <div className="protocol-step slide-up">
              <Fingerprint size={48} className="protocol-warning-icon text-accent" />
              <h2>OPERATOR RECOGNIZED</h2>
              <p>Welcome to Zoë, your gamified Life Operating System. Track tasks to earn EXP and level up. Stay consistent, or face system damage from inactivity.</p>
              <div className="protocol-actions">
                <button className="protocol-btn primary" onClick={nextStep}>INITIALIZE LINK</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="protocol-step slide-up">
              <Crosshair size={48} className="protocol-warning-icon text-gold" />
              <h2>PRIMARY DIRECTIVE</h2>
              <p>Select your initial area of focus to calibrate the system.</p>
              <div className="protocol-grid">
                {['Career', 'Health', 'Discipline', 'Finances'].map(domain => (
                  <button 
                    key={domain}
                    className="protocol-domain-btn"
                    onClick={() => {
                      playClickSound();
                      setFocus(domain);
                      setStep(3);
                    }}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="protocol-step slide-up">
              <ShieldAlert size={48} className="protocol-warning-icon text-accent" />
              <h2>LINK ESTABLISHED</h2>
              <p>You are now officially an Operator. Complete your tasks to unlock Black Market items, upgrades, and secure your place on the Global Leaderboard.</p>
              
              <button 
                className="protocol-btn submit-btn ready"
                style={{ marginTop: '1.5rem' }}
                onClick={handleInitialize}
              >
                ENTER SYSTEM
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
