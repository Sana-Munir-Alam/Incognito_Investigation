import React, { useState, useEffect, useRef } from 'react';
import './UserDashboard.css';

const UserDashboard = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('slot1');
  const [specialPuzzles, setSpecialPuzzles] = useState({
    sp1: { active: false, solved: false },
    sp2: { active: false, solved: false },
    sp3: { active: false, solved: false }
  });
  const [showPuzzleModal, setShowPuzzleModal] = useState(null);
  const [puzzleAnswer, setPuzzleAnswer] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [suspects, setSuspects] = useState(['', '', '', '']);
  const [suspectsSubmitted, setSuspectsSubmitted] = useState(false);
  const [storyMessages, setStoryMessages] = useState([]);
  const [hasNewStory, setHasNewStory] = useState(false);
  const [showClueModal, setShowClueModal] = useState(false);
  const [clueText, setClueText] = useState('');
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [attackPopups, setAttackPopups] = useState([]);
  const [currentPopup, setCurrentPopup] = useState(null);

  const hasUserViewedRef = useRef(true);

  // Puzzle riddles only
  const puzzleRiddles = {
    GOOD: {
      sp1: "IN THE REALM OF LIGHT, WHERE TRUTH RESIDES,\nA NUMBER HIDDEN IN PLAIN SIGHT.\nCOUNT THE GUARDIANS, MULTIPLY BY NINE,\nTHE CODE YOU SEEK IN SHADOWS SHINE.\n\nANSWER FORMAT: SP1-XXXXXX",
      sp2: "WHEN STARS ALIGN IN CRIMSON NIGHT,\nTHREE PATHS CONVERGE IN ETERNAL LIGHT.\nSUBTRACT THE LIES, ADD THE TRUTH,\nTHE FINAL NUMBER SHALL BE YOUR PROOF.\n\nANSWER FORMAT: SP2-XXXXXX",
      sp3: "BEYOND THE VEIL WHERE TIME STANDS STILL,\nFOUR ELEMENTS THE VOID DO FILL.\nCOMBINE THEIR ESSENCE, DIVIDE BY TWO,\nTHE KEY UNLOCKS WHAT'S PURE AND TRUE.\n\nANSWER FORMAT: SP3-XXXXXX"
    },
    BAD: {
      sp1: "IN SHADOWS DEEP WHERE DECEIT IS BORN,\nA SECRET KEPT FROM NIGHT 'TIL MORN.\nREVERSE THE DIGITS, ADD THE FALL,\nTHE DARKNESS ANSWERS TO YOUR CALL.\n\nANSWER FORMAT: SP1-XXXXXX",
      sp2: "WHERE CHAOS REIGNS AND ORDER DIES,\nFIVE WHISPERS TELL OF CUNNING LIES.\nMULTIPLY THE ANGER, DIVIDE THE FEAR,\nTHE VICTORY NUMBER NOW APPEARS.\n\nANSWER FORMAT: SP2-XXXXXX",
      sp3: "BENEATH THE SURFACE WHERE MALICE GROWS,\nSIX SIGILS IN DARKNESS GLOW.\nSUBTRACT THE WEAK, ADD THE STRONG,\nTHE FINAL ANSWER TO CORRUPTION BELONGS.\n\nANSWER FORMAT: SP3-XXXXXX"
    },
    RATS: {
      sp1: "BETWEEN TWO WORLDS, NEITHER HERE NOR THERE,\nA DOUBLE AGENT'S SECRET LAIR.\nADD BOTH SIDES, SUBTRACT THE BETRAYAL,\nTHE BALANCE POINT WITHOUT FAIL.\n\nANSWER FORMAT: SP1-XXXXXX",
      sp2: "IN THE GRAY WHERE LOYALTIES SHIFT,\nSEVEN SHADOWS CRAFT A CUNNING DRIFT.\nDIVIDE THE TRUTH, MULTIPLY THE LIES,\nTHE NUMBER OF SURVIVAL BEFORE YOU DIES.\n\nANSWER FORMAT: SP2-XXXXXX",
      sp3: "WALKING THE LINE OF FIRE AND ICE,\nEIGHT FACES WEAR THE SAME DEVICE.\nCOMBINE THE EXTREMES, FIND THE MIDDLE WAY,\nTHE RAT'S ESCAPE AT BREAK OF DAY.\n\nANSWER FORMAT: SP3-XXXXXX"
    }
  };

  const getThemeClass = () => {
    switch (user.alliance) {
      case 'GOOD': return 'user-dashboard-good-theme';
      case 'BAD': return 'user-dashboard-bad-theme';
      case 'RATS': return 'user-dashboard-rat-theme';
      default: return 'user-dashboard-good-theme';
    }
  };

  // Fetch user status when component mounts
  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/user/status/${user.team}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setSuspectsSubmitted(data.suspectsSubmitted);
          setSpecialPuzzles(data.specialPuzzles);
          setSubmitDisabled(data.submitDisabled);
        }
      } catch (error) {
        console.error('Error fetching user status:', error);
      }
    };

    fetchUserStatus();
  }, [user.team]);

  // Fetch puzzle status from backend
  useEffect(() => {
    const checkPuzzleStatus = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/user/puzzle-status/${user.team}`);
        const data = await response.json();
        if (response.ok && data.success) {
          setSpecialPuzzles(data.specialPuzzles);
          setSuspectsSubmitted(data.suspectsSubmitted);
          setSubmitDisabled(data.submitDisabled);
        }
      } catch (error) {
        console.error('Error fetching puzzle status:', error);
      }
    };

    checkPuzzleStatus();
    const interval = setInterval(checkPuzzleStatus, 5000);
    
    return () => clearInterval(interval);
  }, [user.team]);

  // Fetch attack popups
  const fetchAttackPopups = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/user/attack-popups/${user.team}`);
      const data = await response.json();
      
      if (response.ok && data.success && data.popups.length > 0) {
        // Show the first popup if we don't have a current one showing
        if (!currentPopup) {
          setCurrentPopup(data.popups[0]);
        }
        setAttackPopups(data.popups);
      }
    } catch (error) {
      console.error('Error fetching attack popups:', error);
    }
  };

  // Poll for attack popups
  useEffect(() => {
    fetchAttackPopups();
    
    const popupInterval = setInterval(fetchAttackPopups, 3000);
    
    return () => clearInterval(popupInterval);
  }, [user.team, currentPopup]);

  // Add this useEffect to poll for puzzle status more frequently when popup is open
  useEffect(() => {
    if (showPuzzleModal) {
      const checkPuzzleStatus = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/user/puzzle-status/${user.team}`);
          const data = await response.json();
          if (response.ok && data.success) {
            setSpecialPuzzles(data.specialPuzzles);
            
            // ✅ NEW: If puzzle is no longer active, close the modal
            const currentPuzzle = data.specialPuzzles[showPuzzleModal];
            if (!currentPuzzle.active) {
              setShowPuzzleModal(null);
              setPuzzleAnswer('');
              alert('This puzzle has been successfully completed by your alliance!');
            }
          }
        } catch (error) {
          console.error('Error fetching puzzle status:', error);
        }
      };

      // Poll every 2 seconds when popup is open
      const interval = setInterval(checkPuzzleStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [showPuzzleModal, user.team]);

  // Dismiss attack popup
  const handleDismissPopup = async (popupId) => {
    try {
      await fetch('http://localhost:5000/api/user/dismiss-popup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ popupId })
      });
      
      // Remove from local state
      const remainingPopups = attackPopups.filter(p => p._id !== popupId);
      setAttackPopups(remainingPopups);
      
      // Show next popup if available
      if (remainingPopups.length > 0) {
        setCurrentPopup(remainingPopups[0]);
      } else {
        setCurrentPopup(null);
      }
    } catch (error) {
      console.error('Error dismissing popup:', error);
    }
  };

  // Fetch story messages
  const fetchStoryMessages = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/user/story-messages?teamName=${user.team}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setStoryMessages(data.messages);
        
        // Set hasNewStory based on backend response
        // Only show red dot if there are new messages AND user is not on story tab
        if (data.hasNewMessages && activeSection !== 'story') {
          setHasNewStory(true);
        }
      }
    } catch (error) {
      console.error('Error fetching story messages:', error);
    }
  };

  // Mark messages as seen on backend
  const markMessagesAsSeen = async () => {
    try {
      await fetch('http://localhost:5000/api/user/mark-messages-seen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName: user.team
        })
      });
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  };

  // Load initial messages and set up polling
  useEffect(() => {
    fetchStoryMessages();
    
    // Poll for new messages every 5 seconds
    const messageInterval = setInterval(fetchStoryMessages, 5000);
    
    return () => clearInterval(messageInterval);
  }, [activeSection, user.team]);

  // Reset red dot when user clicks on Story tab
  const handleStoryTabClick = async () => {
    setActiveSection('story');
    setHasNewStory(false);
    
    // Mark messages as seen on backend
    await markMessagesAsSeen();
  };

  // Set hasUserViewed to false when new messages arrive and user is not on story tab
  useEffect(() => {
    if (storyMessages.length > 0 && activeSection !== 'story') {
      hasUserViewedRef.current = false;
    }
  }, [storyMessages, activeSection]);

  const handlePuzzleClick = (puzzleId) => {
    if (specialPuzzles[puzzleId].active && !specialPuzzles[puzzleId].solved) {
      setShowPuzzleModal(puzzleId);
    }
  };

  const handlePuzzleSubmit = async (puzzleId) => {
  try {
    const response = await fetch('http://localhost:5000/api/user/submit-special-puzzle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamName: user.team,
        puzzleId: puzzleId,
        answer: puzzleAnswer.toUpperCase()
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      if (data.success) {
        setSpecialPuzzles(prev => ({
          ...prev,
          [puzzleId]: { ...prev[puzzleId], solved: true }
        }));
        
        // NEW: Close modal and reset answer
        setShowPuzzleModal(null);
        setPuzzleAnswer('');
        
        // NEW: If puzzle was auto-deactivated, show appropriate message
        if (data.puzzleDeactivated) {
          alert('PUZZLE SOLVED! MISSION ACCOMPLISHED.\n\nThis puzzle has been completed for your alliance.');
        } else {
          alert('PUZZLE SOLVED! MISSION ACCOMPLISHED.');
        }
      } else {
        alert(data.message || 'Incorrect answer. Try again.');
      }
    } else {
      alert(data.message || 'Error submitting puzzle.');
    }
  } catch (error) {
    console.error('Puzzle submission error:', error);
    alert('Connection error. Please try again.');
  }
};

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    
    if (submitDisabled) {
      alert('Submit functionality is currently disabled for your team.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/user/submit-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName: user.team,
          code: codeInput
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.success) {
          setClueText(data.clue || "CLUE: THE TRUTH HIDES IN PLAIN SIGHT. TRUST YOUR INSTINCTS.");
          setShowClueModal(true);
          setCodeInput('');
        } else {
          alert(data.message || 'Invalid code. Try again.');
        }
      } else {
        if (response.status === 403) {
          alert('Submit functionality is currently disabled for your team.');
        } else {
          alert(data.message || 'Error submitting code.');
        }
      }
    } catch (error) {
      console.error('Code submission error:', error);
      alert('Connection error. Please try again.');
    }
  };

  const handleSuspectsSubmit = async (e) => {
    e.preventDefault();
    
    if (suspectsSubmitted) return;
    
    if (submitDisabled) {
      alert('Submit functionality is currently disabled for your team.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/user/submit-suspects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName: user.team,
          suspects: suspects.map(s => s.toUpperCase().trim())
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.success) {
          setSuspectsSubmitted(true);
          alert('SUSPECTS SUBMITTED! ANALYSIS IN PROGRESS.');
        } else {
          alert(data.message || 'Error submitting suspects.');
        }
      } else {
        if (response.status === 403) {
          alert('Submit functionality is currently disabled for your team.');
        } else {
          alert(data.message || 'Error submitting suspects.');
        }
      }
    } catch (error) {
      console.error('Suspects submission error:', error);
      alert('Connection error. Please try again.');
    }
  };

  const handleSuspectChange = (index, value) => {
    const newSuspects = [...suspects];
    newSuspects[index] = value.toUpperCase();
    setSuspects(newSuspects);
  };

  // Get popup styling based on type
  const getPopupClass = (attackType) => {
    switch (attackType) {
      case 'FALSE_EVIDENCE':
        return 'attack-popup-warning';
      case 'AFTERMATH_TARGET':
        return 'attack-popup-critical';
      case 'AFTERMATH_ATTACKER':
        return 'attack-popup-success';
      default:
        return 'attack-popup-warning';
    }
  };

  return (
    <div className={`user-dashboard-container ${getThemeClass()}`}>
      <header className="user-dashboard-header">
        <div className="user-dashboard-logo">
          <span>INCOGNITO</span>
        </div>
        <div className="user-dashboard-info">
          <div className="user-dashboard-alliance">ALLIANCE: {user.alliance}</div>
          <div className="user-dashboard-team">TEAM: {user.team}</div>
        </div>
        <button className={`user-dashboard-logout-btn`} onClick={onLogout}>
          LOGOUT
        </button>
      </header>

      <main className="user-dashboard-main">
        <div className="user-dashboard-welcome">
          <h2>WELCOME, {user.team}</h2>
          <p>YOUR MISSION AWAITS. PREPARE FOR THE MULTIVERSE PURSUIT.</p>
        </div>

        {/* Special Puzzle Buttons */}
        <div className="user-dashboard-puzzles">
          <h3>SPECIAL OPERATIONS</h3>
          <div className="user-dashboard-puzzle-buttons">
            {['sp1', 'sp2', 'sp3'].map(puzzleId => (
              <button
                key={puzzleId}
                className={`user-dashboard-puzzle-btn ${
                  specialPuzzles[puzzleId].active 
                    ? specialPuzzles[puzzleId].solved ? 'solved' : 'active' 
                    : 'inactive'
                }`}
                onClick={() => handlePuzzleClick(puzzleId)}
                disabled={!specialPuzzles[puzzleId].active || specialPuzzles[puzzleId].solved}
              >
                SPECIAL PUZZLE {puzzleId.slice(2)}
                {specialPuzzles[puzzleId].solved && ' ✓'}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="user-dashboard-tabs">
          <button 
            className={`user-dashboard-tab-btn ${activeSection === 'slot1' ? 'active' : ''}`}
            onClick={() => setActiveSection('slot1')}
          >
            SLOT1 SUBMISSION
          </button>
          <button 
            className={`user-dashboard-tab-btn ${activeSection === 'story' ? 'active' : ''}`}
            onClick={handleStoryTabClick}
          >
            STORY {hasNewStory && <span className="user-dashboard-notification-dot"></span>}
          </button>
        </div>

        {/* Content Sections */}
        <div className="user-dashboard-content">
          {activeSection === 'slot1' && (
            <div className="user-dashboard-slot1">
              {/* Code Submission */}
              <div className="user-dashboard-submission-card">
                <h4>ENTER CODE</h4>
                <form onSubmit={handleCodeSubmit}>
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    className="user-dashboard-form-input"
                    placeholder="ENTER PUZZLE CODE"
                    required
                    disabled={submitDisabled}
                  />
                  <button 
                    type="submit" 
                    className={`user-dashboard-primary-btn ${submitDisabled ? 'disabled' : ''}`}
                    disabled={submitDisabled}
                  >
                    {submitDisabled ? 'SUBMIT DISABLED' : 'SUBMIT CODE'}
                  </button>
                </form>
                {submitDisabled && (
                  <p className="user-dashboard-disabled-text">⚠️ SUBMIT CURRENTLY DISABLED</p>
                )}
              </div>

              {/* Suspects Submission */}
              <div className="user-dashboard-submission-card">
                <h4>TOP 4 SUSPECTS</h4>
                {!suspectsSubmitted ? (
                  <form onSubmit={handleSuspectsSubmit}>
                    {suspects.map((suspect, index) => (
                      <input
                        key={index}
                        type="text"
                        value={suspect}
                        onChange={(e) => handleSuspectChange(index, e.target.value)}
                        className="user-dashboard-form-input"
                        placeholder={`SUSPECT ${index + 1} FULL NAME`}
                        required
                        disabled={suspectsSubmitted || submitDisabled}
                      />
                    ))}
                    <button 
                      type="submit" 
                      className={`user-dashboard-primary-btn ${submitDisabled ? 'disabled' : ''}`} 
                      disabled={suspectsSubmitted || submitDisabled}
                    >
                      {submitDisabled ? 'SUBMIT DISABLED' : 'SUBMIT SUSPECTS'}
                    </button>
                  </form>
                ) : (
                  <p className="user-dashboard-submitted-text">SUSPECTS SUBMITTED ✓</p>
                )}
                {submitDisabled && !suspectsSubmitted && (
                  <p className="user-dashboard-disabled-text">⚠️ SUBMIT CURRENTLY DISABLED</p>
                )}
              </div>
            </div>
          )}

          {activeSection === 'story' && (
            <div className="user-dashboard-story">
              <h4>MISSION BRIEFING</h4>
              <div className="user-dashboard-story-messages">
                {storyMessages.length > 0 ? (
                  storyMessages.map((msg, index) => (
                    <div key={index} className="user-dashboard-story-message-card">
                      <div className="user-dashboard-message-sender">{msg.sender}</div>
                      <div className="user-dashboard-message-divider"></div>
                      <div className="user-dashboard-message-content">{msg.message}</div>
                    </div>
                  ))
                ) : (
                  <div className="user-dashboard-no-messages">NO MESSAGES RECEIVED YET</div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Puzzle Modal */}
      {showPuzzleModal && (
        <div className="user-dashboard-modal-overlay">
          <div className="user-dashboard-modal-content user-dashboard-puzzle-modal">
            <div className="user-dashboard-modal-header">
              <h3>SPECIAL PUZZLE {showPuzzleModal.slice(2)}</h3>
              <button 
                className="user-dashboard-close-btn"
                onClick={() => setShowPuzzleModal(null)}
              >
                ×
              </button>
            </div>
            <div className="user-dashboard-puzzle-content">
              <pre className="user-dashboard-riddle-text">
                {puzzleRiddles[user.alliance][showPuzzleModal]}
              </pre>
              
              {/* ✅ NEW: Show warning if puzzle was deactivated */}
              {!specialPuzzles[showPuzzleModal]?.active && (
                <div className="user-dashboard-puzzle-deactivated-warning">
                  ⚠️ This puzzle has been completed by another team!
                </div>
              )}
              
              <input
                type="text"
                value={puzzleAnswer}
                onChange={(e) => setPuzzleAnswer(e.target.value)}
                className="user-dashboard-form-input"
                placeholder={`SP${showPuzzleModal.slice(2)}-XXXXXX`}
                disabled={!specialPuzzles[showPuzzleModal]?.active}
              />
              <div className="user-dashboard-modal-actions">
                <button 
                  onClick={() => handlePuzzleSubmit(showPuzzleModal)}
                  className={`user-dashboard-primary-btn ${!specialPuzzles[showPuzzleModal]?.active ? 'disabled' : ''}`}
                  disabled={!specialPuzzles[showPuzzleModal]?.active}
                >
                  {!specialPuzzles[showPuzzleModal]?.active ? 'PUZZLE COMPLETED' : 'SUBMIT ANSWER'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clue Modal */}
      {showClueModal && (
        <div className="user-dashboard-modal-overlay">
          <div className="user-dashboard-modal-content user-dashboard-clue-modal">
            <div className="user-dashboard-modal-header">
              <h3>CLUE DISCOVERED</h3>
              <button 
                className="user-dashboard-close-btn"
                onClick={() => setShowClueModal(false)}
              >
                ×
              </button>
            </div>
            <div className="user-dashboard-clue-content">
              <p>{clueText}</p>
              <div className="user-dashboard-modal-actions">
                <button 
                  onClick={() => setShowClueModal(false)}
                  className="user-dashboard-primary-btn"
                >
                  CONTINUE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attack Popup Modal */}
      {currentPopup && (
        <div className="user-dashboard-modal-overlay">
          <div className={`user-dashboard-modal-content user-dashboard-attack-popup-modal ${getPopupClass(currentPopup.attackType)}`}>
            <div className="user-dashboard-modal-header">
              <h3>{currentPopup.title}</h3>
              <button 
                className="user-dashboard-close-btn"
                onClick={() => handleDismissPopup(currentPopup._id)}
              >
                ×
              </button>
            </div>
            <div className="user-dashboard-attack-popup-content">
              <p className="user-dashboard-attack-message">{currentPopup.message}</p>
              <div className="user-dashboard-modal-actions">
                <button 
                  onClick={() => handleDismissPopup(currentPopup._id)}
                  className="user-dashboard-primary-btn"
                >
                  ACKNOWLEDGE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;