var orders = require('../../app/controllers/orders.server.controller'),
    user = require('../../app/controllers/user.server.controller'),
    factory = require('../../app/controllers/factoryDetails.server.controller'),
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
    app.route('/orders').get(user.isAuthenticated, user.isFactory, factory.isFactoryData, orders.render);
    app.route('/orders/placeOrder').post(user.isAuthenticated, uploadImage.single('file'), orders.placeOrder);
    app.route('/orders/:orderId').get(user.isAuthenticated, orders.getOrderById);
    app.route('/orders/scheduleOrder').post(user.isAuthenticated, user.isFactory, orders.scheduleOrder);
    app.route('/orders/getFactoryOrders').post(user.isAuthenticated, orders.getFactoryOrders);

    app.route('/orders/download/:orderId').get(orders.downloadFile);
};