/* Main javascript frontend functionality
 */

(function() {
	'use strict';

	var main = (function() {

		var init = function() {

			// initialize bootstrap tooltips
			$('[data-toggle="tooltip"]').tooltip();

			// initialize tabs
			$('[data-toggle="tab"]').click(function (e) {
				e.preventDefault();
				$(this).tab('show');
			});

			// init select2
			$('.js-select2').select2();

			// init datepicker
			$('.js-upcoming-date').datepicker({
				orientation: 'top auto',
				startDate: new Date()
			});

		};

		return {
			init: init
		};

	}());

	$(document).ready(main.init);
})();
