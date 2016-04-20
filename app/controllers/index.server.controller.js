exports.render = function (req, res) {
    req.session.page = 'index';
    console.log(req.session);
    res.render('index', {message: req.flash('error')});
};