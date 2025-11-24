import React, { useState, useEffect, useCallback } from 'react';
import './HomePage.css';
import Lightning from './Lightning';

const HomePage = ({ onLoginClick }) => {
  const [currentLightning, setCurrentLightning] = useState(0);
  
  const lightningConfigs = [
    { hue: 218, xOffset: 0.9, speed: 1, intensity: 1.8, size: 2.1 },  // Right side - Blue
    { hue: 251, xOffset: 0, speed: 1, intensity: 1.8, size: 2.1 },    // Center - Purple
    { hue: 360, xOffset: -0.9, speed: 1, intensity: 1.8, size: 2.1 }  // Left side - Red
  ];

  const getRandomLightningIndex = useCallback((currentIndex) => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * lightningConfigs.length);
    } while (newIndex === currentIndex && lightningConfigs.length > 1);
    return newIndex;
  }, [lightningConfigs.length]);

  useEffect(() => {
    // Start with a random lightning
    setCurrentLightning(Math.floor(Math.random() * lightningConfigs.length));
  }, [lightningConfigs.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLightning(prev => getRandomLightningIndex(prev));
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [getRandomLightningIndex]);

  return (
    <div className="homepage-container">
      <div className="homepage-background">
        <Lightning
          hue={lightningConfigs[currentLightning].hue}
          xOffset={lightningConfigs[currentLightning].xOffset}
          speed={lightningConfigs[currentLightning].speed}
          intensity={lightningConfigs[currentLightning].intensity}
          size={lightningConfigs[currentLightning].size}
        />
      </div>
      <div className="homepage-content">
        <header className="homepage-header">
          <div className="homepage-logo">
            <span className="homepage-logo-text">INCOGNITO</span>
          </div>
          <button className="homepage-login-btn" onClick={onLoginClick}>
            LOGIN
          </button>
        </header>
        
        <main className="homepage-main">
          <div className="homepage-mission">
            <h1>OBSIDIVERSE PURSUIT</h1>
            <p>YOU ARE CHOSEN TO BRING JUSTICE OR THE FALL OF THIS VERSE,</p>
            <p>CHOOSE YOUR PATH AND FOLLOW IT TO THE END</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;