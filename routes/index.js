const express = require('express');

const UnitData = require('../db/UnitData');
const OwnUsage = require('../db/OwnUsage');
const NPHR = require('../db/NPHR');
const MaturityLevel = require('../db/MaturityLevel');

const onlyAuthenticated = require('../middlewares/onlyAuthenticated');

const { getRandomRgbColor, round } = require('../utils');
const { pembangkitNames } = require('../utils/strings');
const { getUpkNames } = require('../utils/data');

const router = express.Router();

router.get(/.*e23a7dcaefbde4e74e263247aa42ecd7.ttf$/, (req, res, next) => {
  return res.send('');
});
router.get(/.*a1ecc3b826d01251edddf29c3e4e1e97.woff$/, (req, res, next) => {
  return res.send('');
});

const getAllUnitData = async () => {
  const upkNames = await getUpkNames();
  let unitData = await UnitData.find({})
    .sort({ createdAt: -1 })
    .lean();
  unitData = unitData.map(u => ({ ...u, upkName: upkNames[u.upk] }));
  return unitData;
};

const getChartPerPembangkit = ownUsages => {
  const labels = [],
    values = [],
    colors = [],
    valuePerPembangkit = {};
  let sum = 0;
  for (let { jenisPembangkit: pembangkit, pemakaianSendiri } of ownUsages) {
    sum += pemakaianSendiri;
    if (!valuePerPembangkit[pembangkit]) {
      valuePerPembangkit[pembangkit] = pemakaianSendiri;
    } else {
      valuePerPembangkit[pembangkit] += pemakaianSendiri;
    }
  }
  for (upk of Object.keys(valuePerPembangkit)) {
    labels.push(pembangkitNames[upk]);
    colors.push(getRandomRgbColor());
    values.push(round((valuePerPembangkit[upk] / sum) * 100, 2));
  }
  return { labels, values, colors };
};

const getChartOwnUsage = async () => {
  const latestOwnUsage = await OwnUsage.findOne({}, ['tahun']).sort({
    tahun: -1,
  });
  if (!latestOwnUsage) return [];
  const { tahun } = latestOwnUsage;
  const ownUsages = await OwnUsage.find({ tahun }).lean();
  const chartOwnUsage = getChartPerPembangkit(ownUsages);
  return chartOwnUsage;
};

const getTopNphrContributors = async tahun => {
  const nphrs = await NPHR.find({ tahun }).lean();
  const nphrPerUlpl = {};
  for (let nphr of nphrs) {
    if (!nphrPerUlpl[nphr.ulpl]) nphrPerUlpl[nphr.ulpl] = nphr.NPHR;
    else nphrPerUlpl[nphr.ulpl] += nphr.NPHR;
  }
  const nphrPerUlplArray = Object.keys(nphrPerUlpl).map(ulpl => ({
    ulpl,
    nphr: nphrPerUlpl[ulpl],
  }));
  const sortDesc = (param1, param2) => param2.nphr - param1.nphr;
  return nphrPerUlplArray.sort(sortDesc).slice(0, 10);
};

const getMaturityLevel = async () => {
  const latestMaturityLevel = await MaturityLevel.findOne({}, [
    'bulan',
    'tahun',
  ])
    .sort({ tahun: -1, bulan: -1 })
    .lean();
  if (!latestMaturityLevel) return [];
  const { bulan, tahun } = latestMaturityLevel;
  let maturityLevelArray = await MaturityLevel.find({ bulan, tahun }).lean();
  const maturityLevel = {};
  for (let ml of maturityLevelArray) {
    maturityLevel[ml.upk] = {
      target: ml.averageTarget,
      realisasi: ml.averageRealisasi,
    };
  }
  return maturityLevel;
};

router.get('/', onlyAuthenticated, async (req, res, next) => {
  const { tahun } = req.query;
  const year = tahun ? Number(tahun) : new Date().getFullYear();

  const unitData = await getAllUnitData();
  const chartOwnUsage = await getChartOwnUsage();
  const topNphrContributors = await getTopNphrContributors(year);
  const maturityLevel = await getMaturityLevel();

  return res.render('index', {
    layout: 'dashboard',
    title: 'SIMANIS',
    unitData,
    chartOwnUsage,
    topNphrContributors,
    maturityLevel,
    query: { tahun },
  });
});

router.get('/404', function (req, res, next) {
  res.render('404', { title: 'Error' });
});

router.get('/500', function (req, res, next) {
  res.render('500', { title: 'Error' });
});

module.exports = router;
