const express = require('express');

const User = require('../db/User');
const UnitData = require('../db/UnitData');

const isAuthenticated = require('../middlewares/isAuthenticated');

const router = express.Router();

router.get(/.*e23a7dcaefbde4e74e263247aa42ecd7.ttf$/, (req, res, next) => {
  return res.send('');
});
router.get(/.*a1ecc3b826d01251edddf29c3e4e1e97.woff$/, (req, res, next) => {
  return res.send('');
});

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

const getAllUnitData = async () => {
  const upkNames = await getUpkNames();
  let unitData = await UnitData.find({})
    .sort({ createdAt: -1 })
    .lean();
  unitData = unitData.map(u => ({ ...u, upkName: upkNames[u.upk] }));
  return unitData;
}

router.get('/', isAuthenticated, async (req, res, next) => {
  const unitData = await getAllUnitData();
  
  return res.render('index', {
    layout: 'dashboard',
    title: 'SIMANIS',
    unitData,
  });
});

router.get('/404', function(req, res, next) {
  res.render('404', { title: 'Error' });
});

router.get('/500', function(req, res, next) {
  res.render('500', { title: 'Error' });
});

module.exports = router;
