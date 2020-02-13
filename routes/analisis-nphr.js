const express = require('express');

const User = require('../db/User');
const NPHRAnalysis = require('../db/NPHRAnalysis');

const isAuthenticated = require('../middlewares/isAuthenticated');

const { getRandomRgbColor, round } = require('../utils');
const { nphrParamNames: paramNames } = require('../utils/strings');
const { getUnitList } = require('../utils/data');

const router = express.Router();

router.get('/', isAuthenticated, async (req, res, next) => {
  const ulplList = await getUlplList();
  const bulanTahun = req.query['dataAnalisis.bulanTahun'];
  const upk = req.query['dataAnalisis.upk'];
  const ulpl = req.query['dataAnalisis.ulpl'];
  const query = {
    dataAnalisis: {
      bulanTahun,
      upk,
      ulpl,
    },
  };

  let parameters = [],
    waterfall = { labels: [], values: [] },
    pareto = { labels: [], barValues: [], lineValues: [] },
    warningMsg = '',
    infoMsg = '';
  if (bulanTahun && upk && ulpl) {
    const [bulan, tahun] = bulanTahun.split('-');
    const nphrAnalysis = await NPHRAnalysis.findOne({
      upk,
      ulpl,
      bulan,
      tahun,
    }).lean();
    if (nphrAnalysis) {
      parameters = nphrAnalysis.parameters;
    } else {
      warningMsg = 'Tidak ada data untuk periode / UPK / ULPL yang dipilih.';
    }
    waterfall = await getWaterfallChart(nphrAnalysis);
    pareto = await getParetoChart(nphrAnalysis);
  } else {
    infoMsg =
      'Silakan pilih periode, UPK, dan ULPL di atas untuk melihat data.';
  }

  return res.render('analisis-nphr/index', {
    layout: 'dashboard',
    title: 'Analisis NPHR',
    success: req.flash('success'),
    infoMsg,
    warningMsg,
    paramNames,
    ulplList,
    query,
    parameters,
    waterfall,
    pareto,
  });
});

const getWaterfallChart = async nphrAnalysis => {
  const labels = [],
    values = [];

  if (nphrAnalysis) {
    nphrAnalysis.parameters.forEach((param, i) => {
      if (param.name === 'nettPlantHeatRate') {
        values[0] = round(param.actual, 4);
        values[nphrAnalysis.parameters.length] = round(param.baseline, 4);
        labels[0] = 'Heat Rate Actual';
        labels[nphrAnalysis.parameters.length] = 'Heat Rate Reference';
      } else {
        labels[i] = paramNames[param.name];
        values[i] = round(param.heatRate, 4);
      }
    });
  }

  return { labels, values };
};

const getParetoChart = async nphrAnalysis => {
  const labels = [],
    barValues = [],
    lineValues = [];

  const sortDesc = (param1, param2) => param2.heatRate - param1.heatRate;

  if (nphrAnalysis) {
    const maxLabels = nphrAnalysis.jenisPembangkit === 'pltg' ? 5 : 10;
    const params = JSON.parse(JSON.stringify(nphrAnalysis.parameters));
    const sortedParams = params.sort(sortDesc).slice(0, maxLabels);

    let sumOfPositiveHeatRate = 0;
    for (let { name, heatRate } of sortedParams) {
      if (name === 'nettPlantHeatRate') continue;
      if (heatRate <= 0) break;
      labels.push(paramNames[name]);
      barValues.push(round(heatRate, 4));
      sumOfPositiveHeatRate += heatRate;
    }
    let tempSum = 0;
    for (let { name, heatRate } of sortedParams) {
      if (name === 'nettPlantHeatRate') continue;
      if (heatRate <= 0) break;
      tempSum += heatRate;
      const percentage = (tempSum / sumOfPositiveHeatRate) * 100;
      lineValues.push(round(percentage, 4));
    }
  }

  return { labels, barValues, lineValues };
};

router.get('/create', isAuthenticated, async (req, res, next) => {
  const units = await getUnitList(req.user);

  return res.render('analisis-nphr/create', {
    layout: 'dashboard',
    title: 'Input Data Analisis NPHR',
    paramNames,
    units,
  });
});

router.post('/create', isAuthenticated, async (req, res, next) => {
  const { bulanTahun, upk, ulpl, jenisPembangkit } = req.body;

  if (!isAdminOrRelatedUnit(req.user, upk)) {
    return res.redirect('/analisis-nphr');
  }

  const [bulan, tahun] = bulanTahun.split('-');

  if (jenisPembangkit != 'pltg' && jenisPembangkit != 'pltu') {
    return res.redirect('/analisis-nphr');
  }
  const dataPembangkit = req.body[jenisPembangkit];
  const harga = Number(dataPembangkit.harga);
  const kalorJenis = Number(dataPembangkit.kalorJenis);
  const rerataProduksiHarian = Number(dataPembangkit.rerataProduksiHarian);

  let nettPlantHeatRate = {
    baseline: 0,
    actual: 0,
    heatRate: 0,
  };

  const parameters = [];
  let sumHeatRate = 0;
  for (let i = 0; i < dataPembangkit.parameters.name.length; i++) {
    const name = dataPembangkit.parameters.name[i];
    const baseline = Number(dataPembangkit.parameters.baseline[i] || 0);
    const actual = Number(dataPembangkit.parameters.actual[i] || 0);
    if (name === 'nettPlantHeatRate') {
      const heatRate = actual - baseline;
      const costBenefit = calcCostBenefit(
        harga,
        kalorJenis,
        heatRate,
        rerataProduksiHarian
      );
      nettPlantHeatRate = {
        baseline,
        actual,
        heatRate,
      };
      parameters.push({
        name,
        baseline,
        actual,
        heatRate,
        costBenefit,
      });
    } else {
      const heatRate = calcHeatRate(
        jenisPembangkit,
        nettPlantHeatRate,
        name,
        baseline,
        actual
      );
      sumHeatRate += heatRate > 0 ? heatRate : 0;
      const costBenefit = calcCostBenefit(
        harga,
        kalorJenis,
        heatRate,
        rerataProduksiHarian
      );
      parameters.push({
        name,
        baseline,
        actual,
        heatRate,
        costBenefit,
      });
    }
  }
  parameters.push({
    name: 'otherLosses',
    heatRate: nettPlantHeatRate.heatRate - sumHeatRate,
    costBenefit: calcCostBenefit(
      harga,
      kalorJenis,
      nettPlantHeatRate.heatRate - sumHeatRate,
      rerataProduksiHarian
    ),
  });

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

const calcCostBenefit = (harga, kalorJenis, heatRate, rerataProduksiHarian) => {
  const rupiahPerCal = harga / kalorJenis;
  return (heatRate * rupiahPerCal * rerataProduksiHarian) / 1000000;
};

const calcHeatRate = (
  jenisPembangkit,
  nettPlantHeatRate,
  paramName,
  baseline,
  actual
) => {
  if (jenisPembangkit === 'pltg') {
    const deviasiByHeatRateFactor = calcDeviasiByHeatRateFactorPltg(
      paramName,
      baseline,
      actual
    );
    return (deviasiByHeatRateFactor * nettPlantHeatRate.heatRate) / 100;
  } else if (jenisPembangkit === 'pltu') {
    const deviasiByHeatRateFactor = calcDeviasiByHeatRateFactorPltu(
      paramName,
      baseline,
      actual
    );
    const nettPlantHeatRateDeviasiPercent =
      ((nettPlantHeatRate.actual - nettPlantHeatRate.baseline) /
        nettPlantHeatRate.baseline) *
      100;
    return (
      (deviasiByHeatRateFactor * nettPlantHeatRate.heatRate) /
      nettPlantHeatRateDeviasiPercent
    );
  } else {
    return 0;
  }
};

const calcDeviasiByHeatRateFactorPltg = (paramName, baseline, actual) => {
  const deviasiPercent = ((actual - baseline) / baseline) * 100;
  switch (paramName) {
    case 'gtgPlantEfficiency':
      return -2.118 * deviasiPercent;
    case 'compressorEfficiency':
      return -1.6 * deviasiPercent;
    case 'airInletTemperature':
      return 0.033 * deviasiPercent;
    case 'airInletDpFilter':
      return 0.0011 * deviasiPercent;
    case 'exhaustTemperature':
      return (
        0.0144 * Math.pow(deviasiPercent, 2) - 0.2249 * deviasiPercent - 5.1361
      );
    case 'compressorDischPressure':
      return (
        0.0076 * Math.pow(deviasiPercent, 3) +
        0.0448 * Math.pow(deviasiPercent, 2) -
        1.4125 * deviasiPercent -
        1.9247
      );
    case 'compressorDischTemperature':
      return (
        -0.1267 * Math.pow(deviasiPercent, 3) -
        1.0638 * Math.pow(deviasiPercent, 2) -
        3.6701 * deviasiPercent -
        6.1338
      );
    default:
      return 0;
  }
};

const calcDeviasiByHeatRateFactorPltu = (paramName, baseline, actual) => {
  const deviasi = actual - baseline;
  switch (paramName) {
    case 'flueGasTempOutAH':
      return (deviasi * 0.35) / 5.55;
    case 'gasOutletAH':
      return (deviasi * 0.29) / 1.43;
    case 'mainSteamTemp':
      return (deviasi * -0.15) / 5.55;
    case 'hotReheatTemperature':
      return (deviasi * -0.14) / 5.55;
    case 'mainSteamPress':
      return (deviasi * -0.04) / 0.07;
    case 'shSprayFlow':
      return (deviasi * 0.025) / 1;
    case 'reheatSprayFlow':
      return (deviasi * 0.2) / 1;
    case 'vacuumCondenser':
      return (deviasi * 0.082) / 0.13;
    case 'auxPower':
      return (deviasi * 1) / 1;
    case 'finalFeedWaterTemp':
      return (deviasi * -0.1) / 2.77;
    case 'unburnedCarbon':
      return (deviasi * 1) / 1;
    case 'hpTurbineEfficiency':
      return (deviasi * -0.18) / 1;
    case 'ipTurbineEfficiency':
      return (deviasi * -0.17) / 1;
    case 'lpTurbineEfficiency':
      return (deviasi * -0.45) / 1;
    case 'bfpEfficiency':
      return (deviasi * -0.02) / 1;
    case 'ttdHph1':
      return (deviasi * 0.1) / 2.77;
    case 'ttdHph2':
      return (deviasi * 0.3) / 2.77;
    case 'ttdHph3':
      return (deviasi * 0.3) / 2.77;
    case 'ttdLph5':
      return (deviasi * 0.3) / 2.77;
    case 'ttdLph6':
      return (deviasi * 0.3) / 2.77;
    case 'ttdLph7':
      return (deviasi * 0.3) / 2.77;
    case 'moistureInCoal':
      return (deviasi * 0.17) / 1;
    case 'hydrogenInCoal':
      return (deviasi * 1.2) / 1;
    case 'airHeaterLeakage':
      return (deviasi * 0.5) / 1;
    case 'airHeaterEffectiveness':
      return (deviasi * -0.15) / 1;
    case 'fdFanAirInletTemp':
      return (deviasi * -0.05) / 5.55;
    case 'millOutAirTemperature':
      return (deviasi * -0.04) / 5.55;
    case 'makeUpWater':
      return (deviasi * 0.4) / 2.2;
    default:
      return 0;
  }
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

const getUlplList = async () => {
  return NPHRAnalysis.find().distinct('ulpl');
};

module.exports = router;
