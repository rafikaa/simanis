const express = require('express');

const User = require('../db/User');

const isAuthenticated = require('../middlewares/isAuthenticated');
const isAdminOrUnit = require('../middlewares/isAdminOrUnit');

const router = express.Router();

router.get('/', isAuthenticated, (req, res, next) => {
  res.render('data-unit/home', { title: 'Data Unit' });
});

router.get('/:unit([a-zA-Z0-9\-]+)', isAuthenticated, async (req, res, next) => {
  const {
    username,
    accountType,
  } = req.user;
  
  const unit = await User.findOne({ username: req.params.unit });

  if (!unit) {
    return res.redirect('/data-unit');
  }

  let hasUpdatePermission = false;
  if (unit && (accountType === 'ADMIN' || (accountType === 'UNIT' && username === req.params.unit))) {
    hasUpdatePermission = true;
  }

  res.render('data-unit/detail', {
    title: `Data Unit ${unit.name}`, 
    unit: {
      name: unit.name,
      username: unit.username,
    },
    hasUpdatePermission,
  });
});

router.get('/:username/create', isAuthenticated, isAdminOrUnit, function(req, res, next) {
  res.render('data-unit/input', { title: 'Data Unit' });
});

router.get('/data-nphr', function(req, res, next) {
  res.render('data-nphr', { title: 'Data NPHR' });
});

router.get('/input-data-nphr', function(req, res, next) {
  res.render('input-data-nphr', { title: 'Data NPHR' });
});

router.get('/analisa-nphr', function(req, res, next) {
  res.render('analisa-nphr', { title: 'Analisa NPHR' });
});

router.get('/input-data-analisa-nphr', function(req, res, next) {
  res.render('input-data-analisa-nphr', { title: 'Data Analisa NPHR' });
});

router.get('/pemakaian-sendiri', function(req, res, next) {
  res.render('pemakaian-sendiri', { title: 'Pemakaian Sendiri' });
});

router.get('/input-pemakaian-sendiri', function(req, res, next) {
  res.render('input-pemakaian-sendiri', { title: 'Pemakaian Sendiri' });
});

router.get('/maturity-level', function(req, res, next) {
  res.render('maturity-level', { title: 'Maturity Level' });
});

router.get('/maturity-level-x', function(req, res, next) {
  res.render('maturity-level-x', { title: 'Maturity Level' });
});

router.get('/input-maturity-level', function(req, res, next) {
  res.render('input-maturity-level', { title: 'Maturity Level' });
});

router.get('/input-maturity-level-target', function(req, res, next) {
  res.render('input-maturity-level-target', { title: 'Maturity Level' });
});

router.get('/laporan', function(req, res, next) {
  res.render('laporan', { title: 'Laporan' });
});

router.get('/download', function(req, res, next) {
  res.render('download', { title: 'Download' });
});

router.get('/input-download', function(req, res, next) {
  res.render('input-download', { title: 'Download' });
});

router.get('/404', function(req, res, next) {
  res.render('404', { title: 'Error' });
});

router.get('/500', function(req, res, next) {
  res.render('500', { title: 'Error' });
});

module.exports = router;
