/* Usersearch
 */

(function() {
	"use strict";

	var admin = function() {

		var $container,
			$popover,
			userSearchTemplate;

		var init = function() {

			$container = $('.js-usersearch-container'),
			$popover = $('[rel="popover"]', $container);
			userSearchTemplate = $('.js-usersearch-template', $container).html();

			$popover.popover({
				content: userSearchTemplate
			});

			$popover.on('shown.bs.popover', function () {
				var $userSearch = $('.js-usersearch');

				// init select2
				$userSearch.select2();
			})

		};

		return {
			init: init
		}

	}();

	$(document).ready(admin.init);

})();
