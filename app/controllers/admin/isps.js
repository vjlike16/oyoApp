var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Customer = require('../../models/home');
var ServiceCategories = require('../../models/admin/service_category');
var importContactSuccess = require('../../models/isp/importContactSuccess');
var Appointment = require('../../models/customers/appointments');
var sendReminder = require('../../models/isp/sendReminder');
var paymentReminder = require('../../models/isp/paymentReminder');
var connectedList = require('../../models/customers/connectedList');
var fs = require('fs');
var Email = require('../../../lib/email.js');
var usersSubscription = require('../../models/admin/users_subscription');
var subscription = require('../../models/admin/subscription');
var CustomerUpload = require('../../models/admin/customer_upload');
var manage_subscription_plan = require('../../models/admin/manage_subscription_plan');
var renewPlan = require('../../models/customers/renewPlan');
var freeTrial = require('../../models/customers/freeTrial');

var lowerCase = require('lower-case');
var trim = require('trim');
var Async = require('async');
var secToMin = require('sec-to-min');
var moment = require('moment');

/* For Image Upload Configration */
const multer = require('multer');
const { select } = require('underscore');
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
	res.render('admin/isps/add', data);
}

exports.listing = async function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;
	
	var tasks = [
		function (callback) {
			var statusByStatus = ['active', 'inactive'];
			Customer.find({
				role_id: '3', 'status': { $in: statusByStatus }
			})
			.populate('business_category',select['name','_id'])
			.populate('subscription', 'plan_name')
				.exec(function (err, result) {
					if (err) {
						data.result = "";
						callback();
					} else {
						result.reverse();
						data.result = result;
						callback();
					}
				});
		},
		function (callback) {
			ServiceCategories.find({})
				.sort({ 'created_date': -1 })
				.exec(function (err, service_categories) {
					if (err) {
						data.service_categories = "";
						callback();
					} else {
						data.service_categories = service_categories;
						//console.log("service_categories  :"+JSON.stringify(service_categories));
						callback();
					}
				});
		},

	];
	Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
		if (err) {
			data.service_categories = "";
			data.result = "";
			res.render('admin/isps/listing', data);
		} else {
			data.min = '';
			data.max = '';
			res.render('admin/isps/listing', data);
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
			var profileImageNewName = 'null';
		} else {
			var profileImageNewName = req.files['profileImage'][0].filename;
			console.log(req.files['profileImage'][0]);
		}

		newCustomer.profileImage = profileImageNewName;


		newCustomer.name = req.body.name;
		newCustomer.mail = req.body.mail;
		//newCustomer.mobile = req.body.mobile;
		newCustomer.gender = req.body.gender;
		newCustomer.business_name = req.body.business_name;
		newCustomer.business_category = req.body.business_category;


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
		newCustomer.zipcode = req.body.postal_code;




		newCustomer._id = new_id;
		newCustomer.status = 'active';
		newCustomer.verify = 0;
		newCustomer.role_id = 3;
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
				res.redirect(baseUrl + 'admin/isps');
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
				req.flash('success', 'Isps Created Successfully.');
				res.redirect(baseUrl + 'admin/isps');
			}
		});/***save function end***/
	});
}

exports.update = function (req, res) {
	profileImageUpload(req, res,async function (err) {
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
		var business_category_name = await ServiceCategories.findOne({ _id: req.body.business_category });
		business_category_name = JSON.parse(JSON.stringify(business_category_name)).name;
		req.body.business_category_name = business_category_name;
		// var plan_name = await manage_subscription_plan.findOne({ _id: req.body.subscription });
		// console.log("plan name" , req.body);
		// plan_name = JSON.parse(JSON.stringify(plan_name)).plan_name;
		//req.body.plan_name = plan_name;
		delete req.body.mail;
		req.body.updated_date = moment.utc();
		req.body.zipcode = req.body.postal_code;

		console.log('----------------------', req.body);
		console.log('----------------------');

		Customer.update({ _id: req.body._id }, req.body, function (err, updatedUser) {
			if (err) {
				req.flash('success', 'Client update successful.');
				res.redirect(baseUrl + 'admin/isps');
			} else {  
				req.flash('success', 'Client update successful.'); 
				res.redirect(baseUrl + 'admin/isps');
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
			res.redirect(baseUrl + 'admin/isps');
		} else {
			Customer.update({ _id: req.params.id }, req.body, function (err, updatedUser) {
				if (err) {
					req.flash('error', 'Sorry something went wrong.');
					res.redirect(baseUrl + 'admin/isps');
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
					res.redirect(baseUrl + 'admin/isps');
				}
			});
		}
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
				res.redirect(baseUrl + 'admin/isps/resetpassword/' + req.params.id + '/' + req.params.token);
			} else {
				if (!userDetails) {
					req.flash('error', 'Link has been expired.');
					res.redirect(baseUrl + 'admin/isps/resetpassword/' + req.params.id + '/' + req.params.token);
				} else {
					Customer.update({ _id: req.params.id }, req.body, function (err, updatedUser) {
						if (err) {
							req.flash('error', 'Sorry something went wrong.');
							res.redirect(baseUrl + 'admin/isps/resetpassword/' + req.params.id + '/' + req.params.token);
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
			manage_subscription_plan.find({})
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
		},
		function (callback) {
			ServiceCategories.find({})
				.sort({ 'created_date': -1 })
				.exec(function (err, service_categories) {
					if (err) {
						data.service_categories = "";
						callback();
					} else {
						data.service_categories = service_categories;
						//console.log("service_categories  :"+JSON.stringify(service_categories));
						callback();
					}
				});
		},

	];
	Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
		if (err) {
			data.service_categories = "";
			data.result = "";
			data.plans = '';
			data.uploads = "";
			res.render('admin/isps/edit', data);
		} else {
			res.render('admin/isps/edit', data);
		}
	});
}

exports.changeStatus = function (req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = req.params.status;
	var userId = req.params.id;
	console.log("userId",userId);
	var statusMessage = "";
	if(req.params.status == "active"){
        statusMessage = "Activated";
		Customer.update({ _id: req.params.id }, req.body, function (err, updatedresult) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/isps');
			} else {
				req.flash('success', `Business Owner ${statusMessage} Successfully.`);
				res.redirect(baseUrl + 'admin/isps');
			}
		});
	}else{
		statusMessage = "Inactivated";
		var appointmentList = []
		appointments.find({ service_proviver: userId, status:{ $in: ["Upcoming", "Ongoing"]} }, function(err , result){
			if(err){
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/isps');
			} else {
				appointmentList = result;
				if(appointmentList.length > 0){
					req.flash('error', 'The Business Owner should be active due to pending appointments.');  
					res.redirect(baseUrl + 'admin/isps');
				} else {
					Customer.update({ _id: req.params.id }, req.body, function (err, updatedresult) {
						if (err) {
							req.flash('error', 'Sorry something went wrong.');
							res.redirect(baseUrl + 'admin/isps');
						} else {
							req.flash('success', `Business Owner ${statusMessage} Successfully.`);
							res.redirect(baseUrl + 'admin/isps');
						}
					});
				}
			}
		});
	}
}

exports.exportToCsv = function (req, res) {
	var data = {};
	var newCustomer = new Customer();
	var day = moment.utc();
	// var userEmailsInForm = req.body.userEmailsInForm;
	// userEmailsInForm = userEmailsInForm.split(",");

	const Json2csvParser = require('json2csv').Parser;
	Customer.find({'role_id': '3', 'status': { $in: ['inactive','active'] }})
		//.select(['_id', 'name', 'mail', 'address', 'status', 'created_date']) 
		.populate('business_category', 'name')
		.populate('subscription', 'plan_name')
		.sort({ 'created_date': -1 })
		.exec(async function (err, result) {
			if (err) {
				console.log('error---------', err);
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/isps');
			} else {
				// Making Array for export
				var dataArray = [];
				for (var i = 0; i < result.length; i++) {
					let business_category =  (result[i].business_category == null) ? '' : result[i].business_category.name;
					let subscription =  (result[i].subscription == null) ? '' : result[i].subscription.plan_name;
				//	console.log('result------------------',result[i]);
					let plan_end_date = dateFormat(result[i].plan_end_date, "mm-dd-yyyy h:MM TT");
					let login_time = dateFormat(result[i].login_time, "mm-dd-yyyy h:MM TT");
					let created_date = dateFormat(result[i].created_date, "mm-dd-yyyy h:MM TT");
					dataArray.push({ "S. No.": i+1, "Name": result[i].name, "Email": result[i].mail, "Gender": result[i].gender, "Mobile No.":result[i].mobile, "Address": result[i].address, "City ": result[i].city, "State": result[i].state, "Zipcode": result[i].zipcode, "Business Name": result[i].business_name, "Business Category": business_category, "Subscription Plan": "Monthly Subscription", "Hear About Us":result[i].heard_about, "User Type":result[i].userType, "Signed Up Through":result[i].social_provider, "Plan End Date":  plan_end_date, "Last Paid Amount": result[i].last_paid_amount, "Last Active On": login_time, "Created Date": created_date, "Status": result[i].status });
				}
				// console.log("-----------------dataArray",dataArray);
				//Exporting
				const json2csvParser = new Json2csvParser();
				const csv = json2csvParser.parse(dataArray);

				var CurrentTimeStamp = moment.utc();
				var datetimestamp = dateFormat(CurrentTimeStamp, "yyyy_mm_dd'T'HH_MM_ss");
				var fileName = "isps_" + datetimestamp + ".csv";
				var filePath = 'public/uploads/csv/' + fileName;
 
				console.log('filePath------------------', filePath);

				fs.writeFileSync('public/uploads/csv/' + fileName + '', csv);
				res.download(filePath, function (err) {
					fs.unlinkSync(filePath);
					// req.flash('success', 'Successfully exported the data.');
					// res.redirect(baseUrl + 'admin/isps');
				});

			}
		}); 
}

var appointments = require('../../models/customers/appointments');
exports.delete = function (req, res) {
	var userId = req.params.id;
	var emailAfterDelete = `${userId}@gmail.com`;
	var data = {}; 
	req.body.updated_date = new Date();  
	req.body.status = 'delete';
	req.body.mail = emailAfterDelete;
	var email  = req.params.mail;
	var appointmentList = []
   	appointments.find({ service_proviver:userId, status:{ $in: ["Upcoming", "Ongoing"]} }, function(err , result){
	   if(err){
		req.flash('error', 'Sorry something went wrong.');
		res.redirect(baseUrl + 'admin/isps');
	   }else{
		   appointmentList = result;
		   if(appointmentList.length > 0){
			req.flash('error', 'Business Owner should be not deleted due to pending appointments.');  
			res.redirect(baseUrl + 'admin/isps');
		   }
		   else{
			 	Customer.update({ _id: req.params.id }, req.body, function (err, updatedresult) {
		           if (err) {
		            	req.flash('error', 'Sorry something went wrong.');
		             	res.redirect(baseUrl + 'admin/isps');
		            } else {  
						importContactSuccess.updateMany({ ispEmail: email },
						{ $set : {
							ispEmail: emailAfterDelete,
						}}, async function(err, updatedImportContactSuccess) {
							if(err){
								return done(err);
							} else{
								Appointment.deleteMany({
									$or: [
										{ispEmail: email},
										{mail: email}
									]
								},async function(err, removeAppointment) {
									if(err){
										return done(err);
									} else{
										await sendReminder.deleteMany({mail: email});
										await paymentReminder.deleteMany({cusMail: email});
										await connectedList.deleteMany({cusMail: email});
										await freeTrial.deleteMany({service_proviver: userId});
										await renewPlan.deleteMany({service_proviver: userId});
										console.log("BO deleted")
										req.flash('success', 'Business Owner deleted!');
										res.redirect(baseUrl + 'admin/isps');
									}
								});
							}
						});
		            }
	            });  
		   }
	   }
   	})
}
exports.datefilter = async function (req, res) {
	
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;

	var statusByStatus = ['active', 'inactive'];
	var date1 =new Date(req.body.min);
	var	min = moment(date1,"YYY-MM-DD");
	var date2 =new Date(req.body.max);
	date2.setDate(date2.getDate() + 1);
	var	max = moment(date2,"YYY-MM-DD");

	var tasks = [
		function (callback) {
			var statusByStatus = ['active', 'inactive'];
			Customer.find({
				role_id: '3', 'status': { $in: statusByStatus },
				created_date: {  
					$gte: min,  
					$lte: max
				}
			})
			.populate('business_category',select['name','_id'])
			.populate('subscription', 'plan_name') 
			.sort({ 'created_date': -1 })
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
			ServiceCategories.find({})
				.sort({ 'created_date': -1 })
				.exec(function (err, service_categories) {
					if (err) {
						data.service_categories = "";
						callback();
					} else {
						data.service_categories = service_categories;
						//console.log("service_categories  :"+JSON.stringify(service_categories));
						callback();
					}
				});
		},

	];
	Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
		if (err) {
			data.service_categories = "";
			data.result = "";
			res.render('admin/isps/listing', data);
		} else {
			data.min = min;
			date2.setDate(date2.getDate() - 1);
			max = moment(date2,"yyyy-mm-dd");
			data.max = max;
			res.render('admin/isps/listing', data);
		}
	});

	// Customer.find({
	// 	role_id: '3', 'status': { $in: statusByStatus },
	// 	created_date: {  
	// 		$gte: min,  
	// 		$lte: max
	// 	}
	// }) 
	//     .populate('business_category', 'name','_id')
	//     .populate('subscription', select['name','_id'])
	// 	//.select(['_id', 'name', 'mail','city','address','zipcode','state','country', 'profileImage','status', 'created_date'])
	// 	.sort({ 'created_date': -1 })
	// 	.exec(function (err, result) {
	// 		if (err) {
	// 			data.result = '';
	// 			res.render('admin/isps/listing', data);
	// 		} else {
	// 			data.result = result;
	// 			data.min = min;
	// 			data.max = max;

	// 			res.render('admin/isps/listing', data);
	// 		}
	// 	});
}




