var paymentEngine = require('./../modules/paymentEngine.js'),
    uuid = require('node-uuid'),
    nodemailer = require('nodemailer'),
    smtpTransport = require("nodemailer-smtp-transport");


exports.render = function (req, res) {

    var options = {
        cancel: req.flash('cancel'),
        error: req.flash('error'),
        success: req.flash('success')
    };

    res.render('factory/payments.ejs', options);
};

exports.payUp = function (req, res) {
    var order = {
        amount: req.query.value,
        currency: req.query.currency,
        subType: req.query.subType,
        desc: req.query.desc ? req.query.desc : "My awesome payment",
        orderId: uuid.v4()
    };

    req.session.order = order;

    paymentEngine.createPayment(order, function (err, response) {
        if (err)
            return res.send(err);

        if (response) {
            req.session.order.paymentId = response.paymentId;
            if (response.redirectURL)
                return res.redirect(response.redirectURL);
        }
    });

};

exports.execute = function (req, res) {
    var sessOrder = req.session.order;

    var order = {
        id: sessOrder.orderId,
        paymentId: sessOrder.paymentId,
        payerId: req.query.PayerID
    };

    paymentEngine.executePayment(order, function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/payments');
        }
        req.flash('success', true);
        res.redirect('/payments')
    });
};

exports.cancel = function (req, res) {
    req.flash('cancel', true);
    res.redirect('/payments');
};

exports.getPaymentPlans = function (req, res) {
    paymentEngine.listPaymentPlans(function (err, results) {
        if (err)
            return res.send(err);
        res.json(results);
    });
};

exports.cep = function (req, res) {
    console.log('CEP said...');
    console.log(req.body);
    res.end();

    /*var smtpTrans = nodemailer.createTransport(smtpTransport({
     host: "smtp1.servage.net",
     secureConnection: false,
     port: 2525,
     auth: {
     user: "johnny@bluemind-software.ro",
     pass: "bmspass1"
     }
     }));

     var mailOptions = {
     to: '',
     from: 'johnny@bluemind-software.ro',
     subject: 'Payment fail',
     html: 'The followind payment has failed: <b>' + req.body.paymentId + '</b>'
     };

     smtpTrans.sendMail(mailOptions, function (err) {
     if (err)
     return res.json(err);
     return res.end();
     });*/

};