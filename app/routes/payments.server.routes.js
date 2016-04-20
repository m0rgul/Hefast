var payments = require('../../app/controllers/payments.server.controller'),
    user = require('../../app/controllers/user.server.controller');

module.exports = function (app) {
    app.route('/payments')
        .get(payments.render);

    //single payments
    app.get('/payments/create', payments.payUp);
    app.get('/payments/execute', payments.execute);
    app.get('/payments/cancel', payments.cancel);

    app.post('/payments/cep', payments.cep);

    app.get('/payments/listPlans', payments.getPaymentPlans);
};