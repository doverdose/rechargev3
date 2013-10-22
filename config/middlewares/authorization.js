/*
 *  Restrict pages that require login
 */

exports.requiresLogin = function (req, res, next) {
	if (!req.isAuthenticated()) {
		req.flash('error', 'You are not authorized');
		req.session.returnTo = req.originalUrl
		return res.redirect('/login')
	}
	next()
}

