const jwt = require('jsonwebtoken');

const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.jwt;

  try {
    const { name, username, accountType } = jwt.verify(token, 'secret');
    req.user = {
      name,
      username,
      accountType,
    };
    return next();
  } catch {
    return res.redirect('/auth/signin');
  }
};

module.exports = isAuthenticated;
