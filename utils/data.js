const User = require('../db/User');

const getUpkNames = async () => {
  const upks = await User.find({ accountType: 'UNIT' }, [
    'name',
    'username',
  ]).lean();
  const upkNames = {};
  for (let upk of upks) {
    upkNames[upk.username] = upk.name;
  }
  return upkNames;
};

const getUnitList = async user => {
  let units = [];
  if (user.accountType === 'ADMIN') {
    units = await User.find({ accountType: 'UNIT' }, [
      'name',
      'username',
    ]).lean();
  } else if (user.accountType === 'UNIT') {
    units = [user];
  }
  return units;
};

module.exports = {
  getUnitList,
  getUpkNames,
};
