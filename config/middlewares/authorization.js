/* Authorization Middleware
 * Restrict pages based on authentication and permissions
 */

module.exports = (function() {
	'use strict';

	var requiresLogin = function (req, res, next) {

		if(req.method === 'GET') {
			req.session.lastUrl = req.url;
		}

		if (!req.isAuthenticated()) {
			req.flash('error', 'You are not authorized');
			req.session.returnTo = req.originalUrl;
			return res.redirect('/login');
		}
		next();
	};

	/* If user is logged-in, redirect to dashboard.
	* Used for Login and Register
	*/

	var isLoggedIn = function (req, res, next) {
		if(req.isAuthenticated()) {
			return res.redirect('/dashboard');
		}

		next();
	};

	/* Require Admin permission
	*/
	var requiresAdmin = function(req, res, next) {

		if(!req.user.permissions.admin) {
			req.session.returnTo = req.originalUrl;
			return res.send(403, 'Forbidden');
		}
		next();

	};

	/* Require Provider permission
	*/
	var requiresProvider = function(req, res, next) {

		if(!req.user.permissions.provider && !req.user.permissions.admin) {
			req.session.returnTo = req.originalUrl;
			return res.send(403, 'Forbidden');
		}
		next();

	};

	/* Require Provider permission
	*/
	var requiresPacient = function(req, res, next) {

		if(req.user.permissions.provider || req.user.permissions.admin) {
			req.session.returnTo = req.originalUrl;
			return res.send(403, 'Forbidden');
		}
		next();

	};

	return {
		requiresLogin: requiresLogin,
		isLoggedIn: isLoggedIn,
		requiresAdmin: requiresAdmin,
		requiresProvider: requiresProvider
	};

}());

