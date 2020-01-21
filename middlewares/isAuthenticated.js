const jwt = require('jsonwebtoken');

const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.jwt;

  try {
    jwt.verify(token, 'secret');
    return next();
  } catch {
    return res.redirect('/auth/signin');
  }
};

module.exports = isAuthenticated;
