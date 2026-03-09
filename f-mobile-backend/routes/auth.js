const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`[AUTH] Login attempt: username=${username}`);

    if (!username || !password) {
      console.log('[AUTH] Missing username or password');
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const user = await User.findOne({ username }).select('+password').populate('branch');
    console.log(`[AUTH] User found: ${user ? 'yes' : 'no'}`);
    
    if (!user) {
      console.log(`[AUTH] User not found: ${username}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const passwordMatch = await user.comparePassword(password);
    console.log(`[AUTH] Password match: ${passwordMatch}`);
    
    if (!passwordMatch) {
      console.log('[AUTH] Password mismatch');
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.active) {
      console.log('[AUTH] User is inactive');
      return res.status(403).json({ success: false, error: 'User is inactive' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    console.log(`[AUTH] Login successful for user: ${username}`);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        branch: user.branch
      }
    });
  } catch (err) {
    console.error('[AUTH] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Current User
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('branch');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Logout
router.post('/logout', auth, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
