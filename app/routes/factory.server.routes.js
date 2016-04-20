var factoryDetails = require('../../app/controllers/factoryDetails.server.controller'),
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
    app.route('/factoryDetails')
        .get(user.isAuthenticated, user.isFactory, factoryDetails.render)
        .post(user.isAuthenticated, user.isFactory, uploadImage.single('file'), factoryDetails.updateFactory);

    app.route('/factory/getPrinterTypes').get(user.isAuthenticated, factoryDetails.getPrinterTypes);

    app.route('/factory/:factoryId').get(factoryDetails.renderPublicFactory);
};
