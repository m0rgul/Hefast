var request = require('request');

exports.authUser = function (req, res) {
    var sess = req.session;
    console.log(sess);

    if (!sess.page) {
        req.flash('error', 'Something went wrong. Please retry.');
        req.logout();
        return res.redirect('/');
    }

    if (sess.page && Object.keys(sess.passport.user.user).length == 0) {
        //user not found, redirect to register pages
        if (sess.page == 'index')
            return res.redirect('/register');
        else if (sess.page == 'client')
            return res.redirect('/registerUser');
    }

    if (sess.page && Object.keys(sess.passport.user.user).length > 0) {
        res.redirect('/home');
    }
};

exports.logout = function (req, res) {
    req.logout();
    req.session.user = {};
    res.redirect('/');
};