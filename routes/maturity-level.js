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
  let mls = await MaturityLevel.find({ semester, tahun }).lean();
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
      });
    }

    ml.pengumpulanDataEfisiensi.target = pengumpulanDataEfisiensi;
    ml.perhitunganPerformanceTest.target = perhitunganPerformanceTest;
    ml.pemodelan.target = pemodelan;
    ml.heatRateAnalysis.target = heatRateAnalysis;
    ml.auxiliaryPowerAnalysis.target = auxiliaryPowerAnalysis;
    ml.rekomendasi.target = rekomendasi;
    ml.pelaporanEfisiensi.target = pelaporanEfisiensi;
    ml.monitoringPostProgram.target = monitoringPostProgram;
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
  const units = await getUnitList(req.user);

  return res.render('maturity-level/realisasi', {
    layout: 'dashboard',
    title: 'Maturity Level',
    isAdmin,
    units,
  });
});

const parseFormData = (body) => {
  const formData = {};
  for (let formKey of Object.keys(body)) {
    const keys = formKey.replace(/]/g, '');
    const [key, idx1, idx2] = keys.split('[');
    if (!formData[key]) formData[key] = [];
    if (!formData[key][Number(idx1)]) formData[key][Number(idx1)] = [];
    formData[key][Number(idx1)][Number(idx2)] = body[formKey] === 'y';
  }
  return formData;
};

const weight = {
  pengumpulanDataEfisiensi: [
    [0.2, 0.8],
    [0.3, 0.3, 0.4],
    [0.2, 0.3, 0.3, 0.2],
    [0.5, 0.5],
    [0.4, 0.6],
  ],
};

const calculateScores = (formData) => {
  const scores = {};
  for (let mlCat of Object.keys(formData)) {
    for (let [i, ival] of formData[mlCat].entries()) {
      for (let [j, jval] of ival.entries()) {
        if (weight[mlCat] && weight[mlCat][i] && weight[mlCat][i][j]) {
          if (!scores[mlCat]) {
            scores[mlCat] = jval * weight[mlCat][i][j];
          } else {
            scores[mlCat] += jval * weight[mlCat][i][j];
          }
        }
      }
    }
  }
};

router.post('/realisasi', isAuthenticated, async (req, res, next) => {
  const isAdmin = req.user.accountType === 'ADMIN';
  const units = await getUnitList(req.user);

  const formData = parseFormData(req.body);
  const scores = calculateScores(formData);
  console.log(formData);
  console.log(scores);
  const sumRealisasi = Object.values(scores).reduce((a, b) => a + b, 0);
  const averageRealisasi = (sumRealisasi / Object.values(scores).length) || 0;

  let ml = await MaturityLevel.findOne({ semester, tahun, upk });

  if (!ml) {
    ml = new MaturityLevel({
      semester,
      tahun,
      upk,
    });
  }

  ml.pengumpulanDataEfisiensi.realisasi = scores.pengumpulanDataEfisiensi;
  ml.perhitunganPerformanceTest.realisasi = scores.perhitunganPerformanceTest;
  ml.pemodelan.realisasi = scores.pemodelan;
  ml.heatRateAnalysis.realisasi = scores.heatRateAnalysis;
  ml.auxiliaryPowerAnalysis.realisasi = scores.auxiliaryPowerAnalysis;
  ml.rekomendasi.realisasi = scores.rekomendasi;
  ml.pelaporanEfisiensi.realisasi = scores.pelaporanEfisiensi;
  ml.monitoringPostProgram.realisasi = scores.monitoringPostProgram;
  ml.averageRealisasi = averageRealisasi;

  await ml.save();

  // TODO upload file

  return res.render('maturity-level/realisasi', {
    layout: 'dashboard',
    title: 'Maturity Level',
    isAdmin,
    units,
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
