const express = require('express');

const User = require('../db/User');
const OwnUsage = require('../db/OwnUsage');

const onlyAuthenticated = require('../middlewares/onlyAuthenticated');

const { isAdminOrUnit, isAdminOrRelatedUnit, round } = require('../utils');
const { pembangkitNames } = require('../utils/strings');
const { getUnitList, getUpkNames } = require('../utils/data');

const router = express.Router();

const bulanNames = [
  undefined,
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

const getRandomColor = () => {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  color = 'rgba(' + r + ', ' + g + ', ' + b + ', 0.6)';
  return color;
};

router.get('/', onlyAuthenticated, async (req, res, next) => {
  const tahun = req.query.tahun;
  const query = { tahun };

  let psPerUpk = [],
    psPerPembangkit = [],
    chartPerUpk = { labels: [], values: [], colors: [] },
    chartPerPembangkit = { labels: [], values: [], colors: [] },
    infoMsg = '',
    warningMsg = '';
  if (tahun) {
    const upkNames = await getUpkNames();
    const ownUsages = await OwnUsage.find({ tahun });
    if (ownUsages.length > 0) {
      psPerUpk = getPsPerUpk(ownUsages, upkNames);
      chartPerUpk = getChartPerUpk(ownUsages, upkNames);
      psPerPembangkit = getPsPerPembangkit(ownUsages);
      chartPerPembangkit = getChartPerPembangkit(ownUsages);
    } else {
      warningMsg = 'Tidak ada data untuk periode / UPK / ULPL yang dipilih.';
    }
  } else {
    infoMsg = 'Silakan pilih tahun di atas untuk melihat data.';
  }

  return res.render('pemakaian-sendiri/index', {
    layout: 'dashboard',
    title: 'Pemakaian Sendiri',
    success: req.flash('success'),
    isAdminOrUnit: isAdminOrUnit(req.user),
    infoMsg,
    warningMsg,
    query,
    psPerUpk,
    psPerPembangkit,
    chartPerUpk,
    chartPerPembangkit,
  });
});

const getPsPerUpk = (ownUsages, upkNames) => {
  const psPerUpk = {};
  for (let { upk, bulan, pemakaianSendiri } of ownUsages) {
    if (!psPerUpk[upk]) psPerUpk[upk] = { name: upkNames[upk] };
    if (!psPerUpk[upk][bulanNames[bulan]]) {
      psPerUpk[upk][bulanNames[bulan]] = pemakaianSendiri;
    } else {
      psPerUpk[upk][bulanNames[bulan]] += pemakaianSendiri;
    }
  }
  return Object.values(psPerUpk);
};

const getChartPerUpk = (ownUsages, upkNames) => {
  const labels = [],
    values = [],
    colors = [],
    valuePerUpk = {};
  let sum = 0;

  for (let { upk, pemakaianSendiri } of ownUsages) {
    sum += pemakaianSendiri;
    if (!valuePerUpk[upk]) {
      valuePerUpk[upk] = pemakaianSendiri;
    } else {
      valuePerUpk[upk] += pemakaianSendiri;
    }
  }
  for (upk of Object.keys(valuePerUpk)) {
    labels.push(upkNames[upk]);
    colors.push(getRandomColor());
    values.push(round((valuePerUpk[upk] / sum) * 100, 2));
  }
  return { labels, values };
};

const getPsPerPembangkit = ownUsages => {
  const psPerPembangkit = {};
  for (let {
    jenisPembangkit: pembangkit,
    bulan,
    pemakaianSendiri,
  } of ownUsages) {
    if (!psPerPembangkit[pembangkit])
      psPerPembangkit[pembangkit] = {
        name: pembangkitNames[pembangkit],
      };
    if (!psPerPembangkit[pembangkit][bulanNames[bulan]]) {
      psPerPembangkit[pembangkit][bulanNames[bulan]] = pemakaianSendiri;
    } else {
      psPerPembangkit[pembangkit][bulanNames[bulan]] += pemakaianSendiri;
    }
  }
  return Object.values(psPerPembangkit);
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
    colors.push(getRandomColor());
    values.push(round((valuePerPembangkit[upk] / sum) * 100, 2));
  }
  return { labels, values, colors };
};

router.get('/create', onlyAuthenticated, async (req, res, next) => {
  const units = await getUnitList(req.user);

  return res.render('pemakaian-sendiri/create', {
    layout: 'dashboard',
    title: 'Input Data Pemakaian Sendiri',
    units,
  });
});

router.post('/create', onlyAuthenticated, async (req, res, next) => {
  const {
    bulanTahun,
    upk,
    ulpl,
    jenisPembangkit,
    produksiBruto,
    pemakaianSendiri,
  } = req.body;

  if (!isAdminOrRelatedUnit(req.user, upk)) {
    return res.redirect('/pemakaian-sendiri');
  }

  const [bulan, tahun] = bulanTahun.split('-');

  const ownUsage = new OwnUsage({
    bulan,
    tahun,
    upk,
    ulpl,
    jenisPembangkit,
    produksiBruto,
    pemakaianSendiri,
  });

  await ownUsage.save();

  req.flash('success', 'Data Pemakaian Sendiri berhasil ditambahkan');

  const queryString = `tahun=${tahun}`;

  return res.redirect(`/pemakaian-sendiri?${queryString}`);
});

module.exports = router;
