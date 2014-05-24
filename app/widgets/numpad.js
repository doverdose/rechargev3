/* Signup */

(function() {
	'use strict';

	var numpad = (function() {
		var $container,
			$btnsNum,
			$btnReveal,
			$containerForm,
			$btnSubmit,
			$containerPassword,
			$btnDelete,
			$fieldPasswordReal,
			$fieldPassword,
			inputMasked = true,
			passwordValue = '';

		var updatePassword = function() {
			if(inputMasked) {
				var maskedPassword = '';
				for(var i = 0; i < passwordValue.length; i++) {
					maskedPassword += '●';
				}
				$fieldPassword.val(maskedPassword);
			} else {
				$fieldPassword.val(passwordValue);
			}
		};

		var addDigit = function() {
			if(passwordValue.length < 10) {
				passwordValue = passwordValue + $(this).text();
			}
			updatePassword();
		};

		var addDigitManual = function(digit) {
			if(passwordValue.length < 10) {
				passwordValue = passwordValue + digit.toString();
			}
			updatePassword();
		};

		var removeDigit = function() {
			if(passwordValue.length > 0) {
				passwordValue = passwordValue.substr(0, passwordValue.length-1);
			}
			updatePassword();
		};

		var toggleReveal = function() {
			if($btnReveal.hasClass('active')) {
				inputMasked = true;
			} else {
				inputMasked = false;
			}
			updatePassword();
			$btnReveal.toggleClass('active');
		};

		var submitForm = function() {
			$fieldPasswordReal.val(passwordValue);
			$containerForm.submit();
			return false;
		};

		var init = function() {
			$container = $('.js-password-keypad');
			$btnsNum = $('button:not(.js-btn-reveal)', $container);
			$btnReveal = $('.js-btn-reveal', $container);

			$containerPassword = $('.js-password-container');
			$btnDelete = $('.js-btn-delete-char', $containerPassword);
			$fieldPassword = $('.js-password', $containerPassword);
			$fieldPasswordReal = $('.js-password-real', $containerPassword);

			$containerForm = $('.js-form-numpad');
			$btnSubmit = $('.js-btn-submit', $containerForm);

			$btnsNum.click(addDigit);
			$btnDelete.click(removeDigit);
			$btnReveal.click(toggleReveal);
			$btnSubmit.click(submitForm);
		};
		return {
			init: init,
			addDigitManual: addDigitManual
		};

	}());

	$(document).ready(numpad.init);

	window.numpad = numpad;

})();
