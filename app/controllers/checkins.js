/*jshint -W083 */
/* Checkins controller */

module.exports = (function () {
    'use strict';

    var mongoose = require('mongoose'),
        async = require('async'),
        moment = require('moment'),
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
                    if(err){next(err)}
                  
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

    var update = function (req, res, next) {
      var functions = [];
      
      // Group checkins by id      
      var dataMap = {};
      for (var i = 0; i < req.body.data.length; i++) {
        var dataPt = req.body.data[i];
        if (dataPt.id in dataMap) {
          // checkinTemplate id is already in dataMap object
        } else {
          dataMap[dataPt.id] = [];
        }
        if (dataPt.answers) {
          dataPt.answers.forEach(function(answer){
            dataMap[dataPt.id].push(answer);
          });
        } else if (dataPt.answer) {
          dataMap[dataPt.id].push(answer);
        }
      }
      
      // Reformat object as data array
      var groupedData = [];
      Object.keys(dataMap).forEach(function(id) {
        var groupedCheckin = {
          id: id,
          answers: dataMap[id]
        };
        groupedData.push(groupedCheckin);
      });
            
      // Assign to request data array
      req.body.data = groupedData;            
      
      // For each checkin template answered, create set of datastore functions and add to function array
      for (var i = 0; i < req.body.data.length; i++) {
        functions.push((function (index, answers) {
          return function (callback) {
            CheckinTemplate.findOne({
              _id: req.body.data[index].id
            }, function (err, template) {
              if (err) {
                callback(err);
                return;
              }

              if (!template) {
                callback(new Error('Failed to load Check-in Template' + req.body.data[index].id));
                return;
              }

              // For each answer with a linked schedule, create function to save new schedule 
              template = template.toObject();
              var schedulesSave = [];
              if (answers) {
                for (var j = 0; j < answers.length; j++) {
                  for (var k = 0; k < template.schedules.length; k++) {
                    if (answers[j] === template.schedules[k].answer) {
                      var schedule = {};
                      schedule.user_id = req.user.id;
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

              // After saving schedules, save checkin
              async.parallel(schedulesSave, function (err) {
                var surveyId = req.body.surveyID;
                Survey.findOne({_id: surveyId}, '__v', function(err,survey){
                  var surveyVersion;
                  if (err){                    
                  } else {
                    surveyVersion = survey.__v;                    
                  }
                  
                  var saveFunctions = [];
                  for (var k = 0; k < answers.length; k++) {
                    var answer = answers[k];
                    var checkinData = {};
                    checkinData.template_id = template._id;
                    checkinData.type = template.type;
                    checkinData.title = template.title;
                    checkinData.question = template.question;
                    checkinData.tips = template.tips;
                    checkinData.score = template.score;                
                    checkinData.answers = [answer];
                    checkinData.survey_id = surveyId;
                    checkinData.surveyVersion = surveyVersion;
                  
                    var formParams = parseForm(checkinData);;
                    var checkin = new Checkin(formParams);
                    checkin.user_id = req.user.id;
                    console.log(checkin);
                    saveFunctions.push(function(callback){
                      checkin.save(function(err){
                        if (err) {
                          callback(err);
                          return;
                        }                        
                        var assignedSurveyId = req.body.assignedSurveyId;
                        AssignedSurvey.update({id:assignedSurveyId}, {isDone:true}, function(err, num){});
                        callback();
                      });
                    });
                  }
                  
                  async.parallel(saveFunctions, function(err){
                    callback();
                  });
                }); // end find Survey
              }); // end async 
            }); // end find Checkin
          }
        })(i, req.body.data[i].answers));
      }

      // Execute checkin and schedule datastore transactions, and then create Adherence Survey if survey is Wizard Survey type
      async.series(functions, function (err) {
        if (err) {
          next(err);
        }

        Survey.findOne({_id:req.body.surveyID}, function(err, survey){
          if(err) next(err);

          if(survey.isWizardSurvey){

            // if the survey is a wizard survey (aka medication survey) do the following:
            //- generate a survey that contains checkin templates for each medication
            //- generate a checkin templates as necessary for new medications
            //- schedule and assign survey to user

            var medicationNames = [];
            var medicationNameFinders = [];

            req.body.data.forEach(function (dataItem) {
              // for each template that is a "dropdownText" type, add its answer to the medicationNames array
              dataItem.id;

              medicationNameFinders.push(
                function (callback) {
                  CheckinTemplate.findOne({_id: dataItem.id}, function (err, template) {
                    if (err) {
                      callback();
                    }
                    if (template.type == "dropdownText") {
                      //construct a "questions object"
                      medicationNames.push(dataItem.answers[0]);
                      callback();
                    }              
                  });
                }
              );
            });
                      
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
      }); // end async.series callc
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

