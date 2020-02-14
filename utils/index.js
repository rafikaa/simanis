const getRandomRgbColor = () => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  color = 'rgba(' + r + ', ' + g + ', ' + b + ', 0.6)';
  return color;
};

const round = (num, numOfDecimal) => {
  return parseFloat(num.toFixed(numOfDecimal));
};

const isAdminOrUnit = (user) => {
  if (
    user.accountType === 'ADMIN' ||
    user.accountType === 'UNIT'
  ) {
    return true;
  }
  return false;
};

const isAdminOrRelatedUnit = (user, unit) => {
  if (
    user.accountType === 'ADMIN' ||
    (user.accountType === 'UNIT' && user.username === unit)
  ) {
    return true;
  }
  return false;
};

module.exports = {
  getRandomRgbColor,
  isAdminOrUnit,
  isAdminOrRelatedUnit,
  round,
};
