/* Checkin Selector
 */

(function() {
	'use strict';

	var checkinSelector = function() {

		var $container,
			$popover,
			checkinSelectorTemplate;

		var init = function() {

			$container = $('.js-checkinselector-container');

			if($container) {
				$popover = $('.js-checkinselector-btn', $container);
				checkinSelectorTemplate = $('.js-checkinselector-template', $container).html();

				console.log(checkinSelectorTemplate);

				$popover.popover({
					content: checkinSelectorTemplate
				});

				$popover.on('shown.bs.popover', function () {
					var $checkinSearch = $('.js-checkinsearch');

					// init select2
					$checkinSearch.select2();
				})
			}

		};

		return {
			init: init
		}

	}();

	$(document).ready(checkinSelector.init);

})();
