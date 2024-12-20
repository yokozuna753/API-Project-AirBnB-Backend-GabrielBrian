const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../../db/models');
const { setTokenCookie } = require('../../utils/auth');
const { check, validationResult } = require('express-validator');
const router = express.Router();

// Input validation rules (unchanged)
const validateSignup = [
  check('firstName')
    .exists({ checkFalsy: true })
    .withMessage('First Name is required'),
  check('lastName')
    .exists({ checkFalsy: true })
    .withMessage('Last Name is required'),
  check('email')
    .isEmail()
    .withMessage('Invalid email'),
  check('username')
    .exists({ checkFalsy: true })
    .withMessage('Username is required'),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

// Middleware to handle validation errors and return 400 if any (unchanged)
const handleValidationErrors = (req, _res, next) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const errors = {};
    validationErrors
      .array()
      .forEach(error => errors[error.path] = error.msg);

    const err = Error('Bad Request');
    err.errors = errors;
    err.status = 400;
    err.title = 'Bad Request';
    return next(err);
  }
  return next();  // Continue to the next middleware or route handler
};

// Route to Sign Up a User
router.post(
  '/',
  validateSignup,
  handleValidationErrors,  // Handle validation errors (400 Bad Request)
  async (req, res) => {
    const { firstName, lastName, email, password, username } = req.body;
    const hashedPassword = bcrypt.hashSync(password);

    try {
      // Check if the email or username already exists
      const userEmail = await User.findOne({
        where: { email },
        attributes: ['email'],
      });
      const userUsername = await User.findOne({
        where: { username },
        attributes: ['username'],
      });

      // If either email or username exists, throw an error with the corresponding field
      if (userEmail || userUsername) {
        const emailMessage = userEmail ? email : 'undefined';
        const usernameMessage = userUsername ? username : 'undefined';
        throw new Error(`${emailMessage},${usernameMessage}`);
      }

      // Try to create a new user in the db
      const user = await User.create({
        email,
        username,
        hashedPassword,
        firstName,
        lastName,
      });

      const safeUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
      };

      // Set a token cookie for the newly created user
      await setTokenCookie(res, safeUser);

      // Return the created user with a 201 status
      return res.status(201).json({
        user: safeUser,
      });
    } catch (error) {
      // If an error was thrown in the previous try block (email or username exists), split and process it
      const [email, username] = error.message.split(',');
      const response = { message: 'User already exists' };
      const errors = {};

      // If the email exists, set the corresponding error message
      if (email !== 'undefined') errors.email = 'User with that email already exists';
      // If the username exists, set the corresponding error message
      if (username !== 'undefined') errors.username = 'User with that username already exists';

      // Attach the errors to the response
      if (Object.keys(errors).length > 0) response.errors = errors;

      // Return a 500 status for conflict (user already exists)
      res.status(500).json(response);
      return;
    }
  }
);

module.exports = router;




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


