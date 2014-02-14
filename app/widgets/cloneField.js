/* Clone field
 *
 * Clones an existing DOM node.
 * Used in the Checkin Template editor.
 */

(function() {
	'use strict';

	var cloneField = (function() {

		var $container,
			fieldSelector,
			$clone,
			$field,
			removeBtn = '.js-remove-field-btn';

		var cloneField = function() {
			$field = $(fieldSelector, $container).last();
			$clone = $field.clone();
			$('input', $clone).val('');

			$field.after($clone);

			checkRemovable();
		};

		var removeField = function() {
			$(this).parents(fieldSelector).remove();

			checkRemovable();
		};

		var checkRemovable = function() {

			// check if there are multiple fields
			var $fields = $(fieldSelector, $container);
			if($fields.length > 1) {
				$(removeBtn, $fields).attr('disabled', false);
			} else {
				$(removeBtn, $fields).attr('disabled', true);
			}

		};

		var init = function() {
			$container = $('.js-clone-field');
			fieldSelector = $container.attr('data-clone');

			$container.delegate('.js-clone-field-btn', 'click', cloneField);
			$container.delegate(removeBtn, 'click', removeField);

			checkRemovable();
		};

		return {
			init: init
		};

	}());

	$(document).ready(cloneField.init);
})();
