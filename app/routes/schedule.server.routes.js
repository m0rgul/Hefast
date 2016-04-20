var schedule = require('../../app/controllers/schedule.server.controller'),
    user = require('../../app/controllers/user.server.controller'),
    factory = require('../../app/controllers/factoryDetails.server.controller');

module.exports = function (app) {
    app.route('/schedule').get(user.isAuthenticated, user.isFactory, factory.isFactoryData, schedule.render);
    app.get('/schedule/getMachineSchedule', user.isAuthenticated, user.isFactory, schedule.getMachineSchedule);
    app.post('/schedule/isFreeSlot', user.isAuthenticated, user.isFactory, schedule.isFreeSlot);
};