/* Site controller
 */

module.exports = (function() {
	'use strict';

	var index = function(req,res){
		res.render('site/index.ejs');
	};

	return {
		index: index
	};

}());

