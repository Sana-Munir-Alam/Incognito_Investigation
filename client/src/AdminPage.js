import React, { useState, useEffect } from 'react';
import './AdminPage.css';

const AdminPage = ({ onLogout }) => {
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showRatConfirmModal, setShowRatConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetButtonsModal, setShowResetButtonsModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [resetButtonsConfirmation, setResetButtonsConfirmation] = useState('');
  const [teamsData, setTeamsData] = useState([]);
  const [sortedTeams, setSortedTeams] = useState([]);
  const [buttonStatus, setButtonStatus] = useState({
    goodAttack: {
      DEACTIVATE_SUBMIT: true,
      FALSE_EVIDENCE: true,
      DECREASE_POINTS: true
    },
    badAttack: {
      DEACTIVATE_SUBMIT: true,
      FALSE_EVIDENCE: true,
      DECREASE_POINTS: true
    },
    ratAttack: {
      DEACTIVATE_SUBMIT: true,
      FALSE_EVIDENCE: true,
      DECREASE_POINTS: true
    },
    submitActivation: {
      GOOD: true,
      BAD: true
    }
  });
  
  const [pendingRatAttack, setPendingRatAttack] = useState(null);
  const [selectedTargetSubAlliance, setSelectedTargetSubAlliance] = useState('GOOD');
  
  const [newUser, setNewUser] = useState({
    teamName: '',
    teamLeaderName: '',
    password: '',
    alliance: 'GOOD',
    subAlliance: 'GOOD'
  });

  const [messageData, setMessageData] = useState({
    sender: 'ALEXANDER WHITEHALL',
    message: ''
  });

  const senderOptions = [
    'SAMEUL JACKSON',
    'JACK SPARROW',
    'CYGNUS CHRONOS',
    'MAYA ROSS',
    'KIERA SOLAS',
    'CARL ROGERS',
    'COMMAND CENTER',
    'MULTIVERSE HQ',
    'SYSTEM ADMIN',
    'ANONYMOUS'
  ];

  // Fetch teams data
  const fetchTeams = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/teams');
      const data = await response.json();
      if (response.ok) {
        setTeamsData(data);
        
        // Sort teams by total score (descending)
        const sorted = [...data].sort((a, b) => b.TotalPoints - a.TotalPoints);
        setSortedTeams(sorted);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  // Fetch button status
  const fetchButtonStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/button-status');
      const data = await response.json();
      if (response.ok && data.success) {
        setButtonStatus(data.buttonStatus);
      }
    } catch (error) {
      console.error('Error fetching button status:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/puzzle-notifications');
      const data = await response.json();
      if (response.ok && data.notifications.length > 0) {
        // Show the most recent notification
        const latestNotification = data.notifications[data.notifications.length - 1];
        setCurrentNotification(latestNotification);
        setShowNotificationModal(true);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Load teams on component mount and set up polling
  useEffect(() => {
    fetchTeams();
    fetchButtonStatus();
    fetchNotifications(); // Initial fetch
    
    const teamsInterval = setInterval(fetchTeams, 3000); // Poll every 3 seconds
    const buttonStatusInterval = setInterval(fetchButtonStatus, 3000);
    const notificationsInterval = setInterval(fetchNotifications, 2000); // Poll notifications every 2 seconds
    
    return () => {
      clearInterval(teamsInterval);
      clearInterval(buttonStatusInterval);
      clearInterval(notificationsInterval);
    };
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/admin/create-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Team created successfully!');
        setShowCreateUser(false);
        setNewUser({
          teamName: '',
          teamLeaderName: '',
          password: '',
          alliance: 'GOOD',
          subAlliance: 'GOOD'
        });
        fetchTeams(); // Refresh teams list
      } else {
        alert(data.message || 'Failed to create team');
      }
    } catch (error) {
      console.error('Create team error:', error);
      alert('Connection error. Please try again.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/admin/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: messageData.sender,
          message: messageData.message,
          timestamp: new Date().toISOString()
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Message sent to all teams!');
        setShowMessageModal(false);
        setMessageData({
          sender: 'ALEXANDER WHITEHALL',
          message: ''
        });
      } else {
        alert(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      alert('Connection error. Please try again.');
    }
  };

  const handleResetGame = async (e) => {
    e.preventDefault();
    
    if (resetConfirmation !== 'CONFIRM RESET GAME') {
      alert('Please type "CONFIRM RESET GAME" exactly to proceed.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/reset-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: resetConfirmation
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Game reset successfully! All teams have been restored to default state.');
        setShowResetModal(false);
        setResetConfirmation('');
        fetchTeams(); // Refresh teams list
      } else {
        alert(data.message || 'Failed to reset game');
      }
    } catch (error) {
      console.error('Reset game error:', error);
      alert('Connection error. Please try again.');
    }
  };

  const handleDeleteEverything = async (e) => {
    e.preventDefault();
    
    if (deleteConfirmation !== 'DELETE EVERYTHING') {
      alert('Please type "DELETE EVERYTHING" exactly to proceed.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/delete-everything', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: deleteConfirmation
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Database completely wiped! Everything has been deleted.');
        setShowDeleteModal(false);
        setDeleteConfirmation('');
        fetchTeams(); // Refresh teams list
        fetchButtonStatus(); // Refresh button status
      } else {
        alert(data.message || 'Failed to delete everything');
      }
    } catch (error) {
      console.error('Delete everything error:', error);
      alert('Connection error. Please try again.');
    }
  };

  const handleResetButtons = async (e) => {
    e.preventDefault();
    
    if (resetButtonsConfirmation !== 'RESET BUTTONS') {
      alert('Please type "RESET BUTTONS" exactly to proceed.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/reset-buttons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: resetButtonsConfirmation
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('All buttons reset to active state!');
        setShowResetButtonsModal(false);
        setResetButtonsConfirmation('');
        fetchButtonStatus(); // Refresh button status
      } else {
        alert(data.message || 'Failed to reset buttons');
      }
    } catch (error) {
      console.error('Reset buttons error:', error);
      alert('Connection error. Please try again.');
    }
  };

  const handleActivatePuzzle = async (puzzleNumber) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/activate-special-puzzle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puzzleNumber: puzzleNumber
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Special Puzzle ${puzzleNumber} activated for ALL alliances!`);
      } else {
        alert(data.message || 'Failed to activate puzzle');
      }
    } catch (error) {
      console.error('Activate puzzle error:', error);
      alert('Connection error. Please try again.');
    }
  };

  const handleActivateSubmit = async (subAlliance) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/activate-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subAlliance: subAlliance
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Submit functionality activated for ${subAlliance} sub-alliance!`);
        fetchButtonStatus(); // Refresh button status
      } else {
        alert(data.message || 'Failed to activate submit');
      }
    } catch (error) {
      console.error('Activate submit error:', error);
      alert('Connection error. Please try again.');
    }
  };

  // Attack Functions
  const handleAttack = async (attackerAlliance, attackType) => {
    // For RAT alliance, show confirmation modal first
    if (attackerAlliance === 'RATS') {
      setPendingRatAttack({ attackerAlliance, attackType });
      setShowRatConfirmModal(true);
      return;
    }

    // For GOOD and BAD, determine target automatically
    const targetSubAlliance = attackerAlliance === 'GOOD' ? 'BAD' : 'GOOD';
    await executeAttack(attackerAlliance, targetSubAlliance, attackType);
  };

  const handleRatAttackConfirm = async () => {
    if (!pendingRatAttack) return;

    await executeAttack(
      pendingRatAttack.attackerAlliance,
      selectedTargetSubAlliance,
      pendingRatAttack.attackType
    );

    setShowRatConfirmModal(false);
    setPendingRatAttack(null);
    setSelectedTargetSubAlliance('GOOD');
  };

  const executeAttack = async (attackerAlliance, targetSubAlliance, attackType) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/launch-attack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attackerAlliance,
          targetSubAlliance,
          attackType
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Attack launched successfully! ${data.message}`);
        fetchTeams(); // Refresh to see point changes
        fetchButtonStatus(); // Refresh button status
      } else {
        alert(data.message || 'Failed to launch attack');
      }
    } catch (error) {
      console.error('Attack error:', error);
      alert('Connection error. Please try again.');
    }
  };

  const handleCloseNotification = () => {
    setShowNotificationModal(false);
    setCurrentNotification(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value.toUpperCase()
    }));
  };

  const handleMessageChange = (e) => {
    const { name, value } = e.target;
    setMessageData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to render puzzle status circles
  const renderPuzzleStatus = (team, puzzleType) => {
    const puzzles = [];
    const count = puzzleType === 'GP' ? 8 : 3;
    
    for (let i = 1; i <= count; i++) {
      const puzzleField = puzzleType === 'GP' ? `GeneralPuzzle${i}Status` : `SpecialPuzzle${i}`;
      const isSolved = team[puzzleField];
      
      puzzles.push(
        <div key={i} className="admin-page-puzzle-item">
          <span className="admin-page-puzzle-number">{i}</span>
          <div className={`admin-page-puzzle-circle ${isSolved ? 'admin-page-puzzle-circle-solved' : 'admin-page-puzzle-circle-unsolved'}`}></div>
        </div>
      );
    }
    
    return puzzles;
  };

  // Helper function to check if attack button is disabled
  const isAttackButtonDisabled = (alliance, attackType) => {
    return !buttonStatus[`${alliance.toLowerCase()}Attack`]?.[attackType];
  };

  // Helper function to check if submit activation button is disabled
  const isSubmitActivationDisabled = (subAlliance) => {
    return !buttonStatus.submitActivation?.[subAlliance];
  };

  return (
    <div className="admin-page-container">
      {/* Fixed Header */}
      <nav className="admin-page-nav">
        <div className="admin-page-logo">
          <span>INCOGNITO ADMIN</span>
        </div>
        <button className="admin-page-logout" onClick={onLogout}>
          LOGOUT
        </button>
      </nav>

      {/* Main Content */}
      <main className="admin-page-main">
        <h2 className="admin-page-teams-title">ADMIN CONTROL PANEL</h2>
        {/* Controls Grid */}
        <div className="admin-page-controls-grid">
          {/* Control Panel */}
          <div className="admin-page-control-card admin-page-control-panel">
            <h3 className="admin-page-control-title">CONTROL PANEL</h3>
            <button 
              className="admin-page-control-btn"
              onClick={() => setShowCreateUser(true)}
            >
              CREATE USER
            </button>
            <button 
              className="admin-page-control-btn"
              onClick={() => setShowMessageModal(true)}
            >
              SEND MESSAGE
            </button>
          </div>

          {/* Activate SP */}
          <div className="admin-page-control-card admin-page-activate-sp">
            <h3 className="admin-page-control-title">ACTIVATE SP</h3>
            <div>
              <h4>ALL ALLIANCE</h4>
              <button className="admin-page-control-btn admin-page-sp-btn" onClick={() => handleActivatePuzzle('1')}> ACTIVATE SP1 </button>
              <button className="admin-page-control-btn admin-page-sp-btn" onClick={() => handleActivatePuzzle('2')}> ACTIVATE SP2 </button>
              <button className="admin-page-control-btn admin-page-sp-btn" onClick={() => handleActivatePuzzle('3')}> ACTIVATE SP3 </button>
            </div>
          </div>

          {/* Submit Activation */}
          <div className="admin-page-control-card admin-page-activation-card">
            <h3 className="admin-page-control-title">ACTIVATE SUBMIT</h3>
            <div>
              <h4>ENABLE SUBMISSION</h4>
              <button 
                className={`admin-page-control-btn admin-page-activation-btn ${isSubmitActivationDisabled('GOOD') ? 'admin-page-btn-disabled' : ''}`}
                onClick={() => handleActivateSubmit('GOOD')}
                disabled={isSubmitActivationDisabled('GOOD')}
              >
                ACTIVATE GOOD SUBMIT
              </button>
              <button 
                className={`admin-page-control-btn admin-page-activation-btn ${isSubmitActivationDisabled('BAD') ? 'admin-page-btn-disabled' : ''}`}
                onClick={() => handleActivateSubmit('BAD')}
                disabled={isSubmitActivationDisabled('BAD')}
              >
                ACTIVATE BAD SUBMIT
              </button>
            </div>
          </div>

          {/* Good Attack - Blue */}
          <div className="admin-page-attack-card admin-page-good-attack">
            <h3 className="admin-page-attack-title">GOOD ATTACK</h3>
            <div>
              <h4>TARGET: BAD SUB-ALLIANCE</h4>
              <button 
                className={`admin-page-attack-btn ${isAttackButtonDisabled('good', 'DEACTIVATE_SUBMIT') ? 'admin-page-btn-disabled' : ''}`}
                onClick={() => handleAttack('GOOD', 'DEACTIVATE_SUBMIT')}
                disabled={isAttackButtonDisabled('good', 'DEACTIVATE_SUBMIT')}
              >
                DEACTIVATE SUBMIT
              </button>
              <button 
                className={`admin-page-attack-btn ${isAttackButtonDisabled('good', 'FALSE_EVIDENCE') ? 'admin-page-btn-disabled' : ''}`}
                onClick={() => handleAttack('GOOD', 'FALSE_EVIDENCE')}
                disabled={isAttackButtonDisabled('good', 'FALSE_EVIDENCE')}
              >
                FALSE EVIDENCE
              </button>
              <button 
                className={`admin-page-attack-btn ${isAttackButtonDisabled('good', 'DECREASE_POINTS') ? 'admin-page-btn-disabled' : ''}`}
                onClick={() => handleAttack('GOOD', 'DECREASE_POINTS')}
                disabled={isAttackButtonDisabled('good', 'DECREASE_POINTS')}
              >
                DECREASE POINTS
              </button>
            </div>
          </div>

          {/* Bad Attack - Red */}
          <div className="admin-page-attack-card admin-page-bad-attack">
            <h3 className="admin-page-attack-title">BAD ATTACK</h3>
            <div>
              <h4>TARGET: GOOD SUB-ALLIANCE</h4>
              <button 
                className={`admin-page-attack-btn ${isAttackButtonDisabled('bad', 'DEACTIVATE_SUBMIT') ? 'admin-page-btn-disabled' : ''}`}
                onClick={() => handleAttack('BAD', 'DEACTIVATE_SUBMIT')}
                disabled={isAttackButtonDisabled('bad', 'DEACTIVATE_SUBMIT')}
              >
                DEACTIVATE SUBMIT
              </button>
              <button 
                className={`admin-page-attack-btn ${isAttackButtonDisabled('bad', 'FALSE_EVIDENCE') ? 'admin-page-btn-disabled' : ''}`}
                onClick={() => handleAttack('BAD', 'FALSE_EVIDENCE')}
                disabled={isAttackButtonDisabled('bad', 'FALSE_EVIDENCE')}
              >
                FALSE EVIDENCE
              </button>
              <button 
                className={`admin-page-attack-btn ${isAttackButtonDisabled('bad', 'DECREASE_POINTS') ? 'admin-page-btn-disabled' : ''}`}
                onClick={() => handleAttack('BAD', 'DECREASE_POINTS')}
                disabled={isAttackButtonDisabled('bad', 'DECREASE_POINTS')}
              >
                DECREASE POINTS
              </button>
            </div>
          </div>

          {/* RAT Attack - Purple */}
          <div className="admin-page-attack-card admin-page-rat-attack">
            <h3 className="admin-page-attack-title">RAT ATTACK</h3>
            <div>
              <h4>SELECT TARGET</h4>
              <button 
                className={`admin-page-attack-btn ${isAttackButtonDisabled('rat', 'DEACTIVATE_SUBMIT') ? 'admin-page-btn-disabled' : ''}`}
                onClick={() => handleAttack('RATS', 'DEACTIVATE_SUBMIT')}
                disabled={isAttackButtonDisabled('rat', 'DEACTIVATE_SUBMIT')}
              >
                DEACTIVATE SUBMIT
              </button>
              <button 
                className={`admin-page-attack-btn ${isAttackButtonDisabled('rat', 'FALSE_EVIDENCE') ? 'admin-page-btn-disabled' : ''}`}
                onClick={() => handleAttack('RATS', 'FALSE_EVIDENCE')}
                disabled={isAttackButtonDisabled('rat', 'FALSE_EVIDENCE')}
              >
                FALSE EVIDENCE
              </button>
              <button 
                className={`admin-page-attack-btn ${isAttackButtonDisabled('rat', 'DECREASE_POINTS') ? 'admin-page-btn-disabled' : ''}`}
                onClick={() => handleAttack('RATS', 'DECREASE_POINTS')}
                disabled={isAttackButtonDisabled('rat', 'DECREASE_POINTS')}
              >
                DECREASE POINTS
              </button>
            </div>
          </div>

          {/* Critical Card */}
            <div className="admin-page-critical-card">
              <h3 className="admin-page-critical-title">CRITICAL</h3>
              <button className="admin-page-critical-btn"
                onClick={() => {
                  setResetConfirmation('');
                  setShowResetModal(true);
                }}
              >
                RESET GAME
              </button>
              <button className="admin-page-critical-btn"
                onClick={() => {
                  setResetButtonsConfirmation('');
                  setShowResetButtonsModal(true);
                }}
              >
                RESET BUTTONS
              </button>
              <button className="admin-page-critical-btn"
                onClick={() => {
                  setDeleteConfirmation('');
                  setShowDeleteModal(true);
                }}
              >
                DELETE ALL
              </button>
            </div>
        </div>

        {/* Divider */}
        <div className="admin-page-divider">
          <div className="admin-page-divider-line"></div>
        </div>

        {/* Teams Progress Section */}
        <section className="admin-page-teams-section">
          <h2 className="admin-page-teams-title">TEAMS PROGRESS & LEADERBOARD</h2>
          
          <div className="admin-page-teams-grid">
            {sortedTeams.map((team, index) => (
              <div key={team._id} className="admin-page-team-card">
                <div className="admin-page-team-number">
                  {index + 1}
                </div>
                
                <div className="admin-page-team-header">
                  <h4 className="admin-page-team-name">{team.teamName}</h4>
                  <p className="admin-page-team-leader">Leader: {team.teamLeaderName}</p>
                </div>
                
                <div className="admin-page-team-stats">
                  <div className="admin-page-stat-item">
                    <span className="admin-page-stat-label">Total Score:</span>
                    <span className="admin-page-stat-value">{team.TotalPoints}</span>
                  </div>
                  
                  <div className="admin-page-stat-item">
                    <span className="admin-page-stat-label">Suspect Match:</span>
                    <span className="admin-page-stat-value">{team.SuspectMatchQty}/4</span>
                  </div>
                  
                  <div className="admin-page-stat-item">
                    <span className="admin-page-stat-label">Suspects Submitted:</span>
                    <span className={`admin-page-stat-value ${team.SuspectSubmittedStatus ? 'admin-page-stat-value-submitted' : 'admin-page-stat-value-not-submitted'}`}>
                      {team.SuspectSubmittedStatus ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
                
                {/* GP Puzzle Status */}
                <div className="admin-page-puzzle-section">
                  <h5 className="admin-page-puzzle-title">GP PUZZLE</h5>
                  <div className="admin-page-puzzle-grid">
                    {renderPuzzleStatus(team, 'GP')}
                  </div>
                </div>
                
                {/* SP Puzzle Status */}
                <div className="admin-page-puzzle-section">
                  <h5 className="admin-page-puzzle-title">SP PUZZLE</h5>
                  <div className="admin-page-puzzle-grid">
                    {renderPuzzleStatus(team, 'SP')}
                  </div>
                </div>
              </div>
            ))}
            
            {sortedTeams.length === 0 && (
              <div className="admin-page-no-teams">
                <p>No teams created yet. Use "CREATE USER" to add teams.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="admin-page-modal-overlay">
          <div className="admin-page-modal-content">
            <div className="admin-page-modal-header">
              <h3 className="admin-page-modal-title">CREATE NEW TEAM</h3>
              <button 
                className="admin-page-modal-close"
                onClick={() => setShowCreateUser(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateUser}>
              <div className="admin-page-form-group">
                <label className="admin-page-form-label">TEAM NAME</label>
                <input
                  type="text"
                  name="teamName"
                  value={newUser.teamName}
                  onChange={handleInputChange}
                  className="admin-page-form-input"
                  placeholder="ENTER TEAM NAME"
                  required
                />
              </div>
              
              <div className="admin-page-form-group">
                <label className="admin-page-form-label">TEAM LEADER NAME</label>
                <input
                  type="text"
                  name="teamLeaderName"
                  value={newUser.teamLeaderName}
                  onChange={handleInputChange}
                  className="admin-page-form-input"
                  placeholder="ENTER LEADER NAME"
                  required
                />
              </div>
              
              <div className="admin-page-form-group">
                <label className="admin-page-form-label">PASSWORD</label>
                <input
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  className="admin-page-form-input"
                  placeholder="ENTER PASSWORD"
                  required
                />
              </div>
              
              <div className="admin-page-form-group">
                <label className="admin-page-form-label">ALLIANCE</label>
                <select
                  name="alliance"
                  value={newUser.alliance}
                  onChange={handleInputChange}
                  className="admin-page-form-input"
                  required
                >
                  <option value="GOOD">GOOD</option>
                  <option value="BAD">BAD</option>
                  <option value="RATS">RATS</option>
                </select>
              </div>
              
              <div className="admin-page-form-group">
                <label className="admin-page-form-label">SUB-ALLIANCE</label>
                <select
                  name="subAlliance"
                  value={newUser.subAlliance}
                  onChange={handleInputChange}
                  className="admin-page-form-input"
                  required
                >
                  <option value="GOOD">GOOD</option>
                  <option value="BAD">BAD</option>
                </select>
              </div>
              
              <div className="admin-page-modal-actions">
                <button type="submit" className="admin-page-modal-btn-primary">
                  CREATE TEAM
                </button>
                <button 
                  type="button" 
                  className="admin-page-modal-btn-secondary"
                  onClick={() => setShowCreateUser(false)}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="admin-page-modal-overlay">
          <div className="admin-page-modal-content">
            <div className="admin-page-modal-header">
              <h3 className="admin-page-modal-title">SEND MESSAGE TO ALL TEAMS</h3>
              <button 
                className="admin-page-modal-close"
                onClick={() => setShowMessageModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSendMessage}>
              <div className="admin-page-form-group">
                <label className="admin-page-form-label">SENDER NAME</label>
                <select
                  name="sender"
                  value={messageData.sender}
                  onChange={handleMessageChange}
                  className="admin-page-form-input"
                  required
                >
                  {senderOptions.map((sender, index) => (
                    <option key={index} value={sender}>
                      {sender}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="admin-page-form-group">
                <label className="admin-page-form-label">MESSAGE</label>
                <textarea
                  name="message"
                  value={messageData.message}
                  onChange={handleMessageChange}
                  className="admin-page-form-input admin-page-form-textarea"
                  placeholder="ENTER YOUR MESSAGE FOR ALL TEAMS..."
                  rows="6"
                  required
                />
              </div>
              
              <div className="admin-page-modal-actions">
                <button type="submit" className="admin-page-modal-btn-primary">
                  SEND MESSAGE
                </button>
                <button 
                  type="button" 
                  className="admin-page-modal-btn-secondary"
                  onClick={() => setShowMessageModal(false)}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Game Modal */}
      {showResetModal && (
        <div className="admin-page-modal-overlay">
          <div className="admin-page-modal-content">
            <div className="admin-page-modal-header">
              <h3 className="admin-page-modal-title">RESET GAME</h3>
              <button 
                className="admin-page-modal-close"
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmation('');
                }}
              >
                ×
              </button>
            </div>
            
            <div className="admin-page-warning">
              <h4 className="admin-page-warning-title">⚠️ WARNING</h4>
              <p className="admin-page-warning-text">This will reset ALL teams to their default state:</p>
              <ul className="admin-page-warning-list">
                <li>All puzzle progress will be lost</li>
                <li>All points will be reset to zero</li>
                <li>All suspect submissions will be cleared</li>
                <li>All messages will be deleted</li>
                <li>Teams will start fresh</li>
              </ul>
              <p className="admin-page-danger-text">Team names, leaders, passwords, and alliances will be preserved.</p>
            </div>
            
            <form onSubmit={handleResetGame}>
              <div className="admin-page-form-group">
                <label className="admin-page-form-label">
                  TYPE "CONFIRM RESET GAME" TO PROCEED:
                </label>
                <input
                  type="text"
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  className="admin-page-form-input"
                  placeholder="CONFIRM RESET GAME"
                  required
                />
              </div>
              
              <div className="admin-page-modal-actions">
                <button 
                  type="submit" 
                  className={`admin-page-modal-btn ${resetConfirmation === 'CONFIRM RESET GAME' ? 'admin-page-modal-btn-danger' : 'admin-page-modal-btn-disabled'}`}
                  disabled={resetConfirmation !== 'CONFIRM RESET GAME'}
                >
                  CONFIRM RESET
                </button>
                <button 
                  type="button" 
                  className="admin-page-modal-btn-secondary"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetConfirmation('');
                  }}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    {/* Delete Everything Modal */}
      {showDeleteModal && (
        <div className="admin-page-modal-overlay">
          <div className="admin-page-modal-content">
            <div className="admin-page-modal-header">
              <h3 className="admin-page-modal-title">DELETE EVERYTHING - CRITICAL</h3>
              <button 
                className="admin-page-modal-close"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
              >
                ×
              </button>
            </div>
            
            <div className="admin-page-warning">
              <h4 className="admin-page-warning-title">🚨 CRITICAL WARNING: THIS ACTION CANNOT BE UNDONE</h4>
              <p className="admin-page-warning-text">This will COMPLETELY WIPE the database:</p>
              <ul className="admin-page-warning-list">
                <li>All teams will be permanently deleted</li>
                <li>All messages will be permanently deleted</li>
                <li>All puzzle progress will be lost</li>
                <li>All button status will be reset</li>
                <li>Everything will be gone forever</li>
              </ul>
              <p className="admin-page-danger-text">THIS IS A COMPLETE DATABASE WIPE!</p>
            </div>
            
            <form onSubmit={handleDeleteEverything}>
              <div className="admin-page-form-group">
                <label className="admin-page-form-label">
                  TYPE "DELETE EVERYTHING" TO PROCEED:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="admin-page-form-input"
                  placeholder="DELETE EVERYTHING"
                  required
                />
              </div>
              
              <div className="admin-page-modal-actions">
                <button 
                  type="submit" 
                  className={`admin-page-modal-btn ${deleteConfirmation === 'DELETE EVERYTHING' ? 'admin-page-modal-btn-danger' : 'admin-page-modal-btn-disabled'}`}
                  disabled={deleteConfirmation !== 'DELETE EVERYTHING'}
                >
                  CONFIRM DELETE
                </button>
                <button 
                  type="button" 
                  className="admin-page-modal-btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Buttons Modal */}
      {showResetButtonsModal && (
        <div className="admin-page-modal-overlay">
          <div className="admin-page-modal-content">
            <div className="admin-page-modal-header">
              <h3 className="admin-page-modal-title">RESET BUTTONS</h3>
              <button 
                className="admin-page-modal-close"
                onClick={() => {
                  setShowResetButtonsModal(false);
                  setResetButtonsConfirmation('');
                }}
              >
                ×
              </button>
            </div>
            
            <div className="admin-page-warning">
              <h4 className="admin-page-warning-title">🔄 Reset All Buttons</h4>
              <p className="admin-page-warning-text">This will reset all attack and activation buttons to active state:</p>
              <ul className="admin-page-warning-list">
                <li>All attack buttons will be enabled</li>
                <li>All submit activation buttons will be enabled</li>
                <li>Buttons will be ready for use again</li>
              </ul>
              <p className="admin-page-danger-text">This does not affect game data, only button availability.</p>
            </div>
            
            <form onSubmit={handleResetButtons}>
              <div className="admin-page-form-group">
                <label className="admin-page-form-label">
                  TYPE "RESET BUTTONS" TO PROCEED:
                </label>
                <input
                  type="text"
                  value={resetButtonsConfirmation}
                  onChange={(e) => setResetButtonsConfirmation(e.target.value)}
                  className="admin-page-form-input"
                  placeholder="RESET BUTTONS"
                  required
                />
              </div>
              
              <div className="admin-page-modal-actions">
                <button 
                  type="submit" 
                  className={`admin-page-modal-btn ${resetButtonsConfirmation === 'RESET BUTTONS' ? 'admin-page-modal-btn-danger' : 'admin-page-modal-btn-disabled'}`}
                  disabled={resetButtonsConfirmation !== 'RESET BUTTONS'}
                >
                  RESET BUTTONS
                </button>
                <button 
                  type="button" 
                  className="admin-page-modal-btn-secondary"
                  onClick={() => {
                    setShowResetButtonsModal(false);
                    setResetButtonsConfirmation('');
                  }}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && currentNotification && (
        <div className="admin-page-modal-overlay">
          <div className="admin-page-modal-content">
            <div className="admin-page-modal-header">
              <h3 className="admin-page-modal-title">🎉 PUZZLE SOLVED! 🎉</h3>
              <button 
                className="admin-page-modal-close"
                onClick={handleCloseNotification}
              >
                ×
              </button>
            </div>
            
            <div className="admin-page-notification-content">
              <div className="admin-page-notification-details">
                <div className="admin-page-detail-row">
                  <span className="admin-page-detail-label">Team:</span>
                  <span className="admin-page-detail-value">{currentNotification.teamName}</span>
                </div>
                <div className="admin-page-detail-row">
                  <span className="admin-page-detail-label">Leader:</span>
                  <span className="admin-page-detail-value">{currentNotification.teamLeaderName}</span>
                </div>
                <div className="admin-page-detail-row">
                  <span className="admin-page-detail-label">Alliance:</span>
                  <span className="admin-page-detail-value">{currentNotification.alliance}</span>
                </div>
                <div className="admin-page-detail-row">
                  <span className="admin-page-detail-label">Sub-Alliance:</span>
                  <span className="admin-page-detail-value">{currentNotification.subAlliance}</span>
                </div>
                <div className="admin-page-detail-row">
                  <span className="admin-page-detail-label">Puzzle Solved:</span>
                  <span className="admin-page-detail-value admin-page-puzzle-solved">SP{currentNotification.puzzleNumber}</span>
                </div>
              </div>
              
              <div className="admin-page-notification-action">
                <p className="admin-page-action-text">
                  Click close and then deactivate this puzzle for {currentNotification.alliance} alliance.
                </p>
                <button 
                  onClick={handleCloseNotification}
                  className="admin-page-modal-btn-primary"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RAT Attack Confirmation Modal */}
      {showRatConfirmModal && (
        <div className="admin-page-modal-overlay">
          <div className="admin-page-modal-content">
            <div className="admin-page-modal-header">
              <h3 className="admin-page-modal-title">🎯 RAT ATTACK TARGET SELECTION</h3>
              <button 
                className="admin-page-modal-close"
                onClick={() => {
                  setShowRatConfirmModal(false);
                  setPendingRatAttack(null);
                  setSelectedTargetSubAlliance('GOOD');
                }}
              >
                ×
              </button>
            </div>
            
            <div className="admin-page-rat-confirm-content">
              <p className="admin-page-rat-confirm-question">Which sub-alliance do you want to attack?</p>
              
              <div className="admin-page-form-group">
                <label className="admin-page-form-label">TARGET SUB-ALLIANCE</label>
                <select
                  value={selectedTargetSubAlliance}
                  onChange={(e) => setSelectedTargetSubAlliance(e.target.value)}
                  className="admin-page-form-input"
                >
                  <option value="GOOD">GOOD</option>
                  <option value="BAD">BAD</option>
                </select>
              </div>
              
              <div className="admin-page-modal-actions">
                <button 
                  onClick={handleRatAttackConfirm}
                  className="admin-page-modal-btn-primary"
                >
                  CONFIRM ATTACK
                </button>
                <button 
                  type="button" 
                  className="admin-page-modal-btn-secondary"
                  onClick={() => {
                    setShowRatConfirmModal(false);
                    setPendingRatAttack(null);
                    setSelectedTargetSubAlliance('GOOD');
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;