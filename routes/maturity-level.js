const fs = require('fs');
const path = require('path');
const express = require('express');
const { Storage } = require('@google-cloud/storage');

const User = require('../db/User');
const Download = require('../db/Download');

const isAuthenticated = require('../middlewares/isAuthenticated');

const router = express.Router();
const storage = new Storage();

router.get('/', isAuthenticated, async (req, res, next) => {
  const isAdmin = req.user.accountType === 'ADMIN';

  return res.render('maturity-level/index', {
    layout: 'dashboard',
    title: 'Maturity Level',
    isAdmin,
  });
});

router.get('/target', isAuthenticated, async (req, res, next) => {
  const isAdmin = req.user.accountType === 'ADMIN';

  return res.render('maturity-level/target', {
    layout: 'dashboard',
    title: 'Maturity Level',
    isAdmin,
  });
});

router.get('/realisasi', isAuthenticated, async (req, res, next) => {
  const isAdmin = req.user.accountType === 'ADMIN';

  return res.render('maturity-level/realisasi', {
    layout: 'dashboard',
    title: 'Maturity Level',
    isAdmin,
  });
});

router.get('/:upk', isAuthenticated, async (req, res, next) => {
  const isAdmin = req.user.accountType === 'ADMIN';

  return res.render('maturity-level/detail', {
    layout: 'dashboard',
    title: 'Maturity Level',
    isAdmin,
  });
});

module.exports = router;
