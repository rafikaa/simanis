const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'SIMANIS' });
});

router.get('/signin', function(req, res, next) {
  res.render('signin', { title: 'Sign In' });
});

router.get('/data-unit', function(req, res, next) {
  res.render('data-unit', { title: 'Data Unit' });
});

router.get('/data-unit-belawan', function(req, res, next) {
  res.render('data-unit-belawan', { title: 'Data Unit' });
});

router.get('/input-data-unit', function(req, res, next) {
  res.render('input-data-unit', { title: 'Data Unit' });
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

router.get('/input-maturity-level', function(req, res, next) {
  res.render('input-maturity-level', { title: 'Maturity Level' });
});

router.get('/laporan', function(req, res, next) {
  res.render('laporan', { title: 'Laporan' });
});

router.get('/download', function(req, res, next) {
  res.render('download', { title: 'Download' });
});

module.exports = router;
