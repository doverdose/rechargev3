'use strict';

var dashboard = {
	init: function() {
		if($(".dashboard-index").length == 0) {
			return;
		}

		if(jsVars.weekResults.length == 0 && jsVars.monthResults.length == 0 && jsVars.yearResults.length == 0) {
			dashboard.showNoData("You haven't made any check-ins yet. Come back later, once you've checked-in a couple of times.");
		}

		dashboard.plotChart('#week-results', jsVars.weekResults, "%a, %e %b", function(currentDate, nextDate) {
			currentDate.setHours(0, 0, 0, 0);
			nextDate.setHours(0, 0, 0, 0);

			return nextDate.getTime() == currentDate.getTime();
		});
		dashboard.plotChart('#month-results', jsVars.monthResults, "%b", function(currentDate, nextDate) {
			currentDate.setDate(1);
			currentDate.setHours(0, 0, 0, 0);
			nextDate.setDate(1);
			nextDate.setHours(0, 0, 0, 0);

			return nextDate.getTime() == currentDate.getTime();
		});
		dashboard.plotChart('#year-results', jsVars.yearResults, "%Y", function(currentDate, nextDate) {
			currentDate.setMonth(1);
			currentDate.setDate(1);
			currentDate.setHours(0, 0, 0, 0);
			nextDate.setMonth(1);
			nextDate.setDate(1);
			nextDate.setHours(0, 0, 0, 0);

			return nextDate.getTime() == currentDate.getTime();
		});
	},
	showNoData: function(message) {
		$(".plots").hide();
		$(".notice").html(message).show();
	},
	plotChart: function(placeHolder, rawData, timeFormat, compareDates, plot) {
		plot = plot === undefined ? true : false;

		if(rawData.length == 0) {
			$(placeHolder + "-no").show();
		}

		var dataSet = [];
		if(rawData.length > 0) {
			for(var i = 0; i < rawData.length; i++) {
				var date = new Date(rawData[i].timestamp);
				var score = rawData[i].score;

				for(var j = i + 1; j < rawData.length; j++) {
					var currentDate = new Date(rawData[i].timestamp);
					var nextDate = new Date(rawData[j].timestamp);

					if(compareDates(currentDate, nextDate)) {
						score += rawData[j].score;
						i++;
						continue;
					}
					break;
				}

				dataSet.push([
					date.getTime(),
					score
				]);
			}
		}

		if(plot == true) {
			$.plot($(placeHolder), [dataSet], {
				xaxis: {
					mode: 'time',
					timeformat: timeFormat
				},
				series: {
			        lines: { show: true, fill: true },
	        		points: { show: true, fill: false }
			    }
			});
		}

		return dataSet;
	}
};
$(document).ready(function() {
	dashboard.init();
});