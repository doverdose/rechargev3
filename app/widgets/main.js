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
          };

        return {
          init: init
        };
      }());

    $(document).ready(main.init);
  })();
