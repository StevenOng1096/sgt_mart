const express = require('express');
const router = express.Router();
// Import route modules
const loginRoutes = require('./login');
const registerRoutes = require('./register');
const profileRoutes = require('../routes/profile');

const Controller = require('../controllers/controller')

// Home route
router.get('/', Controller.home);

// Use other route modules
router.use('/login', loginRoutes);
router.use('/register', registerRoutes);

// Dashboard (protected route)
router.get('/dashboard', Controller.dashboard);
router.use('/profile', profileRoutes);

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;

