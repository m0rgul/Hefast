var client = require('../../app/controllers/user.server.controller'),
    wireCloud = require('../../app/controllers/wirecloud.server.controller');

module.exports = function (app) {
    app.route('/wirecloud').get(client.isAdmin, wireCloud.render);
    /*
     *   General stats
     */
    app.route('/wirecloud/generalStats').get(wireCloud.getGeneralStats);
    app.route('/wirecloud/getAllFactories').get(wireCloud.getAllFactories);
    app.route('/wirecloud/getAllClients').get(wireCloud.getAllClients);
    app.route('/wirecloud/getAllOrders').get(wireCloud.getAllOrders);
    app.route('/wirecloud/getAllMachines').get(wireCloud.getAllMachines);
    app.route('/wirecloud/getAllMaterials').get(wireCloud.getAllMaterials);

    /*
     *   Factory Stats
     */
    app.route('/wirecloud/:factoryId/stats').get(wireCloud.getFactoryStats);
    app.route('/wirecloud/:factoryId/orders').get(wireCloud.getFactoryOrders);
    app.route('/wirecloud/:factoryId/clients').get(wireCloud.getFactoryClients);
    app.route('/wirecloud/:factoryId/machines').get(wireCloud.getFactoryMachines);
    app.route('/wirecloud/:factoryId/materials').get(wireCloud.getFactoryMaterials);

};