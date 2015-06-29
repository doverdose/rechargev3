/*jshint -W083 */
/* Checkins controller */

module.exports = (function () {
    'use strict';

    var mongoose = require('mongoose'),
        async = require('async'),
        moment = require('moment'),
        sha1 = require('sha1'),
        helper = require('./components/helper'),
        Schedule = mongoose.model('Schedule'),
        Checkin = mongoose.model('Checkin'),
        Survey = mongoose.model('Survey'),
        CheckinTemplate = mongoose.model('CheckinTemplate'),
        AssignedSurvey = mongoose.model('AssignedSurvey'),
        Medication = mongoose.model('Medication');

    var view = function (req, res, next) {
        Checkin.findOne({
            _id: req.params.id
        }, function (err, c) {
            if (!c) {
                return next(new Error('Failed to load Check-in ' + req.params.id));
            }
            c.pastAnswers.reverse();
            res.render('checkin/checkinView.ejs', {
                c: c,
                choice: (c.type.indexOf('choice') !== -1)
            });
        });
    };

    var listSurveys = function (req, res, next) {
        helper.listSurveys(req.user._id, function(templateVars){
          res.render('checkin/listSurveys.ejs', templateVars);
        });        
    };

    var list = function (req, res, next) {
        var templateVars = {};

        async.parallel([
            function(callback){
                Survey.findOne({_id:req.params.id},function(err,survey){
                    if(err){return next(err)}
                  
                    templateVars.survey = survey;

                    CheckinTemplate.find({_id: {$in:survey.checkinTemplates}}, function(err, checkinTemplates){
                        if(err){return next(err)}
                      
                        templateVars.checkinTemplates = checkinTemplates;
                        callback();
                    });
                });
            },
            function(callback){
                Checkin.find({
                    user_id: req.user._id,
                    survey_id: req.params.id
                }).sort({timestamp:-1}).exec(function (err, checkins) {
                    if (err) {
                        return next(err);
                    }

                    templateVars.checkins = checkins;
                    callback();
                });
            }
        ],function(err){
            // Cluster checkins by template, sort by most recent first
            templateVars.checkinsByTemplate = templateVars.checkinTemplates.map( function(checkinTemplate){
              var cTemp = {
                _id: checkinTemplate._id,
                question: checkinTemplate.question,
                title: checkinTemplate.title,
                answers: checkinTemplate.answers,
                checkins: []
              }; 
              
              templateVars.checkins.forEach(function(checkin){
                if (checkin.template_id === checkinTemplate.id){
                  cTemp.checkins.push(checkin);
                }
              });                
              return cTemp;
            });
          
            // Set flash variable
            templateVars.flash = req.flash().success;          
            
            res.render('checkin/list.ejs', templateVars);
        });
    };

    var parseForm = function (form) {
        var newAnswers = [];
      
        if (form.answers && form.answers.length) {
            form.answers.forEach(function (answer) {
                // don't add if just whitespace
                if (answer.trim()) {
                    newAnswers.push({
                        text: answer
                    });
                }
            });
        }
      
        form.answers = newAnswers;
      
        var answer = form.answer;
        if (answer) {
          form.answer
        }      
        return form;

    };

    var parseDates = function (obj, schedule) {
        // make sure we always use UTC dates
        if (!obj.due_date) {
            // in case the update does not have a new due_date
            obj.due_date = moment.utc(schedule.due_date).format('MM/DD/YYYY');
        }

        obj.due_date += ' UTC';
        if (obj.expiry) {
            var expiryPreset = {
                '1m': { months: 1 },
                '6m': { months: 6 },
                '1y': { years: 1 }
            };
            // set proper expire_date, based on expiry select
            if (obj.expiry === '0') {
                obj.expires = false;
            } else {
                obj.expires = true;
                if (obj.expiry === 'custom') {
                    obj.expire_date += ' UTC';
                } else {
                    obj.expire_date = moment.utc(obj.due_date).add(expiryPreset[obj.expiry]).toDate();
                }
            }
        }
    };
  
    // formatAnswers: accepts posted data and groups checkins by survey iteration
    var formatAnswers = function (req, score, cb) {
      var data = req.body.data;      
      var dataMap = {};
      var currTime = moment();
      var answerScore = score || 0;
      var ids = {
        survey: req.body.surveyID
      };
      
      async.series([function(callback) {                  
        var surveyData = {
          version: null,
          templates: {}
        };
        
        Survey.findOne({_id:ids.survey}, function(err, survey){
          if (err) {
            callback(err);
          }
          
          if (survey.__v) {
            surveyData.version = survey.__v;
          }          
          
          if (survey.checkinTemplates) {
            CheckinTemplate.find({_id:{$in: survey.checkinTemplates}}, function(err, templates) {
              var templateFunctions = [];
              templates.forEach(function(template){
                templateFunctions.push(function(cb2){
                  var templateObj = {
                    question: template.question,
                    title: template.title,
                    type: template.type
                  };
                  surveyData.templates[template.id] = templateObj;
                  cb2();
                });
              });
              
              async.series(templateFunctions, function(err){
                callback(null, surveyData);
              });
            });
          } else {
            callback(null, surveyData);
          }          
        });          
      }], function(err, results){        
        for(var i = 0; i < data.length; i++) {
          var currData = data[i];
          var currGroup = currData.group;
          var groupID = sha1(ids.survey+currTime+currGroup);          

          // Format answer as array
          var currAnswer = [];        
          if (currData.answers) {
            currAnswer = currData.answers;
          } else if (currData.answer) {
            currAnswer = [currData.answer];
          }        

          // Add answer to dataMap[currGroup]
          if (currGroup in dataMap) {
          } else {
            dataMap[currGroup] = [];          
          }

          currAnswer.forEach(function(answer){
            var currQuestion, currTitle, currType;
            if (results[0].templates[currData.id]) {
              currQuestion = results[0].templates[currData.id].question;
              currTitle = results[0].templates[currData.id].title;
              currType = results[0].templates[currData.id].type;
            }
            var answerObj = {
              text: answer,
              template_id: currData.id,
              question: currQuestion,
              score: answerScore,
              title: currTitle,
              type: currType,
              group_id: groupID,
              surveyVersion: results[0].version
            };
            dataMap[currGroup].push(answerObj);                                           
          });          
        }
        cb(dataMap);
      });
    } // end formatAnswers
     
    var createSchedules = function(template, answers, userId) {
      var schedulesSave = [];
      if (answers) {
        for (var j = 0; j < answers.length; j++) {
          for (var k = 0; k < template.schedules.length; k++) {
            if (answers[j] === template.schedules[k].answer) {
              var schedule = {};
              schedule.user_id = userId;
              schedule.template_id = template._id;
              schedule.repeat_interval = template.schedules[k].repeat_interval;
              schedule.due_date = template.schedules[k].due_date;

              var expiryPreset = {
                '1m': { months: 1 },
                '6m': { months: 6 },
                '1y': { years: 1 }
              };

              if (template.schedules[k].expires === '0') {
                schedule.expires = false;
              } else {
                schedule.expires = true;
                if (template.schedules[k].expires === 'custom') {
                  schedule.expire_date = template.schedules[k].expire_date;
                } else {
                  schedule.expire_date = moment.utc(template.schedules[k].due_date).add(expiryPreset[template.schedules[k].expires]).toDate();
                }
              }

              schedulesSave.push(
                (function (schedule) {
                  return function (callback) {
                    var obj = new Schedule(schedule);
                    obj.save(function (err) {
                      if (err) {
                        callback(err);
                        return;
                      }
                      callback();
                    });
                  };
                })(schedule)
              );
            }
          }
        }
      }
      return schedulesSave;
    }
    
    var createCheckins = function(ids, answers) {     
      var saveFunctions = [];            
      saveFunctions.push((function(currAnswers) {
        return function(callback) {
          var keyText;
          
          currAnswers.forEach(function(answer){
            if (answer.template_id === ids.keyTemplate) {
              keyText = answer.text;
            }
          });
          
          Checkin.findOne({answers: {$elemMatch: {template_id: ids.keyTemplate, text: keyText}}}, function(err, checkin){
            // Update existing checkin if key template text matches            
            var currCheckin;
            if (err) {
              return;
            }
            
            if (checkin) {              
              currCheckin = checkin;             
              checkin.answers.forEach(function(pastAnswer){
                currCheckin.pastAnswers.push(pastAnswer);
              });
              currCheckin.answers = currAnswers;
            } else {
              currCheckin = new Checkin({
                survey_id: ids.survey,
                answers: currAnswers
              });
              currCheckin.user_id = ids.user;             
            }
            
            currCheckin.save(function(err){
              if (err) {
                callback(err);
                return;
              }                                      
              AssignedSurvey.update({id: ids.assignedSurvey}, {isDone:true}, function(err, num){});
              callback();
            });  
          });                                                                
        }
      })(answers));
      return saveFunctions;    
    } // end createCheckins
    
    var update = function (req, res, next) {
      var functions = [];
      var score = 1;
                                       
      // Format id object
      var ids = {
        survey: req.body.surveyID,
        user: req.user._id,
        assignedSurvey: req.body.assignedSurveyId,
        keyTemplate: req.body.keyTemplate     
      };

      formatAnswers(req, score, function(groupedResponses){
        // For each survey iteration answered, create set of datastore functions and add to function array
        for (var group in groupedResponses) {
          functions.push((function (objKey, answers) {
            return function (callback) {                                                                 
              var saveFunctions = createCheckins(ids, answers);
              async.parallel(saveFunctions, function(err){
                callback();
              });                           
            }
          })(group, groupedResponses[group]));
        }

        // Execute checkin and schedule datastore transactions, and then create Adherence Survey if survey is Wizard Survey type
        async.series(functions, function (err) {
          if (err) {
            next(err);
          }

          Survey.findOne({_id:ids.survey}, function(err, survey){
            if(err) next(err);
            
            // Survey found, and responses have been saved. Flash thank you message
            req.flash("success", "Thanks for answering our survey!");             

            if(survey.isWizardSurvey){

              // if the survey is a wizard survey (aka medication survey) do the following:
              //- generate a survey that contains checkin templates for each medication
              //- generate a checkin templates as necessary for new medications
              //- schedule and assign survey to user

              var medicationNames = [];
              var medicationNameFinders = [];

              for (var group in groupedResponses) {
                var groupAnswers = groupedResponses[group];
                groupAnswers.forEach(function(answer){
                  if (answer.template_id) {
                    medicationNameFinders.push(
                      function (callback) {
                        CheckinTemplate.findOne({_id: answer.template_id}, function (err, template){
                          if (err) {
                            callback();
                          }            
                          if (template.type == "dropdownText") {
                            medicationNames.push(answer.text);
                            callback();
                          }
                        });
                      }
                    );
                  }
                });
              }            

              async.parallel(medicationNameFinders, function (err) {
                // Medication names are used to generate a Survey with associated Adherence Checkin Templates
                // Check if adherence survey is already assigned
                AssignedSurvey.find({userId: req.user.id}, function(err, assigned) {
                  if (err) next(err);

                  // Find:
                  // - assigned surveys that are generated
                  // - Adherence Checkin Templates associated with medications
                  var generatedSurvey = [];          
                  var adherenceTemplates = [];
                  var adherenceSurveyPrepper = [];
                  var assignedIds = assigned.map(function(a) {return a.surveyId;});


                  // Add generatedSurveyFinder and templateGenerators to async function array
                  var generatedSurveyFinder = function(callback) {
                    Survey.findOne({_id: {$in: assignedIds}, isGenerated: true}, function(err, survey){
                      if (err) next(err);
                      if (survey) {
                        generatedSurvey = survey;                      
                      }
                      callback();
                    });

                  }

                  medicationNames.forEach(function(medName){
                    adherenceSurveyPrepper.push(function(callback){
                      CheckinTemplate.findOne({title: "{MED_NAME} adherence template".replace("{MED_NAME}", medName)}, function(err, template){
                        if (err) next(err);
                        if (template) {
                          // Template matched, push to array                       
                          adherenceTemplates.push(template);
                          callback();
                        } else {
                          // Template missing, create new CheckinTemplate
                          var newCheckinTemplate = new CheckinTemplate({
                            type: "medicationCheckin",
                            title: "{MED_NAME} adherence template".replace("{MED_NAME}", medName),
                            score: 1,
                            tips: "",
                            question: "How many times did you take '{MED_NAME}' this week?".replace('{MED_NAME}', medName),                                        
                            schedules: [],
                            answers: []
                          });
                          newCheckinTemplate.save(function(err, newTemplate){                          
                            adherenceTemplates.push(newTemplate);
                            callback();
                          });                                                                    
                        }
                      });  
                    });

                  });

                  adherenceSurveyPrepper.push(generatedSurveyFinder);

                  // Create missing templates, and add Adherence Checkin Templates to current or new AssignedSurvey  
                  async.series(adherenceSurveyPrepper, function(err){
                    if (err) {
                      next(err);
                    }
                    var adherenceSurvey = {};
                    // Get adherence template IDs
                    var adherenceTemplateIds = [];
                    adherenceTemplateIds = adherenceTemplates.map(function (adTemp){
                      return adTemp.id;
                    });                

                    if (generatedSurvey && generatedSurvey.checkinTemplates) {
                      adherenceSurvey = generatedSurvey;

                      // Update survey with new Adherence Templates
                      if (adherenceTemplateIds) {
                        adherenceSurvey.checkinTemplates = adherenceTemplateIds;                      
                      }

                    } else {
                      // No existing generated surveys, create one and assign it
                      adherenceSurvey = new Survey({
                        title: "GENERATED_Weekly Adherence Survey",
                        isStartingSurvey: false,
                        duration: "2months",
                        recurrence: "1week",
                        isWizardSurvey: false,
                        maximumIterations: "0",
                        checkinTemplates: adherenceTemplates.map(function(adTemp) { return adTemp.id }),
                        isGenerated: true
                      });
                    } // end if-else statement                  

                    adherenceSurvey.save(function(err, freshSurvey){
                      if(err) next(err);
                      // here we assign weekly adherence surveys for the next two months to the user:                                       

                      var todayDate = new Date();
                      //set the time to 0, so when we schedule surveys we schedule them for midnight
                      todayDate.setUTCHours(0, 0, 0, 0);
                      var endDate = new Date(todayDate);

                      //set endDate 1 month from now
                      endDate.setMonth(todayDate.getMonth() + 1);

                      //jump to the next friday
                      var currentDate = moment().day(5).toDate();
                      //set the time to 0, so when we schedule surveys we schedule them for midnight
                      currentDate.setUTCHours(0, 0, 0, 0);

                      var datesToAssign = [];
                      while (currentDate < endDate) {
                        datesToAssign.push(new Date(currentDate));
                        currentDate.setDate(currentDate.getDate() + 7);
                      }

                      // delete all the queue (assignedSurvey) items that reference the currently saved survey's id
                      // before inserting new items in                  

                      AssignedSurvey.find({surveyId: freshSurvey.id}).remove(function (err, num) {                      

                        if (err) {
                        }
                        else {
                          var assignedSurveysToInsert = [];
                          datesToAssign.forEach(function (date) {
                            assignedSurveysToInsert.push({
                              userId: req.user.id,
                              surveyId: freshSurvey.id,
                              isDone: false,
                              showDate: date,
                              hasNotifications:true,
                              __v: 0
                            });
                          });
                          AssignedSurvey.collection.insert(assignedSurveysToInsert, function (err, items) {});
                        }
                      }); // end AssignedSurvey mongoose call
                    }); // end Survey save mongoose call

                  }); // end async.parallel                        
                }); // end AssignedSurvey mongoose call                       
              }); // end async.parallel

              res.redirect('/checkin/survey/' + req.body.surveyID);

            } else {
              res.redirect('/checkin/survey/' + req.body.surveyID);
            } // end isWizardSurvey if-else statement
          }); // end Survey mongoose call
        }); // end async.series
      }); // end formatAnswers
    }; // end update function

    var updateView = function (req, res, next) {
        Checkin.findOne({
            _id: req.params.id
        }, function (err, checkin) {
            if (!checkin) {
                return next(new Error('Failed to load Check-in ' + req.params.id));
            }
            res.render('checkin/checkinEdit.ejs', {
                checkin: checkin
            });
        });
    };

    var getStringValuesFromItemsArray = function (items) {
        var stringValues = [];
        var tempString = "";

        items.forEach(function (item) {
            tempString = "";

            //convert mongoose object to actual js object
            item = item.toObject();
            for (var property in item) {
                if (item.hasOwnProperty(property)) {
                    if (property != "_id" && property != "__v") {
                        if (!tempString) {
                            tempString = item[property];
                        } else {
                            tempString = tempString + ", " + item[property];
                        }
                    }
                }
            }
            stringValues.push(tempString);
        });
        return stringValues;
    }

    var createView = function (req, res, next) {
      Survey.findOne({
        _id: req.body.id
      }, function (err, survey) {
        if (!survey) {
          return next(new Error('Failed to load Survey ' + req.body.id));
        }

        Medication.find({}, function (err, dropdownItems) {
          if (err) {
            next(err);
          }

          if (dropdownItems) {
            dropdownItems = getStringValuesFromItemsArray(dropdownItems);
          }

          CheckinTemplate.find({
            _id: { $in: survey.checkinTemplates}
          }, function (err, templates) {                  
            res.render('checkin/checkinEdit.ejs', {
              checkin: {},
              templates: templates,
              survey: survey,
              dropdownDataSource: dropdownItems                    
            });
          });
        });
      });
    };

    var remove = function (req, res, next) {
        Checkin.findOne({
            _id: req.body.id
        }, function (err, c) {
            if (!c) {
                return next(new Error('Failed to load Check-in ' + req.body.id));
            }
            c.remove();

            res.redirect('/checkin');
        });
    };

    var editCheckin = function (req, res, next) {
        Checkin.findOne({
            _id: req.body.id
        }, function (err, c) {
            if (err) {
                next(err);
            }
            CheckinTemplate.findOne({
                _id: c.template_id
            }, function (err, template) {
                if (err) {
                    next(err);
                }

                Medication.find({}, function (err, dropdownItems) {
                    if (err) {
                        next(err);
                    }

                    if (dropdownItems) {
                        dropdownItems = getStringValuesFromItemsArray(dropdownItems);
                    }

                    res.render('checkin/editView.ejs', {
                        c: c,
                        template: template,
                        choice: (c.type.indexOf('choice') !== -1),
                        dropdownDataSource: dropdownItems
                    });
                });
            });
        });
    };

    var addAnswer = function (req, res, next) {
        Checkin.findOne({
            _id: req.body.id
        }, function (err, checkin) {
            if (err) {
                next(err);
            }

            for (var i = 0; i < checkin.answers.length; i++) {
                checkin.pastAnswers.push(checkin.answers[i]);
            }
            checkin.answers = [];

            var data = {
                answers: req.body.answers
            };
            data = parseForm(data);
            checkin.answers = data.answers;

            checkin.save(function (err) {
                if (err) {
                    next(err);
                }

                res.redirect('/checkin/' + req.body.id);
            });
        });
    };

    return {
        createView: createView,
        update: update,
        updateView: updateView,
        remove: remove,
        view: view,
        list: list,
        listSurveys: listSurveys,
        editCheckin: editCheckin,
        addAnswer: addAnswer
    };

}());

