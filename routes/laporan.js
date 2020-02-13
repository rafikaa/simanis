const fs = require('fs');
const path = require('path');
const express = require('express');
const { Storage } = require('@google-cloud/storage');

const User = require('../db/User');
const Report = require('../db/Report');

const isAuthenticated = require('../middlewares/isAuthenticated');

const router = express.Router();
const storage = new Storage();

router.get('/', isAuthenticated, async (req, res, next) => {
  let units = [];
  if (req.user.accountType === 'ADMIN') {
    units = await User.find({ accountType: 'UNIT' }, [
      'name',
      'username',
    ]).lean();
  } else if (req.user.accountType === 'UNIT') {
    units = [req.user];
  }
  const { upk } = req.query;
  const laporanList = await Report.find({ upk }).lean();
  const query = { upk };

  return res.render('laporan/index', {
    layout: 'dashboard',
    title: 'Laporan',
    success: req.flash('success'),
    error: req.flash('error'),
    laporanList,
    units,
    query,
  });
});

router.post('/', isAuthenticated, async (req, res, next) => {
  const { bulanTahun, upk, ulpl } = req.body;
  const [bulan, tahun] = bulanTahun.split('-');

  if (!req.files || Object.keys(req.files).length === 0) {
    req.flash('error', `Kesalahan sewaktu mengunggah file: ${err.message}`);
    return res.redirect('/laporan');
  }

  let file = req.files.file;

  // No more than 100mb
  if (file.size > 100000000) {
    req.flash('error', `File "${file.name}" terlalu besar.`);
    return res.redirect('/laporan');
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
    const laporan = new Report({
      bulan,
      tahun,
      upk,
      ulpl,
      name: filename,
      gsPath,
      size: file.size,
    });
    await laporan.save();
    req.flash('success', `File "${file.name}" berhasil diupload`);
  } catch (err) {
    console.error(err);
    req.flash('error', `Kesalahan sewaktu mengunggah file: ${err.message}`);
  }

  return res.redirect(`/laporan?upk=${upk}`);
});

router.get('/:filename', isAuthenticated, async (req, res, next) => {
  const { filename } = req.params;
  const file = await Report.findOne({ name: filename }).lean();
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
