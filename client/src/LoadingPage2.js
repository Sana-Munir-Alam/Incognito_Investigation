import React, { useEffect, useState } from 'react';
import Galaxy from './Galaxy';
import GradientText from './GradientText';
import './LoadingPage2.css';

const LoadingPage2 = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setFadeOut(true);
    }, 4500);

    const finishTimer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 4500); // Call onFinish at 13 seconds

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`loading-page2-container ${fadeOut ? 'fade-out' : ''}`}>
      <div className="loading-page2-background">
        <Galaxy 
            mouseRepulsion={true}
            mouseInteraction={true}
            density={3}
            glowIntensity={0.3}
            saturation={0.7}
            hueShift={190}
            speed={1}
            twinkleIntensity={0.3}
            rotationSpeed={0.1}
            repulsionStrength={0.5}
            autoCenterRepulsion={4}
        />
      </div>
      
      <div className="loading-page2-content">
        <div className="loading-page2-grid">
          <div className="loading-page2-text-wrapper">
            <GradientText
              colors={["#C70039", "#0033FF", "#3D0066", "#0033FF", "#C70039"]}
              animationSpeed={3}
              showBorder={false}
              className="loading-page2-gradient-text"
            >
              TELEPORTING TO BASE
            </GradientText>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage2;