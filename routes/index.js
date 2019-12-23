const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Mood Player' });
});

/* GET signin. */
router.get('/signin', function(req, res, next) {
  res.render('signin', { title: 'Sign In' });
});

module.exports = router;
