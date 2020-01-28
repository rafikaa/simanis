const express = require('express');

const User = require('../db/User');
const NPHR = require('../db/NPHR');

const isAuthenticated = require('../middlewares/isAuthenticated');
const isAdminOrUnit = require('../middlewares/isAdminOrUnit');

const router = express.Router();

router.get('/', isAuthenticated, async (req, res, next) => {
  let dataPerUpk = [], dataTahunan = [];
  if (req.query['dataPerUpk.upk'] && req.query['dataPerUpk.bulanTahun']) {
    dataPerUpk = await getNphrForUpk(req.query['dataPerUpk.upk'], req.query['dataPerUpk.bulanTahun']);
  }
  if (req.query['dataTahunan.upk'] && req.query['dataTahunan.tahun']) {
    dataTahunan = await getYearlyNphr(req.query['dataTahunan.upk'], req.query['dataTahunan.tahun']);
  }
  // const topNphr = await getTopNphr();

  return res.render('nphr/index', {
    layout: 'dashboard',
    title: 'Data NPHR',
    success: req.flash('success'),
    query: {
      dataPerUpk: {
        upk: req.query['dataPerUpk.upk'],
        bulanTahun: req.query['dataPerUpk.bulanTahun'],
      },
      dataTahunan: {
        upk: req.query['dataTahunan.upk'],
        tahun: req.query['dataTahunan.tahun'],
      },
    },
    dataPerUpk,
    dataTahunan,
    // topNphr,
  });
});

const getNphrForUpk = async (upk, bulanTahun) => {
  try {
    const [bulan, tahun] = bulanTahun.split('-');
    return NPHR.find({ upk, bulan, tahun }).lean();
  } catch {
    return [];
  }
}

const getYearlyNphr = async (upk, tahun) => {
  const nphrList = await NPHR.find({ upk, tahun }).lean();
  const nphrByUlpl = {};
  for (let i = 0; i < nphrList.length; i++) {
    if (nphrByUlpl[nphrList[i].ulpl] === undefined) {
      nphrByUlpl[nphrList[i].ulpl] = {};
    }
    if (nphrByUlpl[nphrList[i].ulpl][nphrList[i].bulan] === undefined) {
      nphrByUlpl[nphrList[i].ulpl][nphrList[i].bulan] = nphrList[i].NPHR;
    } else {
      nphrByUlpl[nphrList[i].ulpl][nphrList[i].bulan] += nphrList[i].NPHR;
    }
  }

  const yearlyNphr = Object.keys(nphrByUlpl).map(ulpl => ({
    ulpl,
    jan: nphrByUlpl[ulpl]['1'],
    feb: nphrByUlpl[ulpl]['2'],
    mar: nphrByUlpl[ulpl]['3'],
    apr: nphrByUlpl[ulpl]['4'],
    may: nphrByUlpl[ulpl]['5'],
    jun: nphrByUlpl[ulpl]['6'],
    jul: nphrByUlpl[ulpl]['7'],
    aug: nphrByUlpl[ulpl]['8'],
    sep: nphrByUlpl[ulpl]['9'],
    oct: nphrByUlpl[ulpl]['10'],
    nov: nphrByUlpl[ulpl]['11'],
    des: nphrByUlpl[ulpl]['12'],
  }));

  return yearlyNphr;
}

const getTopNphr = async () => {
  const nphrList = await NPHR.find().lean();
  const nphrByUlpl = {}, totalPerYear = {};
  for (let i = 0; i < nphrList.length; i++) {
    if (nphrByUlpl[nphrList[i].ulpl] === undefined) {
      nphrByUlpl[nphrList[i].ulpl] = {};
    }
    if (nphrByUlpl[nphrList[i].ulpl][nphrList[i].tahun] === undefined) {
      nphrByUlpl[nphrList[i].ulpl][nphrList[i].tahun] = nphrList[i].NPHR;
    } else {
      nphrByUlpl[nphrList[i].ulpl][nphrList[i].tahun] += nphrList[i].NPHR;
    }
    if (totalPerYear[nphrList[i].tahun] === undefined) {
      totalPerYear[nphrList[i].tahun] = nphrList[i].NPHR;
    } else {
      totalPerYear[nphrList[i].tahun] += nphrList[i].NPHR;
    }
  }
  const nphr = Object.keys(nphrByUlpl).map(ulpl => ({
    ulpl,
    y2015: nphrByUlpl[ulpl]['2015'],
    y2016: nphrByUlpl[ulpl]['2016'],
    y2017: nphrByUlpl[ulpl]['2017'],
    y2018: nphrByUlpl[ulpl]['2018'],
    y2019: nphrByUlpl[ulpl]['2019'],
  }));

  nphr.push({
    ulpl: '<strong>TOTAL</strong>',
    y2015: `<strong>${totalPerYear['2015'] || 0}</strong>`,
    y2016: `<strong>${totalPerYear['2016'] || 0}</strong>`,
    y2017: `<strong>${totalPerYear['2017'] || 0}</strong>`,
    y2018: `<strong>${totalPerYear['2018'] || 0}</strong>`,
    y2019: `<strong>${totalPerYear['2019'] || 0}</strong>`,
  })

  return nphr;
};

router.get(
  '/create',
  isAuthenticated,
  isAdminOrUnit('/nphr'),
  async (req, res, next) => {
    let units = [];
    if (req.user.accountType === 'ADMIN') {
      units = await User.find({ accountType: 'UNIT' }, [
        'name',
        'username',
      ]).lean();
    } else if (req.user.accountType === 'UNIT') {
      units = [req.user];
    }

    return res.render('nphr/create', {
      layout: 'dashboard',
      title: 'Data NPHR',
      units,
    });
  }
);

router.post('/create', isAuthenticated, async (req, res, next) => {
  const {
    bulanTahun,
    upk,
    ulpl,
    jenisPembangkit,
    jenis,
    volume,
    kalorJenis,
    produksiNetto,
    targetNPHR,
  } = req.body;

  if (!isAdminOrRelatedUnit(req.user, upk)) {
    return res.redirect('/nphr');
  }

  const [bulan, tahun] = bulanTahun.split('-');

  let bahanBakar = [];
  let totalKalori = 0;
  for (let i = 0; i < jenis.length; i++) {
    if (jenisPembangkitMap[jenisPembangkit].includes(jenis[i])) {
      bahanBakar.push({
        jenis: jenis[i],
        volume: Number(volume[i]),
        kalorJenis: Number(kalorJenis[i]),
      });
      totalKalori += Number(volume[i]) * Number(kalorJenis[i]);
    }
  }

  const nphr = new NPHR({
    bulan,
    tahun,
    upk,
    ulpl,
    jenisPembangkit,
    bahanBakar,
    totalKalori,
    produksiNetto,
    targetNPHR,
    NPHR: Math.round(totalKalori / Number(produksiNetto)),
  });

  await nphr.save();

  req.flash('success', 'Data NPHR berhasil ditambahkan');

  const queryDataPerUpk = `dataPerUpk.bulanTahun=${bulanTahun}&dataPerUpk.upk=${upk}`
  return res.redirect(`/nphr?${queryDataPerUpk}`);
});

const jenisPembangkitMap = {
  PLTU: ['Batubara', 'HSD'],
  PLTG: ['Gas', 'HSD'],
  PLTMG: ['Gas', 'HSD'],
  PLTD: ['HSD'],
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

module.exports = router;
