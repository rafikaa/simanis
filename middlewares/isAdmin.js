const isAdminOrUnit = redirectUrl => async (req, res, next) => {
  const { accountType } = req.user;

  if (accountType === 'ADMIN') {
    return next();
  } else {
    return res.redirect(redirectUrl || '/');
  }
};

module.exports = isAdminOrUnit;
