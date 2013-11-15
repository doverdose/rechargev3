/* Admin
 */

(function() {
	"use strict";

	var admin = function() {

		var $container = $('.js-admin-container');

		var init = function() {

			var $popover = $('[rel="popover"]', $container);

			$popover.popover();

			$popover.on('show.bs.popover', function () {
				// do something…
				 console.log('show');
			})

		};

		return {
			init: init
		}

	}();

	$(document).ready(admin.init);

})();
