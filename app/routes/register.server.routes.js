var register = require('../../app/controllers/register.server.controller');

module.exports = function (app) {
    app.route('/register')
        .get(register.render)
        .post(register.registerFactory);

    app.route('/registerUser').get(register.renderUserForm);

    app.route('/register/userData').get(register.getUserSessionData);
};