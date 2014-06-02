$(document).ready(function() {
	$(".legend").bind('click', function() {
		if($(this).siblings('.details').is(":visible")) {
			$(this).siblings('.details').hide('slow');
		} else {
			$(this).siblings('.details').show('slow');
		}
	});
});