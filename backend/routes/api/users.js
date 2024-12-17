const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../../db/models');
const { setTokenCookie } = require('../../utils/auth');
const { check, validationResult } = require('express-validator'); // For input validation
const router = express.Router();

// Input validation rules
const validateSignup = [
  check('firstName')
    .exists({ checkFalsy: true })
    .withMessage('First Name is required'),
  check('lastName')
    .exists({ checkFalsy: true })
    .withMessage('Last Name is required'),
  check('email')
    .isEmail()
    .withMessage('Invalid email')
    .custom(async (value) => {
      const user = await User.findOne({ where: { email: value } });
      if (user) {
        throw new Error('User with that email already exists');
      }
    }),
  check('username')
    .exists({ checkFalsy: true })
    .withMessage('Username is required')
    .custom(async (value) => {
      const user = await User.findOne({ where: { username: value } });
      if (user) {
        throw new Error('User with that username already exists');
      }
    }),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

// Route to Sign Up a User
router.post(
  '/',
  validateSignup, 
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: errors.mapped(),
      });
    }

    const { firstName, lastName, email, password, username } = req.body;
    const hashedPassword = bcrypt.hashSync(password); 

    try {
      // Create a new user in db
      const user = await User.create({ email, username, hashedPassword, firstName, lastName });

     
      const safeUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
      };

      // Set a token cookie for the newly created user
      await setTokenCookie(res, safeUser);

      
      return res.status(201).json({
        user: safeUser,
      });
    } catch (error) {
      
      console.error(error);
      return res.status(500).json({
        message: 'User already exists',
        errors: {
          email: 'User with that email already exists',
          username: 'User with that username already exists',
        },
      });
    }
  }
);


/*

fetch('/api/users', {
  method: 'POST',
  headers: {
    "Content-Type": "application/json",
    "XSRF-TOKEN": "zj8s4XHT-fXKiTvB6CJW0hpF8igWyzN-er1w"
  },
  body: JSON.stringify({
    email: 'spidey@spider.man',
    username: 'Spidey',
    password: 'password'
  })
}).then(res => res.json()).then(data => console.log(data));

// !!!!!!!!!!!!


fetch('/api/users', {
  method: 'POST',
  headers: {
    "Content-Type": "application/json",
    "XSRF-TOKEN": `908thIM9-fMML6UR4ey17dpLAeEDfRMTprCE`
  },
  body: JSON.stringify({
    email: 'firestar@spider.man',
    username: 'Firestar',
    password: ''
  })
}).then(res => res.json()).then(data => console.log(data));

*/


module.exports = router; 