const jwt = require('jsonwebtoken');

const onlyAuthenticated = async (req, res, next) => {
  const token = req.cookies.jwt;

  try {
    const { name, username, accountType } = jwt.verify(
      token,
      process.env.AUTH_SECRET || 'secret'
    );
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

module.exports = onlyAuthenticated;
