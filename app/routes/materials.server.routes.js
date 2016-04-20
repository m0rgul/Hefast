var materials = require('../../app/controllers/materials.server.controller'),
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

    app.route('/materials').post(user.isAuthenticated, user.isFactory, uploadImage.single('file'), materials.addMaterial);
    app.route('/materials/delete').post(user.isAuthenticated, user.isFactory, materials.deleteMaterial);
    app.route('/materials/update').post(user.isAuthenticated, user.isFactory, uploadImage.single('file'), materials.updateMaterial);
};