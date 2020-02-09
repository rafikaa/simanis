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
  // const hasUpdatePermission = req.user.accountType === 'ADMIN';
  // const files = await Download.find().lean();

  return res.render('laporan/index', {
    layout: 'dashboard',
    title: 'Laporan',
  });
  // return res.render('download/index', {
  //   layout: 'dashboard',
  //   title: 'Download',
  //   files,
  //   hasUpdatePermission,
  // });
});

router.post('/', isAuthenticated, async (req, res, next) => {
  if (req.user.accountType != 'ADMIN') {
    return res.redirect('/download');
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    req.flash('error', `Kesalahan sewaktu mengunggah file: ${err.message}`);
    return res.redirect('/download/create');
  }

  let file = req.files.file;

  if (file.size > 100000000) { // No more than 100mb
    req.flash('error', `File "${file.name}" terlalu besar.`);
    return res.redirect('/download/create');
  }

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
    req.flash('success', `File "${req.body.title}" berhasil diupload`);
  } catch (err) {
    console.error(err);
    req.flash('error', `Kesalahan sewaktu mengunggah file: ${err.message}`);
  }

  return res.redirect('/download/create');
});

router.get('/:filename', isAuthenticated, async (req, res, next) => {
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

module.exports = router;
