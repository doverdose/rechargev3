/* Site controller
 */

module.exports = (function() {
	'use strict';

	exports.index = function(req,res){
		res.render('site/index.ejs');
	};

}());

