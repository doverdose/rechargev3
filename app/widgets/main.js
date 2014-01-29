/* Main javascript frontend functionality
 */

(function() {
	"use strict";

	var main = function() {

		var init = function() {

			// initialize bootstrap tooltips
			$('[data-toggle="tooltip"]').tooltip();

		};

		return {
			init: init
		}

	}();

	$(document).ready(main.init);
})();
