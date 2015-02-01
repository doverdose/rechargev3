/* Helper functions */

module.exports = (function() {

  var mongoose = require('mongoose'),
        async = require('async'),
        moment = require('moment'),
        Schedule = mongoose.model('Schedule'),
        Checkin = mongoose.model('Checkin'),
        Survey = mongoose.model('Survey'),
        AssignedSurvey = mongoose.model('AssignedSurvey'),
        CheckinTemplate = mongoose.model('CheckinTemplate');
  
  var listSurveys = function (user_id, next) {
    
    var templateVars = {};
    Survey.find({}, function (err, surveyTemplates) {
      //all surveys list
      if (err) {
        return next(err);
      }
      templateVars.surveyTemplates = surveyTemplates;
      
      Checkin.find({
        user_id: user_id
      }, {
        survey_id: true,
      }, function (err, results) {
        if (err) {
          next(err);
        }
        var surveys = [];
        for (var i = 0; i < results.length; i++) {
          surveys.push(results[i].survey_id);
        }
        
        Survey.find({
          _id: {
            $in: surveys
          }
        }, function (err, surveysFound) {
          templateVars.surveys = surveysFound;

          async.parallel([
            function (callback) {
              // get checkin details
              Checkin.find({
                user_id: user_id
              }, function (err, checkins) {
                if (err) {
                  return next(err);
                }
                templateVars.checkins = checkins.reverse();
                callback();
              });
            },
            function (callback) {
              // get total score from all checkins
              Checkin.find({
                user_id: user_id
              }, function (err, checkins) {
                if (err) {
                  return next(err);
                }

                // calculate user score
                var totalScore = 0;
                checkins.forEach(function (checkin) {
                  totalScore += checkin.score || 0;
                });

                templateVars.totalScore = totalScore;
                callback();
              });
            },
            function (callback) {
              CheckinTemplate.find({}, function (err, checkinTemplates) {
                if (err) {
                  return next(err);
                }
                templateVars.checkinTemplates = checkinTemplates;
                callback();
              });
            },
            function (callback) {
              AssignedSurvey.find({userId: user_id}, function (err, assignedSurveys) {
                if (err) {
                  return next(err);
                }
                templateVars.assignedSurveys = assignedSurveys;
                callback();
              });
            }
          ], function (err) {
            if (err) {
              next(err);
            }

            var nextMonday = moment().day(8).hour(0).minute(0).toDate(),
                tomorrow = moment().add('days', 1).hour(0).minute(0).toDate(),
                today = moment().hour(0).minute(0).second(0).toDate();

            
            // For every assigned survey, populate object with survey and checkin titles
            var surveyData = templateVars.assignedSurveys.map(function(aSurvey){              
              var currSurvey = {
                id: aSurvey.surveyId,
                title: "",
                checkinTemplates: [],
                isCompleted: false
              };
              
              templateVars.surveyTemplates.every(function(surveyTemplate){
                if (surveyTemplate._id.equals(aSurvey.surveyId)) {
                  
                  currSurvey.title = surveyTemplate.title;
                  
                  if(surveyTemplate.checkinTemplates) {
                    
                    currSurvey.checkinTemplates = surveyTemplate.checkinTemplates.map(function(cTempId){
                      var currCheckinTemplate = {
                        _id: cTempId,
                        title: "",
                        answers: [],
                        checkins: []
                      };
                      
                      templateVars.checkinTemplates.every(function(cTemp){
                        if (cTemp._id.equals(cTempId)) {
                          currCheckinTemplate.title = cTemp.title;
                          currCheckinTemplate.answers = cTemp.answers;
                          return false;
                        }
                        return true;
                      });
                      
                      templateVars.checkins.forEach(function(c){
                        if (String(cTempId) === String(c.template_id)) {
                          currCheckinTemplate.checkins.push(c);
                          currSurvey.isCompleted = true;                          
                        }                        
                      });
                      
                      return currCheckinTemplate;
                    });  
                  }
                  return false;
                }
                return true;
              });
              
              return currSurvey;
         
            });            
            
            // Only add surveys with titles to templateVars
            templateVars.surveyData = [];
            surveyData.forEach(function(survey){
              if (survey.title) {
                templateVars.surveyData.push(survey);
              }
            });
                      
            // get schedules for checking-in, including checkins that don't or haven't expired, and are repeating or have due dates after today
            Schedule.find({
              user_id: user_id,
              $and: [
                {
                  $or: [
                    {
                      expires: false
                    },
                    {
                      expire_date: {
                        $gte: today
                      }
                    }
                  ]
                },
                {
                  $or: [
                    {
                      due_date: {
                        $gte: today
                      }
                    },
                    {
                      repeat_interval: {
                        $gt: 0
                      }
                    }
                  ]
                }
              ]
            }, function (err, schedules) {
              if (err) {
                return next(err);
              }

              templateVars.schedules = {
                today: [],
                thisWeek: []
              };

              // for recurring dates, set the next
              schedules.forEach(function (schedule) {
                // if the due_date has passed, but this is a recurring check-in
                if (schedule.due_date < new Date() && schedule.repeat_interval) {
                  // calculate the number of possible recurring times
                  // then add one more to get the 'next' recurring date
                  var recurringTimes = parseInt(moment().diff(schedule.due_date, 'days') / schedule.repeat_interval) + 1;
                  var nextDueDate = moment(schedule.due_date).add('days', schedule.repeat_interval * recurringTimes).toDate();
                  schedule.due_date = nextDueDate;
                }

                templateVars.checkinTemplates.every(function (template) {
                  if (schedule.template_id.equals(template._id)) {
                    schedule.template = template;
                    return false;
                  }
                  return true;
                });

                // compareDate is the date object against which the current schedule's due date is compared to identify existing checkins
                var compareDate = {
                  date: null,
                  object: null
                };

                // check if the user has already checked-in in the last interval
                if (schedule.due_date < tomorrow) {
                  compareDate.date = tomorrow;
                  compareDate.object = 'today';
                } else if (schedule.due_date < nextMonday) {
                  compareDate.date = nextMonday;
                  compareDate.object = 'thisWeek';
                }

                if (compareDate.date) {
                  // parse all checkins, to see if we already made the required checkin
                  var existingCheckin = false;
                  templateVars.checkins.every(function (checkin) {
                    // look for a template with the same title made in the last day
                    if (checkin.title === schedule.template.title &&
                        checkin.timestamp > moment(compareDate.date).subtract(schedule.repeat_interval, 'days').toDate() &&
                        checkin.timestamp < compareDate.date) {

                      existingCheckin = true;
                      return false;
                    }
                    return true;
                  });

                  // If a checkin hasn't been made, add to schedule object
                  if (!existingCheckin) {
                    templateVars.schedules[compareDate.object].push(schedule);
                  }
                }
              });
              
              next(templateVars);
            });
          });
        });
      });  
    });
 
  };
  
  return {
    listSurveys: listSurveys  
  };
  
}());