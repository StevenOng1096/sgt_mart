const express = require('express');
const router = express.Router();
// Import route modules
const loginRoutes = require('./login');
const registerRoutes = require('./register');
const profileRoutes = require('../routes/profile');
const cartRoutes = require('../routes/cart');

const Controller = require('../controllers/controller');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// Home route
router.get('/', Controller.home);

// Use other route modules
router.use('/login', loginRoutes);
router.use('/register', registerRoutes);

// Dashboard (protected route)
router.get('/dashboard', isAuthenticated, Controller.dashboard);
router.use('/profile', isAuthenticated, profileRoutes);
router.use('/cart', isAuthenticated, cartRoutes)

// router.get('/checkout', isAuthenticated, Controller.checkout)

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;

