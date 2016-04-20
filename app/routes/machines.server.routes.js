var machine = require('../../app/controllers/machines.server.controller'),
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
    app.route('/machine/addMachine').post(user.isAuthenticated, user.isFactory, uploadImage.single('file'), machine.addMachine);
    app.route('/machine/updateMachine').post(user.isAuthenticated, user.isFactory, uploadImage.single('file'), machine.updateMachine);
    app.route('/machine/delete').post(user.isAuthenticated, user.isFactory, machine.deleteMachine);
    app.route('/machine/getRecurringEvents/:machineId').get(user.isAuthenticated, user.isFactory, machine.getRecurringEvents);
};