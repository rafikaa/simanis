const express = require('express');

const User = require('../db/User');
const OwnUsage = require('../db/OwnUsage');

const isAuthenticated = require('../middlewares/isAuthenticated');

const router = express.Router();

router.get('/', isAuthenticated, async (req, res, next) => {
  return res.render('download/index', {
    layout: 'dashboard',
    title: 'Download',
  });
});

router.get('/create', isAuthenticated, async (req, res, next) => {
  return res.render('download/create', {
    layout: 'dashboard',
    title: 'Download',
  });
});

module.exports = router;
