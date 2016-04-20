var home = require('../../app/controllers/homepage.server.controller'),
    user = require('../../app/controllers/user.server.controller'),
    multer = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now());
    }
});

var uploadImage = multer({storage: storage});


module.exports = function (app) {
    app.route('/home').get(home.render);

    app.route('/api/getFactoryData').get(home.getFactoryData);

    app.route('/home/editFactory').get(home.editFactory);

    app.route('/home/api/getFactoryMachines').post(home.getFactoryMachines);
    app.route('/home/api/getFactoryMaterials').get(home.getFactoryMaterials);

    //orders

    app.route('/api/getUserFactoryData').get(home.getUserFactoryData);


    /* These will be the new routes */
    app.route('/factory/getNavInfo').get(user.isAuthenticated, user.isFactory, home.getFactoryNavInfo);
    app.route('/factory/getFactoryInfo').get(home.getFactoryPublicInfo);
    app.route('/api/getFactoryInfo/:factoryId/').get(home.getFactoryPublicInfo);
    app.route('/factory/getUserFactory').get(user.isAuthenticated, home.getUserFactory);
    app.route('/home/factory').get(user.isAuthenticated, home.renderClientFactoryPage);
    app.route('/home/orders').get(user.isAuthenticated, home.renderClientOrderPage);

};