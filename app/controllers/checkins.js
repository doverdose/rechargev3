/*jshint -W083 */
/* Checkins controller */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		async = require('async'),
		moment = require('moment'),
		Schedule = mongoose.model('Schedule'),
		Checkin = mongoose.model('Checkin'),
		Survey = mongoose.model('Survey'),
		CheckinTemplate = mongoose.model('CheckinTemplate'),
        AssignedSurvey = mongoose.model('AssignedSurvey');

    var view = function(req, res, next) {
		Checkin.findOne({
			_id: req.params.id
		}, function(err, c) {
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

	var listSurveys = function(req, res, next) {
		var templateVars = {};
		Survey.find({}, function(err, surveyTemplates) {
			//all surveys list
			if (err) {
				return next(err);
			}
			templateVars.surveyTemplates = surveyTemplates;

			Checkin.find({
				user_id: req.user._id
			}, {
				survey_id: true,
			}, function(err, results) {
				if(err) {
					next(err);
				}
				var surveys = [];
				for(var i = 0; i < results.length; i++) {
					surveys.push(results[i].survey_id);
				}

				Survey.find({
					_id: {
						$in: surveys
					}
				}, function(err, surveysFound) {
					templateVars.surveys = surveysFound;

					async.parallel([
						function(callback) {
							// get checkin details
							Checkin.find({
								user_id: req.user._id
							}, function(err, checkins) {
								if (err) {
									return next(err);
								}

								templateVars.checkins = checkins.reverse();
								callback();
							});
						},
						function(callback) {
							// get total score from all checkins
							Checkin.find({
								user_id: req.user._id
							}, function(err, checkins) {
								if (err) {
									return next(err);
								}

								// calculate user score
								var totalScore = 0;
								checkins.forEach(function(checkin) {
									totalScore += checkin.score || 0;
								});

								templateVars.totalScore = totalScore;
								callback();
							});
						},
						function(callback) {
							CheckinTemplate.find({}, function(err, checkinTemplates) {
								if (err) {
									return next(err);
								}
								templateVars.checkinTemplates = checkinTemplates;
								callback();
							});
						}
					], function(err) {
						if(err) {
							next(err);
						}

						var nextMonday = moment().day(8).hour(0).minute(0).toDate(),
							tomorrow = moment().add('days', 1).hour(0).minute(0).toDate(),
							today = moment().hour(0).minute(0).second(0).toDate();

						// get schedules for checking-in
						Schedule.find({
							user_id: req.user._id,
							$and: [{
								$or: [{
									expires: false
								}, {
									expire_date: {
										$gte: today
									}
								}]
							}, {
								$or: [{
									due_date: {
										$gte: today
									}
								}, {
									repeat_interval: {
										$gt: 0
									}
								}]
							}]
						}, function(err, schedules) {
							if (err) {
								return next(err);
							}

							templateVars.schedules = {
								today: [],
								thisWeek: []
							};

							// for recurring dates, set the next
							schedules.forEach(function(schedule) {
								// if the due_date has passed, but this is a recurring check-in
								if(schedule.due_date < new Date() && schedule.repeat_interval) {
									// calculate the number of possible recurring times
									// then add one more to get the 'next' recurring date
									var recurringTimes = parseInt(moment().diff(schedule.due_date, 'days') / schedule.repeat_interval) + 1;
									var nextDueDate = moment(schedule.due_date).add('days', schedule.repeat_interval * recurringTimes).toDate();
									schedule.due_date = nextDueDate;
								}

								templateVars.checkinTemplates.every(function(template) {
									if(schedule.template_id.equals(template._id)) {
										schedule.template = template;
										return false;
									}
									return true;
								});

								var compareDate = {
									date: null,
									object: null
								};

								// check if the user has already checked-in in the last interval
								if(schedule.due_date < tomorrow) {
									compareDate.date = tomorrow;
									compareDate.object = 'today';
								} else if (schedule.due_date < nextMonday) {
									compareDate.date = nextMonday;
									compareDate.object = 'thisWeek';
								}

								if(compareDate.date) {
									// parse all checkins, to see if we already made the required checkin
									var existingCheckin = false;
									templateVars.checkins.every(function(checkin) {
										// look for a template with the same title made in the last day
										if(checkin.title === schedule.template.title &&
											checkin.timestamp > moment(compareDate.date).subtract(schedule.repeat_interval, 'days').toDate() &&
											checkin.timestamp < compareDate.date) {

											existingCheckin = true;
											return false;
										}
										return true;
									});

									if(!existingCheckin) {
										templateVars.schedules[compareDate.object].push(schedule);
									}
								}
							});
							res.render('checkin/listSurveys.ejs', templateVars);
						});
					});
				});
			});
		});
	};

	var list = function(req, res, next) {
		var templateVars = {};

		Checkin.find({
			user_id: req.user._id,
			survey_id: req.params.id
		}, function(err, checkins) {
			if (err) {
				return next(err);
			}

			templateVars.checkins = checkins.reverse();
			res.render('checkin/list.ejs', templateVars);
		});
	};

	var parseForm = function(form) {
		var newAnswers = [];
		if(form.answers && form.answers.length) {
			form.answers.forEach(function(answer) {
				// don't add if just whitespace
				if(answer.trim()) {
					newAnswers.push({
						text: answer
					});
				}
			});
		}
		form.answers = newAnswers;
		return form;

	};

	var parseDates = function(obj, schedule) {
		// make sure we always use UTC dates
		if(!obj.due_date) {
			// in case the update does not have a new due_date
			obj.due_date = moment.utc(schedule.due_date).format('MM/DD/YYYY');
		}

		obj.due_date += ' UTC';
		if(obj.expiry) {
			var expiryPreset = {
				'1m': { months: 1 },
				'6m': { months: 6 },
				'1y': { years: 1 }
			};
			// set proper expire_date, based on expiry select
			if(obj.expiry === '0') {
				obj.expires = false;
			} else {
				obj.expires = true;
				if(obj.expiry === 'custom') {
					obj.expire_date += ' UTC';
				} else {
					obj.expire_date = moment.utc(obj.due_date).add(expiryPreset[obj.expiry]).toDate();
				}
			}
		}
	};

	var update = function(req, res, next) {
		var functions = [];
		for(var i = 0; i < req.body.data.length; i++) {
			functions.push((function(index, answers) {
				return function(callback) {
					CheckinTemplate.findOne({
						_id: req.body.data[index].id
					}, function(err, template) {
						if(err) {
							callback(err);
							return;
						}

						if (!template) {
							callback(new Error('Failed to load Check-in Template' + req.body.data[index].id));
							return;
						}

						template = template.toObject();
						var schedulesSave = [];

						for(var j = 0; j < answers.length; j++) {
							for(var k = 0; k < template.schedules.length; k++) {
								if(answers[j] === template.schedules[k].answer) {
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

									if(template.schedules[k].expires === '0') {
										schedule.expires = false;
									} else {
										schedule.expires = true;
										if(template.schedules[k].expires === 'custom') {
											schedule.expire_date = template.schedules[k].expire_date;
										} else {
											schedule.expire_date = moment.utc(template.schedules[k].due_date).add(expiryPreset[template.schedules[k].expires]).toDate();
										}
									}

									schedulesSave.push(
										(function(schedule) {
											return function(callback) {
												var obj = new Schedule(schedule);
												obj.save(function(err) {
													if(err) {
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

						async.parallel(schedulesSave, function(err) {
							if(err) {
								next(err);
							}

							var checkinData = {};
							checkinData.template_id = template._id;
							checkinData.type = template.type;
							checkinData.title = template.title;
							checkinData.question = template.question;
							checkinData.tips = template.tips;
							checkinData.score = template.score;
							checkinData.title = template.title;
							checkinData.answers = answers;
							checkinData.survey_id = req.body.surveyID;

							var formParams = parseForm(checkinData);

							// create new checkin
							var checkin = new Checkin(formParams);
							checkin.user_id = req.user.id;

							checkin.save(function(err) {
								if(err) {
									callback(err);
									return;
								}

                                //here take the newly submitted survey and set it to "isDone:true" in assignedSurvey collection in DB
                                var assignedSurveyId = req.body.assignedSurveyId;
                                AssignedSurvey.update({_id: assignedSurveyId},{isDone:true},function(err,num){});

                                callback();
							});
						});
					});
				};
			})(i, req.body.data[i].answers));
		}
		async.parallel(functions, function(err) {
			if(err) {
				next(err);
			}
			res.redirect('/checkin/survey/' + req.body.surveyID);
		});
	};

	var updateView = function(req, res, next) {
		Checkin.findOne({
			_id: req.params.id
		}, function(err, checkin) {
			if (!checkin) {
				return next(new Error('Failed to load Check-in ' + req.params.id));
			}
			res.render('checkin/checkinEdit.ejs', {
				checkin: checkin
			});
		});
	};

	var createView = function (req, res, next) {
		Survey.findOne({
			_id: req.body.id
		}, function(err, template) {
			if (!template) {
				return next(new Error('Failed to load Check-in Template ' + req.body.id));
			}

			CheckinTemplate.find({
				_id: { $in: template.checkinTemplates}
			}, function(err, templates) {
				res.render('checkin/checkinEdit.ejs', {
					checkin: {},
					templates: templates,
					survey: template
				});
			});
		});
	};

	var remove = function(req, res, next) {
		Checkin.findOne({
			_id: req.body.id
		}, function(err, c) {
			if (!c) {
				return next(new Error('Failed to load Check-in ' + req.body.id));
			}
			c.remove();

			res.redirect('/checkin');
		});
	};

	var editCheckin = function(req, res, next) {
		Checkin.findOne({
			_id: req.body.id
		}, function(err, c) {
			if(err) {
				next(err);
			}
			CheckinTemplate.findOne({
				_id: c.template_id
			}, function(err, template) {
				if(err) {
					next(err);
				}
				res.render('checkin/editView.ejs', {
					c: c,
					template: template,
					choice: (c.type.indexOf('choice') !== -1)
				});
			});
		});
	};

	var addAnswer = function(req, res, next) {
		Checkin.findOne({
			_id: req.body.id
		}, function(err, checkin) {
			if(err) {
				next(err);
			}

			for(var i = 0; i < checkin.answers.length; i++) {
				checkin.pastAnswers.push(checkin.answers[i]);
			}
			checkin.answers = [];

			var data = {
				answers: req.body.answers
			};
			data = parseForm(data);
			checkin.answers = data.answers;

			checkin.save(function(err) {
				if(err) {
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

