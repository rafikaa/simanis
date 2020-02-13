const express = require('express');

const User = require('../db/User');
const NPHR = require('../db/NPHR');

const isAuthenticated = require('../middlewares/isAuthenticated');
const isAdminOrUnit = require('../middlewares/isAdminOrUnit');

const { isAdminOrRelatedUnit } = require('../utils');
const { getUnitList } = require('../utils/data');

const router = express.Router();

router.get('/', isAuthenticated, async (req, res, next) => {
  let dataPerUpk = [],
    dataTahunan = [],
    ulplChart = { target: '[]', realisasi: '[]' };
  if (req.query['dataPerUpk.upk'] && req.query['dataPerUpk.bulanTahun']) {
    dataPerUpk = await getNphrForUpk(
      req.query['dataPerUpk.upk'],
      req.query['dataPerUpk.bulanTahun']
    );
  }
  if (req.query['dataTahunan.upk'] && req.query['dataTahunan.tahun']) {
    dataTahunan = await getYearlyNphr(
      req.query['dataTahunan.upk'],
      req.query['dataTahunan.tahun']
    );
  }
  if (req.query['visualisasi.ulpl'] && req.query['visualisasi.tahun']) {
    ulplChart = await getUlplChart(
      req.query['visualisasi.ulpl'],
      req.query['visualisasi.tahun']
    );
  }
  const ulplList = await getUlplList();

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
      visualisasi: {
        ulpl: req.query['visualisasi.ulpl'],
        tahun: req.query['visualisasi.tahun'],
      },
    },
    dataPerUpk,
    dataTahunan,
    ulplList,
    ulplChart,
  });
});

const getNphrForUpk = async (upk, bulanTahun) => {
  try {
    const [bulan, tahun] = bulanTahun.split('-');
    return NPHR.find({ upk, bulan, tahun }).lean();
  } catch {
    return [];
  }
};

const getYearlyNphr = async (upk, tahun) => {
  const nphrList = await NPHR.find({ upk, tahun }).lean();
  const nphrByUlpl = {};
  for (let i = 0; i < nphrList.length; i++) {
    if (nphrByUlpl[nphrList[i].ulpl] === undefined) {
      nphrByUlpl[nphrList[i].ulpl] = {};
    }
    if (nphrByUlpl[nphrList[i].ulpl][nphrList[i].bulan] === undefined) {
      nphrByUlpl[nphrList[i].ulpl][nphrList[i].bulan] = {};
    }
    if (
      nphrByUlpl[nphrList[i].ulpl][nphrList[i].bulan].totalKalori === undefined
    ) {
      nphrByUlpl[nphrList[i].ulpl][nphrList[i].bulan].totalKalori =
        nphrList[i].totalKalori;
      nphrByUlpl[nphrList[i].ulpl][nphrList[i].bulan].produksiNetto =
        nphrList[i].produksiNetto;
    } else {
      nphrByUlpl[nphrList[i].ulpl][nphrList[i].bulan].totalKalori +=
        nphrList[i].totalKalori;
      nphrByUlpl[nphrList[i].ulpl][nphrList[i].bulan].produksiNetto +=
        nphrList[i].produksiNetto;
    }
  }

  const calculateNphr = (ulpl, bulan) => {
    if (
      !nphrByUlpl[ulpl][bulan] ||
      !nphrByUlpl[ulpl][bulan].totalKalori ||
      !nphrByUlpl[ulpl][bulan].produksiNetto
    ) {
      return 0;
    }
    return (
      nphrByUlpl[ulpl][bulan].totalKalori /
      nphrByUlpl[ulpl][bulan].produksiNetto
    ).toFixed(2);
  };

  const yearlyNphr = Object.keys(nphrByUlpl).map(ulpl => ({
    ulpl,
    jan: calculateNphr(ulpl, ['1']),
    feb: calculateNphr(ulpl, ['2']),
    mar: calculateNphr(ulpl, ['3']),
    apr: calculateNphr(ulpl, ['4']),
    may: calculateNphr(ulpl, ['5']),
    jun: calculateNphr(ulpl, ['6']),
    jul: calculateNphr(ulpl, ['7']),
    aug: calculateNphr(ulpl, ['8']),
    sep: calculateNphr(ulpl, ['9']),
    oct: calculateNphr(ulpl, ['10']),
    nov: calculateNphr(ulpl, ['11']),
    des: calculateNphr(ulpl, ['12']),
  }));

  return yearlyNphr;
};

const getUlplList = async () => {
  return NPHR.find().distinct('ulpl');
};

const getUlplChart = async (ulpl, tahun) => {
  const nphrList = await NPHR.find({ ulpl, tahun });
  let target = [],
    realisasi = [];
  for (let i = 0; i < nphrList.length; i++) {
    const index = Number(nphrList[i].bulan) - 1;
    if (target[index] === undefined) {
      target[index] = nphrList[i].targetNPHR;
    } else {
      target[index] += nphrList[i].targetNPHR;
    }
    if (realisasi[index] === undefined) {
      realisasi[index] = nphrList[i].NPHR;
    } else {
      realisasi[index] += nphrList[i].NPHR;
    }
  }

  target = JSON.stringify(target.map(t => t || 0));
  realisasi = JSON.stringify(realisasi.map(r => r || 0));

  return { target, realisasi };
};

router.get(
  '/create',
  isAuthenticated,
  isAdminOrUnit('/nphr'),
  async (req, res, next) => {
    const units = await getUnitList(req.user);

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

  const queryDataPerUpk = `dataPerUpk.bulanTahun=${bulanTahun}&dataPerUpk.upk=${upk}`;
  const queryDataTahunan = `dataTahunan.tahun=${tahun}&dataTahunan.upk=${upk}`;
  const queryVisualisasi = `visualisasi.tahun=${tahun}&visualisasi.ulpl=${ulpl}`;
  return res.redirect(
    `/nphr?${queryDataPerUpk}&${queryDataTahunan}&${queryVisualisasi}`
  );
});

const jenisPembangkitMap = {
  PLTU: ['Batubara', 'HSD'],
  PLTG: ['Gas', 'HSD'],
  PLTMG: ['Gas', 'HSD'],
  PLTD: ['HSD'],
};

module.exports = router;
