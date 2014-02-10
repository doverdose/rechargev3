/* Visibility selector
 *
 * Shows an element depending on the selected in a select.
 * Used in the Checkin Template editor.
 */

(function() {
	'use strict';

	var visibilitySelector = (function() {
		var $select,
			$options,
			elementSelector,
			hideClass = 'js-visibility-select-hide',
			showClass = 'js-visibility-select-show';

		var showElement = function() {
			// hide previous selection
			$('.' + showClass).removeClass(showClass);

			// show element for current selection
			var optionSelected = $('option:selected', this);
			elementSelector = optionSelected.attr('data-show');
			$(elementSelector).addClass(showClass);
		};

		var init = function() {
			$select = $('.js-visibility-select');
			$options = $('option', $select);

			// hide all elements that will be toggled
			$options.each(function(i, option) {
				elementSelector = $(option).attr('data-show');
				if(elementSelector) {
					$(elementSelector).addClass(hideClass);
				}
			});

			$select.on('change', showElement);
			$select.trigger('change');
		};

		return {
			init: init
		};
	}());

	$(document).ready(visibilitySelector.init);
})();
