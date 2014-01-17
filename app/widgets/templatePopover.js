/* Bootstrap Popover with HTML content
 */

(function() {
	'use strict';

	var templatePopover = function() {

		var $popover;

		var init = function() {

			$popover = $('[rel=popover][data-tpl]');

			$popover.each(function(i, elem) {
				var $elem = $(elem),
					popoverTemplate = $($elem.attr('data-tpl')).html();

				$elem.popover({
					html: true,
					content: popoverTemplate
				});

				$elem.on('shown.bs.popover', function () {
					var $popover = $elem.siblings('.popover');
					var $select2 = $('.js-select2', $popover);
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
