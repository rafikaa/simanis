const express = require('express');

const User = require('../db/User');
const UnitData = require('../db/UnitData');

const isAuthenticated = require('../middlewares/isAuthenticated');
const isAdminOrUnit = require('../middlewares/isAdminOrUnit');

const router = express.Router();

router.get('/', isAuthenticated, (req, res, next) => {
  res.render('analisis-nphr/index', {
    layout: 'dashboard',
    title: 'Analisis NPHR',
  });
});

router.get('/create', isAuthenticated, (req, res, next) => {
  res.render('analisis-nphr/create', {
    layout: 'dashboard',
    title: 'Data Analisis NPHR',
  });
});

module.exports = router;
