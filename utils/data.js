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

module.exports = {
  getUpkNames,
};
