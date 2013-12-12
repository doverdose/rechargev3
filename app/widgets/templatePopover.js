/* Bootstrap Popover with HTML content
 */

(function() {
	'use strict';

	var templatePopover = function() {

		var $popover,
			popoverTemplate;

		var init = function() {

			$popover = $('[rel="popover"][data-template]');

			$popover.each(function(i, elem) {
				var $elem = $(elem);
				popoverTemplate = $($elem.attr('data-template')).html();

				console.log(popoverTemplate);

				$elem.popover({
					content: popoverTemplate
				});

				$elem.on('shown.bs.popover', function () {
					var $select2 = $('.select2');

					// init select2
					$select2.select2();
				});

			});

		};

		return {
			init: init
		}

	}();

	$(document).ready(templatePopover.init);

})();
