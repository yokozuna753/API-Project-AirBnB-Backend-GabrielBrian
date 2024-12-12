const express = require('express')
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { setTokenCookie, restoreUser } = require('../../utils/auth');
const { User } = require('../../db/models');

const router = express.Router();

router.post(
    '/',
    async (req, res, next) => {
      const { credential, password } = req.body;
  
      const user = await User.unscoped().findOne({
        where: {
          [Op.or]: {
            username: credential,
            email: credential
          }
        }
      });
  
      if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
        const err = new Error('Login failed');
        err.status = 401;
        err.title = 'Login failed';
        err.errors = { credential: 'The provided credentials were invalid.' };
        return next(err);
      }
  
      const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
      };
  
    await setTokenCookie(res, safeUser);
  
      return res.json({
        user: safeUser
      });
    }
  );



router.delete(
    '/',
    (_req, res) => {
      res.clearCookie('token');
      return res.json({ message: 'success' });
    }
);


router.get(
  '/',
  (req, res) => {
    const { user } = req;
    if (user) {
      const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
      };
      return res.json({
        user: safeUser
      });
    } else return res.json({ user: null });
  }
);

module.exports = router;

/*

fetch('/api/session', {
  method: 'POST',
  headers: {
    "Content-Type": "application/json",
    "XSRF-TOKEN": `UKM44b2I-yXhE9YLcWwZt-_ESy9c0DDi9Yug`
  },
  body: JSON.stringify({ credential: 'demo@user.io', password: 'password' })
}).then(res => res.json()).then(data => console.log(data));

fetch('/api/session', {
  method: 'POST',
  headers: {
    "Content-Type": "application/json",
    "XSRF-TOKEN": `UKM44b2I-yXhE9YLcWwZt-_ESy9c0DDi9Yug`
  },
  body: JSON.stringify({ credential: 'Demo-lition', password: 'password' })
}).then(res => res.json()).then(data => console.log(data));

fetch('/api/session', {
  method: 'POST',
  headers: {
    "Content-Type": "application/json",
    "XSRF-TOKEN": `UKM44b2I-yXhE9YLcWwZt-_ESy9c0DDi9Yug`
  },
  body: JSON.stringify({ credential: 'Demo-lition', password: 'Hello World!' })
}).then(res => res.json()).then(data => console.log(data));

    fetch('/api/session', {
    method: 'DELETE',
    headers: {
        "Content-Type": "application/json",
        "XSRF-TOKEN": "UKM44b2I-yXhE9YLcWwZt-_ESy9c0DDi9Yug"
    }
    }).then(res => res.json()).then(data => console.log(data));

*/