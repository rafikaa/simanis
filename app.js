const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const exphbs = require('express-handlebars');
const flash = require('connect-flash');
const session = require('express-session');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const dataUnitRouter = require('./routes/dataUnit');

const dbConnection = require('./db/connection');
dbConnection.connect();

const app = express();

// view engine setup
const hbs = exphbs.create({
  helpers: {},
  extname: '.hbs',
});

app.engine('.hbs', hbs.engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.COOKIE_SECRET || 'secret',
    cookie: { maxAge: 60000 },
  })
);
app.use(flash());

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/unit', dataUnitRouter);

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
