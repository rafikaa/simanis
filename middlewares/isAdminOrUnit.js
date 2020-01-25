const isAdminOrUnit = (redirectUrl) => async (req, res, next) => {
  const {
    username,
    accountType,
  } = req.user;

  if (accountType === 'ADMIN' || (accountType === 'UNIT' && username === req.params.unit)) {
    return next();
  } else {
    return res.redirect(redirectUrl || '/');
  }
};

module.exports = isAdminOrUnit;
