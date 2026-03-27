import React from 'react';

/**
 * Mascot Component for React
 * Usa una animación CSS de Sprite Sheet (pasos).
 * 
 * @param {string} sprite - URL o Base64 del Sprite Sheet.
 * @param {number} width - Ancho de un solo cuadro (px).
 * @param {number} height - Alto de un solo cuadro (px).
 * @param {number} frames - Número total de cuadros en el sprite.
 * @param {number} duration - Duración total de la animación (segundos).
 */
const Mascot = ({ sprite, width = 64, height = 64, frames = 4, duration = 0.5 }) => {
  const spriteWidth = width * frames;

  const mascotStyle = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundImage: `url(${sprite})`,
    backgroundSize: `${spriteWidth}px ${height}px`,
    animation: `mascot-animation ${duration}s steps(${frames}) infinite`
  };

  return (
    <div className="mascot-container">
      <div className="mascot-sprite" style={mascotStyle} />
      <style>{`
        @keyframes mascot-animation {
          from { background-position: 0px 0px; }
          to { background-position: -${spriteWidth}px 0px; }
        }
        .mascot-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .mascot-sprite {
          image-rendering: pixelated; /* Si es pixel art */
        }
      `}</style>
    </div>
  );
};

export default Mascot;
