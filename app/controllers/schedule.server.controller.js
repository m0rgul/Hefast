var request = require('request'),
    async = require('async');

var EventUtils = require('./../modules/EventUtils.js');
var encode = require('./../modules/encoding.js');

exports.render = function (req, res) {
    var factoryId = req.session.passport.user.factoryId;
    var machineReq = {
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
                    "value": "factoryId==" + factoryId + ";"
                }
            ]
        }
    };
    var machines = [];
    request({
        url: urls.queryURL,
        method: "POST",
        json: true,
        body: machineReq,
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {
        var resp = body.contextResponses ? body.contextResponses : null;
        var err = body.errorCode;
        if (!error && resp && !err) {

            if (resp.length === 0)
                return res.redirect('/home');

            resp.forEach(function (elem) {
                var machine = {};
                machine.id = elem.contextElement.id;
                var attr = elem.contextElement.attributes;
                for (i = 0; i < attr.length; i++) {
                    if (attr[i].name == 'name') {
                        machines.push(encode.decodeString(attr[i].value));
                        break;
                    }
                }
            });
            return res.render('factory/factory.schedule.ejs', {'machines': machines});
        } else {
            if (err.code == 404)
                return res.redirect('/home');
            else if (err.code == 400)
                return res.sendStatus(400);
            else
                return res.sendStatus(err.code);
        }
    });
};

exports.getMachineSchedule = function (req, res) {
    var machine = req.query.machineId;
    var startDate = new Date(req.query.start).getTime();
    var endDate = new Date(req.query.end).getTime();
    var factoryId = req.session.passport.user.factoryId;
    machine = factoryId + "_" + machine;
    var orderEvents = [];
    var recurring = [];


    async.auto({
        getMachineOrders: function (callback) {
            var orderRequest = {
                "entities": [
                    {
                        "type": "Order",
                        "isPattern": "true",
                        "id": ".*"
                    }
                ],
                "restriction": {
                    "scopes": [
                        {
                            "type": "FIWARE::StringQuery",
                            "value": "machine==" + encode.encodeString(machine) + ";"
                        }
                    ]
                }
            };

            request({
                url: urls.queryURL,
                method: "POST",
                json: true,
                body: orderRequest,
                header: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                proxy: false
            }, function (error, response, body) {
                var resp = body.contextResponses ? body.contextResponses : null;
                var err = body.errorCode;
                if (!error && response && !err) {
                    var events = [];

                    resp.forEach(function (elem) {
                        var event = {};
                        event.title = elem.contextElement.id;
                        elem.contextElement.attributes.forEach(function (attrib) {
                            if (attrib.name == 'startDate') {
                                event.start = new Date(parseInt(attrib.value));
                            }
                            if (attrib.name == 'endDate') {
                                event.end = new Date(parseInt(attrib.value));
                            }
                        });
                        events.push(event);
                    });
                    orderEvents = events;
                    callback(null);
                } else {
                    if (err.code == 404)
                        callback(null);
                    if (err.code == 400)
                        return calback(err);
                }
            });
        },
        getMachineRecurringEvents: function (callback) {
            var machineId = req.query.machineId.toLowerCase().split(' ').join('');
            machineId = factoryId + "_" + machineId;
            var url = urls.v2_url + "entities/" + machineId + "/attrs/recurringEvents/value";

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
                if (response.statusCode == 200) {
                    recurring = body.value;
                    callback(null);
                }
                else
                    return callback(response.statusCode);
            });
        }
    }, function (err) {
        if (err) {
            return res.json(err);
        } else {
            EventUtils.getEventsBetweenDates(orderEvents, startDate, endDate, function (events) {
                EventUtils.generateRecurringEvents(events, recurring, startDate, endDate, function (allevents) {
                    res.json(allevents);
                });

            });
        }
    });
};

exports.isFreeSlot = function (req, res) {
    var machine = req.body.machine;
    var orderId = req.body.orderId;
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var factoryId = req.session.passport.user.factoryId;
    machine = factoryId + "_" + machine;
    var orderEvents = [];
    var recurring = [];

    if (machine && startDate && endDate) {
        async.auto({
            getMachineOrders: function (callback) {
                var orderRequest = {
                    "entities": [
                        {
                            "type": "Order",
                            "isPattern": "true",
                            "id": ".*"
                        }
                    ],
                    "restriction": {
                        "scopes": [
                            {
                                "type": "FIWARE::StringQuery",
                                "value": "machine==" + encode.encodeString(machine) + ";"
                            }
                        ]
                    }
                };

                console.log(JSON.stringify(orderRequest));

                request({
                    url: urls.queryURL,
                    method: "POST",
                    json: true,
                    body: orderRequest,
                    header: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    proxy: false
                }, function (error, response, body) {
                    var resp = body.contextResponses ? body.contextResponses : null;
                    var err = body.errorCode;
                    if (!error && response && !err) {
                        var events = [];

                        resp.forEach(function (elem) {
                            var event = {};
                            event.title = elem.contextElement.id;
                            elem.contextElement.attributes.forEach(function (attrib) {
                                if (attrib.name == 'startDate') {
                                    event.start = new Date(parseInt(attrib.value));
                                }
                                if (attrib.name == 'endDate') {
                                    event.end = new Date(parseInt(attrib.value));
                                }
                            });
                            if (event.title != orderId)
                                events.push(event);
                        });
                        orderEvents = events;
                        callback(null);
                    } else {
                        if (err.code == 404)
                            callback(null);
                        if (err.code == 400)
                            return calback(err);
                    }
                });
            },
            getMachineRecurringEvents: function (callback) {
                var machineId = req.body.machine.toLowerCase().split(' ').join('');
                machineId = factoryId + "_" + machineId;
                var url = urls.v2_url + "entities/" + machineId + "/attrs/recurringEvents/value";

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
                    if (response.statusCode == 200) {
                        recurring = body.value;
                        callback(null);
                    }
                    else
                        return callback(response.statusCode);
                });
            }
        }, function (err) {
            console.log(err);
            if (err) {
                return res.json(false);
            } else {
                EventUtils.getEventsBetweenDates(orderEvents, startDate, endDate, function (events) {
                    EventUtils.generateRecurringEvents(events, recurring, startDate, endDate, function (allevents) {
                        console.log(allevents);
                        EventUtils.isFreeSlot(allevents, startDate, endDate, function (status) {
                            if (status)
                                return res.json(true);
                            else
                                return res.json(false);
                        });
                    });

                });
            }
        });
    } else {
        return res.json(true);
    }
};