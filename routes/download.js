const fs = require('fs');
const path = require('path');
const express = require('express');
const { Storage } = require('@google-cloud/storage');

const User = require('../db/User');
const Download = require('../db/Download');

const onlyAuthenticated = require('../middlewares/onlyAuthenticated');

const router = express.Router();
const storage = new Storage();

router.get('/', onlyAuthenticated, async (req, res, next) => {
  const isAdmin = req.user.accountType === 'ADMIN';
  const files = await Download.find().lean();

  return res.render('download/index', {
    layout: 'dashboard',
    title: 'Download',
    files,
    isAdmin,
  });
});

router.get('/create', onlyAuthenticated, async (req, res, next) => {
  if (req.user.accountType != 'ADMIN') {
    return res.redirect('/download');
  }

  const files = await Download.find().lean();

  return res.render('download/create', {
    layout: 'dashboard',
    title: 'Download',
    success: req.flash('success'),
    error: req.flash('error'),
    files,
  });
});

router.post('/create', onlyAuthenticated, async (req, res, next) => {
  if (req.user.accountType != 'ADMIN') {
    return res.redirect('/download');
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    req.flash('error', `Kesalahan sewaktu mengunggah file: ${err.message}`);
    return res.redirect('/download/create');
  }

  let file = req.files.file;

  // No more than 100mb
  if (file.size > 100000000) {
    req.flash('error', `File "${file.name}" terlalu besar.`);
    return res.redirect('/download/create');
  }

  const filename = `${Date.now()}-${file.name}`;
  const tempPath = path.resolve(`upload/${filename}`);
  const gsPath = `downloads/${filename}`;

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
      name: filename,
      gsPath,
      size: file.size,
    });
    await download.save();
    req.flash('success', `File "${req.body.title}" berhasil diupload`);
  } catch (err) {
    console.error(err);
    req.flash('error', `Kesalahan sewaktu mengunggah file: ${err.message}`);
  }

  return res.redirect('/download/create');
});

router.get('/:filename', onlyAuthenticated, async (req, res, next) => {
  const { filename } = req.params;
  const file = await Download.findOne({ name: filename }).lean();
  if (file) {
    const tempPath = path.resolve(`upload/${file.name}`);

    await storage
      .bucket('simanis')
      .file(file.gsPath)
      .download({
        destination: tempPath,
      });

    return res.download(`upload/${file.name}`);
  }

  return res.status(404).send('Not found');
});

router.get('/:filename/delete', onlyAuthenticated, async (req, res, next) => {
  if (req.user.accountType != 'ADMIN') {
    return res.redirect('/download');
  }

  const { filename } = req.params;
  const file = await Download.findOne({ name: filename }).lean();

  try {
    await storage
      .bucket('simanis')
      .file(file.gsPath)
      .delete();

    await Download.deleteOne({ name: filename });
    req.flash('success', `File "${file.title}" berhasil dihapus`);
  } catch (err) {
    console.error(`GET /:filename/delete ${err}`);
    req.flash('error', `Gagal menghapus file "${file.title}"`);
  }

  return res.redirect('/download/create');
});

module.exports = router;
