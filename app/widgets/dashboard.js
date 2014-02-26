'use strict';

var dashboard = {
	init: function() {
		if($(".dashboard-wrapper").length == 0) {
			return;
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
			currentDate.setDate(1);
			currentDate.setHours(0, 0, 0, 0);
			nextDate.setDate(1);
			nextDate.setHours(0, 0, 0, 0);

			return nextDate.getTime() == currentDate.getTime();
		});
	},
	plotChart: function(placeHolder, rawData, timeFormat, compareDates) {
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
};
$(document).ready(function() {
	dashboard.init();
});