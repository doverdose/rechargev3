/* Dashboard controller
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose')
	var	Checkin = mongoose.model('Checkin')
  var CheckinTemplate = mongoose.model('CheckinTemplate')
  var Survey = mongoose.model('Survey')
	var	moment = require('moment')
	var	async = require('async')
  var helper = require('../controllers/components/helper')

	var checkinsForInterval = function(userID, startDate, endDate, index, renderVars, callback) {
		Checkin.find({
			timestamp: {
				$lt: endDate.toDate(),
				$gt: startDate.toDate()
			},
			user_id: userID
		}, {
			score: true,
			timestamp: true
		}, {
			sort: {
				timestamp: 1
			}
		}, function(err, results) {
			if (err) {
				callback(err);
			}
			renderVars[index] = results;
			callback(null, results);
		});
	};

	var index = function(req, res, next) {		     
       
    // Get survey activity
    async.parallel([
      function (callback){
        helper.getAssignedSurveys(req.user.id, function(err, results) {
          if (err) {
            next(err)
          }          
          callback(null, results)
        })
      }
    ],
    function(err, results) {
      if (err) {
        next(err)
      }
      
      var activeCt = 0
      var doneCt = 0
      
      results[0].forEach(function(item,ind,arr){
        if(item.isActive) {
          activeCt++
        }  
        if(item.isDone) {
          doneCt++
        }
      })
                 
      res.render('dashboard/index.ejs', {
        active: activeCt,
        done: doneCt
      })  
    }) 
    
	};

	return {
		index: index,
		checkinsForInterval: checkinsForInterval
	};

}());

