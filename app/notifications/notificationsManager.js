module.exports = (function() {
    var schedule = require('node-schedule'),
        nodemailer = require('nodemailer'),
        moment = require('moment'),
        async = require('async'),
        mongoose = require('mongoose'),
        AssignedSurvey = mongoose.model('AssignedSurvey'),
        User = mongoose.model('User'),
        Survey = mongoose.model('Survey');

    // create reusable transporter object using SMTP transport
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'baranditest1@gmail.com',
            pass: 'baranditest1password'
        }
    });

    var sendNotificationEmail = function(to,subject,html){
        transporter.sendMail({
            from: 'Recharge Notification Robot <baranditest1@gmail.com>', // sender address
            to: to,
            subject: subject,
            html: html
        }, function(error, info){
            if(error){
                console.log(error);
            }else{
                console.log('Message sent to: '+ to + ', ' + info.response);
            }
        });
    };

    var mainJob = schedule.scheduleJob({hour: 0, minute: 0}, function(){

        // schedule a daily job (at 0:00) that looks through the "assignedSurvey" list
        // if isNotDone and showDate is passed,
        // if it's a monthly survey, if a month or multiple of months has passed, send a notifications
        // if it's a weekly survey, and a multiple of 1 week has passed, send notification
        // and so on

        AssignedSurvey.find({isDone:false, showDate:{$ne:null, $lt:new Date()}}, function(err, assignedSurveys){
            if(err){}

            if(assignedSurveys && assignedSurveys.length){

                var todayDate = new Date();
                //set the time to 0, so when we schedule surveys we schedule them for midnight
                todayDate.setUTCHours(0,0,0,0);

                var notifications = [];
                var asyncFunctions = [];

                assignedSurveys.forEach(function(assignedSurvey){
                    if(assignedSurvey.hasNotifications){

                        asyncFunctions.push(function(callback){
                            Survey.findOne({_id:assignedSurvey.surveyId},function(err,survey){
                                switch(survey.recurrence){
                                    case '1week':
                                        //if difference between today's date and showDate is exactly multiples of 1 week
                                        // if modular division between the 2 is 0, notify
                                        if(moment(todayDate).diff(moment(assignedSurvey.showDate),'weeks',true) % 1 == 0){
                                            notifications.push({
                                                assignedSurvey:assignedSurvey,
                                                survey:survey
                                            });
                                        }
                                        break;
                                    case '2weeks':
                                        if(moment(todayDate).diff(moment(assignedSurvey.showDate),'weeks',true) % 2 == 0){
                                            notifications.push({
                                                assignedSurvey:assignedSurvey,
                                                survey:survey
                                            });
                                        }
                                        break;
                                    case '1month':
                                        if(moment(todayDate).diff(moment(assignedSurvey.showDate),'months',true) % 1 == 0){
                                            notifications.push({
                                                assignedSurvey:assignedSurvey,
                                                survey:survey
                                            });
                                        }
                                        break;
                                    case '2months':
                                        if(moment(todayDate).diff(moment(assignedSurvey.showDate),'months',true) % 2 == 0){
                                            notifications.push({
                                                assignedSurvey:assignedSurvey,
                                                survey:survey
                                            });
                                        }
                                        break;
                                }
                                callback();
                            });
                        });
                    }
                });

                async.parallel(asyncFunctions, function (err) {
                    //when its all done
                    notifications.forEach(function(notification){
                        User.findOne({_id:notification.assignedSurvey.userId},function(err,user){
                            sendNotificationEmail(
                                user.email,
                                "Notification: " + notification.survey.title,
                                "<h3>You have not completed your following survey:</h3>" +
                                    "<p>{TITLE}</p>".replace('{TITLE}', notification.survey.title)
                            );
                        });
                    });
                });
            }
        });
    });

}());
