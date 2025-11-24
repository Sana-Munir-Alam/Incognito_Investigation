import React, { useState, useCallback, useMemo } from 'react';
import ElectricBorder from './ElectricBorder';
import Galaxy from './Galaxy';
import './Login.css';

const Login = ({ onLogin, onBack }) => {
  const [loginType, setLoginType] = useState('participant');
  const [formData, setFormData] = useState({
    teamName: '',
    teamLeaderName: '',
    password: '',
    adminUsername: '',
    adminPassword: ''
  });

  // Memoize the input handler to prevent unnecessary re-renders
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.toUpperCase()
    }));
  }, []);

  // Memoize the login type toggle
  const handleLoginTypeToggle = useCallback((type) => {
    setLoginType(type);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loginType === 'admin') {
      // Hardcoded admin credentials
      if (formData.adminUsername === 'INCOGNITOADMIN' && formData.adminPassword === 'INCOGNITO26PROCOM') {
        onLogin({ role: 'admin' });
      } else {
        alert('Invalid admin credentials');
      }
    } else {
      // Participant login - will connect to backend
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamName: formData.teamName,
            teamLeaderName: formData.teamLeaderName,
            password: formData.password
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          onLogin({
            role: 'participant',
            team: data.team,
            alliance: data.alliance
          });
        } else {
          alert(data.message || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Connection error. Please try again.');
      }
    }
  };

  // Memoize the Galaxy component with optimized settings
  const memoizedGalaxy = useMemo(() => (
    <Galaxy 
      mouseRepulsion={false}
      mouseInteraction={false}
      density={2}
      glowIntensity={0.2}
      saturation={0.7}
      hueShift={190}
      speed={0.2}
      twinkleIntensity={0.1}
      rotationSpeed={0.05}
      transparent={true}
    />
  ), []);

  // Memoize ElectricBorder to prevent re-renders
  const memoizedElectricBorder = useMemo(() => (
    <ElectricBorder
      color="#80f6ff"
      speed={1.5}
      chaos={0.5}
      thickness={3}
      className="login-page-electric-border"
      style={{ 
        borderRadius: '8px',
        width: '100%',
        maxWidth: '500px'
      }}
    >
      <div className="login-page-form-content">
        <h2>ACCESS PORTAL</h2>
        
        <div className="login-page-type-toggle">
          <button 
            className={`login-page-toggle-btn ${loginType === 'participant' ? 'active' : ''}`}
            onClick={() => handleLoginTypeToggle('participant')}
            type="button"
          >
            PARTICIPANT
          </button>
          <button 
            className={`login-page-toggle-btn ${loginType === 'admin' ? 'active' : ''}`}
            onClick={() => handleLoginTypeToggle('admin')}
            type="button"
          >
            ADMIN
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {loginType === 'participant' ? (
            <>
              <div className="login-page-form-group">
                <label className="login-page-form-label">TEAM NAME</label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleInputChange}
                  className="login-page-form-input"
                  placeholder="ENTER TEAM NAME"
                  required
                />
              </div>
              
              <div className="login-page-form-group">
                <label className="login-page-form-label">TEAM LEADER NAME</label>
                <input
                  type="text"
                  name="teamLeaderName"
                  value={formData.teamLeaderName}
                  onChange={handleInputChange}
                  className="login-page-form-input"
                  placeholder="ENTER LEADER NAME"
                  required
                />
              </div>
              
              <div className="login-page-form-group">
                <label className="login-page-form-label">PASSWORD</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="login-page-form-input"
                  placeholder="ENTER PASSWORD"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="login-page-form-group">
                <label className="login-page-form-label">ADMIN USERNAME</label>
                <input
                  type="text"
                  name="adminUsername"
                  value={formData.adminUsername}
                  onChange={handleInputChange}
                  className="login-page-form-input"
                  placeholder="ENTER ADMIN USERNAME"
                  required
                />
              </div>
              
              <div className="login-page-form-group">
                <label className="login-page-form-label">ADMIN PASSWORD</label>
                <input
                  type="password"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleInputChange}
                  className="login-page-form-input"
                  placeholder="ENTER ADMIN PASSWORD"
                  required
                />
              </div>
            </>
          )}
          
          <button type="submit" className="login-page-submit-btn">
            {loginType === 'participant' ? 'ACCESS DASHBOARD' : 'ADMIN ACCESS'}
          </button>
        </form>
      </div>
    </ElectricBorder>
  ), [loginType, formData, handleInputChange, handleLoginTypeToggle, handleSubmit]);

  return (
    <div className="login-page-container">
      <div className="login-page-background">
        {memoizedGalaxy}
      </div>
      <div className="login-page-content">
        <button className="login-page-back-btn" onClick={onBack}>← BACK</button>
        {memoizedElectricBorder}
      </div>
    </div>
  );
};

export default React.memo(Login);