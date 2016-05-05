var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var middleware = require('./middleware');
var routes = require('./routes/index');
var session = require('express-session')

//
// This is important for deployment on Heroku (they set the PORT environment variable).
//
app.set('port', (process.env.PORT || 5000));

//
// Load all magical middleware that we need.
//
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));


//
// Set up the session. This is a TOY app, so an in-memory session store is ok. In production you'd use Redis or a database or
// something like that to store sessions.
//
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//
// This middleware is called before any routes are executed. (In English: before any of the code for any URL is
// run on the server, this middleware is run.)
//
// This does magicalness. It creates the database if it doesn't currently exist.
//
app.use(middleware.ensureDataseExists);

//
// This middleware is called before any routes are executed. (In English: before any of the code for any URL is
// run on the server, this middleware is run.)
//
// This loads the logged in user - if one is logged in.
//
app.use(middleware.loadLoggedInUser);

//
// Set up all of the URL-to-code mappings/routes.
//
// See "./routes/index.js" for all the URL-to-code mappings/routes.
//
app.use('/', routes);

//
// catch 404 and forward to error handler
//
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


//
// development error handler
// will print stacktrace
//
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}


//
// production error handler
// no stacktraces leaked to user
//
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.format({
      text:function() {
          res.send(err.message);
      },
      json:function() {
          res.send(err);
      },
      html:function() {
        res.render('error', {
          message: err.message,
          error: {}
        });
      }
  });
  
});


//
// Once this is called, the web server is "open for business" and can be accessed from browsers.
//
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


