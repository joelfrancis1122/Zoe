import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { completeProtocol } from '../features/userSlice';
import { Terminal, AlertTriangle, ShieldAlert, Crosshair, Fingerprint } from 'lucide-react';
import './ProtocolOverlay.css';

export default function ProtocolOverlay() {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [focus, setFocus] = useState(null);
  const [typedAgreement, setTypedAgreement] = useState('');
  const [glitchText, setGlitchText] = useState(false);

  // Auto-focus on input for step 4
  useEffect(() => {
    if (step === 4) {
      const input = document.getElementById('protocol-agreement-input');
      if (input) input.focus();
    }
  }, [step]);

  const handleAbort = () => {
    // Punish them with a glitch effect and reset to step 1
    setGlitchText(true);
    setTimeout(() => {
      setGlitchText(false);
      setStep(1);
    }, 800);
  };

  const handleInitialize = (e) => {
    e.preventDefault();
    if (typedAgreement === 'I AGREE') {
      dispatch(completeProtocol({ focus }));
    } else {
      setGlitchText(true);
      setTimeout(() => setGlitchText(false), 500);
    }
  };

  return (
    <div className="protocol-backdrop">
      <div className={`protocol-panel ${glitchText ? 'glitch-anim' : ''}`}>
        
        {/* Terminal Header */}
        <div className="protocol-header">
          <Terminal size={18} className="protocol-icon" />
          <span>SYSTEM.INITIALIZATION.PROTOCOL</span>
        </div>

        <div className="protocol-content">
          
          {step === 1 && (
            <div className="protocol-step slide-up">
              <ShieldAlert size={48} className="protocol-warning-icon text-accent" />
              <h2>SYSTEM OVERRIDE DETECTED</h2>
              <p>Do you agree to surrender control of your daily chaos to the Zoë operating system?</p>
              <div className="protocol-actions">
                <button className="protocol-btn primary" onClick={() => setStep(2)}>I SURRENDER</button>
                <button className="protocol-btn secondary abort" onClick={handleAbort}>ABORT</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="protocol-step slide-up">
              <AlertTriangle size={48} className="protocol-warning-icon text-danger" />
              <h2 className="text-danger">SEVERE CONSEQUENCES</h2>
              <p>Are you prepared to face severe numerical penalties and the "Death" mechanic if you fail to execute your daily directives?</p>
              <div className="protocol-actions">
                <button className="protocol-btn primary danger-hover" onClick={() => setStep(3)}>I ACCEPT THE RISK</button>
                <button className="protocol-btn secondary abort" onClick={handleAbort}>I AM NOT READY</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="protocol-step slide-up">
              <Crosshair size={48} className="protocol-warning-icon text-gold" />
              <h2>TARGET ACQUISITION</h2>
              <p>Which domain requires the most ruthless optimization?</p>
              <div className="protocol-grid">
                {['Career', 'Health', 'Discipline', 'Finances'].map(domain => (
                  <button 
                    key={domain}
                    className="protocol-domain-btn"
                    onClick={() => {
                      setFocus(domain);
                      setStep(4);
                    }}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="protocol-step slide-up">
              <Fingerprint size={48} className="protocol-warning-icon text-accent" />
              <h2>FINAL AUTHORIZATION</h2>
              <p>By proceeding, you acknowledge that you are no longer a passenger in your life, but an Operator.</p>
              <p className="protocol-instruction">Type <span className="highlight">I AGREE</span> to initialize.</p>
              
              <form onSubmit={handleInitialize} className="protocol-form">
                <input 
                  id="protocol-agreement-input"
                  type="text" 
                  className={`protocol-input ${typedAgreement !== 'I AGREE' && typedAgreement.length >= 7 ? 'input-error' : ''}`}
                  placeholder="I AGREE" 
                  value={typedAgreement}
                  onChange={(e) => setTypedAgreement(e.target.value)}
                  autoComplete="off"
                />
                <button 
                  type="submit" 
                  className={`protocol-btn submit-btn ${typedAgreement === 'I AGREE' ? 'ready' : ''}`}
                  disabled={typedAgreement !== 'I AGREE'}
                >
                  INITIALIZE ZOË
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
