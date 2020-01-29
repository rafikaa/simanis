const express = require('express');

const isAuthenticated = require('../middlewares/isAuthenticated');

const router = express.Router();

router.get(/.*e23a7dcaefbde4e74e263247aa42ecd7.ttf$/, (req, res, next) => {
  return res.send('');
});
router.get(/.*a1ecc3b826d01251edddf29c3e4e1e97.woff$/, (req, res, next) => {
  return res.send('');
});

router.get('/', isAuthenticated, (req, res, next) => {
  res.render('index', { layout: 'dashboard', title: 'SIMANIS' });
});

router.get('/analisa-nphr', function(req, res, next) {
  res.render('analisa-nphr', { layout: 'dashboard', title: 'Analisis NPHR' });
});

router.get('/input-data-analisa-nphr', function(req, res, next) {
  res.render('input-data-analisa-nphr', { layout: 'dashboard', title: 'Data Analisis NPHR' });
});

router.get('/pemakaian-sendiri', function(req, res, next) {
  res.render('pemakaian-sendiri', { layout: 'dashboard', title: 'Pemakaian Sendiri' });
});

router.get('/input-pemakaian-sendiri', function(req, res, next) {
  res.render('input-pemakaian-sendiri', { layout: 'dashboard', title: 'Pemakaian Sendiri' });
});

router.get('/maturity-level', function(req, res, next) {
  res.render('maturity-level', { layout: 'dashboard', title: 'Maturity Level' });
});

router.get('/maturity-level-x', function(req, res, next) {
  res.render('maturity-level-x', { layout: 'dashboard', title: 'Maturity Level' });
});

router.get('/input-maturity-level', function(req, res, next) {
  res.render('input-maturity-level', { layout: 'dashboard', title: 'Maturity Level' });
});

router.get('/input-maturity-level-target', function(req, res, next) {
  res.render('input-maturity-level-target', { layout: 'dashboard', title: 'Maturity Level' });
});

router.get('/laporan', function(req, res, next) {
  res.render('laporan', { layout: 'dashboard', title: 'Laporan' });
});

router.get('/download', function(req, res, next) {
  res.render('download', { layout: 'dashboard', title: 'Download' });
});

router.get('/input-download', function(req, res, next) {
  res.render('input-download', { layout: 'dashboard', title: 'Download' });
});

router.get('/404', function(req, res, next) {
  res.render('404', { title: 'Error' });
});

router.get('/500', function(req, res, next) {
  res.render('500', { title: 'Error' });
});

module.exports = router;
