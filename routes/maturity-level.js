const fs = require('fs');
const path = require('path');
const express = require('express');
const { Storage } = require('@google-cloud/storage');

const User = require('../db/User');
const MaturityLevel = require('../db/MaturityLevel');

const isAuthenticated = require('../middlewares/isAuthenticated');

const router = express.Router();
const storage = new Storage();

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


router.get('/', isAuthenticated, async (req, res, next) => {
  const isAdmin = req.user.accountType === 'ADMIN';
  const query = req.query;
  const { semester, tahun } = query;
  const upkNames = await getUpkNames();
  let mls = await MaturityLevel.find({ semester, tahun }).lean()
  mls = mls.map(m => ({ ...m, upkName: upkNames[m.upk] }));

  return res.render('maturity-level/index', {
    layout: 'dashboard',
    title: 'Maturity Level',
    success: req.flash('success'),
    error: req.flash('error'),
    isAdmin,
    query,
    mls,
  });
});

router.get('/target', isAuthenticated, async (req, res, next) => {
  const isAdmin = req.user.accountType === 'ADMIN';
  const units = await getUnitList(req.user);

  return res.render('maturity-level/target', {
    layout: 'dashboard',
    title: 'Maturity Level',
    isAdmin,
    units,
  });
});

router.post('/target', isAuthenticated, async (req, res, next) => {
  const {
    semester,
    tahun,
    upk,
    pengumpulanDataEfisiensi,
    perhitunganPerformanceTest,
    pemodelan,
    heatRateAnalysis,
    auxiliaryPowerAnalysis,
    rekomendasi,
    pelaporanEfisiensi,
    monitoringPostProgram,
  } = req.body;
  try {
    const avgTarget =
      (Number(pengumpulanDataEfisiensi) +
        Number(perhitunganPerformanceTest) +
        Number(pemodelan) +
        Number(heatRateAnalysis) +
        Number(auxiliaryPowerAnalysis) +
        Number(rekomendasi) +
        Number(pelaporanEfisiensi) +
        Number(monitoringPostProgram)) /
      8;

    let ml = await MaturityLevel.findOne({ semester, tahun, upk });

    if (!ml) {
      ml = new MaturityLevel({
        semester,
        tahun,
        upk,
        averageTarget: avgTarget,
      });
    }

    ml.pengumpulanDataEfisiensi.target = pengumpulanDataEfisiensi;
    ml.perhitunganPerformanceTest.target = pengumpulanDataEfisiensi;
    ml.pemodelan.target = pengumpulanDataEfisiensi;
    ml.heatRateAnalysis.target = pengumpulanDataEfisiensi;
    ml.auxiliaryPowerAnalysis.target = pengumpulanDataEfisiensi;
    ml.rekomendasi.target = pengumpulanDataEfisiensi;
    ml.pelaporanEfisiensi.target = pengumpulanDataEfisiensi;
    ml.monitoringPostProgram.target = pengumpulanDataEfisiensi;
    ml.averageTarget = avgTarget;

    await ml.save();
    req.flash('success', 'Data target Maturity Level berhasil ditambahkan');
  } catch (e) {
    console.error(e);
    req.flash(
      'error',
      `Data target Maturity Level gagal ditambahkan, error: ${e.message}`
    );
  }

  const query = `semester=${semester}&tahun=${tahun}`;
  return res.redirect(`/maturity-level?${query}`);
});

router.get('/realisasi', isAuthenticated, async (req, res, next) => {
  const isAdmin = req.user.accountType === 'ADMIN';

  return res.render('maturity-level/realisasi', {
    layout: 'dashboard',
    title: 'Maturity Level',
    isAdmin,
  });
});

router.get('/:upk', isAuthenticated, async (req, res, next) => {
  const isAdmin = req.user.accountType === 'ADMIN';
  const { upk } = req.params;
  const query = req.query;
  const { semester, tahun } = query;
  const upkNames = await getUpkNames();
  const ml = await MaturityLevel.findOne({ semester, tahun, upk }).lean();

  return res.render('maturity-level/detail', {
    layout: 'dashboard',
    title: 'Maturity Level',
    success: req.flash('success'),
    error: req.flash('error'),
    isAdmin,
    query,
    ml,
    upkName: upkNames[ml.upk],
  });
});

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

module.exports = router;
