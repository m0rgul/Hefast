var request = require('request'),
    async = require('async'),
    fs = require('fs');
var encode = require('./../modules/encoding.js');

exports.editFactory = function (req, res) {
    res.render('factoryPage');
};

exports.render = function (req, res) {
    var session = req.session;
    if (!session.passport.user)
        return res.redirect('/');

    console.log(JSON.stringify(session.passport.user));

    var user = {
        role: session.passport.user.response.role,
        factoryId: session.passport.user.response.factoryId,
        accessToken: session.passport.user.user.accessToken,
        refreshToken: session.passport.user.user.refreshToken
    };

    if (session.passport.user.response.userId)
        user.id = session.passport.user.response.userId;

    session.passport.user = user;

    console.log(session.passport);


    if (session.passport.user.role == 'factory') {
        //get factory details
        request({
            url: urls.v2_url + "entities/" + req.session.passport.user.factoryId,
            method: "GET",
            json: true,
            header: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            proxy: false
        }, function (error, response, body) {
            console.log(error);
            if (error || response.statusCode != 200)
                return res.redirect('/');

            var description = body.description ? encode.decodeString(body.description.value) : "";
            var machines = body.machines ? body.machines : [];
            var materials = body.materials ? body.materials : [];

            if (description == "" || machines.length == 0 || materials.length == 0)
            //redirect to edit page
                return res.redirect('/factoryDetails');
            else
                return res.redirect('/orders');

        });
    }
    if (session.passport.user.role == 'client') {
        res.render('client/client.home.ejs', {user: req.session.passport.user});
    }
};

/*
 Factory operations
 */

exports.getFactoryData = function (req, res) {
    var session = req.session;
    var id = session.passport.user.user;

    var content = {};
    content.factoryDetails = {};

    var contextElement = {
        "entities": [
            {
                "type": "Factory",
                "isPattern": "false",
                "id": id
            }
        ]
    };

    request({
        url: urls.queryURL,
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
            //get content

            content.id = resp.contextElement.id;

            resp.contextElement.attributes.forEach(function (element) {
                if (element.name == 'factoryAddress')
                    content.factoryDetails.address = element.value;
                if (element.name == 'factoryEmail')
                    content.factoryDetails.email = element.value;
                if (element.name == 'factoryName')
                    content.factoryDetails.factoryName = encode.decodeString(element.value);
                if (element.name == 'description')
                    content.factoryDetails.description = encode.decodeString(element.value);
                if (element.name == 'machines')
                    content.machines = element.value;
                if (element.name == 'materials')
                    content.materials = element.value;
                if (element.name == 'logo')
                    content.logo = element.value;
            });
            return res.json(content);
        } else {
            return res.json({});
        }
    });

};


/*
 Machine operations
 */


exports.getFactoryMachines = function (req, res) {
    var machinesRequest = {
        "entities": [
            {
                "type": "Machine",
                "isPattern": "true",
                "id": ".*"
            }
        ],
        "restriction": {
            "scopes": [
                {
                    "type": "FIWARE::StringQuery",
                    "value": "factoryId==" + req.session.passport.user.factoryId + ';'
                }
            ]
        }
    };

    request({
        url: urls.queryURL,
        method: "POST",
        json: true,
        body: machinesRequest,
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {
        var resp = body.contextResponses != undefined ? body.contextResponses : null;
        var err = body.errorCode;

        if (!error && res && !err && resp.length > 0) {
            var machines = [];
            resp.forEach(function (machine) {
                var newMachine = {};
                newMachine.id = machine.id;
                machine.contextElement.attributes.forEach(function (attrib) {
                    if (attrib.name == 'description')
                        newMachine.description = encode.decodeString(attrib.value);
                    if (attrib.name == 'materials')
                        newMachine.materials = attrib.value;
                    if (attrib.name == 'name')
                        newMachine.name = encode.decodeString(attrib.value);
                    if (attrib.name == 'technology')
                        newMachine.technology = attrib.value;
                    if (attrib.name == 'image')
                        newMachine.image = attrib.value;
                });
                machines.push(newMachine);
            });
            return res.json(machines);

        } else {
            if (err.code == 404)
                return res.json([]);
            return res.sendStatus(err.code);
        }
    });
};

exports.getFactoryMaterials = function (req, res) {
    var factoryId = req.session.passport.user.factoryId;
    var materialsRequest = {
        "entities": [
            {
                "type": "Material",
                "isPattern": "true",
                "id": ".*"
            }
        ],
        "restriction": {
            "scopes": [
                {
                    "type": "FIWARE::StringQuery",
                    "value": "factoryId==" + factoryId + ';'
                }
            ]
        }
    };

    request({
        url: urls.queryURL,
        method: "POST",
        json: true,
        body: materialsRequest,
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {
        var resp = body.contextResponses != undefined ? body.contextResponses : null;
        var err = body.errorCode;
        if (!error && resp && !err && resp.length > 0) {
            var materials = [];
            resp.forEach(function (material) {
                var newMaterial = {};
                newMaterial.id = material.id;
                material.contextElement.attributes.forEach(function (attrib) {
                    if (attrib.name == 'description')
                        newMaterial.description = encode.decodeString(attrib.value);
                    if (attrib.name == 'name')
                        newMaterial.name = encode.decodeString(attrib.value);
                    if (attrib.name == 'reservedStock')
                        newMaterial.reservedStock = parseFloat(attrib.value);
                    if (attrib.name == 'stock')
                        newMaterial.stock = parseFloat(attrib.value);
                    if (attrib.name == 'image')
                        newMaterial.image = attrib.value;
                });
                materials.push(newMaterial);
            });
            return res.json(materials);
        } else {
            if (err.code == 404)
                return res.json([]);
            return res.sendStatus(err.code);
        }
    });
};


/*
 USER export data
 */

exports.getUserFactoryData = function (req, res) {
    var factoryId = req.session.passport.user.factoryId;
    var factoryQuery = {
        "entities": [
            {
                "type": "Factory",
                "isPattern": "false",
                "id": factoryId
            }
        ]
    };

    request({
        url: urls.queryURL,
        method: "POST",
        json: true,
        body: factoryQuery,
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {

        var resp = body.contextResponses != undefined ? body.contextResponses[0] : null;
        var err = body.errorCode;
        if (!error && res && !err) {
            //get content
            var content = {};
            content.factoryDetails = {};
            content.machines = [];
            content.materials = [];
            content.id = resp.contextElement.id;
            content.user = req.session.passport.user;

            resp.contextElement.attributes.forEach(function (element) {
                if (element.name == 'factoryName')
                    content.factoryDetails.factoryName = encode.decodeString(element.valueencode.decodeString);
                if (element.name == 'description')
                    content.factoryDetails.description = encode.decodeString(element.value);
                if (element.name == 'machines')
                    content.machines = element.value;
                if (element.name == 'materials')
                    content.materials = element.value;
                if (element.name == "technology")
                    content.technology = element.value;
            });

            return res.json(content);
        } else {
            //redirect to login and retry
            return res.redirect('/');
        }
    });
};

exports.getFactoryNavInfo = function (req, res) {
    var session = req.session;
    var factoryId = session.passport.user.factoryId;
    var navInfo = {};
    navInfo.factoryId = factoryId;

    var path = "/img/" + factoryId + "/logo";

    if (fs.existsSync("./public" + path + ".jpg"))
        navInfo.logo = path + ".jpg";
    else if (fs.existsSync("./public" + path + ".png"))
        navInfo.logo = path + ".png";
    else
        navInfo.logo = '/img/defaultLogo.jpg';


    var url = urls.v2_url + "entities?type=Order&q=factoryId==" + factoryId + ";status==processing;";

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
            navInfo.newOrders = body.length;
            return res.json(navInfo);
        }
        else
            return res.json({});
    });
};

exports.getFactoryPublicInfo = function (req, res) {
    var factoryId;
    if (req.params && req.params.factoryId) {
        factoryId = req.params.factoryId;
    }
    else {
        var session = req.session;
        if (session.passport && session.passport.user && session.passport.user.factoryId)
            factoryId = session.passport.user.factoryId;
        else if ((!session.passport || !session.passport.user || !session.passport.user.factoryId) && session.user.factoryId)
            factoryId = session.user.factoryId;
        else
            return res.status(500).send('No factoryId anywhere.');
    }

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
        if (response.statusCode >= 200 && response.statusCode < 300) {
            var fact = {};
            fact.id = body.id;
            fact.description = encode.decodeString(body.description.value);
            fact.factoryEmail = body.factoryEmail.value;
            fact.factoryName = encode.decodeString(body.factoryName.value);

            var path = "/img/" + factoryId + "/logo";

            if (fs.existsSync("./public" + path + ".jpg"))
                fact.logo = path + ".jpg";
            else if (fs.existsSync("./public" + path + ".png"))
                fact.logo = path + ".png";
            else
                fact.logo = '/img/defaultLogo.jpg';


            var machines = body.machines ? body.machines : [];
            if (machines.length > 0) {
                machines.forEach(function (machine) {
                    machine.name = encode.decodeString(machine.name);
                    machine.description = encode.decodeString(machine.description);

                    var fileName = factoryId + "_machine_" + encode.encodeString(machine.name.toLowerCase().split(' ').join(''));
                    var path = "/img/" + factoryId + "/" + fileName;

                    if (fs.existsSync("./public" + path + ".jpg"))
                        machine.image = path + ".jpg";
                    else if (fs.existsSync("./public" + path + ".png"))
                        machine.image = path + ".png";
                    else
                        machine.image = '/img/defaultMachine.jpg';

                });
            }

            var materials = body.materials ? body.materials : [];
            if (materials.length > 0) {
                materials.forEach(function (material) {
                    material.name = encode.decodeString(material.name);
                    material.description = encode.decodeString(material.description);

                    var fileName = factoryId + "_material_" + encode.encodeString(material.name.toLowerCase().split(' ').join(''));
                    var path = "/img/" + factoryId + "/" + fileName;

                    if (fs.existsSync("./public" + path + ".jpg"))
                        material.image = path + ".jpg";
                    else if (fs.existsSync("./public" + path + ".png"))
                        material.image = path + ".png";
                    else
                        material.image = '/img/defaultMaterial.jpg';
                });
            }

            fact.machines = machines;
            fact.materials = materials;


            return res.json(fact);
        }
        else {
            return res.sendStatus(response.statusCode);
        }
    });
};

exports.getUserFactory = function (req, res) {
    console.log(req.session);
    var userId = req.session.passport.user.id;

    var factoryData = {};

    async.auto({
            getUserFactoryId: function (callback) {
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
                        factoryData.factoryId = body.factoryId.value;
                        callback(null);
                    }
                    else
                        return callback(response.statusCode);
                });
            },
            getFactoryData: ['getUserFactoryId', function (callback) {
                var url = urls.v2_url + "entities/" + factoryData.factoryId;

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
                        factoryData.factoryName = encode.decodeString(body.factoryName.value);
                        factoryData.description = encode.decodeString(body.description.value);

                        var path = "/img/" + factoryData.factoryId + "/logo";
                        var logo;
                        if (fs.existsSync("./public" + path + ".jpg"))
                            logo = path + ".jpg";
                        else if (fs.existsSync("./public" + path + ".png"))
                            logo = path + ".png";
                        else
                            logo = '/img/defaultLogo.jpg';
                        factoryData.logo = logo;

                        factoryData.factoryEmail = body.factoryEmail.value;
                        callback(null);
                    }
                    else
                        return callback(response.statusCode);
                });
            }]
        },
        function (err) {
            if (err)
                return res.sendStatus(err);
            return res.json(factoryData);
        });
};

exports.renderClientFactoryPage = function (req, res) {
    res.render('client/factory.ejs');
};

exports.renderClientOrderPage = function (req, res) {
    res.render('client/orders.ejs');
};

