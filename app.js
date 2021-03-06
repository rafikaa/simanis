const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const exphbs = require('express-handlebars');
const hbsHelpers = require('handlebars-helpers');
const flash = require('connect-flash');
const session = require('express-session');
const fileUpload = require('express-fileupload');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const unitRouter = require('./routes/unit');
const nphrRouter = require('./routes/nphr');
const analisisNphrRouter = require('./routes/analisis-nphr');
const pemakaianSendiriRouter = require('./routes/pemakaian-sendiri');
const maturityLevelRouter = require('./routes/maturity-level');
const laporanRouter = require('./routes/laporan');
const downloadRouter = require('./routes/download');

const dbConnection = require('./db/connection');
dbConnection.connect();

const app = express();

// view engine setup
const hbs = exphbs.create({
  extname: '.hbs',
});
hbsHelpers({
  handlebars: hbs.handlebars,
});
app.engine('.hbs', hbs.engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.COOKIE_SECRET || 'secret',
    cookie: { maxAge: 60000 },
  })
);
app.use(flash());
app.use(fileUpload());

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/unit', unitRouter);
app.use('/nphr', nphrRouter);
app.use('/analisis-nphr', analisisNphrRouter);
app.use('/pemakaian-sendiri', pemakaianSendiriRouter);
app.use('/maturity-level', maturityLevelRouter);
app.use('/laporan', laporanRouter);
app.use('/download', downloadRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.error(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('500', { title: 'Error' });
});

module.exports = app;
