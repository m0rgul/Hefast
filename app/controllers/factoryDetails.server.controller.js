var request = require('request'),
    async = require('async'),
    fs = require('fs');

var encode = require('./../modules/encoding.js');

exports.render = function (req, res) {
    res.render('factory/factoryEdit.ejs');
};

exports.isFactoryData = function (req, res, next) {
    var factoryId = req.session.passport.user.factoryId;
    var url = urls.v2_url + "entities/" + factoryId + "/attrs/machines/value";

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
        if (error || response.statusCode == 404)
            return res.redirect('/factoryDetails');
        if (body && body.value.length > 0)
            next();
        else
            return res.redirect('/factoryDetails');
    });
};

exports.updateFactory = function (req, res) {

    var factory = {
        'id': req.session.passport.user.factoryId,
        'name': encode.encodeString(req.body.factoryInfo.factoryName),
        'email': req.body.factoryInfo.factoryEmail,
        'description': encode.encodeString(req.body.factoryInfo.description)
    };

    if (req.file) {

        /* Move file */

        var sourceFile = "./" + req.file.path.replace("\\", "/");

        var is = fs.createReadStream(sourceFile);
        var type;
        if (req.file.mimetype === 'image/png')
            type = ".png";
        if (req.file.mimetype === 'image/jpg' || req.file.mimetype === 'image/jpeg')
            type = ".jpg";

        var destination = "./public/img/" + factory.id;


        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination);
        }

        var file = "logo" + type;

        if (type == ".png" && fs.existsSync(destination + "/logo.jpg")) {
            fs.unlinkSync(destination + "/logo.jpg");
        }
        if (type == ".jpg" && fs.existsSync(destination + "/logo.png")) {
            fs.unlinkSync(destination + "/logo.png");

        }


        var os = fs.createWriteStream(destination + "/" + file);
        is.pipe(os);
        is.on('end', function () {
            fs.unlinkSync(sourceFile);
        });
    }

    var contextElement = {
        "contextElements": [
            {
                "type": "Factory",
                "isPattern": "false",
                "id": factory.id,
                "attributes": [
                    {
                        "name": "factoryName",
                        "type": "string",
                        "value": factory.name
                    },
                    {
                        "name": "factoryEmail",
                        "type": "string",
                        "value": factory.email
                    },
                    {
                        "name": "description",
                        "type": "string",
                        "value": factory.description
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
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {
        var resp = body.contextResponses != undefined ? body.contextResponses[0] : null;
        var err = body.errorCode;
        if (!error && res && !err) {
            return res.send('ok');
        } else {
            return res.sendStatus(err.statusCode);
        }
    });
};

exports.getPrinterTypes = function (req, res) {
    var role = req.session.passport.user.role;
    if (role == 'factory') {
        var factoryId = req.session.passport.user.factoryId;
        var printerTypes = [];

        var url = urls.v2_url + "entities?type=Machine&q=factoryId==" + factoryId;
        console.log(url);

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
            console.log(error);
            console.log(body);
            if (body.length > 0 && response.statusCode >= 200 && response.statusCode < 300) {
                body.forEach(function (machine) {
                    var techName = machine.technology.display;
                    if (printerTypes.indexOf(techName) < 0)
                        printerTypes.push(techName);
                });
                return res.json(printerTypes);
            }
            else {
                res.statusCode = response.statusCode;
                return res.send();
            }
        });
    }


    else if (role == 'client') {


        var userId = req.session.passport.user.userId;

        var factoryId;
        var printerTypes = [];

        async.auto({
                getUserFactory: function (callback) {
                    var url = urls.v2_url + "entities/" + userId + "/attrs/factoryId";
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
                        if (response.statusCode >= 200 && response.statusCode < 300) {
                            factoryId = body.factoryId.value;
                            return callback(null);
                        }
                        else
                            return callback(response.statusCode);
                    });
                },
                getPrinterTypes: ['getUserFactory', function (callback) {
                    var url = urls.v2_url + "entities?type=Machine&q=factoryId==" + factoryId;

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
                        if (response.statusCode >= 200 && response.statusCode < 300) {
                            body.forEach(function (machine) {
                                var techName = machine.technology.display;
                                if (printerTypes.indexOf(techName) < 0)
                                    printerTypes.push(techName);
                            });
                            return callback(null);
                        }
                        else
                            return callback(response.statusCode);
                    });
                }]
            },
            function (err) {
                if (err)
                    return res.sendStatus(err);
                return res.json(printerTypes);
            });
    }
};

exports.renderPublicFactory = function (req, res) {
    var factoryId = req.params.factoryId;

    var account = urls.v2_url + "entities/" + factoryId;

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
        if (error)
            res.redirect('/404');
        else if (body.length == 0)
            res.redirect('/404');
        else if (response.statusCode == 404)
            res.redirect('/404');
        else {
            var sess = req.session;

            if (!sess.passport || !sess.passport.user || sess.passport.user.role != 'factory') {
                var user = {
                    factoryId: factoryId,
                    newUser: true
                };
                req.session.user = user;
            }
            req.session.page = 'client';
            console.log('public factory! ---------------');
            console.log(req.session);
            res.render('factory/factory.public.ejs', {user: sess.user});
        }
    });
};