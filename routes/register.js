// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const { User } = require('../models');

// // Registration page
// router.get('/', (req, res) => {
//   if (req.session.user) {
//     return res.redirect('/dashboard');
//   }
//   res.render('register', { error: null });
// });

// // Registration process
// router.post('/', async (req, res) => {
//   try {
//     const { email, password, confirmPassword } = req.body;
    
//     console.log('Registration attempt for:', email);
    
//     // Check passwords match
//     if (password !== confirmPassword) {
//       console.log('Passwords do not match for:', email);
//       return res.render('register', { 
//         error: 'Passwords do not match',
//         email
//       });
//     }
    
//     // Check if user exists using the model's static method
//     const existingUser = await User.findByEmail(email);
//     if (existingUser) {
//       console.log('Email already registered:', email);
//       return res.render('register', { 
//         error: 'Email already registered',
//         email
//       });
//     }
    
//     // Hash password
//     const salt = bcrypt.genSaltSync(10);
//     const hashedPassword = bcrypt.hashSync(password, salt);
    
//     console.log('Creating new user with email:', email);
    
//     // Create user
//     const newUser = await User.create({
//       email,
//       password: hashedPassword,
//       role: 'customer' // Using default from your model
//     });
    
//     console.log('User created successfully with ID:', newUser.id);
    
//     // Set session
//     req.session.user = {
//       id: newUser.id,
//       email: newUser.email,
//       role: newUser.role
//     };
    
//     res.redirect('/dashboard');
//   } catch (error) {
//     console.error('Registration error details:', error.message);
//     console.error(error.stack);
    
//     // Check for validation errors
//     if (error.name === 'SequelizeValidationError') {
//       const validationErrors = error.errors.map(err => err.message).join(', ');
//       console.log('Validation errors:', validationErrors);
//       return res.render('register', { 
//         error: validationErrors,
//         email: req.body.email
//       });
//     }
    
//     res.render('register', { 
//       error: 'Registration failed: ' + error.message,
//       email: req.body.email
//     });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Registration page
router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('register', { errors: [] });
});

// Registration process
router.post('/', async (req, res) => {
  try {
    const { email, password, confirmPassword, role } = req.body;
    
    console.log('Registration attempt for:', email);
    
    // Check passwords match
    if (password !== confirmPassword) {
      return res.render('register', { 
        errors: [{ message: 'Passwords do not match' }],
        email
      });
    }
    
    // Check if user exists using the model's static method
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.render('register', { 
        errors: [{ message: 'Email already registered' }],
        email
      });
    }
    
    // Create user - password hashing is handled by the model hook
    const newUser = await User.create({
      email,
      password,
      role: role || 'customer' // Use selected role or default to customer
    });
    
    console.log('User created successfully with ID:', newUser.id);
    
    // Set session
    req.session.user = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    };
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Registration error details:', error.message);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => ({
        message: err.message
      }));
      
      return res.render('register', { 
        errors,
        email: req.body.email
      });
    }
    
    // Handle other errors
    res.render('register', { 
      errors: [{ message: 'Registration failed: ' + error.message }],
      email: req.body.email
    });
  }
});

module.exports = router;