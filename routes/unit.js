const express = require('express');

const User = require('../db/User');
const UnitData = require('../db/UnitData');

const isAuthenticated = require('../middlewares/isAuthenticated');
const isAdminOrUnit = require('../middlewares/isAdminOrUnit');

const { isAdminOrRelatedUnit } = require('../utils');

const router = express.Router();

router.get('/', isAuthenticated, (req, res, next) => {
  res.render('unit/index', {
    layout: 'dashboard',
    title: 'Data Unit',
  });
});

router.get('/:unit', isAuthenticated, async (req, res, next) => {
  const unit = await User.findOne({ username: req.params.unit }).lean();

  if (!unit) {
    return res.redirect('/unit');
  }

  const hasUpdatePermission =
    unit && isAdminOrRelatedUnit(req.user, req.params.unit);

  const unitData = await UnitData.find({ upk: req.params.unit })
    .sort({ createdAt: -1 })
    .lean();
  unitData,
    res.render('unit/detail', {
      layout: 'dashboard',
      title: `Data Unit ${unit.name}`,
      success: req.flash('success'),
      unit,
      unitData,
      hasUpdatePermission,
    });
});

router.get(
  '/:unit/create',
  isAuthenticated,
  isAdminOrUnit('/unit'),
  async (req, res, next) => {
    if (!isAdminOrRelatedUnit(req.user, req.params.unit)) {
      return res.redirect('/unit');
    }
    const unit = await User.findOne({
      username: req.params.unit,
      accountType: 'UNIT',
    }).lean();
    if (!unit) {
      return res.redirect('/unit');
    }
    return res.render('unit/input', {
      layout: 'dashboard',
      title: `Data Unit ${unit.name}`,
      error: req.flash('error'),
      unit,
    });
  }
);

router.post('/:unit/create', isAuthenticated, async (req, res, next) => {
  const {
    ulpl,
    tahunPembuatan,
    statusUnit,
    dayaPasok,
    dayaNetto,
    manufaktur,
    tipeMesin,
  } = req.body;
  // TODO: request validation
  if (!isAdminOrRelatedUnit(req.user, req.params.unit)) {
    return res.redirect('/unit');
  }
  const unit = await User.findOne({
    username: req.params.unit,
    accountType: 'UNIT',
  });
  if (!unit) {
    return res.redirect('/unit');
  }
  try {
    const unitData = new UnitData({
      upk: req.params.unit,
      ulpl,
      tahunPembuatan,
      statusUnit,
      dayaPasok,
      dayaNetto,
      manufaktur,
      tipeMesin,
    });
    await unitData.save();
    req.flash('success', 'Data Unit berhasil ditambahkan');
    return res.redirect(`/unit/${req.params.unit}`);
  } catch (e) {
    req.flash('error', e.message);
    return res.redirect(`/unit/${req.params.unit}/create`);
  }
});

module.exports = router;
