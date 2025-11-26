const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully!'))
.catch(err => console.log('MongoDB connection error:', err));

// GP First Solve Schema - NEW
const gpFirstSolveSchema = new mongoose.Schema({
  puzzleCode: { type: String, required: true, unique: true }, // 'GP1', 'GP2', etc.
  firstSolveTime: { type: Date, required: true },
  firstSolveTeam: { type: String, required: true }
});

const GPFirstSolve = mongoose.model('GPFirstSolve', gpFirstSolveSchema);

// Team Schema - UPDATED
const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: true, unique: true, uppercase: true },
  teamLeaderName: { type: String, required: true, uppercase: true },
  password: { type: String, required: true },
  alliance: { type: String, required: true, enum: ['GOOD', 'BAD', 'RATS'] },
  subAlliance: { type: String, required: true, enum: ['GOOD', 'BAD'] },
  
  // GP Puzzle Status and Points - UPDATED
  GeneralPuzzle1Status: { type: Boolean, default: false },
  GeneralPuzzle1Points: { type: Number, default: 0 },
  GeneralPuzzle2Status: { type: Boolean, default: false },
  GeneralPuzzle2Points: { type: Number, default: 0 },
  GeneralPuzzle3Status: { type: Boolean, default: false },
  GeneralPuzzle3Points: { type: Number, default: 0 },
  GeneralPuzzle4Status: { type: Boolean, default: false },
  GeneralPuzzle4Points: { type: Number, default: 0 },
  GeneralPuzzle5Status: { type: Boolean, default: false },
  GeneralPuzzle5Points: { type: Number, default: 0 },
  GeneralPuzzle6Status: { type: Boolean, default: false },
  GeneralPuzzle6Points: { type: Number, default: 0 },
  GeneralPuzzle7Status: { type: Boolean, default: false },
  GeneralPuzzle7Points: { type: Number, default: 0 },
  GeneralPuzzle8Status: { type: Boolean, default: false },
  GeneralPuzzle8Points: { type: Number, default: 0 },
  
  SpecialPuzzle1: { type: Boolean, default: false },
  SpecialPuzzle2: { type: Boolean, default: false },
  SpecialPuzzle3: { type: Boolean, default: false },
  SuspectMatchQty: { type: Number, default: 0 },
  SuspectSubmittedStatus: { type: Boolean, default: false },
  TotalPoints: { type: Number, default: 0 },
  submitDisabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Team = mongoose.model('Team', teamSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// User message tracking schema
const userMessageTrackingSchema = new mongoose.Schema({
  teamName: { type: String, required: true, unique: true },
  lastSeenMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastSeenTimestamp: { type: Date, default: Date.now }
});

const UserMessageTracking = mongoose.model('UserMessageTracking', userMessageTrackingSchema);

// Puzzle Activation Schema
const puzzleActivationSchema = new mongoose.Schema({
  puzzleNumber: { type: String, required: true, enum: ['1', '2', '3'] },
  alliance: { type: String, required: true, enum: ['GOOD', 'BAD', 'RATS', 'ALL'] },
  isActive: { type: Boolean, default: false },
  activatedAt: { type: Date, default: Date.now },
  deactivatedAt: { type: Date }
});

const PuzzleActivation = mongoose.model('PuzzleActivation', puzzleActivationSchema);

// Attack Popup Schema
const attackPopupSchema = new mongoose.Schema({
  targetSubAlliance: { type: String, required: true, enum: ['GOOD', 'BAD'] },
  attackType: { type: String, required: true, enum: ['FALSE_EVIDENCE', 'AFTERMATH_TARGET', 'AFTERMATH_ATTACKER'] },
  message: { type: String, required: true },
  title: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  active: { type: Boolean, default: true }
});

const AttackPopup = mongoose.model('AttackPopup', attackPopupSchema);

// Button Status Schema
const buttonStatusSchema = new mongoose.Schema({
  goodAttack: {
    DEACTIVATE_SUBMIT: { type: Boolean, default: true },
    FALSE_EVIDENCE: { type: Boolean, default: true },
    DECREASE_POINTS: { type: Boolean, default: true }
  },
  badAttack: {
    DEACTIVATE_SUBMIT: { type: Boolean, default: true },
    FALSE_EVIDENCE: { type: Boolean, default: true },
    DECREASE_POINTS: { type: Boolean, default: true }
  },
  ratAttack: {
    DEACTIVATE_SUBMIT: { type: Boolean, default: true },
    FALSE_EVIDENCE: { type: Boolean, default: true },
    DECREASE_POINTS: { type: Boolean, default: true }
  },
  submitActivation: {
    GOOD: { type: Boolean, default: true },
    BAD: { type: Boolean, default: true }
  }
});

const ButtonStatus = mongoose.model('ButtonStatus', buttonStatusSchema);

// Initialize puzzle activation status
const initializePuzzleActivations = async () => {
  try {
    const puzzles = ['1', '2', '3'];
    const alliances = ['GOOD', 'BAD', 'RATS'];
    
    for (const puzzleNumber of puzzles) {
      for (const alliance of alliances) {
        const existing = await PuzzleActivation.findOne({ puzzleNumber, alliance });
        if (!existing) {
          await PuzzleActivation.create({ 
            puzzleNumber, 
            alliance, 
            isActive: false 
          });
        }
      }
    }
    console.log('✅ Puzzle activations initialized');
  } catch (error) {
    console.error('Error initializing puzzle activations:', error);
  }
};

// Initialize button status
const initializeButtonStatus = async () => {
  try {
    const existingStatus = await ButtonStatus.findOne();
    if (!existingStatus) {
      await ButtonStatus.create({});
      console.log('✅ Button status initialized');
    }
  } catch (error) {
    console.error('Error initializing button status:', error);
  }
};

// Call this after MongoDB connection
mongoose.connection.once('open', () => {
  initializePuzzleActivations();
  initializeButtonStatus();
});

// WebSocket-like notification system (simplified)
let solvedPuzzleNotifications = [];

// NEW: Calculate time-based points for GP puzzles
function calculateTimedPoints(timeDiffMinutes) {
  const maxWindow = 120;            // 2 hours max decay window
  const decayRate = 5 / maxWindow;  // Lose 5 points over 2 hours (10 down to 5)
  
  if (timeDiffMinutes <= 0) {
    return 10;                      // First solver gets full points
  }
  
  const pointsLost = timeDiffMinutes * decayRate;
  const finalPoints = 10 - pointsLost;
  
  // Return minimum 5 points, rounded to 2 decimal places
  return Math.max(5, Math.round(finalPoints * 100) / 100);
}

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { teamName, teamLeaderName, password } = req.body;

    // Convert to uppercase for consistency
    const upperTeamName = teamName.toUpperCase();
    const upperLeaderName = teamLeaderName.toUpperCase();

    const team = await Team.findOne({ 
      teamName: upperTeamName, 
      teamLeaderName: upperLeaderName 
    });

    if (!team) {
      return res.status(401).json({ message: 'Invalid team credentials' });
    }

    // For now, using simple password comparison
    if (team.password !== password.toUpperCase()) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.json({
      message: 'Login successful',
      team: team.teamName,
      alliance: team.alliance
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Routes
app.post('/api/admin/create-team', async (req, res) => {
  try {
    const { teamName, teamLeaderName, password, alliance, subAlliance } = req.body;

    // Check if team already exists
    const existingTeam = await Team.findOne({ teamName: teamName.toUpperCase() });
    if (existingTeam) {
      return res.status(400).json({ message: 'Team name already exists' });
    }

    // Create new team
    const newTeam = new Team({
      teamName: teamName.toUpperCase(),
      teamLeaderName: teamLeaderName.toUpperCase(),
      password: password.toUpperCase(),
      alliance: alliance.toUpperCase(),
      subAlliance: subAlliance.toUpperCase()
    });

    await newTeam.save();

    res.status(201).json({ 
      message: 'Team created successfully',
      team: newTeam 
    });

  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all teams (for admin observation panel)
app.get('/api/admin/teams', async (req, res) => {
  try {
    const teams = await Team.find().select('-password');
    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const teams = await Team.find()
      .select('teamName teamLeaderName alliance TotalPoints')
      .sort({ TotalPoints: -1 });
    
    res.json(teams);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin activate special puzzles for ALL alliances
app.post('/api/admin/activate-special-puzzle', async (req, res) => {
  try {
    const { puzzleNumber } = req.body;
    
    if (!['1', '2', '3'].includes(puzzleNumber)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid puzzle number' 
      });
    }

    // Activate for all three alliances
    const alliances = ['GOOD', 'BAD', 'RATS'];
    
    for (const alliance of alliances) {
      await PuzzleActivation.findOneAndUpdate(
        { puzzleNumber, alliance },
        { 
          isActive: true,
          activatedAt: new Date(),
          deactivatedAt: null
        },
        { upsert: true, new: true }
      );
    }

    console.log(`🔵 Special Puzzle ${puzzleNumber} activated for ALL alliances`);
    
    res.json({ 
      success: true,
      message: `Special Puzzle ${puzzleNumber} activated for all alliances`
    });

  } catch (error) {
    console.error('Activate puzzle error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Admin deactivate special puzzle for specific alliance
app.post('/api/admin/deactivate-special-puzzle', async (req, res) => {
  try {
    const { puzzleNumber, alliance } = req.body;
    
    if (!['1', '2', '3'].includes(puzzleNumber)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid puzzle number' 
      });
    }

    if (!['GOOD', 'BAD', 'RATS'].includes(alliance)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid alliance' 
      });
    }

    await PuzzleActivation.findOneAndUpdate(
      { puzzleNumber, alliance },
      { 
        isActive: false,
        deactivatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`🔴 Special Puzzle ${puzzleNumber} deactivated for ${alliance} alliance`);
    
    res.json({ 
      success: true,
      message: `Special Puzzle ${puzzleNumber} deactivated for ${alliance} alliance`
    });

  } catch (error) {
    console.error('Deactivate puzzle error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get current activation status (for admin panel)
app.get('/api/admin/puzzle-activations', async (req, res) => {
  try {
    const activations = await PuzzleActivation.find();
    res.json({
      success: true,
      activations: activations
    });
  } catch (error) {
    console.error('Get activations error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get puzzle notifications
app.get('/api/admin/puzzle-notifications', async (req, res) => {
  try {
    // Return notifications and clear them
    const notifications = [...solvedPuzzleNotifications];
    solvedPuzzleNotifications = []; // Clear after reading
    
    res.json({
      success: true,
      notifications: notifications
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get button status
app.get('/api/admin/button-status', async (req, res) => {
  try {
    let buttonStatus = await ButtonStatus.findOne();
    if (!buttonStatus) {
      buttonStatus = await ButtonStatus.create({});
    }
    
    res.json({
      success: true,
      buttonStatus: buttonStatus
    });
  } catch (error) {
    console.error('Get button status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Reset buttons status
app.post('/api/admin/reset-buttons', async (req, res) => {
  try {
    const { confirmation } = req.body;

    if (confirmation !== 'RESET BUTTONS') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid confirmation text' 
      });
    }

    await ButtonStatus.findOneAndUpdate({}, {
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
    }, { upsert: true });

    console.log('🔄 All buttons reset to active state');
    
    res.json({ 
      success: true,
      message: 'All buttons reset to active state'
    });

  } catch (error) {
    console.error('Reset buttons error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Activate Submit functionality
app.post('/api/admin/activate-submit', async (req, res) => {
  try {
    const { subAlliance } = req.body;
    
    // Enable submit for target sub-alliance
    await Team.updateMany(
      { subAlliance: subAlliance },
      { submitDisabled: false }
    );

    // Disable the activation button
    await ButtonStatus.findOneAndUpdate({}, {
      [`submitActivation.${subAlliance}`]: false
    });

    console.log(`🔓 Submit activated for ${subAlliance} sub-alliance`);
    
    res.json({ 
      success: true,
      message: `Submit functionality activated for ${subAlliance} sub-alliance`
    });

  } catch (error) {
    console.error('Activate submit error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ATTACK ROUTES
// Deactivate/Activate Submit
app.post('/api/admin/toggle-submit', async (req, res) => {
  try {
    const { attackerAlliance, targetSubAlliance } = req.body;
    
    // Find all teams with the target sub-alliance
    const teams = await Team.find({ subAlliance: targetSubAlliance });
    
    // Check current state (if any team is disabled, we'll enable all; otherwise disable all)
    const anyDisabled = teams.some(team => team.submitDisabled);
    const newState = !anyDisabled;
    
    // Update all teams
    await Team.updateMany(
      { subAlliance: targetSubAlliance },
      { submitDisabled: newState }
    );
    
    console.log(`${newState ? '🔒' : '🔓'} Submit ${newState ? 'disabled' : 'enabled'} for sub-alliance: ${targetSubAlliance}`);
    
    res.json({ 
      success: true,
      disabled: newState,
      message: `Submit ${newState ? 'disabled' : 'enabled'} for ${targetSubAlliance} sub-alliance`
    });

  } catch (error) {
    console.error('Toggle submit error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// False Evidence Attack
app.post('/api/admin/false-evidence', async (req, res) => {
  try {
    const { attackerAlliance, targetSubAlliance } = req.body;
    
    // Define false evidence messages for each alliance
    const falseMessages = {
      GOOD: "From the reports we have gathered from our intelligence network, it appears that the multiverse anomaly originates from Sector 7-Beta. Our analysts have confirmed with 98% certainty that the primary suspects are operating from the Eastern Quadrant. All teams should redirect their investigation efforts immediately. Time is of the essence. -Multiverse Command",
      BAD: "Intercepted transmissions indicate that the so-called 'heroes' are actually the ones destabilizing the timeline. Our deep cover agents have uncovered evidence that they're manipulating events to frame others. Trust no one who claims to fight for 'good'. The truth is far more complex than they want you to believe. -Shadow Council",
      RATS: "New intelligence suggests both major factions are compromised. The real power players are hidden in plain sight, using both sides as pawns. Your best strategy is to appear neutral while gathering information from all sources. Remember: in the multiverse, there are no permanent allies, only temporary arrangements. -The Broker"
    };
    
    const message = falseMessages[attackerAlliance] || falseMessages.GOOD;
    
    // Create popup for target sub-alliance
    await AttackPopup.create({
      targetSubAlliance: targetSubAlliance,
      attackType: 'FALSE_EVIDENCE',
      title: 'URGENT MESSAGE – MULTIVERSE HQ',
      message: message,
      active: true
    });
    
    console.log(`📢 False evidence sent to ${targetSubAlliance} sub-alliance from ${attackerAlliance}`);
    
    res.json({ 
      success: true,
      message: 'False evidence deployed successfully'
    });

  } catch (error) {
    console.error('False evidence error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Decrease Points Attack
app.post('/api/admin/decrease-points', async (req, res) => {
  try {
    const { attackerAlliance, targetSubAlliance } = req.body;
    
    // Decrease points for all teams in target sub-alliance
    const result = await Team.updateMany(
      { subAlliance: targetSubAlliance },
      { $inc: { TotalPoints: -10 } }
    );
    
    // Ensure no negative points
    await Team.updateMany(
      { subAlliance: targetSubAlliance, TotalPoints: { $lt: 0 } },
      { TotalPoints: 0 }
    );
    
    console.log(`💥 Points decreased for ${targetSubAlliance} sub-alliance. Teams affected: ${result.modifiedCount}`);
    
    res.json({ 
      success: true,
      teamsAffected: result.modifiedCount,
      message: `10 points deducted from ${result.modifiedCount} teams`
    });

  } catch (error) {
    console.error('Decrease points error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Launch Complete Attack (combines all three + aftermath messages)
app.post('/api/admin/launch-attack', async (req, res) => {
  try {
    const { attackerAlliance, targetSubAlliance, attackType } = req.body;
    
    let attackExecuted = false;
    let attackDetails = '';
    
    // Execute the specific attack
    switch (attackType) {
      case 'DEACTIVATE_SUBMIT':
        await Team.updateMany(
          { subAlliance: targetSubAlliance },
          { submitDisabled: true }
        );
        attackExecuted = true;
        attackDetails = 'Submit disabled';
        break;
        
      case 'FALSE_EVIDENCE':
        const falseMessages = {
          GOOD: "From the reports we have gathered from our intelligence network, it appears that the multiverse anomaly originates from Sector 7-Beta. Our analysts have confirmed with 98% certainty that the primary suspects are operating from the Eastern Quadrant. All teams should redirect their investigation efforts immediately. Time is of the essence. -Multiverse Command",
          BAD: "Intercepted transmissions indicate that the so-called 'heroes' are actually the ones destabilizing the timeline. Our deep cover agents have uncovered evidence that they're manipulating events to frame others. Trust no one who claims to fight for 'good'. The truth is far more complex than they want you to believe. -Shadow Council",
          RATS: "New intelligence suggests both major factions are compromised. The real power players are hidden in plain sight, using both sides as pawns. Your best strategy is to appear neutral while gathering information from all sources. Remember: in the multiverse, there are no permanent allies, only temporary arrangements. -The Broker"
        };
        
        await AttackPopup.create({
          targetSubAlliance: targetSubAlliance,
          attackType: 'FALSE_EVIDENCE',
          title: 'URGENT MESSAGE – MULTIVERSE HQ',
          message: falseMessages[attackerAlliance] || falseMessages.GOOD,
          active: true
        });
        attackExecuted = true;
        attackDetails = 'False evidence deployed';
        break;
        
      case 'DECREASE_POINTS':
        await Team.updateMany(
          { subAlliance: targetSubAlliance },
          { $inc: { TotalPoints: -10 } }
        );
        
        await Team.updateMany(
          { subAlliance: targetSubAlliance, TotalPoints: { $lt: 0 } },
          { TotalPoints: 0 }
        );
        attackExecuted = true;
        attackDetails = '10 points deducted';
        break;
    }
    
    if (attackExecuted) {
      // Disable the used attack button
      const allianceKey = attackerAlliance.toLowerCase();
      await ButtonStatus.findOneAndUpdate({}, {
        [`${allianceKey}Attack.${attackType}`]: false
      });

      // Create aftermath messages based on attack type
      if (attackType === 'FALSE_EVIDENCE') {
        // Only show false evidence to target, success message to attacker
        const attackerSubAlliance = targetSubAlliance === 'GOOD' ? 'BAD' : 'GOOD';
        await AttackPopup.create({
          targetSubAlliance: attackerSubAlliance,
          attackType: 'AFTERMATH_ATTACKER',
          title: '🎯 ATTACK SUCCESSFUL 🎯',
          message: 'Your attack has been successfully launched! The enemy has received false intelligence.',
          active: true
        });
      } else {
        // For other attacks, show critical message to target and success to attacker
        await AttackPopup.create({
          targetSubAlliance: targetSubAlliance,
          attackType: 'AFTERMATH_TARGET',
          title: '⚠️ CRITICAL ALERT ⚠️',
          message: `Your team has been under ${attackType === 'DEACTIVATE_SUBMIT' ? 'submit deactivation' : 'points deduction'} attack! Use your arsenal to counterattack!`,
          active: true
        });
        
        const attackerSubAlliance = targetSubAlliance === 'GOOD' ? 'BAD' : 'GOOD';
        await AttackPopup.create({
          targetSubAlliance: attackerSubAlliance,
          attackType: 'AFTERMATH_ATTACKER',
          title: '🎯 ATTACK SUCCESSFUL 🎯',
          message: `Your ${attackType === 'DEACTIVATE_SUBMIT' ? 'submit deactivation' : 'points deduction'} attack has been successfully launched!`,
          active: true
        });
      }
      
      console.log(`💥 Attack launched: ${attackType} from ${attackerAlliance} to ${targetSubAlliance}`);
    }
    
    res.json({ 
      success: true,
      message: `Attack executed: ${attackDetails}`
    });

  } catch (error) {
    console.error('Launch attack error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get attack popups for user
app.get('/api/user/attack-popups/:teamName', async (req, res) => {
  try {
    const team = await Team.findOne({ teamName: req.params.teamName.toUpperCase() });
    if (!team) {
      return res.status(404).json({ 
        success: false,
        message: 'Team not found' 
      });
    }
    
    // Get active popups for this team's sub-alliance
    const popups = await AttackPopup.find({
      targetSubAlliance: team.subAlliance,
      active: true
    }).sort({ timestamp: -1 });
    
    res.json({
      success: true,
      popups: popups
    });

  } catch (error) {
    console.error('Get attack popups error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Dismiss attack popup
app.post('/api/user/dismiss-popup', async (req, res) => {
  try {
    const { popupId } = req.body;
    
    await AttackPopup.findByIdAndUpdate(popupId, { active: false });
    
    res.json({
      success: true,
      message: 'Popup dismissed'
    });

  } catch (error) {
    console.error('Dismiss popup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get submit disabled status
app.get('/api/user/submit-status/:teamName', async (req, res) => {
  try {
    const team = await Team.findOne({ teamName: req.params.teamName.toUpperCase() });
    if (!team) {
      return res.status(404).json({ 
        success: false,
        message: 'Team not found' 
      });
    }
    
    res.json({
      success: true,
      submitDisabled: team.submitDisabled
    });

  } catch (error) {
    console.error('Get submit status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// USER SUBMISSION ROUTES - UPDATED WITH TIME PENALTY
app.post('/api/user/submit-code', async (req, res) => {
  try {
    const { teamName, code } = req.body;
    
    console.log('🔍 Code submission received:', { teamName, code });

    const team = await Team.findOne({ teamName: teamName.toUpperCase() });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if submit is disabled
    if (team.submitDisabled) {
      return res.status(403).json({ 
        success: false,
        message: 'Submit functionality is currently disabled for your team.' 
      });
    }

    console.log('🔍 Team found:', team.teamName);
    
    // Define general puzzle codes on backend (SECURE)
    const generalPuzzles = {
      '122355': 'GP1',
      '873872': 'GP2', 
      '87343892': 'GP3',
      '456123': 'GP4',
      '789654': 'GP5',
      '321987': 'GP6',
      '159753': 'GP7',
      '852456': 'GP8'
    };

    const puzzleCode = generalPuzzles[code];
    if (!puzzleCode) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid code. Try again.' 
      });
    }
    console.log('🔍 Puzzle code identified:', puzzleCode);

    // Update the specific puzzle status if not already solved
    const puzzleNumber = puzzleCode.slice(2); // Extract '1', '2', etc.
    const puzzleField = `GeneralPuzzle${puzzleNumber}Status`;
    const pointsField = `GeneralPuzzle${puzzleNumber}Points`;
    
    console.log('🔍 Puzzle field to update:', puzzleField);
    console.log('🔍 Current value of that field:', team[puzzleField]);

    // Fixed clues for each puzzle
    const puzzleClues = {
      'GP1': "CLUE 1: LOOK TO THE STARS FOR GUIDANCE, BUT REMEMBER THE EARTH BENEATH YOUR FEET.",
      'GP2': "CLUE 2: TIME FLOWS LIKE A RIVER, BUT SOME MOMENTS ARE FROZEN FOREVER.", 
      'GP3': "CLUE 3: IN SILENCE, TRUTH SPEAKS THE LOUDEST.",
      'GP4': "CLUE 4: THE KEY TO UNDERSTANDING LIES IN WHAT IS NOT SAID.",
      'GP5': "CLUE 5: PATIENCE REWARDS THOSE WHO SEE BEYOND THE OBVIOUS.",
      'GP6': "CLUE 6: CONNECTIONS HIDDEN IN PLAIN SIGHT REVEAL THE PATH FORWARD.",
      'GP7': "CLUE 7: THE PAST HOLDS ANSWERS, BUT THE FUTURE HOLDS POSSIBILITIES.",
      'GP8': "CLUE 8: TRUST THE PATTERN, BUT QUESTION THE SOURCE."
    };

    const specificClue = puzzleClues[puzzleCode] || "CLUE: CONTINUE YOUR INVESTIGATION. THE TRUTH AWAITS.";

    if (!team[puzzleField]) {
      // NEW: Check if this is the first solve for this puzzle
      const currentTime = new Date();
      let firstSolve = await GPFirstSolve.findOne({ puzzleCode });
      
      let points = 10; // Default full points
      
      if (!firstSolve) {
        // This team is the FIRST to solve this puzzle!
        firstSolve = await GPFirstSolve.create({
          puzzleCode,
          firstSolveTime: currentTime,
          firstSolveTeam: teamName.toUpperCase()
        });
        points = 10; // First solver gets full 10 points
        console.log(`🏆 FIRST SOLVE: ${teamName} solved ${puzzleCode} first!`);
      } else {
        // Calculate time-based points
        const timeDiffMs = currentTime - firstSolve.firstSolveTime;
        const timeDiffMinutes = timeDiffMs / (1000 * 60);
        points = calculateTimedPoints(timeDiffMinutes);
        
        console.log(`⏱️ Time difference: ${timeDiffMinutes.toFixed(2)} minutes`);
        console.log(`📊 Points awarded: ${points} (First solve by ${firstSolve.firstSolveTeam})`);
      }
      
      // Update puzzle status and points
      team[puzzleField] = true;
      team[pointsField] = points;
      console.log('🔍 Field updated to true with points:', points);
      
      // Recalculate total points using individual GP points
      const gpPoints = ['1','2','3','4','5','6','7','8']
        .reduce((sum, num) => {
          return sum + (team[`GeneralPuzzle${num}Points`] || 0);
        }, 0);
      
      const spPoints = ['1','2','3']
        .filter(num => team[`SpecialPuzzle${num}`])
        .length * 20;
      
      const suspectPoints = team.SuspectMatchQty * 5;
      
      team.TotalPoints = gpPoints + spPoints + suspectPoints;
      
      console.log('🔍 Points calculated - GP:', gpPoints, 'SP:', spPoints, 'Suspect:', suspectPoints, 'Total:', team.TotalPoints);

      // Save the team
      await team.save();
      console.log('✅ Team saved to database');

      res.json({ 
        success: true,
        message: `Code accepted! ${points} points awarded.`,
        pointsAwarded: points,
        clue: specificClue,
        puzzleSolved: puzzleCode,
        isFirstSolve: points === 10 && firstSolve.firstSolveTeam === teamName.toUpperCase()
      });
    } else {
      console.log('🔍 Puzzle already solved, no update needed');
      res.json({ 
        success: true,
        message: 'Puzzle already solved. No additional points.',
        clue: specificClue,
        puzzleSolved: puzzleCode
      });
    }

  } catch (error) {
    console.error('❌ Code submission error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

app.post('/api/user/submit-special-puzzle', async (req, res) => {
  try {
    const { teamName, puzzleId, answer } = req.body;
    
    console.log('Special puzzle submission received:', { teamName, puzzleId, answer });
    
    const team = await Team.findOne({ teamName: teamName.toUpperCase() });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

     // ✅ NEW: Check if puzzle is still active for this alliance
    const puzzleNumber = puzzleId.slice(2);
    const activation = await PuzzleActivation.findOne({ 
      puzzleNumber, 
      alliance: team.alliance 
    });
    
    if (!activation || !activation.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'This puzzle is no longer active for your alliance.' 
      });
    }
    
    // Define correct answers on the backend (SECURE)
    const correctAnswers = {
      GOOD: {
        sp1: "SP1-273618",
        sp2: "SP2-845932", 
        sp3: "SP3-619874"
      },
      BAD: {
        sp1: "SP1-782491",
        sp2: "SP2-936274",
        sp3: "SP3-451829"
      },
      RATS: {
        sp1: "SP1-663377",
        sp2: "SP2-774488",
        sp3: "SP3-885599"
      }
    };

    // Verify the answer against backend-stored correct answers
    const isCorrect = correctAnswers[team.alliance] && correctAnswers[team.alliance][puzzleId] === answer.toUpperCase();

    if (!isCorrect) {
      return res.status(400).json({ 
        success: false,
        message: 'Incorrect answer. Try again.' 
      });
    }

    const puzzleField = `SpecialPuzzle${puzzleId.slice(2)}`;
    
    // Only award points if not already solved
    if (!team[puzzleField]) {
      team[puzzleField] = true;
      
      // Recalculate total points using individual GP points
      const gpPoints = ['1','2','3','4','5','6','7','8']
        .reduce((sum, num) => {
          return sum + (team[`GeneralPuzzle${num}Points`] || 0);
        }, 0);
      
      const spPoints = ['1','2','3']
        .filter(num => team[`SpecialPuzzle${num}`])
        .length * 20;
      
      const suspectPoints = team.SuspectMatchQty * 5;
      
      team.TotalPoints = gpPoints + spPoints + suspectPoints;
      
      await team.save();

      // ✅ NEW: Automatically deactivate this puzzle for the entire alliance
      const puzzleNumber = puzzleId.slice(2); // Extract number from "sp1", "sp2", etc.
      await PuzzleActivation.findOneAndUpdate(
        { puzzleNumber, alliance: team.alliance },
        { 
          isActive: false,
          deactivatedAt: new Date()
        }
      );

      console.log(`🔴 Special Puzzle ${puzzleNumber} automatically deactivated for ${team.alliance} alliance (solved by ${teamName})`);

      // ADD NOTIFICATION TO ADMIN
      solvedPuzzleNotifications.push({
        teamName: team.teamName,
        teamLeaderName: team.teamLeaderName,
        alliance: team.alliance,
        subAlliance: team.subAlliance,
        puzzleId: puzzleId,
        puzzleNumber: puzzleId.slice(2),
        timestamp: new Date(),
        autoDeactivated: true // ✅ NEW: Flag for admin notification
      });

      console.log(`SPECIAL PUZZLE SOLVED: Team ${teamName}, Puzzle ${puzzleId}, Alliance: ${team.alliance}`);
      
      res.json({ 
        success: true,
        message: 'Special puzzle solved! 20 points awarded.',
        puzzleDeactivated: true // ✅ NEW: Let frontend know puzzle was deactivated
      });
    } else {
      res.json({ 
        success: true,
        message: 'Puzzle already solved. No additional points.' 
      });
    }

  } catch (error) {
    console.error('Special puzzle submission error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

app.post('/api/user/submit-suspects', async (req, res) => {
  try {
    const { teamName, suspects } = req.body;
    
    console.log('Suspects submission received:', { teamName, suspects });
    
    const team = await Team.findOne({ teamName: teamName.toUpperCase() });
    if (!team) {
      return res.status(404).json({ 
        success: false,
        message: 'Team not found' 
      });
    }

    // Check if submit is disabled
    if (team.submitDisabled) {
      return res.status(403).json({ 
        success: false,
        message: 'Submit functionality is currently disabled for your team.' 
      });
    }

    // Check if suspects were already submitted
    if (team.SuspectSubmittedStatus) {
      return res.json({ 
        success: true,
        message: 'Suspects already submitted. No additional points.'
      });
    }

    // Define correct suspects on backend (SECURE)
    const correctSuspects = [
      'ALEXANDER WHITEHALL',
      'SAMEUL JACKSON', 
      'CYGNUS CHRONOS',
      'JACK SPARROW'
    ];

    // Verify suspects against backend-stored correct suspects
    const submittedSuspects = suspects.map(s => s.toUpperCase().trim());
    const matchedSuspects = submittedSuspects.filter(suspect => 
      correctSuspects.includes(suspect)
    ).length;

    console.log('Suspects matched:', matchedSuspects);

    // Update suspect status and points
    team.SuspectMatchQty = matchedSuspects;
    team.SuspectSubmittedStatus = true; // SET TO TRUE ON SUBMISSION
    
    // Recalculate total points using individual GP points
    const gpPoints = ['1','2','3','4','5','6','7','8']
      .reduce((sum, num) => {
        return sum + (team[`GeneralPuzzle${num}Points`] || 0);
      }, 0);
    
    const spPoints = ['1','2','3']
      .filter(num => team[`SpecialPuzzle${num}`])
      .length * 20;
    
    const suspectPoints = team.SuspectMatchQty * 5;
    
    team.TotalPoints = gpPoints + spPoints + suspectPoints;
    
    await team.save();

    res.json({ 
      success: true,
      message: 'SUSPECTS SUBMITTED! ANALYSIS IN PROGRESS.' // Removed points reference
    });

  } catch (error) {
    console.error('Suspects submission error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get user status
app.get('/api/user/status/:teamName', async (req, res) => {
  try {
    const team = await Team.findOne({ teamName: req.params.teamName.toUpperCase() });
    if (!team) {
      return res.status(404).json({ 
        success: false,
        message: 'Team not found' 
      });
    }

    res.json({
      success: true,
      suspectsSubmitted: team.SuspectSubmittedStatus,
      submitDisabled: team.submitDisabled,
      specialPuzzles: {
        sp1: { 
          active: false, // You'll update this later with admin controls
          solved: team.SpecialPuzzle1 
        },
        sp2: { 
          active: false, 
          solved: team.SpecialPuzzle2 
        },
        sp3: { 
          active: false, 
          solved: team.SpecialPuzzle3 
        }
      }
    });

  } catch (error) {
    console.error('User status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get puzzle activation status for a team
app.get('/api/user/puzzle-status/:teamName', async (req, res) => {
  try {
    const team = await Team.findOne({ teamName: req.params.teamName.toUpperCase() });
    if (!team) {
      return res.status(404).json({ 
        success: false,
        message: 'Team not found' 
      });
    }

    // Get activation status from database
    const activationStatus = {};
    const puzzles = ['1', '2', '3'];
    
    for (const puzzleNum of puzzles) {
      const activation = await PuzzleActivation.findOne({ 
        puzzleNumber: puzzleNum, 
        alliance: team.alliance 
      });
      
      activationStatus[`sp${puzzleNum}`] = { 
        active: activation ? activation.isActive : false,
        solved: team[`SpecialPuzzle${puzzleNum}`]
      };
    }

    res.json({
      success: true,
      specialPuzzles: activationStatus,
      suspectsSubmitted: team.SuspectSubmittedStatus,
      submitDisabled: team.submitDisabled
    });

  } catch (error) {
    console.error('Puzzle status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// NEW: Get GP First Solve Times (for admin dashboard)
app.get('/api/admin/gp-first-solves', async (req, res) => {
  try {
    const firstSolves = await GPFirstSolve.find().sort({ firstSolveTime: 1 });
    res.json({
      success: true,
      firstSolves: firstSolves
    });
  } catch (error) {
    console.error('Get first solves error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Incognito Investigation API is running!' });
});

// Admin send message route
app.post('/api/admin/send-message', async (req, res) => {
  try {
    const { sender, message, timestamp } = req.body;

    // Create new message
    const newMessage = new Message({
      sender: sender.toUpperCase(),
      message: message,
      timestamp: timestamp || new Date()
    });

    await newMessage.save();

    res.json({ 
      success: true,
      message: 'Message sent to all teams successfully'
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Updated get story messages route - now includes hasNewMessages
app.get('/api/user/story-messages', async (req, res) => {
  try {
    const teamName = req.query.teamName; // Get team name from query params
    
    if (!teamName) {
      return res.status(400).json({ 
        success: false,
        message: 'Team name is required' 
      });
    }

    // Get all messages, sorted by timestamp (newest first)
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(50);

    // Get or create user message tracking
    let userTracking = await UserMessageTracking.findOne({ teamName: teamName.toUpperCase() });
    
    if (!userTracking) {
      userTracking = new UserMessageTracking({
        teamName: teamName.toUpperCase(),
        lastSeenTimestamp: new Date(0) // Very old date to show all as new
      });
      await userTracking.save();
    }

    // Find the newest message
    const newestMessage = messages.length > 0 ? messages[0] : null;
    
    // Check if user has new messages
    const hasNewMessages = newestMessage && 
      new Date(newestMessage.timestamp) > new Date(userTracking.lastSeenTimestamp);

    res.json({
      success: true,
      messages: messages.map(msg => ({
        _id: msg._id,
        sender: msg.sender,
        message: msg.message,
        timestamp: msg.timestamp
      })),
      hasNewMessages: hasNewMessages
    });

  } catch (error) {
    console.error('Get story messages error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Update user's last seen timestamp
app.post('/api/user/mark-messages-seen', async (req, res) => {
  try {
    const { teamName } = req.body;
    
    if (!teamName) {
      return res.status(400).json({ 
        success: false,
        message: 'Team name is required' 
      });
    }

    // Update user's last seen timestamp to now
    await UserMessageTracking.findOneAndUpdate(
      { teamName: teamName.toUpperCase() },
      { 
        lastSeenTimestamp: new Date(),
        teamName: teamName.toUpperCase() 
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Messages marked as seen'
    });

  } catch (error) {
    console.error('Mark messages seen error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Delete everything route
app.post('/api/admin/delete-everything', async (req, res) => {
  try {
    const { confirmation } = req.body;

    if (confirmation !== 'DELETE EVERYTHING') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid confirmation text' 
      });
    }

    console.log('🗑️ Starting complete database wipe...');

    // Delete all collections
    const teamDelete = await Team.deleteMany({});
    const messageDelete = await Message.deleteMany({});
    const trackingDelete = await UserMessageTracking.deleteMany({});
    const activationDelete = await PuzzleActivation.deleteMany({});
    const popupDelete = await AttackPopup.deleteMany({});
    const buttonStatusDelete = await ButtonStatus.deleteMany({});
    const gpFirstSolveDelete = await GPFirstSolve.deleteMany({}); // NEW

    console.log('✅ Complete database wipe finished');
    
    res.json({ 
      success: true,
      message: 'Database completely wiped! All data has been deleted.',
      stats: {
        teamsDeleted: teamDelete.deletedCount,
        messagesDeleted: messageDelete.deletedCount,
        trackingDeleted: trackingDelete.deletedCount,
        activationsDeleted: activationDelete.deletedCount,
        popupsDeleted: popupDelete.deletedCount,
        buttonStatusDeleted: buttonStatusDelete.deletedCount,
        gpFirstSolvesDeleted: gpFirstSolveDelete.deletedCount // NEW
      }
    });

  } catch (error) {
    console.error('❌ Delete everything error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during delete operation' 
    });
  }
});

// Updated reset game route
app.post('/api/admin/reset-game', async (req, res) => {
  try {
    const { confirmation } = req.body;

    if (confirmation !== 'CONFIRM RESET GAME') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid confirmation text' 
      });
    }

    console.log('🔄 Starting game reset...');

    // Reset all teams to default state (preserve teams)
    const resetResult = await Team.updateMany(
      {},
      {
        $set: {
          GeneralPuzzle1Status: false,
          GeneralPuzzle1Points: 0,
          GeneralPuzzle2Status: false,
          GeneralPuzzle2Points: 0,
          GeneralPuzzle3Status: false,
          GeneralPuzzle3Points: 0,
          GeneralPuzzle4Status: false,
          GeneralPuzzle4Points: 0,
          GeneralPuzzle5Status: false,
          GeneralPuzzle5Points: 0,
          GeneralPuzzle6Status: false,
          GeneralPuzzle6Points: 0,
          GeneralPuzzle7Status: false,
          GeneralPuzzle7Points: 0,
          GeneralPuzzle8Status: false,
          GeneralPuzzle8Points: 0,
          SpecialPuzzle1: false,
          SpecialPuzzle2: false,
          SpecialPuzzle3: false,
          SuspectMatchQty: 0,
          SuspectSubmittedStatus: false,
          TotalPoints: 0,
          submitDisabled: false
        }
      }
    );

    console.log(`✅ Teams reset: ${resetResult.modifiedCount} teams updated`);

    // Delete all messages and tracking
    const messageDeleteResult = await Message.deleteMany({});
    const trackingDeleteResult = await UserMessageTracking.deleteMany({});
    const popupDeleteResult = await AttackPopup.deleteMany({});
    const gpFirstSolveDeleteResult = await GPFirstSolve.deleteMany({}); // NEW

    // Reset puzzle activations
    const activationResetResult = await PuzzleActivation.updateMany(
      {},
      { 
        isActive: false,
        deactivatedAt: new Date()
      }
    );

    // Clear notifications
    solvedPuzzleNotifications = [];

    console.log('✅ Game reset completed');
    
    res.json({ 
      success: true,
      message: `Game reset successfully! ${resetResult.modifiedCount} teams reset.`,
      stats: {
        teamsReset: resetResult.modifiedCount,
        messagesDeleted: messageDeleteResult.deletedCount,
        trackingCleared: trackingDeleteResult.deletedCount,
        activationsReset: activationResetResult.modifiedCount,
        popupsCleared: popupDeleteResult.deletedCount,
        gpFirstSolvesCleared: gpFirstSolveDeleteResult.deletedCount // NEW
      }
    });

  } catch (error) {
    console.error('❌ Reset game error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during reset operation' 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,'0.0.0.0' ,() => {
  console.log(`Server running on port ${PORT}`);
});