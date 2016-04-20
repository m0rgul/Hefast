var request = require('request'),
    encode = require('./../modules/encoding.js'),
    fs = require('fs'),
    async = require('async');

exports.render = function (req, res) {
    var session = req.session;
    if (session.passport && session.passport.user && session.passport.user.user && session.page == 'index') {
        //we should have some data
        var data = {
            partial: true, //means that we only display some of the fields in the form, i.e. no username and password
            user: {
                id: session.passport.user.profile.id,
                email: session.passport.user.profile.emails[0].value
            }
        };
        return res.render('register', {data: data});
    }
    else
        res.render('register');
};

exports.renderUserForm = function (req, res) {
    req.session.user.registerUser = true;
    var session = req.session;

    if (session && session.user && session.user.newUser && session.passport && session.passport.user) {
        //we should have some data
        var data = {
            partial: true, //means that we only display some of the fields in the form, i.e. no username and password
            user: {
                id: session.passport.user.profile.id,
                fullName: session.passport.user.profile.fullName ? session.passport.user.profile.fullName : "",
                email: session.passport.user.profile.emails[0].value
            }
        };

        return res.render('registerUser', {data: data});
    }
    else
        res.render('registerUser');
};

exports.registerFactory = function (req, res) {
    async.waterfall(
        [
            addKeyStoneUser = function addKeyStoneUser(callback) {
                var user = req.body;
                if (!user.username && !user.password) {
                    console.log('external auth, no keystone');
                    return callback();
                } else {
                    console.log('adding user to keystone');
                    var user = {
                        "user": {
                            "default_project_id": "3f32d46b5dd5465a8551e25a08c10c32",
                            "domain_id": "7873961b43354cdc8e39deb2a0518cc1",
                            "email": req.body.email,
                            "enabled": true,
                            "name": req.body.factoryName,
                            "username": req.body.username,
                            "password": req.body.password
                        }
                    };

                    request({
                        url: keyStone.users,
                        method: "POST",
                        json: true,
                        body: user,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-Auth-Token': keyStone.adminToken
                        },
                        proxy: false
                    }, function (error, response, body) {
                        console.log(error);
                        console.log(body);
                        if (error) {
                            req.session.user = {};
                            return callback(error);
                        } else {
                            callback();
                        }
                    });
                }
            },
            updateContextBroker = function updateContextBroker(callback) {
                //contextBroker stuff
                var user = req.body;
                var id;
                if (!user.username)
                    id = req.session.passport.user.profile.id;
                else
                    id = user.username;
                var contextElement = {
                    "contextElements": [
                        {
                            "type": "Factory",
                            "isPattern": "false",
                            "id": id,
                            "attributes": [
                                {
                                    "name": "factoryName",
                                    "type": "string",
                                    "value": encode.encodeString(req.body.factoryName)
                                },
                                {
                                    "name": "username",
                                    "type": "string",
                                    "value": id
                                },
                                {
                                    "name": "factoryEmail",
                                    "type": "string",
                                    "value": req.body.email
                                },
                                {
                                    "name": "description",
                                    "type": "string",
                                    "value": ""
                                },
                                {
                                    "name": "materials",
                                    "value": []
                                },
                                {
                                    "name": "machines",
                                    "value": []
                                }
                            ]
                        }
                    ],
                    "updateAction": "APPEND"
                };

                request({
                    url: urls.updateURL,
                    method: "POST",
                    json: true,
                    body: contextElement,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    proxy: false
                }, function (error, response, body) {
                    console.log(error);
                    console.log(body);
                    var resp = body.contextResponses != undefined ? body.contextResponses[0] : null;
                    var err = body.errorCode;
                    if (!error && resp && !err) {
                        req.session.user = {};
                        callback();
                    } else {
                        return callback(error);
                    }
                });
            }
        ], function (err) {
            if (err)
                return res.status(err.code).send(err);
            res.status(201).send('ok');
        });
};

exports.getUserSessionData = function (req, res) {
    if (req.session.passport.user) {
        var user = req.session.passport.user;
        var userData = {
            username: user.userName,
            email: user.email
        };
        if (req.session.passport.user.factoryId) {
            var factoryId = req.session.passport.user.factoryId;

            var url = urls.v2_url + "entities/" + factoryId;
            request({
                url: url,
                method: "GET",
                json: true,
                header: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                proxy: false
            }, function (error, response, body) {
                var factoryInfo = {};
                if (!error) {
                    factoryInfo.factoryName = encode.decodeString(body.factoryName.value);

                    var path = "/img/" + factoryId + "/logo";
                    var logo;
                    if (fs.existsSync("./public" + path + ".jpg"))
                        logo = path + ".jpg";
                    else if (fs.existsSync("./public" + path + ".png"))
                        logo = path + ".png";
                    else
                        logo = '/img/defaultLogo.jpg';
                    factoryInfo.logo = logo;
                }
                userData.factoryInfo = factoryInfo;
                return res.json(userData);
            });
        } else {
            return res.json(userData);
        }
    }
    else
        return res.json({});
};