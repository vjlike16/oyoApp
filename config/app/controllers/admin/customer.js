var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Customer = require('../../models/home');
var fs = require('fs');
var Email = require('../../../lib/email.js');
var usersSubscription = require('../../models/admin/users_subscription');
var subscription = require('../../models/admin/subscription');
var CustomerUpload = require('../../models/admin/customer_upload');
var usersUsedTimeLogs = require('../../models/admin/users_used_time_logs');
var lowerCase = require('lower-case');
var trim = require('trim');
var Async = require('async');
var secToMin = require('sec-to-min');
var moment = require('moment');

/* For Image Upload Configration */
const multer = require('multer')
const Storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads/profile')
	},
	filename: function (req, file, cb) {
		//cb(null, datetimestamp+'_'+file.originalname);
		var datetimestamp = Date.now();
		var fileOriginalname = file.originalname;
		fileOriginalname = fileOriginalname.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
		cb(null, datetimestamp + '_' + fileOriginalname);
		//cb(null, datetimestamp+'_');

	}
});
const upload = multer({ storage: Storage });
var multipleFileUpload = upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'registration_card', maxCount: 1 }]);
var profileImageUpload = upload.fields([{ name: 'profileImage', maxCount: 1 }]);
/* end */


exports.add = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	res.render('admin/customer/add', data);
}

exports.listing = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;

	var statusByStatus = ['active', 'inactive'];
	Customer.find({
		role_id: '2', 'status': { $in: statusByStatus }
	})
		.select(['_id', 'name', 'mail', 'address', 'status', 'created_date'])
		.sort({ 'created_date': -1 })
		.exec(function (err, result) {
			if (err) {
				data.result = '';
				res.render('admin/customer/listing', data);
			} else {
				data.result = result;
				res.render('admin/customer/listing', data);
			}
		});

}


exports.save = function (req, res) {
	var newCustomer = new Customer();
	var day = moment.utc();

	var new_id = mongoose.Types.ObjectId();
	var active_code = Math.random().toString(36).slice(-20);

	profileImageUpload(req, res, function (err) {
		if (typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == '') {
			var profileImageNewName = 'avatar.png';
		} else {
			var profileImageNewName = req.files['profileImage'][0].filename;
			console.log(req.files['profileImage'][0]);
		}

		newCustomer.profileImage = profileImageNewName;


		newCustomer.name = req.body.name;
		newCustomer.mail = req.body.mail;
		//newCustomer.mobile = req.body.mobile;
		newCustomer.gender = req.body.gender;


		// Address parameters
		if (!req.body.lat || typeof req.body.lat == "undefined") {
			var latitude = 0;
		} else {
			var latitude = req.body.lat;
		}

		if (!req.body.lng || typeof req.body.lng == "undefined") {
			var longitude = 0;
		} else {
			var longitude = req.body.lng;
		}

		var location_data = {
			"type": "Point",
			"coordinates": [latitude, longitude]
		};
		newCustomer.location = location_data;
		newCustomer.address = req.body.address;
		newCustomer.city = req.body.city;
		newCustomer.state = req.body.state;
		newCustomer.country = req.body.country;
		newCustomer.zipcode = req.body.zipcode;




		newCustomer._id = new_id;
		newCustomer.status = 'active';
		newCustomer.verify = 0;
		newCustomer.role_id = 2;
		newCustomer.active_hash = active_code;
		newCustomer.created_date = day;
		newCustomer.updated_date = day;


		newCustomer.plan_end_date = '';

		newCustomer.login_time = '';
		newCustomer.logout_time = '';
		newCustomer.device_id = '';
		newCustomer.is_login = 0;


		/***save function start***/
		newCustomer.save(function (err) {
			if (err) {
				console.log('errr', err);
				console.log('-----------------------------------', newCustomer);
				req.flash('error', 'Some problem found, try again later.');
				res.redirect(baseUrl + 'admin/customer');
			} else {
				//ready content for send email

				var content = {};
				var content = {
					'name': req.body.name,
					'email': req.body.mail,
					'subject': 'Welcome to OYO',
					'templatefoldername': 'createPasswordCustomer',
					'id': new_id,
					'token': active_code
				};

				//Sending new password via Email
				Email.send_email(content);
				req.flash('success', 'Customer created successfully.');
				res.redirect(baseUrl + 'admin/customer');
			}
		});/***save function end***/
	});
}

exports.update = function (req, res) {
	profileImageUpload(req, res, function (err) {
		if (typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == '') {
			req.body.profileImage = req.body.uploaded_profileImage;
		} else {
			req.body.profileImage = req.files['profileImage'][0].filename;
			// to remove old uploaded certificate image
			if (req.body.uploaded_profileImage != '' || req.body.uploaded_profileImage != 'null' || req.body.uploaded_profileImage != 'Null') {
				var filePath = 'public/uploads/profile/' + req.body.uploaded_profileImage;
				fs.unlink(filePath, function (err) {
					console.log('successfully deleted profile uploaded file');
				});
			}
		}

		delete req.body.mail;
		req.body.updated_date = moment.utc();

		console.log('----------------------', req.body);
		console.log('----------------------');

		Customer.update({ _id: req.body._id }, req.body, function (err, updatedUser) {
			if (err) {
				req.flash('success', 'Customer updated successfully.');
				res.redirect(baseUrl + 'admin/customer');
			} else {
				req.flash('success', 'Customer updated successfully.');
				res.redirect(baseUrl + 'admin/customer');
			}
		});
	});
}

exports.reset_password_by_admin = function (req, res) {
	var data = {};
	var active_hash = Math.random().toString(36).slice(-20);
	var id = req.params.id;

	req.body.active_hash = active_hash;
	req.body.updated_date = new Date();

	Customer.findOne({ '_id': req.params.id }, function (err, userDetails) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/customer');
		} else {
			Customer.update({ _id: req.params.id }, req.body, function (err, updatedUser) {
				if (err) {
					req.flash('error', 'Sorry something went wrong.');
					res.redirect(baseUrl + 'admin/customer');
				} else {
					//ready content for send email						
					var content = {};
					var content = {
						'name': userDetails.name,
						'email': userDetails.mail,
						'subject': 'Reset Password',
						'templatefoldername': 'resetPasswordCustomer',
						'id': id,
						'token': active_hash,
						'content': 'Please click on below Reset Password button to reset your password.'
					};
					//Sending new data via Email
					Email.send_email(content);

					req.flash('success', 'We have sent the reset password link to the registered email.');
					res.redirect(baseUrl + 'admin/customer');
				}
			});
		}
	});
}

exports.resetpassword = function (req, res) {
	res.render('admin/resetpassword', {
		error: req.flash("error"),
		success: req.flash("success"),
		session: req.session
	});
}

exports.reset_password_save = function (req, res) {
	var data = {};
	var newPassword = req.body.password;
	req.body.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
	req.body.verify = 1;
	req.body.updated_date = new Date();

	var active_hash = Math.random().toString(36).slice(-20);
	req.body.active_hash = active_hash;

	Customer.findOne({ '_id': req.params.id, 'active_hash': req.params.token })
		.exec(function (err, userDetails) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/customer/resetpassword/' + req.params.id + '/' + req.params.token);
			} else {
				if (!userDetails) {
					req.flash('error', 'Link has been expired.');
					res.redirect(baseUrl + 'admin/customer/resetpassword/' + req.params.id + '/' + req.params.token);
				} else {
					Customer.update({ _id: req.params.id }, req.body, function (err, updatedUser) {
						if (err) {
							req.flash('error', 'Sorry something went wrong.');
							res.redirect(baseUrl + 'admin/customer/resetpassword/' + req.params.id + '/' + req.params.token);
						} else {
							//ready content for send email						
							var content = {};
							var content = {
								'name': userDetails.name,
								'email': userDetails.mail,
								'subject': 'New Credential',
								'templatefoldername': 'accountActivatedCustomer',
								'password': newPassword,
								'content': 'We have successfully reset your password.'
							};
							//Sending new data via Email
							Email.send_email(content);

							req.flash('success', 'Password set successfully.');
							res.redirect(baseUrl + 'admin/mobile/successPage');
						}
					});
				}
			}
		});
}

exports.reset_password_mobile_save = function (req, res) {
	var data = {};
	var newPassword = req.body.password;
	req.body.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
	req.body.verify = 1;
	req.body.updated_date = new Date();

	var active_hash = Math.random().toString(36).slice(-20);
	req.body.active_hash = active_hash;

	Customer.findOne({ '_id': req.params.id, 'active_hash': req.params.token })
		.exec(function (err, userDetails) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/mobile/resetpassword/' + req.params.id + '/' + req.params.token);
			} else {
				if (!userDetails) {
					req.flash('error', 'Link has been expired.');
					res.redirect(baseUrl + 'admin/mobile/resetpassword/' + req.params.id + '/' + req.params.token);
				} else {
					Customer.update({ _id: req.params.id }, req.body, function (err, updatedUser) {
						if (err) {
							req.flash('error', 'Sorry something went wrong.');
							res.redirect(baseUrl + 'admin/mobile/resetpassword/' + req.params.id + '/' + req.params.token);
						} else {
							//ready content for send email						
							var content = {};
							var content = {
								'name': userDetails.name,
								'email': userDetails.mail,
								'subject': 'New Credential',
								'templatefoldername': 'accountActivatedCustomer',
								'password': newPassword,
								'content': 'We have successfully reset your password.'
							};
							//Sending new data via Email
							Email.send_email(content);

							res.redirect(baseUrl + 'admin/mobile/successPage');
						}
					});
				}
			}
		});
}

exports.successPage = function (req, res) {
	res.render('admin/successpage', {
		error: req.flash("error"),
		success: req.flash("success"),
		session: req.session
	});
}

exports.createpassword = function (req, res) {
	res.render('admin/createpassword', {
		error: req.flash("error"),
		success: req.flash("success"),
		session: req.session
	});
}

exports.create_password_save = function (req, res) {
	var data = {};
	var newPassword = req.body.password;
	req.body.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
	req.body.verify = 1;
	req.body.updated_date = new Date();
	var active_hash = Math.random().toString(36).slice(-20);
	req.body.active_hash = active_hash;

	Customer.findOne({ '_id': req.params.id, 'active_hash': req.params.token })
		.exec(function (err, userDetails) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/customer/createpassword/' + req.params.id + '/' + req.params.token);
			} else {
				if (!userDetails) {
					req.flash('error', 'Link has been expired.');
					res.redirect(baseUrl + 'admin/customer/createpassword/' + req.params.id + '/' + req.params.token);
				} else {
					Customer.update({ _id: req.params.id }, req.body, function (err, updatedUser) {
						if (err) {
							req.flash('error', 'Sorry something went wrong.');
							res.redirect(baseUrl + 'admin/customer/createpassword/' + req.params.id + '/' + req.params.token);
						} else {
							//ready content for send email						
							var content = {};
							var content = {
								'name': userDetails.name,
								'email': userDetails.mail,
								'subject': 'Account Activated',
								'templatefoldername': 'accountActivatedCustomer',
								'password': newPassword,
								'content': "Welcome to OYO! Thank you so much for joining us. We have successfully activated your account."
							};
							//Sending new data via Email
							Email.send_email(content);

							req.flash('success', 'Password set successfully.');
							res.redirect(baseUrl + 'admin/mobile/successPage');
						}
					});
				}
			}
		});

}

exports.listingWithDatatable = function (req, res) {
	var lengthLocal = parseInt(req.body);
	var lengthLocal = parseInt(req.body.length);
	var skipLocal = parseInt(req.body.start);

	var statusByStatus = req.body.sort_by_status;
	if (statusByStatus == '') {
		statusByStatus = ['active', 'inactive'];
	}

	var extra_sort_field_name = req.body.extra_sort_field_name;
	var extra_sort_field_value = req.body.extra_sort_field_value;

	if (!extra_sort_field_value) {
		extra_sort_field_name = 'created_date';
	}


	if (extra_sort_field_value == 'ascending') {
		extra_sort_field_value = 1;
	} else if (extra_sort_field_value == 'descending') {
		extra_sort_field_value = -1;
	} else {
		extra_sort_field_value = -1;
	}


	/**For get data  **/
	Customer.find({
		'role_id': '2', 'status': { $in: statusByStatus },
		'$or': [
			{ name: new RegExp(req.body.search.value, 'i') },
			{ mail: new RegExp(req.body.search.value, 'i') },
			{ tehsil: new RegExp(req.body.search.value, 'i') },
			{ district: new RegExp(req.body.search.value, 'i') },
			{ status: new RegExp(req.body.search.value, 'i') }
		]
	})
		.limit(lengthLocal)
		.skip(skipLocal)
		//.sort({'name': -1})
		.sort({ [extra_sort_field_name]: extra_sort_field_value }) //working code
		.exec(function (err, result) {
			if (err) {
				console.log(err);
			} else {
				/**For get count **/
				Customer.count({
					'role_id': '2', 'status': { $in: statusByStatus },
					'$or': [
						{ name: new RegExp(req.body.search.value, 'i') },
						{ mail: new RegExp(req.body.search.value, 'i') },
						{ tehsil: new RegExp(req.body.search.value, 'i') },
						{ district: new RegExp(req.body.search.value, 'i') },
						{ status: new RegExp(req.body.search.value, 'i') }
					]
				}, function (err, count) {
					if (err) {
						res.send(err);
					} else {
						res.json({
							data: result,
							recordsFiltered: count,
							recordsTotal: count
						});
					}
				});
			}
		});
}


exports.edit = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;

	var tasks = [
		function (callback) {
			Customer.findOne({ '_id': req.params.id })
				.exec(function (err, result) {
					if (err) {
						data.result = "";
						callback();
					} else {
						data.result = result;
						callback();
					}
				});
		},
		function (callback) {
			usersSubscription.find({ 'users_id': req.params.id })
				.sort({ 'created_date': -1 })
				.exec(function (err, plans) {
					if (err) {
						data.plans = "";
						callback();
					} else {
						data.plans = plans;
						callback();
					}
				});
		},
		function (callback) {
			CustomerUpload.find({ 'user': req.params.id })
				.sort({ 'created_date': -1 })
				.exec(function (err, uploads) {
					if (err) {
						data.uploads = "";
						callback();
					} else {
						data.uploads = uploads;
						callback();
					}
				});
		}

	];
	Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
		if (err) {
			data.result = "";
			data.plans = '';
			data.uploads = "";
			res.render('admin/customer/edit', data);
		} else {
			res.render('admin/customer/edit', data);
		}
	});
}

exports.view = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;

	var tasks = [
		function (callback) {
			Customer.findOne({ '_id': req.params.id })
				.exec(function (err, result) {
					if (err) {
						data.result = "";
						callback();
					} else {
						data.result = result;
						callback();
					}
				});
		},
		function (callback) {
			usersSubscription.find({ 'users_id': req.params.id })
				.sort({ 'status': 1 })
				.exec(function (err, plans) {
					if (err) {
						data.plans = "";
						callback();
					} else {
						data.plans = plans;
						callback();
					}
				});
		},
		function (callback) {
			CustomerUpload.find({ 'user': req.params.id })
				.sort({ 'created_date': -1 })
				.exec(function (err, uploads) {
					if (err) {
						data.uploads = "";
						callback();
					} else {
						data.uploads = uploads;
						callback();
					}
				});
		}

	];
	Async.series(tasks, function (err) { //series: for step by step and parallel: for suffle 
		if (err) {
			data.result = "";
			data.plans = '';
			data.uploads = "";
			res.render('admin/customer/view', data);
		} else {
			res.render('admin/customer/view', data);
		}
	});

}

exports.changeStatus = function (req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = req.params.status;

	Customer.update({ _id: req.params.id }, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/customer');
		} else {
			req.flash('success', 'Customer updated successfully.');
			res.redirect(baseUrl + 'admin/customer');
		}
	});
}

exports.exportToCsv = function (req, res) {
	var data = {};
	var newCustomer = new Customer();
	var day = moment.utc();
	var userEmailsInForm = req.body.userEmailsInForm;
	userEmailsInForm = userEmailsInForm.split(",");

	const Json2csvParser = require('json2csv').Parser;
	Customer.find({
		'_id': { $in: userEmailsInForm }
	})
		.sort({ 'created_date': -1 })
		.exec(async function (err, result) {
			if (err) {
				console.log('error1------------------', err);
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/customer');
			} else {
				// Making Array for export
				var dataArray = [];
				for (var i = 0; i < result.length; i++) {
					dataArray.push({ "S. No.": i+1, "Name": result[i].name, "Email": result[i].mail, "Gender": result[i].gender, "Address": result[i].address, "Last Active On": dateFormat(result[i].login_time), "CreatedDate": dateFormat(result[i].created_date, "dd-mm-yyyy h:MM TT"), "Status": result[i].status });
				}

				//Exporting
				const json2csvParser = new Json2csvParser();
				const csv = json2csvParser.parse(dataArray);

				var CurrentTimeStamp = moment.utc();
				var datetimestamp = dateFormat(CurrentTimeStamp, "yyyy_mm_dd'T'HH_MM_ss");
				var fileName = "customer_" + datetimestamp + ".csv";
				var filePath = 'public/uploads/csv/' + fileName;

				console.log('filePath------------------', filePath);

				fs.writeFileSync('public/uploads/csv/' + fileName + '', csv);
				res.download(filePath, function (err) {
					fs.unlinkSync(filePath);
					// req.flash('success', 'Successfully exported the data.');
					// res.redirect(baseUrl + 'admin/customer');
				});

			}
		});
}


exports.delete = function (req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = 'delete';

	Customer.update({ _id: req.params.id }, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/customer');
		} else {
			req.flash('success', 'Customer deleted!');
			res.redirect(baseUrl + 'admin/customer');
		}
	});
}

exports.checkDateTimeSlot = function (req, res) {
	var time = req.body.time;
	var date = req.body.date;

	var statusByStatus = ['active', 'inactive'];
	Customer.count(
		{
			'preference_date': date, 'preference_time': time, 'status': { $in: statusByStatus }
		}, function (err, count) {

			if (count > 9) {
				res.send('false');
			} else {
				res.send('true');
			}
		});
}

exports.save_subscription = function (req, res) {
	var newUsersSubscription = new usersSubscription();
	var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
	var today = dateFormat(Date.now(), "dd-mm-yyyy");
	var planName = req.body.plan;
	var currentTotalTimeCount = req.body.total_time;
	var wordFieldName = 'freewords' + planName;

	newUsersSubscription._id = mongoose.Types.ObjectId();
	newUsersSubscription.users_id = req.body.users_id;
	newUsersSubscription.plan = req.body.plan;
	newUsersSubscription.amount = req.body.amount;
	newUsersSubscription.start = today;
	newUsersSubscription.end = req.body.end_date;

	newUsersSubscription.status = 'active';
	newUsersSubscription.created_date = day;
	newUsersSubscription.updated_date = day;



	subscription.findOne({ 'users_id': req.params.id })
		.select([planName])
		.exec(function (err, plans) {
			if (plans) {
				if (planName == 'free') {
					var word_count = plans.free[0].wordlimitfree;
					var free_time = plans.free[0].freewordsfree;// it contain free time instead of word
				} else if (planName == 'bronze') {
					var word_count = plans.bronze[0].wordlimitbronze;
					var free_time = plans.bronze[0].freewordsbronze;// it contain free time instead of word
				} else if (planName == 'gold') {
					var word_count = plans.gold[0].wordlimitgold;
					var free_time = plans.gold[0].freewordsgold;// it contain free time instead of word
				} else {
					var word_count = plans.silver[0].wordlimitsilver;
					var free_time = plans.silver[0].freewordssilver; // it contain free time instead of word
				}
				var newplans = plans;

				//var totalWordsSum = parseInt(currentTotalTimeCount) + parseInt(word_count) + parseInt(free_word);
				var totalTimeSum = parseInt(currentTotalTimeCount) + parseInt(free_time);
				console.log("@@@@@@#######@@@@@@@@@");
				console.log(req.body.total_time);
				console.log("--------");
				console.log(free_time);
				console.log("--------");
				console.log(totalTimeSum);
				console.log("@@@@@@#######@@@@@@@@@");
				Customer.update({ '_id': req.body.users_id },
					{
						$set:
						{
							'total_time': totalTimeSum,
							'plan_end_date': req.body.end_date
						}
					},
					{ upsert: true, multi: false },
					function (err, result) {
						if (err) {
							console.log('Error while updating word limit.');
						}

						usersSubscription.update({ 'users_id': req.body.users_id },
							{
								$set:
								{
									'status': 'inactive'
								}
							},
							{ upsert: false, multi: true },
							function (err, result) {
								if (err) {
									console.log('Error while updating status.');
								}
								newUsersSubscription.save(function (err) {
									if (err) {
										req.flash('error', 'Some thing went wrong.');
										res.redirect(baseUrl + 'admin/customer');
									} else {
										req.flash('success', 'Plan saved successfully.');
										res.redirect(baseUrl + 'admin/customer');
									}
								});

							});
					});

			}
		});
}


exports.customer_time_logs = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.secToMin = secToMin;
	data.trim = trim;

	usersUsedTimeLogs.aggregate([
		{
			$group: {
				_id: { users_id: "$users_id", day: { $dayOfMonth: "$date" }, },
				users_id: { $last: "$users_id" },
				date: { $last: "$date" },
				totalTimeUsed: { $sum: "$time_used" },
			}
		}
	])
		.exec(function (err, result) {
			usersUsedTimeLogs.populate(result, [{ path: "users_id", select: "name" }], function (err, result) {
				console.log(result);
				console.log("@@@@@@@@@@@@@@@@");
				if (err) {
					data.result = '';
					res.render('admin/customer_time_logs/listing', data);
				} else {
					data.result = result;
					res.render('admin/customer_time_logs/listing', data);
				}
			});
		});
}	
