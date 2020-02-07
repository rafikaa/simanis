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
  });
});

router.post('/create', isAuthenticated, async (req, res, next) => {
  console.log(req.files)
  // await storage.bucket(bucketName).upload(filename, {
  //   // Support for HTTP requests made with `Accept-Encoding: gzip`
  //   gzip: true,
  //   // By setting the option `destination`, you can change the name of the
  //   // object you are uploading to a bucket.
  //   metadata: {
  //     // Enable long-lived HTTP caching headers
  //     // Use only if the contents of the file will never change
  //     // (If the contents will change, use cacheControl: 'no-cache')
  //     cacheControl: 'public, max-age=31536000',
  //   },
  // });

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let file = req.files.file;

  // Use the mv() method to place the file somewhere on your server
  // file.mv(`../upload/${file.name}`, function (err) {
  //   if (err)
  //     return res.status(500).send(err);

  //   res.send('File uploaded!');
  // });
  try {
    await file.mv(path.resolve(`upload/${file.name}`));
  } catch (err) {
    console.error(err)
  }

  return res.render('download/create', {
    layout: 'dashboard',
    title: 'Download',
  });
});

module.exports = router;
