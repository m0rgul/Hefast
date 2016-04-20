var index = require('../../app/controllers/index.server.controller');

module.exports = function (app) {
    app.route('/')
        .get(index.render);
    app.route('/404').get(function (req, res) {
        res.render('404.ejs');
    });
};