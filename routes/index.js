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

module.exports = router;
