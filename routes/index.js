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

router.get('/404', function(req, res, next) {
  res.render('404', { title: 'Error' });
});

router.get('/500', function(req, res, next) {
  res.render('500', { title: 'Error' });
});

module.exports = router;
