/* Helper functions */

module.exports = (function() {

  var mongoose         = require('mongoose')
  var async            = require('async')
  var moment           = require('moment')
  var Schedule         = mongoose.model('Schedule')
  var Checkin          = mongoose.model('Checkin')
  var Survey           = mongoose.model('Survey')
  var User             = mongoose.model('User')
  var AssignedSurvey   = mongoose.model('AssignedSurvey')
  var CheckinTemplate  = mongoose.model('CheckinTemplate')
  
  
  // Get survey responses, grouped by survey, for the user with the provided id. Does not check for permissions. If the survey cannot be found, or survey responses with given user_id exists, returns an error
  var getSurveyResponses = function (survey_id, user_id, flash, next) {
    var templateVars = {}
    
    async.parallel([
      function(callback){
        Survey.findOne({_id:survey_id},function(err,foundSurvey){
          if(err){return next(err)}

          templateVars.survey = foundSurvey

          CheckinTemplate.find({_id: {$in:foundSurvey.checkinTemplates}}, function(err, checkinTemplates){
            if(err){return next(err)}
            templateVars.checkinTemplates = checkinTemplates
            callback()
          })
        })
      },
      function(callback){
        Checkin.find({
          user_id: user_id,
          survey_id: survey_id
        })
          .sort({timestamp:-1})
          .exec(function (err, checkins) {
          
          if (err) { return next(err) }

          templateVars.checkins = checkins
          callback()
        })
      }
    ], function(err){
      // Cluster checkins by template, sort by most recent first
      templateVars.checkinsByTemplate = templateVars.checkinTemplates.map( function(checkinTemplate){
        var cTemp = {
          _id: checkinTemplate._id,
          question: checkinTemplate.question,
          title: checkinTemplate.title,
          answers: checkinTemplate.answers,
          checkins: []
        } 

        templateVars.checkins.forEach(function(checkin){
          if (checkin.template_id === checkinTemplate.id){
            cTemp.checkins.push(checkin)
          }
        })          
        
        return cTemp
      })

      // Set flash variable
      templateVars.flash = flash

      next(templateVars)
    })                                                                           
  }
  
  var listSurveys = function (user_id, next) {
    
    var templateVars = {};   
    
    Survey.find({}, function (err, surveyTemplates) {
      //Find all surveys
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
          
          templateVars.surveysFound = surveysFound;
          
          async.series([                        
            function (callback) {
              // Find all checkin templates
              CheckinTemplate.find({}, function (err, checkinTemplates) {
                if (err) {
                  return next(err);
                }                
                templateVars.checkinTemplates = {};               
                checkinTemplates.forEach(function(cT){
                  cT.checkins = [];
                  templateVars.checkinTemplates[cT.id] = cT;                  
                });                              
                callback();
              });
            },
            function (callback) {
              // get checkin details and calculate checkin score
              var totalScore = 0;                
              Checkin.find({
                user_id: user_id
              }, function (err, checkins) {
                if (err) {
                  return next(err);
                }
                
                checkins.forEach(function(c){
                  c.answers.forEach(function(answer){
                    totalScore += answer.score || 0;                    
                  });
                });
                
                templateVars.totalScore = totalScore;
                templateVars.checkins = checkins.reverse();
                                
                templateVars.checkins.forEach(function(c){
                  if (templateVars.checkinTemplates[c.template_id]){
                    templateVars.checkinTemplates[c.template_id].checkins.push(c);
                  }
                });  
                callback();
              });
            },
            function (callback) {
              // Find assignedsurveys associated with user
              AssignedSurvey.find({userId: user_id}, function (err, assignedSurveys) {
                if (err) {
                  return next(err);
                }
                
                templateVars.rationalized = {};
                                
                assignedSurveys.forEach(function(aSurvey) {
                  if (templateVars.rationalized[aSurvey.surveyId]) {
                    templateVars.rationalized[aSurvey.surveyId].assignments.push({
                      showDate: aSurvey.showDate,
                      isDone: aSurvey.isDone
                    });
                  } else {
                    templateVars.rationalized[aSurvey.surveyId] = {
                      userId: aSurvey.userId,
                      surveyId: aSurvey.surveyId,
                      assignedSurveyId: aSurvey._id,
                      assignments: [{
                        showDate: aSurvey.showDate,
                        isDone: aSurvey.isDone
                      }]
                    }
                  }
                });
               
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
            var surveyData = Object.keys(templateVars.rationalized).map(function(aSurveyId, index){              
              var currSurvey = {
                id: aSurveyId,
                assignedSurveyId: templateVars.rationalized[aSurveyId].assignedSurveyId,
                title: "",
                checkinTemplates: [],
                isCompleted: false,
                isAssigned: true,
                assignments: templateVars.rationalized[aSurveyId].assignments               
              };
              
              templateVars.surveyTemplates.every(function(surveyTemplate){
                if (surveyTemplate._id.equals(aSurveyId)) {
                  
                  currSurvey.title = surveyTemplate.title;
                  
                  if(surveyTemplate.checkinTemplates) {
                    
                    // Map checkintemplate Ids and populate fields
                    currSurvey.checkinTemplates = surveyTemplate.checkinTemplates.map(function(cTempId){
                      return templateVars.checkinTemplates[cTempId];
                    });  
                  }
                  return false;
                }
                return true;
              });              
              return currSurvey;         
            });            
                         
            templateVars.surveyData = [];
            templateVars.surveyIds = [];
            surveyData.forEach(function(survey){
              if (survey.title) {
                templateVars.surveyData.push(survey);
                templateVars.surveyIds.push(survey.id);
              }
            });                     
            
            templateVars.surveysFound.forEach(function(survey){
              if (templateVars.surveyIds.indexOf(survey.id) < 0) {                                     
                // Survey does not yet exist in surveyData array, push Survey object
                var checkinTemplates = survey.checkinTemplates.map(function(cTempId){
                  return templateVars.checkinTemplates[cTempId];
                });
                templateVars.surveyData.push({
                  id: survey.id,
                  title: survey.title,
                  checkinTemplates: checkinTemplates,
                  isCompleted: true,
                  isAssigned: false,
                  assignments: []
                });
                templateVars.surveyIds.push(survey.id);
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

                for (var template in templateVars.checkinTemplates) {
                  if (schedule.template_id === template) {
                    schedule.template = templateVars.checkinTemplates[template];
                    return false;
                  }
                  return true;
                }

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
  
  var getMeds = function(user_id, next) {
    var recentCheckins = {};
    var checkinTimes = {};
    Survey.findOne({isWizardSurvey:true},function(err,survey){
          if(err){return next(err)}
          if (survey !== null) {

            CheckinTemplate.find({_id: {$in: survey.checkinTemplates}}).select('title').exec(function(err, checkinTemplates){
              if (err) {next(err)}

              // Reorder keys in recentCheckin object to match survey.checkinTemplates ordering
              for (var i=0; i < survey.checkinTemplates.length; i++) {
                for (var j = 0; j < checkinTemplates.length; j++) {
                  if (checkinTemplates[j].id === survey.checkinTemplates[i]) {
                    recentCheckins[checkinTemplates[j].title] = [];
                    break;
                  }
                } 
              }                    

              Checkin.find({
                user_id: user_id,
                survey_id: survey._id
              })
                .exec(function(err, checkins) {
                if (err) {
                  return next(err);
                }                      

                checkins = checkins.reverse();

                checkins.forEach(function(checkin){                                                                        
                  if (checkin.answers[0].surveyVersion !== survey.__v) {
                    return;
                  } else {
                    checkin.answers.forEach(function(answer){
                      var question = answer.title;
                      var timestamp = answer.timestamp;                         
                      if (!(question in recentCheckins)) {
                        recentCheckins[question] = [];
                      }
                      recentCheckins[question].push(answer.text);
                      checkinTimes[question] = timestamp;                          
                    });
                  }
                });                                      
                next({
                  recentCheckins: recentCheckins,
                  checkinTimes: checkinTimes
                });
              });                  
            });                  
          } else {            
            next({
              recentCheckins: recentCheckins,
              checkinTimes: checkinTimes
            });               
          }
      });
  }  
  
  /** Find surveys assigned to user
  Inputs:
    - user_id: String representing the data object id. If non-string type is provided, TypeError is returned
  Output:
    - results: String objects, or err object if error.
  **/
    
  var getAssignedSurveys = function (user_Id, callback) {
    if (typeof (user_Id) != "string") {
      callback(new TypeError("userId must be a string"), null)
      return
    }
        
    AssignedSurvey.find({userId: user_Id}, "_id", function(err, assignedSurveys) {
      if (err) {
        callback(err, null)
        return
      }
            
      callback(null, assignedSurveys)
    })
  }
  /* end getAssignedSurveys */
  
  /** Find who user is following
  Inputs:
    - user_id: String representing user object id. If non-string type is provided, TypeError is returned
  Output:
    - results: Array of string
  **/
  var getUserFollowing = function(userId, callback) {
    
  }
  /* end getUserFollowing */
  
  /* Find most recent checkins
  Inputs:
    - count: Int representing number of checkins to return. If argument is not Int, TypeError is returned.
  Outputs:
    - results: Array of checkin objects
  */
  var getCheckinHistory = function(count, callback) {
    if (typeof count !== "number") {
      callback(new TypeError("count must be numeric"), null)
      return
    }
    
    callback(null, [{
      time: "Now",
			user: "Me",
			survey: "First survey",
			checkinId: 123
    }])
    
  } 
  /* end getHistory */
  
  return {
    listSurveys: listSurveys,
    getMeds: getMeds,
    getAssignedSurveys: getAssignedSurveys,
    getSurveyResponses: getSurveyResponses,
    getUserFollowing: getUserFollowing,
    getCheckinHistory: getCheckinHistory
  }
  
}());