import { CContainer } from '@coreui/react'
import Mascot from '../components/Mascot'
import mascotImage from '../assets/mascot.png'

const Mascota = () => {
    return (
        <CContainer fluid className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh', position: 'relative', overflow: 'hidden' }}>
            {/* AR Scanning Effect Background */}
            <div className="ar-overlay"></div>

            {/* Centered Circular Card */}
            <div className="mascot-ar-card">
                <div className="scanning-line"></div>
                <div className="hud-corner top-left"></div>
                <div className="hud-corner top-right"></div>
                <div className="hud-corner bottom-left"></div>
                <div className="hud-corner bottom-right"></div>

                <div className="card-content">
                    <div className="status-badge">TARGET LOCKED</div>
                    <Mascot
                        sprite={mascotImage}
                        width={180}
                        height={180}
                        frames={1}
                        duration={1}
                    />
                    <div className="mascot-info">
                        <span className="label">SPECIES:</span>
                        <span className="value">SENTINEL_DRONE</span>
                    </div>
                </div>
            </div>

            <style>{`
                .ar-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at center, transparent 0%, rgba(0, 20, 40, 0.4) 100%);
                    pointer-events: none;
                    z-index: 1;
                }

                .mascot-ar-card {
                    position: relative;
                    width: 350px;
                    height: 350px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(15px);
                    border: 2px solid rgba(0, 255, 255, 0.3);
                    box-shadow: 0 0 30px rgba(0, 255, 255, 0.2), inset 0 0 20px rgba(0, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                    animation: float 4s ease-in-out infinite;
                    overflow: hidden;
                }

                .card-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    color: #00ffff;
                    font-family: 'Courier New', Courier, monospace;
                }

                .status-badge {
                    font-size: 0.7rem;
                    letter-spacing: 2px;
                    margin-bottom: 20px;
                    color: #00ffff;
                    text-shadow: 0 0 5px #00ffff;
                }

                .mascot-info {
                    margin-top: 20px;
                    font-size: 0.8rem;
                }

                .mascot-info .label {
                    opacity: 0.6;
                    margin-right: 5px;
                }

                .mascot-info .value {
                    font-weight: bold;
                }

                /* HUD Elements */
                .hud-corner {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border: 2px solid #00ffff;
                    opacity: 0.6;
                }

                .top-left { top: 40px; left: 40px; border-right: 0; border-bottom: 0; }
                .top-right { top: 40px; right: 40px; border-left: 0; border-bottom: 0; }
                .bottom-left { bottom: 40px; left: 40px; border-right: 0; border-top: 0; }
                .bottom-right { bottom: 40px; right: 40px; border-left: 0; border-top: 0; }

                .scanning-line {
                    position: absolute;
                    width: 100%;
                    height: 2px;
                    background: rgba(0, 255, 255, 0.5);
                    box-shadow: 0 0 10px #00ffff;
                    top: 0;
                    left: 0;
                    animation: scan 3s linear infinite;
                    z-index: 3;
                }

                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
            `}</style>
        </CContainer>
    )
}

export default Mascota
