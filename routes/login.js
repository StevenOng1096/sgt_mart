const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Login page
router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', { error: null });
});

// Login process
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    // Find user - use the static method from your model
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.log('User not found:', email);
      return res.render('login', { 
        error: 'Invalid email or password',
        email
      });
    }
    
    // Use the model's checkPassword method
    const isPasswordValid = await user.checkPassword(password);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.render('login', { 
        error: 'Invalid email or password',
        email
      });
    }
    
    console.log('Login successful for user:', email);
    
    // Set session
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error.message);
    console.error(error.stack);
    res.render('login', { 
      error: 'Login failed: ' + error.message,
      email: req.body.email
    });
  }
});

module.exports = router;