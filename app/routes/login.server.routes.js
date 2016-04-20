var login = require('../../app/controllers/login.server.controller'),
    passport = require('passport'),
    FIWAREStrategy = require('passport-fiware-oauth').OAuth2Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    request = require('request'),
    keyRockConfig = require('./../modules/keyRock.config.js'),
    encode = require('./../modules/encoding.js');


module.exports = function (app) {

    app.route('/logout').get(login.logout);

    /* FIWARE OAuth2 login */
    app.get('/auth/fiware', passport.authenticate('fiware', {scope: ['all_info']}));

    app.get('/auth/fiware/callback', passport.authenticate('fiware', {failureRedirect: '/'}), login.authUser);

    /* Facebook OAuth2 login */
    app.get('/auth/facebook', passport.authenticate('facebook'));

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        failureRedirect: '/',
        scope: ['email']
    }), login.authUser);

    /* Keystone Login */
    /*app.post('/auth/login', passport.authenticate('keystone'),
        function (req, res) {
            console.log(req.body);
            res.redirect('/home');
        });*/

};

passport.use(new FIWAREStrategy({
        clientID: keyRockConfig.client_id,
        clientSecret: keyRockConfig.client_secret,
        callbackURL: keyRockConfig.callbackURL
    },
    function (accessToken, refreshToken, profile, done) {
        var user = {};

        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        user.id = profile.id;

        if (profile.emails && profile.emails.length > 0)
            user.email = profile.emails[0].value; //TODO might lead to errors if no emails!!!

        getUserFromCB(user.id, function (err, response) {
            if (err)
                if (err == 404) {
                    return done(null, {user: {}, accessToken: accessToken, profile: profile});
                }
                else
                    return done(err);
            else {
                return done(null, {user: user, response: response});
            }
        });
    }
));

passport.use(new FacebookStrategy({
        clientID: '1571718836478251',
        clientSecret: '6e960da68481c73e3e6021e0b033e7cf',
        callbackURL: "http://130.206.113.46:3081//auth/facebook/callback",
        profileFields: ['id', 'email', 'name'],
        scope: 'email'
    },
    function (accessToken, refreshToken, profile, done) {
        var user = {};

        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        user.id = 'fb_' + profile.id;
        user.fullName = '';

        if (profile.name.givenName)
            user.fullName = profile.name.givenName;

        if (profile.name.middleName)
            user.fullName += ' ' + profile.name.middleName;

        if (profile.name.familyName)
            user.fullName += ' ' + profile.name.familyName;

        if (profile.emails && profile.emails.length > 0)
            user.email = profile.emails[0].value; //TODO might lead to errors if no emails!!!

        getUserFromCB(user.id, function (err, response) {
            if (err)
                if (err == 404) {
                    return done(null, {});
                }
                else
                    return done(err);
            else {
                return done(null, {user: user, response: response});
            }
        });
    }
));

/*passport.use(new KeystoneStrategy({
    authUrl: keyStone.authUrl, // required
    usernameField: 'username', // optional
    passwordField: 'password', // optional
    region: 'ord',
    passReqToCallback: true // allows us to interact with req object
}, function (req, identity, done) {
    console.log(identity);
    if (!req.user) {
        var user = {
            id: identity.user.id,
            token: identity.token.id,
            username: identity.user.name
        };

        // Set session expiration to token expiration
        req.session.cookie.expires = Date.parse(identity.token.expires) - Date.now();

        done(null, user);
    } else {
        console.log('??');
        // user already exists
        var user = req.user; // pull the user out of the session
        return done(null, user);
    }
}));*/

function getUserFromCB(userID, callback) {
    var account = urls.v2_url + "entities/" + userID;

    request({
        url: account,
        method: "GET",
        json: true,
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {
        if (error) {
            return callback(error);
        }

        if (response && response.statusCode == 200 && Object.keys(body).length > 0) {
            var userType = body.type.toLowerCase();
            var user = {
                'id': userID,
                'role': userType
            };

            if (userType == 'factory')
                user.factoryId = userID;

            if (userType == 'client') {
                user.userId = userID;
                user.factoryId = body.factoryId.value;

                if (body.fullName && body.fullName.value.length > 0)
                    user.fullName = encode.decodeString(body.fullName.value);
            }

            return callback(null, user);

        } else if (response.statusCode == 404) {
            return callback(404);
        }
    });
}