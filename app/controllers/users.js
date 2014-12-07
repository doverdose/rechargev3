/* Users controller */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		demo = require('./components/demo'),
    helper = require('./components/helper'),
    User = mongoose.model('User'),
        AssignedSurvey = mongoose.model('AssignedSurvey'),
        CheckinTemplate = mongoose.model('CheckinTemplate'),
		    Checkin = mongoose.model('Checkin'),
        Survey = mongoose.model('Survey'),
        Medication = mongoose.model('Medication');

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

	var autoAssign = function(req, res, next) {
		console.log(req.body);
		demo.autoAssign(req.body.userId, req.body.surveyId, function() {
			res.redirect('/user/' + req.body.userId);
		});
	};
  
  var assign = function(req, res, next) {
    User.findOne({
      _id: req.body.userId
    }, function(err, u){
      if (!u) {
        return next(new Error('Could not find User'));
      } else {
        // User exists, find schedule
        
        Survey.findOne({
          _id: req.body.surveyId
        }, function(err, s){
          if (!s) {
            return next(new Error('Could not find Survey'));
          } else {
             // Survey exists, find checkin templates
            console.log(s);
            var schedule;
            s.checkinTemplates.forEach(function(template){
              //schedule[template] = new Schedule();
              //sched.user_id = u._id;
              //sched.template_id = template;
              //sched.repeat_interval = 0;
              //sched.due_date = moment.utc().format('MM/DD/YYYY') + " UTC";
              //sched.expires = false;
              //sched.expire_date = moment.utc().add({years:1}).toDate();
              
              console.log(template);
            });
           
              /*
              var schedule = new Schedule(sched);
              console.log(schedule);
              schedule.save(function() {
              }); 
             
            */
            res.redirect('/admin');
          }
        });
                
      }
    });
  };

    var assignSurvey = function(req, res, next) {
        //do something here

        var surveyId = req.body.surveyId,
            userId = req.body.userId;

        //find survey in DB, so you can check if it has its "duration" and "recurrence" fields set
        Survey.findOne({_id:surveyId}, function(err, survey){
            if(survey && survey.duration && survey.recurrence){

                    var todayDate = new Date();
                    //set the time to 0, so when we schedule surveys we schedule them for midnight
                    todayDate.setUTCHours(0,0,0,0);
                    var endDate = new Date(todayDate);

                    switch (survey.duration) {
                        case '1week':
                            endDate.setDate(todayDate.getDate() + 7);
                            break;
                        case '1month':
                            endDate.setMonth(todayDate.getMonth() + 1);
                            break;
                        case '2months':
                            endDate.setMonth(todayDate.getMonth() + 2);
                            break;
                        case '3months':
                            endDate.setMonth(todayDate.getMonth() + 3);
                            break;
                        case '4months':
                            endDate.setMonth(todayDate.getMonth() + 4);
                            break;
                        case '5months':
                            endDate.setMonth(todayDate.getMonth() + 5);
                            break;
                        case '6months':
                            endDate.setMonth(todayDate.getMonth() + 6);
                            break;
                    }

                    var currentDate = todayDate;
                    var datesToAssign = [];
                    switch (survey.recurrence) {
                        case '1day':
                            //schedule an assigned survey each day until endDate
                            while(currentDate < endDate){
                                datesToAssign.push(new Date(currentDate));
                                currentDate.setDate(currentDate.getDate()+1);
                            }
                            break;
                        case '1week':
                            while(currentDate < endDate){
                                datesToAssign.push(new Date(currentDate));
                                currentDate.setDate(currentDate.getDate()+7);
                            }
                            break;
                        case '2weeks':
                            while(currentDate < endDate){
                                datesToAssign.push(new Date(currentDate));
                                currentDate.setDate(currentDate.getDate()+14);
                            }
                            break;
                        case '1month':
                            while(currentDate < endDate){
                                datesToAssign.push(new Date(currentDate));
                                currentDate.setDate(currentDate.getMonth()+1);
                            }
                            break;
                        case '2months':
                            while(currentDate < endDate){
                                datesToAssign.push(new Date(currentDate));
                                currentDate.setDate(currentDate.getMonth()+2);
                            }
                            break;
                    }

                    // delete all the queue (assignedSurvey) items that reference the currently saved survey's id
                    // before inserting new items in
                    AssignedSurvey.find({surveyId:surveyId}).remove(function(err, num){
                        if(err){}
                        else{
                            var assignedSurveysToInsert = [];

                            datesToAssign.forEach(function(date){
                                assignedSurveysToInsert.push({
                                    userId: userId,
                                    surveyId: surveyId,
                                    isDone:false,
                                    showDate:date,
                                    __v:0
                                });
                            });

                            AssignedSurvey.collection.insert(assignedSurveysToInsert, function(err,items){});

                            demo.autoAssign(userId, surveyId, function() {
                                res.redirect('/user/' + userId);
                            });
                        }
                    });
            }
            else{
                var data ={
                    userId:userId,
                    surveyId:surveyId
                };

                var assignedSurvey = new AssignedSurvey(data);
                assignedSurvey.save(function(err, savedObj) {});

                demo.autoAssign(userId, surveyId, function() {
                    res.redirect('/user/' + userId);
                });
            }
        });
    };

	var login = function (req, res, next) {
		// update last_login date
		if(req.user) {

			User.findOne({
				_id: req.user._id
			}, function(err, u) {

				if (!u) {
					return next(new Error('Could not find User'));
				} else {
					// update last_login
					u.last_login = new Date();

					u.save(function(err) {
						if (err) {
							return console.log(err);
						}
					});
				}
			});
		}

		if (req.session.returnTo) {
			res.redirect(req.session.returnTo);
			delete req.session.returnTo;
			return;
		}

		if(req.user.permissions.provider || req.user.permissions.admin) {
			res.redirect('/admin');
		} else {

            //if the person has some assigned surveys in the queue, redirect him to the first one found
            // same as if he would navigate to /checkin/new

            Medication.find({}, function (err, dropdownItems) {
                if (err) {
                    next(err);
                }

                if (dropdownItems) {
                    dropdownItems = getStringValuesFromItemsArray(dropdownItems);
                }

                AssignedSurvey.findOne({userId:req.user.id, isDone:false, showDate:{$ne:null, $lt:new Date()}},{},function(err,assignedSurvey){
                    if(err){}
                    else{
                        if(assignedSurvey){
                            Survey.findOne({_id: assignedSurvey.surveyId}, function (err, template) {
                                if (!template) {
                                    res.redirect('/dashboard');
                                }
																
                                CheckinTemplate.find({_id: { $in: template.checkinTemplates}}, function (err, templates) {
                                    res.render('checkin/checkinEdit.ejs', {
                                        checkin: {},
                                        templates: templates,
                                        survey: template,
                                        assignedSurvey:assignedSurvey,
                                        dropdownDataSource: dropdownItems
                                    });
                                });
                            });
                        }
                        else{
                            // try again for all the assignedSurvey items that have showDate = null
                            AssignedSurvey.findOne({userId: req.user.id, isDone:false, showDate:null},"", function(err, assignedSurvey){
                                if(assignedSurvey){
                                    Survey.findOne({_id: assignedSurvey.surveyId}, function (err, template) {
                                        if (!template) {
                                            res.redirect('/dashboard');
                                        }
                                        CheckinTemplate.find({_id: { $in: template.checkinTemplates}}, function (err, templates) {
                                            res.render('checkin/checkinEdit.ejs', {
                                                checkin: {},
                                                templates: templates,
                                                survey: template,
                                                assignedSurvey:assignedSurvey,
                                                dropdownDataSource: dropdownItems
                                            });
                                        });
                                    });
                                }
                                else{
                                    res.redirect('/dashboard');
                                }
                            });
                        }
                    }
                });
            });
		}
	};

	/**
	* Login
	*/

	var signin = function (req, res) {
		res.render('users/login', {
			title: 'Login',
			message: req.flash('error')
		});
	};

	/**
	* Sign-up
	*/

	var signup = function (req, res) {
		res.render('users/signup', {
			title: 'Sign up',
			user: new User()
		});
	};


	/**
	* Create new user
	*/
	var create = function (req, res, next) {
		var user = new User(req.body);
		user.provider = 'local';

		var isProvider = false;

		if(user.permissions && user.permissions.provider || req.body.type === 'provider') {
			isProvider = true;
		}

		// remove any sneaky permissions
		user.permissions = {
			admin: false,
			provider: isProvider
		};

		user.save(function (err) {

			if(req.body.admin) {
				if(err && err.errors) {
					return res.render('users/new', {
						errors: err.errors,
						wrongUser: user,
						title: 'New user'
					});
				}

				// return to the admin
				return res.redirect('/admin');

			} else {
				if(err) {
					return res.render('users/signup', {
						errors: err.errors,
						wrongUser: user,
						title: 'Sign up'
					});
				}

				// manually login the user once successfully signed up
				req.logIn(user, function(err) {
					if (err) {
						return next(err);
					}

					return res.redirect('/');
			
				});
			}
		});
	};


	/**
	* Logout
	*/

	var logout = function (req, res) {
		req.logout();
		res.redirect('/login');
	};

	/* Find user by id */

	var user = function (req, res, next, id) {
		User.findOne({ _id : id })
			.exec(function (err, user) {
				if(err) {
					return next(err);
				}

				if(!user) {
					return next(new Error('Failed to load User ' + id));
				}

				req.profile = user;
				next();
			});
	};

	/* View user */

	var view = function (req, res, next) {
		var providerPatients = [],
			allPatients = [],
			patientIds = [],
      userCheckins = [];

		if(req.user.permissions.provider || req.user.permissions.admin) {

			// if provider, only see your own patients
			if(req.user.permissions.provider) {
				req.user.patients.forEach(function(patient){
					patientIds.push(patient.id);
				});

				if(patientIds.indexOf(req.params.id) === -1) {
					return next(new Error('You can only see your own profile'));
				}
			}

		} else {
			// if patient, see only your profile
			if (req.user.id !== req.params.id) {
				return next(new Error('You can only see your own profile'));
			}
		}

		User.findOne({ _id : req.params.id })
			.exec(function (err, user) {
				if (err) {
					return next(err);
				}
				if (!user) {
					return next(new Error('Failed to load User ' + req.params.id));
				}

				if(user.permissions.provider) {

					// get list of provider's patients
					var patientConditions = {
						'permissions.admin': { $ne: true },
						'permissions.provider': { $ne: true }
					};

					// get your own patients
					var patientIds = [];
					user.patients.forEach(function(patient){
						patientIds.push(patient.id);
					});
					patientConditions._id = { $in: patientIds };

					// get current providers patients
					User.find(patientConditions, function(err, patients) {
						if (err) {
							//
						} else {
							providerPatients = patients;

							// get all possible patients
							// those that are not already added to the provider
							User.find({
								'permissions.admin': { $ne: true },
								'permissions.provider': { $ne: true },
								'_id': { $nin: patientIds }
							}, function(err, patients) {
								if (err) {
									next(err);
								} else {
									allPatients = patients;

									res.render('users/view.ejs', {
										title: 'Details',
                    viewer: req.user,
										profile: user,
										providerPatients: providerPatients,
										allPatients: allPatients
									});

								}
							});

						}
					});
				} else {
						// Find checkins
            helper.listSurveys(req.user.id, function(templateVars) {
                res.render('users/view.ejs', {
                    title: 'Details',
                    viewer: req.user,
                    profile: user,
                    surveys: templateVars.surveyTemplates,
                    checkins: templateVars.checkinTemplates
                });
            }); 
				}
        
			});

	};

	/* New user
	*/

	var newView = function (req, res) {
		// TODO if provider, assign users to yourself
		// if patient, see only your profile
		// do this in the template

		res.render('users/new.ejs', {
			title: 'New user',
			profile: new User()
		});

	};

	/* Edit user
	*/

	var update = function (req, res, next) {

		User.findOne({ _id : req.body.id })
			.exec(function (err, user) {
				if (err) {
					return next(err);
				}

				if(!user) {
					return next(new Error('Failed to load User ' + req.body.id));
				}

				user.name = req.body.name || user.name;
				user.email = req.body.email || user.email;
				user.username = req.body.username || user.username;
				user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
				user.smsNotifications = req.body._smsNotifications || user.smsNotifications;

				if(req.body.password) {
					user.password = req.body.password;
				}

				user.save(function(err) {
					if (err) {
						return console.log(err);
					}
				});

			});

		res.redirect('/settings/profile');

	};

	var edit = function (req, res, next) {

		// edit users only if admin
		// only editing your own details
		if(req.user.permissions.admin || req.user.id === req.params.id) {

			User.findOne({ _id : req.params.id })
				.exec(function (err, user) {
					if (err) {
						return next(err);
					}
					if (!user) {
						return next(new Error('Failed to load User ' + req.params.id));
					}

					res.render('users/edit.ejs', {
						title: 'Profile',
						profile: user
					});

				});

		} else {
			// if patient, see only your profile
			return next(new Error('Only admin can edit user details'));
		}

	};

	/* Delete user
	*/

	var remove = function (req, res, next) {

		User.findOne({ _id : req.params.id })
			.exec(function (err, user) {
				if (err) {
					return next(err);
				}

				if (!user) {
					return next(new Error('Failed to load User ' + req.params.id));
				}

				user.remove();
			});

		res.redirect('/admin');

	};

	/* Follow user
	 */
	var follow = function (req, res) {

		req.user.following.push({
			id: req.body.userId,
			approved: false
		});

		req.user.save();

		res.redirect(req.session.lastUrl || '/');

	};

	/* Unfollow user
	 */
	var unfollow = function (req, res) {

		req.user.following.every(function(following, i) {
			if(following.id === req.body.userId) {
				req.user.following.splice(i, 1);
				return false;
			}
			return true;
		});

		req.user.save();

		res.redirect(req.session.lastUrl || '/');

	};

	/* Approve follow
	 */
	var approveFollow = function (req, res, next) {

		/* Find user with followerId.
		 * Then find the current logged-in user in the users' following array
		 * and set it's approved value to true
		 */
		User.findOne({ _id : req.body.followerId })
			.exec(function (err, follower) {
				if (err) {
					return next(err);
				}
				if (!user) {
					return next(new Error('Failed to load User ' + req.body.followerId));
				}

				follower.following.every(function(following) {
					if(following.id === req.user.id) {
						following.approved = true;
						return false;
					}

					return true;
				});

				follower.save();
				res.redirect(req.session.lastUrl || '/');

			});

	};

	/* Reject follow
	 */
	var rejectFollow = function (req, res, next) {

		/* Find user with followerId.
		 * Then find the current logged-in user in the users' following array
		 * and set it's approved value to false
		 */
		User.findOne({ _id : req.body.followerId })
			.exec(function (err, follower) {
				if (err) {
					return next(err);
				}

				if (!follower) {
					return next(new Error('Failed to load User ' + req.body.followerId));
				}

				follower.following.every(function(following) {
					if(following.id === req.user.id) {
						following.approved = false;
						return false;
					}

					return true;
				});

				follower.save();
				res.redirect(req.session.lastUrl || '/');

			});

	};


	return {
		authCallback: login,
		session: login,
		signup: signup,
		signin: signin,
		logout: logout,
		user: user,
		create: create,
		newView: newView,
		view: view,
		edit: edit,
		update: update,
		remove: remove,
		follow: follow,
		approveFollow: approveFollow,
		rejectFollow: rejectFollow,
		unfollow: unfollow,
		autoAssign: autoAssign,
    assignSurvey: assignSurvey
	};

}());
