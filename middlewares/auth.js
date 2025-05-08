// middlewares/auth.js - Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    next();
  };
  
  const isAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).render('error', { 
        message: 'You do not have permission to access this page',
        error: {}
      });
    }
    next();
  };
  
  module.exports = {
    isAuthenticated,
    isAdmin
  };