var client = require('../../app/controllers/user.server.controller'),
    factory = require('../../app/controllers/factoryDetails.server.controller');

module.exports = function (app) {
    app.route('/clients')
        .get(client.isAuthenticated, client.isFactory, factory.isFactoryData, client.render)
        .post(client.addUser)
        .put(client.updateUser);
    app.route('/clients/:clientId').delete(client.deleteUser);

    app.route('/clients/factoryClients').get(client.getFactoryClients);
};