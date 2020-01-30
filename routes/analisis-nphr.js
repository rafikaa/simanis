const express = require('express');

const User = require('../db/User');
const NPHRAnalysis = require('../db/NPHRAnalysis');

const isAuthenticated = require('../middlewares/isAuthenticated');
const isAdminOrUnit = require('../middlewares/isAdminOrUnit');

const router = express.Router();

router.get('/', isAuthenticated, async (req, res, next) => {
  const ulplList = await getUlplList();
  const query = {
    dataAnalisis: {
      bulanTahun: req.query['dataAnalisis.bulanTahun'],
      upk: req.query['dataAnalisis.upk'],
      ulpl: req.query['dataAnalisis.ulpl'],
    },
  };

  return res.render('analisis-nphr/index', {
    layout: 'dashboard',
    title: 'Analisis NPHR',
    ulplList,
    query,
  });
});

router.get('/create', isAuthenticated, async (req, res, next) => {
  let units = [];
  if (req.user.accountType === 'ADMIN') {
    units = await User.find({ accountType: 'UNIT' }, [
      'name',
      'username',
    ]).lean();
  } else if (req.user.accountType === 'UNIT') {
    units = [req.user];
  }

  return res.render('analisis-nphr/create', {
    layout: 'dashboard',
    title: 'Data Analisis NPHR',
    units,
  });
});

router.post('/create', isAuthenticated, async (req, res, next) => {
  const { bulanTahun, upk, ulpl, jenisPembangkit } = req.body;

  if (!isAdminOrRelatedUnit(req.user, upk)) {
    return res.redirect('/analisis-nphr');
  }

  const [bulan, tahun] = bulanTahun.split('-');
  const parameters = [];
  let harga = 0,
    kalorJenis = 0,
    rerataProduksiHarian = 0;

  if (jenisPembangkit === 'pltg' || jenisPembangkit === 'pltu') {
    const dataPembangkit = req.body[jenisPembangkit];
    harga = Number(dataPembangkit.harga);
    kalorJenis = Number(dataPembangkit.kalorJenis);
    rerataProduksiHarian = Number(dataPembangkit.rerataProduksiHarian);

    for (let i = 0; i < dataPembangkit.parameters.name.length; i++) {
      parameters.push({
        name: dataPembangkit.parameters.name[i],
        baseline: Number(dataPembangkit.parameters.baseline[i]),
        actual: Number(dataPembangkit.parameters.actual[i]),
        deviasiHeatRate: 0, // TODO
        costBenefit: 0, // TODO
      });
    }
  } else {
    return res.redirect('/analisis-nphr');
  }
  const nphrAnalysis = new NPHRAnalysis({
    bulan,
    tahun,
    upk,
    ulpl,
    jenisPembangkit,
    parameters,
    harga,
    kalorJenis,
    rerataProduksiHarian,
  });

  await nphrAnalysis.save();

  req.flash('success', 'Data Analisis NPHR berhasil ditambahkan');

  const queryAnalysisNPHR = `dataAnalisis.bulanTahun=${bulanTahun}&dataAnalisis.upk=${upk}&dataAnalisis.ulpl=${ulpl}`;

  return res.redirect(`/analisis-nphr?${queryAnalysisNPHR}`);
});

const isAdminOrRelatedUnit = (user, unit) => {
  if (
    user.accountType === 'ADMIN' ||
    (user.accountType === 'UNIT' && user.username === unit)
  ) {
    return true;
  }
  return false;
};

const getUlplList = async () => {
  return NPHRAnalysis.find().distinct('ulpl');
};

module.exports = router;
