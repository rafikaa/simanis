const express = require('express');

const User = require('../db/User');
const NPHRAnalysis = require('../db/NPHRAnalysis');

const isAuthenticated = require('../middlewares/isAuthenticated');
const isAdminOrUnit = require('../middlewares/isAdminOrUnit');

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

  let parameters = []
  if (bulanTahun && upk && ulpl) {
    const [bulan, tahun] = bulanTahun.split('-');
    const nphrAnalysis = await NPHRAnalysis.findOne({ bulan, tahun, upk, ulpl }).lean();
    if (nphrAnalysis) { 
      parameters = nphrAnalysis.parameters;
    }

    console.log(parameters)
  }

  return res.render('analisis-nphr/index', {
    layout: 'dashboard',
    title: 'Analisis NPHR',
    ulplList,
    query,
    parameters,
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

    let nettPlantHeatRate = {
      baseline: 0,
      actual: 0,
    };

    for (let i = 0; i < dataPembangkit.parameters.name.length; i++) {
      const name = dataPembangkit.parameters.name[i];
      const baseline = Number(dataPembangkit.parameters.baseline[i]);
      const actual = Number(dataPembangkit.parameters.actual[i]);
      if (name === 'nettPlantHeatRate') {
        const heatRate = actual - baseline;
        const costBenefit = calcCostBenefit(harga, kalorJenis, heatRate, rerataProduksiHarian);
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
        const costBenefit = calcCostBenefit(harga, kalorJenis, heatRate, rerataProduksiHarian);
        parameters.push({
          name,
          baseline,
          actual,
          heatRate,
          costBenefit,
        });
      }
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

const calcCostBenefit = (harga, kalorJenis, heatRate, rerataProduksiHarian) => {
  const rupiahPerCal = harga / kalorJenis;
  return (heatRate * rupiahPerCal * rerataProduksiHarian) / 1000000;
}

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
