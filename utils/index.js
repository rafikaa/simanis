const getRandomRgbColor = () => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  color = 'rgba(' + r + ', ' + g + ', ' + b + ', 0.6)';
  return color;
};

module.exports = {
  getRandomRgbColor,
};
