var request = require('request'),
    async = require('async'),
    encode = require('./../modules/encoding.js');


/*
 *   Middleware
 */

exports.isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        console.log('authenticated!');
        // req.user is available for use here
        return next();
    }

    // denied. redirect to login
    return res.status(403).send('\nYou need to renew your auth token. Please proceed to the <a href="/">login page</a>');

};

exports.isFactory = function (req, res, next) {
    var session = req.session;
    console.log(session);
    if (session.passport.user.role != 'factory')
        return res.status(403).send('\nYou need to renew your auth token. Please proceed to the <a href="/">login page</a>');
    next();
};

exports.isAdmin = function (req, res, next) {
    var session = req.session;
    if (!session.passport.user || session.passport.user.role != 'admin')
        return res.status(403).send('\nYou need to renew your auth token. Please proceed to the <a href="/">login page</a>');
    next();
};

/*
 *   Server controlls
 */

exports.render = function (req, res) {
    res.render('factory/factory.clients.ejs');
};

exports.addUser = function (req, res) {

    var username = req.body.username ? req.body.username : req.session.passport.user.profile.id;
    var email = req.body.email ? req.body.email : req.session.user.email;

    var newUser = {
        factoryId: req.session.user.factoryId,
        username: username,
        fullName: encode.encodeString(req.body.fullName),
        email: email,
        address: encode.encodeString(req.body.address),
        phoneNo: encode.encodeString(req.body.phoneNo)
    };

    var newClient = {
        'type': 'Client',
        'id': newUser.username,
        'fullName': {
            'type': 'string',
            'value': newUser.fullName
        },
        'email': {
            'type': 'string',
            'value': newUser.email
        },
        'address': {
            'type': 'string',
            'value': newUser.address
        },
        'phoneNo': {
            'type': 'string',
            'value': newUser.phoneNo
        },
        'username': {
            'type': 'string',
            'value': newUser.username
        },
        'factoryId': {
            'type': 'string',
            'value': newUser.factoryId
        },
        'dateJoined': {
            'type': 'integer',
            'value': new Date().getTime()
        }
    };

    request({
        url: urls.v2_url + "entities",
        method: "POST",
        json: true,
        body: newClient,
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {
        if (response.statusCode == 201)
            req.session.user.newUser = false;
        return res.sendStatus(response.statusCode);

    });

};

exports.updateUser = function (req, res) {
    var userId = req.body.username;
    var url = urls.v2_url + "entities/" + userId;

    var updateClient = {
        'fullName': {
            'type': 'string',
            'value': encode.encodeString(req.body.fullName)
        },
        'email': {
            'type': 'string',
            'value': req.body.email
        },
        'address': {
            'type': 'string',
            'value': encode.encodeString(req.body.address)
        },
        'phoneNo': {
            'type': 'string',
            'value': encode.encodeString(req.body.phoneNo)
        }
    };

    request({
        url: url,
        method: "POST",
        json: true,
        body: updateClient,
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {
        return res.sendStatus(response.statusCode);

    });
};

exports.deleteUser = function (req, res) {

    var userId = req.params.clientId;
    var url = urls.v2_url + "entities/" + userId;

    request({
        method: 'DELETE',
        url: url
    }, function (error, response, body) {
        return res.sendStatus(response.statusCode);
    });
};

exports.getFactoryClients = function (req, res) {
    var factoryId = req.session.passport.user.factoryId;
    var clientsRequest = {
        "entities": [
            {
                "type": "Client",
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
        body: clientsRequest,
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {
        var resp = body.contextResponses != undefined ? body.contextResponses : null;
        var err = body.errorCode;

        if (!error && res && !err && resp.length > 0) {
            var users = [];
            resp.forEach(function (user) {
                var newUser = {};
                newUser.id = user.id;
                user.contextElement.attributes.forEach(function (attrib) {
                    if (attrib.name == 'username')
                        newUser.username = attrib.value;
                    if (attrib.name == 'email')
                        newUser.email = attrib.value;
                    if (attrib.name == 'address')
                        newUser.address = encode.decodeString(attrib.value);
                    if (attrib.name == 'fullName')
                        newUser.fullName = encode.decodeString(attrib.value);
                    if (attrib.name == 'phoneNo')
                        newUser.phoneNo = encode.decodeString(attrib.value);
                    if (attrib.name == 'dateJoined')
                        newUser.dateJoined = attrib.value;
                });
                users.push(newUser);
            });
            return res.json(users);

        } else {
            if (err.code == 404)
                return res.json([]);
            return res.sendStatus(err.code);
        }
    });
};