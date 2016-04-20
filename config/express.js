var config = require('./config'),
    express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    logger = require('morgan'),
    SQLiteStore = require('connect-sqlite3')(session),
    passport = require('passport'),
    flash = require('connect-flash');

module.exports = function () {
    var app = express();

    app.use(function (req, res, next) {
     res.header("Access-Control-Allow-Origin", "*");
     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
     next();
     });

    app.use(flash());

    app.use(logger('dev'));

    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());

    app.use(session(
        {
            name: 'hefastSess',
            saveUninitialized: true,
            resave: true,
            secret: 'SuperFabSecretCookie#',
            cookie: {
                maxAge: 3600000
            },
            store: new SQLiteStore({
                table: 'sessions',
                db: 'hefast',
                dir: './sessions'
            })
        }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (obj, done) {
        done(null, obj);
    });

    app.set('views', './app/views');
    app.set('view engine', 'ejs');

    app.use(express.static('./public'));

    urls =
    {
        queryURL: "http://192.168.0.106:1026/v1/queryContext",
        updateURL: "http://192.168.0.106:1026/v1/updateContext",
        v2_url: "http://192.168.0.106:1026/v2/"
    };

    /*urls =
    {
        queryURL: "http://192.168.225.55:1026/v1/queryContext",
        updateURL: "http://192.168.225.55:1026/v1/updateContext",
        v2_url: "http://192.168.225.55:1026/v2/"
    };*/

    keyStone = {
        adminToken: "gWKuTah8",
        users: "http://130.206.113.46:5000/v3/users",
        authURL:"http://130.206.113.46:5000/"

    };

    require('../app/routes/index.server.routes.js')(app);
    require('../app/routes/login.server.routes.js')(app);
    require('../app/routes/register.server.routes.js')(app);
    require('../app/routes/homepage.server.routes.js')(app);
    require('../app/routes/users.server.routes.js')(app);
    require('../app/routes/orders.server.routes.js')(app);
    require('../app/routes/schedule.server.routes.js')(app);
    require('../app/routes/factory.server.routes.js')(app);
    require('../app/routes/materials.server.routes.js')(app);
    require('../app/routes/machines.server.routes.js')(app);
    require('../app/routes/payments.server.routes.js')(app);
    require('../app/routes/wirecloud.server.routes.js')(app);

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handlers

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function (err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });

    return app;
};