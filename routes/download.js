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
  const hasUpdatePermission = req.user.accountType === 'ADMIN';
  const files = await Download.find().lean();

  return res.render('download/index', {
    layout: 'dashboard',
    title: 'Download',
    files,
    hasUpdatePermission,
  });
});

router.get('/create', isAuthenticated, async (req, res, next) => {
  return res.render('download/create', {
    layout: 'dashboard',
    title: 'Download',
    success: req.flash('success'),
    error: req.flash('error'),
  });
});

router.post('/create', isAuthenticated, async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let file = req.files.file;

  const tempPath = path.resolve(`upload/${file.name}`);
  const gsPath = `downloads/${file.name}`;

  try {
    await file.mv(tempPath);
    await storage.bucket('simanis').upload(tempPath, {
      destination: gsPath,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    const download = new Download({
      title: req.body.title,
      name: file.name,
      gsPath,
      size: file.size,
    });
    await download.save();
    req.flash('success', 'File berhasil diupload');
  } catch (err) {
    console.error(err);
    req.flash('error', `Kesalahan sewaktu mengunggah file: ${err.message}`);
  }

  return res.redirect('/download/create');
});

router.get('/:filename', isAuthenticated, async (req, res, next) => {
  const { filename } = req.params;
  const file = await Download.findOne({ name: filename }).lean();
  const tempPath = path.resolve(`upload/${file.name}`);

  await storage
    .bucket('simanis')
    .file(file.gsPath)
    .download({
      destination: tempPath,
    });
  
  res.download(`upload/${file.name}`);
});

module.exports = router;
