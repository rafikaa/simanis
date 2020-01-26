const express = require('express');

const User = require('../db/User');
const NPHR = require('../db/NPHR');

const isAuthenticated = require('../middlewares/isAuthenticated');
const isAdminOrUnit = require('../middlewares/isAdminOrUnit');

const router = express.Router();

router.get('/', isAuthenticated, async (req, res, next) => {
  const dataPerUpk = await getNphrForUpk(req.query['dataPerUpk.upk'], req.query['dataPerUpk.bulanTahun']);
  return res.render('nphr/index', {
    layout: 'dashboard',
    success: req.flash('success'),
    dataPerUpk,
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
