var request = require('request'),
    async = require('async'),
    paypal = require('paypal-rest-sdk'),
    uuid = require('node-uuid'),
    mysql = require('mysql');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AVgwuIaDUDvUaH7mM8xQb5P-1L4_IoMUlbdwlcoF_oIuVrmvVpROpYZZ0bORIIX8UP_8G_mcyMMHBoxi',
    'client_secret': 'EJN0VASkoTl_HeVpaK-iLAchZjQApf_jVxlIFZYLQQhY8Sf3GRIQkqXdfD-Fzb4aUnLAokGD6xd4kMXU'
});

var mySqlConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hefast'
};

var getMonthMS = function getMonthMs(months) {
    var month = 30 * 24 * 60 * 60 * 1000;
    return months * month;
};

var getExpirationDate = function getExpirationDate(date, duration) {
    var expirationDate = date ? date : new Date().getTime();
    return expirationDate + getMonthMS(duration);
};

module.exports = {
    createPayment: function (order, callback) {
        var paypalPayment = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                return_url: "http://127.0.0.1:3000/payments/execute?order_id=" + order.orderId,
                cancel_url: "http://127.0.0.1:3000/payments/cancel?order_id=" + order.orderId
            },
            "transactions": [{
                description: order.desc,
                "amount": {
                    "total": order.amount,
                    "currency": order.currency
                }
            }]
        };

        async.waterfall([
                createPay = function (next) {
                    paypal.payment.create(paypalPayment, {}, function (err, resp) {
                        if (err) {
                            return next(err);
                        }
                        if (resp) {
                            console.log(resp);
                            var link = resp.links;
                            for (var i = 0; i < link.length; i++) {
                                if (link[i].rel === 'approval_url') {
                                    return next(null, {redirectURL: link[i].href, paymentId: resp.id});
                                }

                            }
                        }
                    });
                },
                postToCEP = function (resp, next) {
                    console.log('posting to CEP');
                    var payment = {
                        "Name": "payment",
                        "paymentId": resp.paymentId
                    };
                    request({
                        url: 'http://130.206.113.46:8080/ProtonOnWebServer/rest/events',
                        method: "POST",
                        body: payment,
                        json: true,
                        header: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        proxy: false
                    }, function (error, response, body) {
                        console.log('CEP error:');
                        console.log(error);

                        if (error)
                            return next(error);
                        next(null, resp);

                    });
                }
            ],
            function (error, resp) {
                if (error)
                    return callback(error);
                if (resp.redirectURL)
                    return callback(null, resp);
            });
    },
    executePayment: function (order, callback) {

        var connection = mysql.createConnection(mySqlConfig);

        async.waterfall([
                executePay = function (next) {
                    paypal.payment.execute(order.paymentId, {"payer_id": order.payerId}, function (error, payment) {
                        if (error) {
                            return next(error);
                        } else {
                            next(null, payment);

                        }
                    });
                },
                writePaymentToDB = function (payment, next) {
                    console.log(payment.transactions[0].amount);
                    var payObj = {
                        username: order.payerId,
                        type: 'paypal', //for the moment
                        id_transaction: order.paymentId,
                        amount: payment.transactions[0].amount.total,
                        currency: payment.transactions[0].amount.currency,
                        id_subscription: order.id
                    };
                    var query = "INSERT INTO `payments` SET ?";
                    query = mysql.format(query, payObj);

                    console.log(query);

                    connection.query(query, function (err, result) {
                        if (err) {
                            connection.end();
                            return next(err);
                        }
                        else {
                            lastId = result.insertId;
                            connection.end();
                            var resp = {
                                "success": true,
                                "msg": "The modifications have been successfully applied."
                            };
                            next(null, resp);
                        }
                    });

                },
                getCurrentSubscription = function (payment, next) {
                    var url = urls.v2_url + 'entities/' + order.payerId + '/attrs/subscription';
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
                        console.log(body);
                        if (error)
                            return next(error);
                        else {
                            var subscription = 0;
                            if (response.statusCode != 404) {
                                subscription = body.subscription.expirationDate;
                            }
                            next(null, subscription);
                        }
                    });

                },
                updateSubscription = function (subscription, next) {
                    var subUpdate = {
                        recurring: false,
                        duration: 0
                    };


                    subUpdate.expirationDate = getExpirationDate(subscription, order.duration);

                    var url = urls.v2_url + 'entities/' + order.payerId;

                    request({
                        url: url,
                        method: "POST",
                        body: {subscription: subUpdate},
                        json: true,
                        header: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        proxy: false
                    }, function (error, response, body) {
                        if (error)
                            return next(error);
                        else {
                            next();
                        }
                    });
                }
            ],
            function (error) {
                if (error) {
                    console.log(error);
                    return callback(error);
                }
                return callback();
            });
    },
    listPayments: function (user, filters, callback) {

    },
    listPaymentPlans: function (callback) {
        var query = "SELECT * FROM `packages`";
        var connection = mysql.createConnection(mySqlConfig);
        connection.query(query, function (err, results) {
            if (err) {
                connection.end();
                return callback(err);
            }
            else {
                var plans = [];
                results.forEach(function (element) {
                    var plan = {};

                    plan.durations = [];
                    plan.prices = [];
                    plan.currency = element.currency;

                    var el = element.packet_name.split('_');
                    var name = el[0];
                    console.log(name);

                    switch (name) {
                        case 'soft':
                            plan.name = 'Software Package';
                            break;
                        case 'reports':
                            plan.name = 'Activity Reports';
                            break;
                        case 'softRep':
                            plan.name = 'Software + Reports';
                            break;
                    }

                    results.forEach(function (elem) {
                        if (elem.packet_name.split('_')[0] == name)
                            if (plan.durations.indexOf(elem.duration) == -1) {
                                plan.durations.push(elem.duration);
                                plan.prices.push(elem.price);
                            }
                    });

                    if (!existsInArray(plans, plan))
                        plans.push(plan);
                });

                callback(null, plans);
            }
        });
    }
};

var existsInArray = function findInArray(array, element) {
    for (var i = 0; i < array.length; i++) {
        var elem = array[i];
        if (elem.name == element.name)
            return true;
    }
    return false;
};