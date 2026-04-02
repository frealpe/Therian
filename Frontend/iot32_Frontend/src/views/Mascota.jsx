import { useEffect, useState, useRef } from 'react'
import { CContainer } from '@coreui/react'
import Mascot from '../components/Mascot'
import mascotImage from '../assets/mascot.png'

// Intervalo de polling para detectar nueva imagen (ms)
const POLL_INTERVAL = 2500
// Cache-bust: agregar timestamp a la URL de la imagen para forzar recarga
const badgeUrl = () => `/api/badge/serve?t=${Date.now()}`

/**
 * Vista /mascota — muestra la mascota y el Smart Badge recibido desde la app móvil.
 * - Hace polling a /api/badge/status cada 2.5s
 * - Cuando el ESP32 reporta badge_updated=true, recarga la imagen
 * - Muestra overlay de "Transmitiendo..." con barra animada mientras uploading
 */
const Mascota = () => {
    const [hasBadge, setHasBadge] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [badgeTimestamp, setBadgeTimestamp] = useState(null)
    const [freeHeap, setFreeHeap] = useState(null)
    const prevUpdated = useRef(false)
    const pollRef = useRef(null)

    // -----------------------------------------------------------------
    // Polling: consulta /api/badge/status
    // -----------------------------------------------------------------
    useEffect(() => {
        const poll = async () => {
            try {
                const res = await fetch('/api/badge/status', { cache: 'no-store' })
                if (!res.ok) return
                const data = await res.json()

                setFreeHeap(data.free_heap)
                setHasBadge(data.has_badge)

                // Si el ESP32 reporta que se actualizó → "uploading" acabó
                if (data.updated && !prevUpdated.current) {
                    // Recién llegó nueva imagen
                    setUploading(false)
                    setBadgeTimestamp(Date.now()) // trigger recarga de img
                }

                // Detectar que empezó una transmisión (has_badge=false momentáneo
                // o updated=false después de haber tenido badge) — lo detectamos
                // desde el componente BadgeUploader vía localStorage
                const uploadingFlag = localStorage.getItem('badge_uploading')
                if (uploadingFlag === '1') {
                    setUploading(true)
                } else if (uploading && data.updated) {
                    setUploading(false)
                }

                prevUpdated.current = data.updated
            } catch (_) { /* silenciar errores de red */ }
        }

        poll() // Llamada inmediata
        pollRef.current = setInterval(poll, POLL_INTERVAL)
        return () => clearInterval(pollRef.current)
    }, [uploading])

    return (
        <CContainer fluid className="d-flex align-items-center justify-content-center"
            style={{ minHeight: '80vh', position: 'relative', overflow: 'hidden' }}>

            {/* AR Scanning Effect Background */}
            <div className="ar-overlay"></div>

            {/* Centered Circular Card */}
            <div className="mascot-ar-card">
                <div className="scanning-line"></div>
                <div className="hud-corner top-left"></div>
                <div className="hud-corner top-right"></div>
                <div className="hud-corner bottom-left"></div>
                <div className="hud-corner bottom-right"></div>

                {/* Overlay de transmisión */}
                {uploading && (
                    <div className="uploading-overlay">
                        <div className="upload-spinner"></div>
                        <span className="upload-label">TRANSMITIENDO...</span>
                        <div className="upload-progress-bar">
                            <div className="upload-progress-fill"></div>
                        </div>
                    </div>
                )}

                <div className="card-content">
                    <div className="status-badge">
                        {uploading ? '⬆ UPLOADING' : hasBadge ? 'BADGE ACTIVE' : 'TARGET LOCKED'}
                    </div>

                    {/* Imagen Badge (si hay) — se muestra encima de la mascota */}
                    {hasBadge && !uploading ? (
                        <div className="badge-display">
                            <img
                                key={badgeTimestamp}
                                src={`/api/badge/serve?t=${badgeTimestamp || Date.now()}`}
                                alt="Smart Badge"
                                className="badge-image"
                                onError={() => setHasBadge(false)}
                            />
                            <div className="badge-glow"></div>
                        </div>
                    ) : (
                        <Mascot
                            sprite={mascotImage}
                            width={180}
                            height={180}
                            frames={1}
                            duration={1}
                        />
                    )}

                    <div className="mascot-info">
                        <span className="label">STATUS:</span>
                        <span className="value">
                            {uploading ? 'RX_INCOMING' : hasBadge ? 'BADGE_SET' : 'SENTINEL_DRONE'}
                        </span>
                    </div>
                    {freeHeap && (
                        <div className="mascot-info" style={{ marginTop: 4 }}>
                            <span className="label">HEAP:</span>
                            <span className="value">{Math.round(freeHeap / 1024)}KB</span>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .ar-overlay {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: radial-gradient(circle at center, transparent 0%, rgba(0, 20, 40, 0.4) 100%);
                    pointer-events: none;
                    z-index: 1;
                }

                .mascot-ar-card {
                    position: relative;
                    width: 350px; height: 350px;
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

                /* ---- Badge ---- */
                .badge-display {
                    position: relative;
                    width: 180px; height: 180px;
                }

                .badge-image {
                    width: 100%; height: 100%;
                    object-fit: cover;
                    border-radius: 50%;
                    border: 2px solid rgba(0, 255, 255, 0.5);
                    animation: badgePulse 3s ease-in-out infinite;
                }

                .badge-glow {
                    position: absolute;
                    inset: -6px;
                    border-radius: 50%;
                    background: transparent;
                    box-shadow: 0 0 20px 6px rgba(0, 255, 255, 0.35);
                    pointer-events: none;
                    animation: badgePulse 3s ease-in-out infinite;
                }

                @keyframes badgePulse {
                    0%, 100% { opacity: 0.8; }
                    50% { opacity: 1; }
                }

                /* ---- Upload overlay ---- */
                .uploading-overlay {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    background: rgba(0, 10, 20, 0.78);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    gap: 10px;
                }

                .upload-spinner {
                    width: 48px; height: 48px;
                    border: 3px solid rgba(0,255,255,0.15);
                    border-top-color: #00ffff;
                    border-radius: 50%;
                    animation: spin 0.9s linear infinite;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                .upload-label {
                    font-size: 0.65rem;
                    letter-spacing: 2px;
                    color: #00ffff;
                    text-shadow: 0 0 6px #00ffff;
                    font-family: 'Courier New', monospace;
                }

                .upload-progress-bar {
                    width: 120px; height: 3px;
                    background: rgba(0,255,255,0.15);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .upload-progress-fill {
                    height: 100%;
                    background: #00ffff;
                    box-shadow: 0 0 8px #00ffff;
                    animation: progress 1.6s ease-in-out infinite;
                    transform-origin: left;
                }

                @keyframes progress {
                    0%   { transform: scaleX(0); }
                    50%  { transform: scaleX(0.7); }
                    100% { transform: scaleX(1); opacity: 0.3; }
                }

                /* ---- Original styles ---- */
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

                .mascot-info .label { opacity: 0.6; margin-right: 5px; }
                .mascot-info .value { font-weight: bold; }

                .hud-corner {
                    position: absolute;
                    width: 20px; height: 20px;
                    border: 2px solid #00ffff;
                    opacity: 0.6;
                }

                .top-left    { top: 40px;    left:  40px;  border-right: 0; border-bottom: 0; }
                .top-right   { top: 40px;    right: 40px;  border-left:  0; border-bottom: 0; }
                .bottom-left { bottom: 40px; left:  40px;  border-right: 0; border-top: 0; }
                .bottom-right{ bottom: 40px; right: 40px;  border-left:  0; border-top: 0; }

                .scanning-line {
                    position: absolute;
                    width: 100%; height: 2px;
                    background: rgba(0, 255, 255, 0.5);
                    box-shadow: 0 0 10px #00ffff;
                    top: 0; left: 0;
                    animation: scan 3s linear infinite;
                    z-index: 3;
                }

                @keyframes scan {
                    0%   { top: 0%;   opacity: 0; }
                    10%  { opacity: 1; }
                    90%  { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-15px); }
                }
            `}</style>
        </CContainer>
    )
}

export default Mascota
