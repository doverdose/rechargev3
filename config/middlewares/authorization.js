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

/* If user is logged-in, don't redirect to dashboard.
 * Used for Login and Register
 */

exports.isLoggedIn = function (req, res, next) {
	if(req.isAuthenticated()) {
		return res.redirect('/dashboard')
	}
	next()
}