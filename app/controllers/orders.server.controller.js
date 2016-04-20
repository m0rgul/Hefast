var request = require('request'),
    async = require('async'),
    fs = require('fs'),
    objStorage = require('./../modules/objectStorageController.js');

var encode = require('./../modules/encoding.js');

exports.render = function (req, res) {
    res.render('factory/factory.orders.ejs');
};

exports.placeOrder = function (req, res) {
    var client;
    var role = req.session.passport.user.role;
    if (role == "client")
        client = req.session.passport.user.userId;
    else if (role == 'factory')
        client = req.body.order.client;

    url = urls.v2_url + "entities";
    var order = req.body.order;

    var orderID = "order_" + new Date().getTime().toString();

    var factoryId = req.session.passport.user.factoryId;

    /**
     * Upload file to cloud storage
     */

    var sourceFile = "./" + req.file.path.replace("\\", "/");
    var serverName = req.file.originalname.split('.');
    serverName = orderID + "." + serverName[serverName.length - 1];

    var uploadFile = {
        path: sourceFile,
        serverName: serverName
    };

    objStorage.uploadFile(uploadFile, function (error, fileName) {
        if (error)
            return res.sendStatus(400);

        else {
            fs.unlinkSync(sourceFile);

            var orderRequest = {
                "type": "Order",
                "id": orderID,
                "status": "processing",
                "factoryId": factoryId,
                "client": client,
                "machine": "",
                "materialName": "",
                "materialQty": {
                    "type": "float",
                    "value": 0
                },
                "startDate": {
                    "type": "integer",
                    "value": 0
                },
                "endDate": {
                    "type": "integer",
                    "value": 0
                },
                "orderDetails": {
                    "file": fileName,
                    "originalFileName": req.file.originalname, //TODO encode filenames
                    "units": order.units,
                    "printerType": order.printerType,
                    "material": encode.encodeString(order.material),
                    "comments": encode.encodeString(order.comments)
                },
                "orderDate": {
                    "type": "integer",
                    "value": parseInt(order.orderDate)
                },
                "deadline": {
                    "type": "integer",
                    "value": parseInt(order.orderDeadline)
                }
            };

            request({
                url: url,
                method: "POST",
                json: true,
                body: orderRequest,
                header: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                proxy: false
            }, function (error, response, body) {
                var status = response.statusCode;
                return res.sendStatus(status);
            });
        }
    });
};

exports.scheduleOrder = function (req, res) {
    var order = req.body;
    var factoryId = req.session.passport.user.factoryId;

    var material = order.material.originalObject ? order.material.originalObject.name : order.material.name;
    var orderRequest = {
        "status": order.status,
        "machine": factoryId + "_" + encode.encodeString(order.machine),
        "materialName": factoryId + "_" + encode.encodeString(material),
        "startDate": {
            "type": "integer",
            "value": order.startDate
        },
        "endDate": {
            "type": "integer",
            "value": order.endDate
        }
    };

    url = urls.v2_url + "entities/" + order.orderId;

    request({
        url: url,
        method: "POST",
        json: true,
        body: orderRequest,
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {
        var status = response.statusCode;
        return res.sendStatus(status);
    });

};

exports.getOrderById = function (req, res) {
    var orderId = req.params.orderId;
    url = urls.v2_url + "entities/" + orderId;
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
        var status = response.statusCode;

        if (status >= 200 && status < 300) {
            var order = {};
            order.endDate = body.endDate.value;
            order.startDate = body.startDate.value;
            order.machine = encode.decodeString(body.machine);
            order.materialName = encode.decodeString(body.materialName);
            order.materialQty = body.materialQty;
            order.details = body.orderDetails;
            order.status = body.status;
            order.client = body.client;
            order.factoryId = body.factoryId;
            order.id = body.id;
            order.details.comments = encode.decodeString(order.details.comments);
            order.details.material = encode.decodeString(order.details.material);
            return res.json(order);
        } else {
            if (status == 404)
                return res.json({});
            return res.sendStatus(status);
        }
    });
};

exports.getFactoryOrders = function (req, res) {
    var sess = req.session;
    var factoryId = sess.passport.user.factoryId;

    var q = "factoryId==" + factoryId;

    var filters = req.body;
    if (filters.dates) {
        //add a date range filter
        q += ";orderDate==" + parseInt(filters.dates.start) + ".." + parseInt(filters.dates.end);
    }

    if (filters.machine)
        q += ";machine==" + factoryId + "_" + encode.encodeString(filters.machine);

    if (filters.material)
        q += ";materialName==" + factoryId + "_" + encode.encodeString(filters.material);

    if (filters.client)
        q += ";client==" + filters.client;

    if (req.session.user && req.session.user.role == 'client') {
        q += ";client==" + req.session.user.userId;
    }

    if (filters.status)
        q += ";status==" + filters.status;

    var url = urls.v2_url + "entities?type=Order&q=" + encodeURIComponent(q);

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
        var status = response.statusCode;

        if (status == 200) {
            var orders = [];
            body.forEach(function (order) {
                var newOrder = {};
                newOrder.id = order.id;
                newOrder.startDate = parseInt(order.startDate.value);
                newOrder.endDate = parseInt(order.endDate.value);
                newOrder.machine = order.machine ? encode.decodeString(order.machine.split("_")[1]) : "";
                newOrder.materialName = order.materialName ? encode.decodeString(order.materialName.split("_")[1]) : "";
                newOrder.orderDetails = order.orderDetails;
                newOrder.orderDetails.comments = encode.decodeString(order.orderDetails.comments);
                newOrder.orderDetails.material = encode.decodeString(order.orderDetails.material);
                newOrder.orderDate = order.orderDate.value;
                newOrder.deadline = order.deadline.value;
                newOrder.status = order.status;
                newOrder.client = order.client;
                if (newOrder.startDate && newOrder.endDate)
                    newOrder.duration = (newOrder.endDate - newOrder.startDate) / (1000 * 3600);
                else
                    newOrder.duration = 0;
                orders.push(newOrder);
            });
            return res.json(orders);

        } else if (err.code == 404)
            return res.json([]);
        return res.sendStatus(err.code);
    });
};

exports.downloadFile = function (req, res) {
    var orderId = req.params.orderId;
    orderId = orderId.split('.')[0];

    if (!orderId)
        return res.send('error');

    url = urls.v2_url + "entities/" + orderId;
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
        var status = response.statusCode;

        if (status == 200) {
            var file = {};
            file.location = body.orderDetails.file;
            file.originalName = body.orderDetails.originalFileName;

            objStorage.getAccessToFile(file.location, function (error, access) {
                if (!error) {
                    var url = access.accessUrl + "/orders/" + file.location;
                    var options = {
                        headers: {
                            'x-auth-token': access.accessToken
                        }
                    };
                    var fStream = fs.createWriteStream('./download/' + file.originalName);
                    var fileDL = request.get(url, options, function (err, response, body) {
                        if (!err && response.statusCode == 200) {
                            res.download('./download/' + file.originalName, file.originalName, function (err) {
                                if (err)
                                    console.log(err);
                                fs.unlinkSync('./download/' + file.originalName);
                            });
                        }
                        else {
                            res.send('error!');
                        }
                    });
                } else {
                    console.log(error);
                }
                fileDL.pipe(fStream);
            });
        } else {
            res.send('file not found');
        }
    });
};





