/* Clone field
 *
 * Clones an existing DOM node.
 * Used in the Checkin Template editor.
 */

(function() {
	"use strict";

	var cloneField = function() {

		var $container,
			fieldSelector,
			$clone,
			$field;

		var cloneField = function() {
			$field = $(fieldSelector, $container).last();
			$clone = $field.clone();
			$('input', $clone).val('');

			$field.after($clone);
		};

		var removeField = function() {
			$(this).parents(fieldSelector).remove();
		};

		var init = function() {
			$container = $('.js-clone-field');
			fieldSelector = $container.attr('data-clone');

			$container.delegate('.js-clone-field-btn', 'click', cloneField);
			$container.delegate('.js-remove-field-btn', 'click', removeField);
		};

		return {
			init: init
		}

	}();

	$(document).ready(cloneField.init);
})();
