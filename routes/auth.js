const express = require('express');

const User = require('../db/User');

const router = express.Router();

// Uncomment these signup routes to enable creating new account
// router.get('/signup', (req, res, next) => {
//   return res.render('auth/signup', { title: 'Sign Up' });
// });

// router.post('/signup', async (req, res) => {
//   const { name, username, accountType, password } = req.body;

//   let user = await User.findOne({ username });
//   if (!user) {
//     user = new User({
//       username,
//     });
//   }
//   user.name = name;
//   user.accountType = accountType;
//   user.setPassword(password);

//   await user.save();

//   return res.redirect('/auth/signup');
// });

router.get('/signin', (req, res, next) => {
  return res.render('auth/signin', { title: 'Sign In' });
});

router.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user || !user.validatePassword(password)) {
    return res.render('signin', {
      title: 'Sign In',
      error: 'Username dan password tidak cocok!',
    });
  }

  res.cookie('jwt', user.generateJWT());
  return res.redirect('/');
});

module.exports = router;
