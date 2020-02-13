const fs = require('fs');
const path = require('path');
const express = require('express');
const { Storage } = require('@google-cloud/storage');

const User = require('../db/User');
const MaturityLevel = require('../db/MaturityLevel');

const isAuthenticated = require('../middlewares/isAuthenticated');

const {
  getUpkNames,
} = require('../utils/data');

const router = express.Router();
const storage = new Storage();

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
    success: req.flash('success'),
    error: req.flash('error'),
    isAdmin,
    units,
  });
});

const parseFormData = (body) => {
  const formData = {};
  for (let formKey of Object.keys(body)) {
    if (formKey !== 'semester' && formKey !== 'tahun' && formKey !== 'upk') {
      const keys = formKey.replace(/]/g, '');
      const [key, idx1, idx2] = keys.split('[');
      if (!formData[key]) formData[key] = [];
      if (!formData[key][Number(idx1)]) formData[key][Number(idx1)] = [];
      formData[key][Number(idx1)][Number(idx2)] = body[formKey] === 'y';
    }
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
  perhitunganPerformanceTest: [
    [0.2, 0.8],
    [0.4, 0.6],
    [0.4, 0.6],
    [0.5, 0.5],
    [0.4, 0.6],
  ],
  pemodelan: [
    [0.7, 0.3],
    [0.4, 0.4, 0.2],
    [0.5, 0.5],
    [0.6, 0.4],
    [0.4, 0.6],
  ],
  heatRateAnalysis: [
    [0.3, 0.7],
    [0.5, 0.5],
    [0.7, 0.3],
    [0.6, 0.4],
    [0.6, 0.4],
  ],
  auxiliaryPowerAnalysis: [
    [0.3, 0.7],
    [0.5, 0.5],
    [0.3, 0.7],
    [0.6, 0.4],
    [0.5, 0.5],
  ],
  rekomendasi: [
    [0.3, 0.7],
    [0.4, 0.3, 0.3],
    [0.4, 0.3, 0.3],
    [0.25, 0.25, 0.25, 0.25],
    [0.15, 0.15, 0.3, 0.4],
  ],
  pelaporanEfisiensi: [
    [0.3, 0.7],
    [0.7, 0.3],
    [0.6, 0.4],
    [0.6, 0.4],
    [0.4, 0.6],
  ],
  monitoringPostProgram: [
    [0.3, 0.7],
    [0.2, 0.6, 0.2],
    [0.3, 0.7],
    [0.3, 0.7],
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
  return scores;
};

router.post('/realisasi', isAuthenticated, async (req, res, next) => {
  const { semester, tahun, upk } = req.body;

  let ml = await MaturityLevel.findOne({ semester, tahun, upk });

  if (!ml) {
    ml = new MaturityLevel({
      semester,
      tahun,
      upk,
    });
  }

  for (let fileKey of Object.keys(req.files)) {
    const file = req.files[fileKey];
    // No more than 100mb
    if (file.size > 100000000) {
      req.flash('error', `File "${file.name}" terlalu besar.`);
      return res.redirect('/maturity-level/realisasi');
    }

    const filename = `${Date.now()}-${file.name}`;
    const tempPath = path.resolve(`upload/${filename}`);
    const gsPath = `maturity-level/${filename}`;
    await file.mv(tempPath);
    await storage.bucket('simanis').upload(tempPath, {
      destination: gsPath,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    ml[fileKey].fileGsPath = gsPath;
    ml[fileKey].fileName = file.name;
  }

  const formData = parseFormData(req.body);
  const scores = calculateScores(formData);
  const sumRealisasi = Object.values(scores).reduce((a, b) => a + b, 0);
  const averageRealisasi = (sumRealisasi / Object.values(scores).length) || 0;

  ml.pengumpulanDataEfisiensi.realisasi = scores.pengumpulanDataEfisiensi;
  ml.pengumpulanDataEfisiensi.detailRealisasi = formData.pengumpulanDataEfisiensi;
  ml.perhitunganPerformanceTest.realisasi = scores.perhitunganPerformanceTest;
  ml.perhitunganPerformanceTest.detailRealisasi = formData.perhitunganPerformanceTest;
  ml.pemodelan.realisasi = scores.pemodelan;
  ml.pemodelan.detailRealisasi = formData.pemodelan;
  ml.heatRateAnalysis.realisasi = scores.heatRateAnalysis;
  ml.heatRateAnalysis.detailRealisasi = formData.heatRateAnalysis;
  ml.auxiliaryPowerAnalysis.realisasi = scores.auxiliaryPowerAnalysis;
  ml.auxiliaryPowerAnalysis.detailRealisasi = formData.auxiliaryPowerAnalysis;
  ml.rekomendasi.realisasi = scores.rekomendasi;
  ml.rekomendasi.detailRealisasi = formData.rekomendasi;
  ml.pelaporanEfisiensi.realisasi = scores.pelaporanEfisiensi;
  ml.pelaporanEfisiensi.detailRealisasi = formData.pelaporanEfisiensi;
  ml.monitoringPostProgram.realisasi = scores.monitoringPostProgram;
  ml.monitoringPostProgram.detailRealisasi = formData.monitoringPostProgram;
  ml.averageRealisasi = averageRealisasi;

  await ml.save();

  req.flash('success', 'Data Realisasi Maturity Level berhasil disimpan');
  const query = `semester=${semester}&tahun=${tahun}`;
  return res.redirect(`/maturity-level?${query}`);
});

router.get('/download', isAuthenticated, async (req, res, next) => {
  const { semester, tahun, upk, laporan } = req.query;
  const ml = await MaturityLevel.findOne({ semester, tahun, upk }).lean();

  if (ml[laporan].fileName && ml[laporan].fileGsPath) {
    const tempPath = path.resolve(`upload/${ml[laporan].fileName}`);

    await storage
      .bucket('simanis')
      .file(ml[laporan].fileGsPath)
      .download({
        destination: tempPath,
      });

    return res.download(`upload/${ml[laporan].fileName}`);
  }

  return res.status(404).send('Not found');
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

router.post('/:upk', isAuthenticated, async (req, res, next) => {
  const isAdmin = req.user.accountType === 'ADMIN';
  if (!isAdmin) {
    req.flash('error', 'Tidak mempunyai akses');
    return res.redirect('/maturity-level');
  }
  const { upk } = req.params;
  const { semester, tahun } = req.query;
  const ml = await MaturityLevel.findOne({ semester, tahun, upk });

  console.log(req.body)

  ml.pengumpulanDataEfisiensi.approved = getApprovalBool(req.body.pengumpulanDataEfisiensi.approval);
  ml.pengumpulanDataEfisiensi.catatan = req.body.pengumpulanDataEfisiensi.catatan;
  ml.perhitunganPerformanceTest.approved = getApprovalBool(req.body.perhitunganPerformanceTest.approval);
  ml.perhitunganPerformanceTest.catatan = req.body.perhitunganPerformanceTest.catatan;
  ml.pemodelan.approved = getApprovalBool(req.body.pemodelan.approval);
  ml.pemodelan.catatan = req.body.pemodelan.catatan;
  ml.heatRateAnalysis.approved = getApprovalBool(req.body.heatRateAnalysis.approval);
  ml.heatRateAnalysis.catatan = req.body.heatRateAnalysis.catatan;
  ml.auxiliaryPowerAnalysis.approved = getApprovalBool(req.body.auxiliaryPowerAnalysis.approval);
  ml.auxiliaryPowerAnalysis.catatan = req.body.auxiliaryPowerAnalysis.catatan;
  ml.rekomendasi.approved = getApprovalBool(req.body.rekomendasi.approval);
  ml.rekomendasi.catatan = req.body.rekomendasi.catatan;
  ml.pelaporanEfisiensi.approved = getApprovalBool(req.body.pelaporanEfisiensi.approval);
  ml.pelaporanEfisiensi.catatan = req.body.pelaporanEfisiensi.catatan;
  ml.monitoringPostProgram.approved = getApprovalBool(req.body.monitoringPostProgram.approval);
  ml.monitoringPostProgram.catatan = req.body.monitoringPostProgram.catatan;

  await ml.save();

  req.flash('success', 'Status dan catatan Maturity Level berhasil disimpan');

  const query = `semester=${semester}&tahun=${tahun}`;
  return res.redirect(`/maturity-level/${upk}?${query}`);
});

const getApprovalBool = (approval) => approval === 'Approved' ? true : approval === 'Rejected' ? false : undefined;

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
