/* Main javascript frontend functionality
 */

(function() {
	'use strict';

	var main = (function() {
		var providerFilter = function() {
			if($('.provider-select').length !== 1) {
				return;
			}

			$('.provider-select').on('change', function() {
				$.get('/schedule/patients/' + $('.provider-select').val(), function(response) {
					$('.patient-select').html('');
					for(var i = 0; i < response.length; i++) {
						$('.patient-select').append('<option value="' + response[i]._id + '">' + response[i].name + '</option>');
					}
				}, 'json');
			});
		};

		var passwordInit = function() {
			if($("#password-input").length == 1) {
				if($(window).width() > 1024) {
					$("#password-input").css("cursor", "default");
					$("#password-input").keyup(function(e) {
						var charCode = e.keyCode ? e.keyCode : e.which;
						if (charCode >= 48  && charCode <= 57) {
							numpad.addDigitManual(String.fromCharCode(charCode));
						}
					});
					$(".password-keypad").hide();
				}
			}
		}

		var init = function() {
			// initialize bootstrap tooltips
			$('[data-toggle="tooltip"]').tooltip();

			// initialize tabs
			$('[data-toggle="tab"]').click(function (e) {
				e.preventDefault();
				$(this).tab('show');
			});

			// init select2
			$('.js-select2 not:js-following-popover-template').select2();

			// init datepicker
			$('.js-upcoming-date').datepicker({
				orientation: 'top auto',
				startDate: new Date()
			});

			//init sms notification
			if($('#smsNotifications').length > 0) {
				$('#smsNotifications').change(function() {
					$('#_smsNotifications').val($('#smsNotifications').is(':checked'));
				});
			}

			providerFilter();
			passwordInit();
		};

		return {
			init: init
		};
	}());

	$(document).ready(main.init);
})();
