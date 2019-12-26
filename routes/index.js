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

router.get('/input-data-unit', function(req, res, next) {
  res.render('input-data-unit', { title: 'Data Unit' });
});

router.get('/data-nphr', function(req, res, next) {
  res.render('data-nphr', { title: 'Data NPHR' });
});

router.get('/input-data-nphr', function(req, res, next) {
  res.render('input-data-nphr', { title: 'Data NPHR' });
});

router.get('/laporan', function(req, res, next) {
  res.render('laporan', { title: 'Laporan' });
});

module.exports = router;
