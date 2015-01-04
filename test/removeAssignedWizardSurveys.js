// Finds all Assigned Surveys that reference Wizard Surveys, and removes them 
console.log('Running removeAssignedWizardSurveys.js');

// Configure mongoose db connection and load schemas
var mongoose = require('mongoose');
var async = require('async');
var config = require('../config/config')()['nitrous'];

console.log(config.db)

mongoose.connect(config.db);

require('../app/models/survey.js');
var Survey = mongoose.model('Survey');

require('../app/models/assignedSurvey.js');
var AssignedSurvey = mongoose.model('AssignedSurvey');

var aSurveysToRemove = [];

async.series([
  function(callback) {
    // Map assigned Assigned Surveys which refer to Wizard Surveys   
    AssignedSurvey.find({}, 'surveyId', function(err, results) {
      var surveyIds = results.map(function(aSurvey) {return aSurvey.surveyId;});

      Survey.find({_id: {$in: surveyIds}, isWizardSurvey: true}, function(err, surveys){        
        surveys.map(function(survey) {         
          aSurveysToRemove.push({
            id: survey.id,
            title: survey.title
          });
        });
        callback();
      });      
      
    });
  }                       
], function(err) { 
  
  // Remove Assigned Surveys that refer to Wizard Surveys
  var removableIds = aSurveysToRemove.map(function(aSurvey){ return aSurvey.id; });
  var removableTitles = aSurveysToRemove.map(function(aSurvey){ return aSurvey.title; });
  
  removableIds.map(function(rId) {
    AssignedSurvey.find( {surveyId: rId}).remove(function(err){
      if (!err) {
        console.log("Removed Assigned Surveys:");
        console.log(removableTitles);
      } else {      
        console.log(err);
        console.log("Could not remove Assigned Surveys:");
        console.log(removableTitles);
      }
    });    
  });
  
  
});




