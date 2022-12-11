var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var User = require('../../models/home');
var Manage_subscription_plan = require('../../models/admin/manage_subscription_plan');
var manage_discount_coupons = require('../../models/admin/manage_discount_coupons');
var Appointments = require('../../models/customers/appointments');
var freeTrial = require('../../models/customers/freeTrial');
var renewPlan = require('../../models/customers/renewPlan');
var userCard = require('../../models/customers/userCard');
var slots = require('../../models/isp/slots');
var businessHours = require('../../models/isp/businessHours');
var paymentReminder = require('../../models/isp/paymentReminder');
var sendReminder = require('../../models/isp/sendReminder');
var setAlert = require('../../models/isp/setAlert');
var Email = require('../../../lib/email.js');
const constants = require('../../../config/constants');
var notification = require('../../../lib/notificationLib');
const { baseUrl } = require('../../../config/constants');
//var DataTable = require('mongoose-datatable');
var Async = require('async');
const { select } = require('underscore');
var fs = require('fs');
var moment = require('moment');
const momentTZ = require('moment-timezone');
var importContact = require('../../models/isp/importContacts');
var subscriptions = require('../../models/isp/subscriptionsData');
var importContactSuccess = require('../../models/isp/importContactSuccess');
var service_categorie = require('../../models/customers/service');
var ServiceCategories = require('../../models/admin/service_category');
var connectedList = require('../../models/customers/connectedList');
var lowerCase = require('lower-case');
var trim = require('trim');
const PUBLISHABLE_KEY =
	'pk_test_51JVSy4CzX7kFjfHZXLy3xhQI9PWrWq3UqAX4x8R4gdemNqMMm97wketwWDtTXjbT2oORsbz4q9Jxlt8v58MKHN4W00xsqmcYKX';
const SECRET_KEY =
	'sk_test_51JVSy4CzX7kFjfHZ0WqNOWnQPs4K3Cwv0YyK75zhtqvNYPVL07zwSbWGA24Abgg5sxa8SMcLUBGO0Ip8k8SggXbU00q0DhCFD7';
const stripe = require('stripe')(SECRET_KEY);
const SECRET_KEYCHECK =
	'sk_test_51JVSy4CzX7kFjfHZ0WqNOWnQPs4K3Cwv0YyK75zhtqvNYPVL07zwSbWGA24Abgg5sxa8SMcLUBGO0Ip8k8SggXbU00q0DhCFD7';
const stripeCheck = require('stripe')(SECRET_KEYCHECK);
var mongoose = require('mongoose');
/* For Image Upload Configration */
const multer = require('multer');
const service = require('../../models/customers/service');
const Storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads/profile');
	},
	filename: function (req, file, cb) {
		//cb(null, datetimestamp+'_'+file.originalname);
		var datetimestamp = Date.now();
		var fileOriginalname = file.originalname;
		fileOriginalname = fileOriginalname
			.replace(/[^a-zA-Z0-9.]/g, '')
			.toLowerCase();
		cb(null, datetimestamp + '_' + fileOriginalname);
		//cb(null, datetimestamp+'_');
	},
});
const Storage1 = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads/past_work_images');
	},
	filename: function (req, file, cb) {
		//cb(null, datetimestamp+'_'+file.originalname);
		var datetimestamp = Date.now();
		var fileOriginalname = file.originalname;
		fileOriginalname = fileOriginalname
			.replace(/[^a-zA-Z0-9.]/g, '')
			.toLowerCase();
		cb(null, datetimestamp + '_' + fileOriginalname);
		//cb(null, datetimestamp+'_');
	},
});
const upload = multer({ storage: Storage });
const upload1 = multer({ storage: Storage1 });
var profileImageUpload = upload.fields([{ name: 'profileImage', maxCount: 1 }]);
var multipleProfileImageUpload = upload.fields([
	{ name: 'profileImage', maxCount: 5 },
]);
var pastWorkImageUpload = upload1.fields([
	{ name: 'profileImage', maxCount: 1 },
]);
var profilePastWorkImageUpload = upload.fields([
	{ name: 'profileImage', maxCount: 1 },
	{ name: 'pastWorkImage', maxCount: 1 },
]);

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

//var singleUpload = upload.fields([{ name: 'profileImage', maxCount: 1 }]);
/* end */

exports.login = function (req, res) {};

exports.customerResetPassword = function (req, res) {
	console.log('resetPassword get route :');
	var active_hash = req.params.token;
	var id = req.params.id;

	User.findOne({ _id: req.params.id, active_hash: req.params.token }).exec(
		function (err, userDetails) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(
					baseUrl +
						'customer/resetpassword/' +
						req.params.id +
						'/' +
						req.params.token
				);
			} else {
				if (!userDetails) {
					req.flash('error', 'Link has been expired.');
					//res.redirect(baseUrl + 'admin/staff/resetpassword/' + req.params.id + '/' + req.params.token);
					res.render('customer/resetpassword', {
						error: req.flash('error'),
						success: req.flash('success'),
						session: req.session,
					});
				} else {
					res.render('customer/resetpassword', {
						error: req.flash('error'),
						success: req.flash('success'),
						session: req.session,
					});
				}
			}
		}
	);
};
exports.businessHours = async function (req, res) {
	const details = req.session.userCustomerSession;
	let timeZone = req.body.timezone ? req.body.timezone : 'GMT';
	let days = [];
	let futureAppointmentsExists = false;

	const monday_start = req.body.monday_start_time || 'Closed';
	const monday_end = req.body.monday_end_time || 'Closed';
	monday_start == 'Closed'
		? days.push({ day: 'monday', startTime: '', endTime: '', isClosed: true })
		: days.push({
				day: 'monday',
				startTime: monday_start,
				endTime: monday_end,
				isClosed: false,
		  });

	const tuesday_start = req.body.tuesday_start_time || 'Closed';
	const tuesday_end = req.body.tuesday_end_time || 'Closed';
	tuesday_start == 'Closed'
		? days.push({ day: 'tuesday', startTime: '', endTime: '', isClosed: true })
		: days.push({
				day: 'tuesday',
				startTime: tuesday_start,
				endTime: tuesday_end,
				isClosed: false,
		  });

	const wednesday_start = req.body.wednesday_start_time || 'Closed';
	const wednesday_end = req.body.wednesday_end_time || 'Closed';
	wednesday_start == 'Closed'
		? days.push({
				day: 'wednesday',
				startTime: '',
				endTime: '',
				isClosed: true,
		  })
		: days.push({
				day: 'wednesday',
				startTime: wednesday_start,
				endTime: wednesday_end,
				isClosed: false,
		  });

	const thrusday_start = req.body.thrusday_start_time || 'Closed';
	const thrusday_end = req.body.thrusday_end_time || 'Closed';
	thrusday_start == 'Closed'
		? days.push({ day: 'thursday', startTime: '', endTime: '', isClosed: true })
		: days.push({
				day: 'thursday',
				startTime: thrusday_start,
				endTime: thrusday_end,
				isClosed: false,
		  });

	const friday_start = req.body.friday_start_time || 'Closed';
	const friday_end = req.body.friday_end_time || 'Closed';
	friday_start == 'Closed'
		? days.push({ day: 'friday', startTime: '', endTime: '', isClosed: true })
		: days.push({
				day: 'friday',
				startTime: friday_start,
				endTime: friday_end,
				isClosed: false,
		  });

	const saturday_start = req.body.saturday_start_time || 'Closed';
	const saturday_end = req.body.saturday_end_time || 'Closed';
	saturday_start == 'Closed'
		? days.push({ day: 'saturday', startTime: '', endTime: '', isClosed: true })
		: days.push({
				day: 'saturday',
				startTime: saturday_start,
				endTime: saturday_end,
				isClosed: false,
		  });

	const sunday_start = req.body.sunday_start_time || 'Closed';
	const sunday_end = req.body.sunday_end_time || 'Closed';
	sunday_start == 'Closed'
		? days.push({ day: 'sunday', startTime: '', endTime: '', isClosed: true })
		: days.push({
				day: 'sunday',
				startTime: sunday_start,
				endTime: sunday_end,
				isClosed: false,
		  });

	// finding futureAppointmentsExists
	let currentUTCTime = moment.utc();
	let appointments = await Appointments.find({
		status: { $in: ['Upcoming', 'Ongoing'] },
		service_proviver: new mongoose.Types.ObjectId(details._id),
		utc_start: { $gt: new Date(currentUTCTime) },
	});
	appointments = JSON.parse(JSON.stringify(appointments));
	appointments.forEach(appointmentData => {
		let appointmentDate = appointmentData.start_date;
		let dayOfDate = moment(appointmentDate).format('dddd');
		dayOfDate = dayOfDate.toLowerCase();
		let appointmentStartTime = moment(
			appointmentData.start_time,
			'hh:mm A'
		).format('HH:mm');
		let appointmentEndTime = appointmentData.end_time;
		days.forEach(data => {
			let day = data.day;
			let startTime = moment(data.startTime, 'hh:mm A').format('HH:mm');
			let endTime = moment(data.endTime, 'hh:mm A').format('HH:mm');
			// console.log("dayOfDate",dayOfDate);
			// console.log("day",day);
			if (dayOfDate == day) {
				// console.log("appointmentStartTime",appointmentStartTime);
				// console.log("appointmentEndTime",appointmentEndTime);
				// console.log("startTime",startTime);
				// console.log("endTime",endTime);
				if (
					appointmentStartTime < startTime ||
					appointmentEndTime < startTime ||
					appointmentStartTime > endTime ||
					appointmentEndTime > endTime
				) {
					futureAppointmentsExists = true;
				}
			}
		});
	});
	console.log('----------futureAppointments 125-', futureAppointmentsExists);
	if (futureAppointmentsExists) {
		req.flash(
			'error',
			`You can't change the business hours because you already have some scheduled appointments for future dates.`
		);
		res.redirect(baseUrl + 'accountSettings');
		return false;
	}

	let checkBusinessHours = await businessHours.find({ ispId: details._id });
	checkBusinessHours = JSON.parse(JSON.stringify(checkBusinessHours));
	if (checkBusinessHours.length == 0) {
		let addBusinessHour = new businessHours();
		addBusinessHour.ispId = details._id;
		addBusinessHour.mondayStartTime = monday_start;
		addBusinessHour.mondayEndTime = monday_end;
		addBusinessHour.tuesdayStartTime = tuesday_start;
		addBusinessHour.tuesdayEndTime = tuesday_end;
		addBusinessHour.wednesdayStartTime = wednesday_start;
		addBusinessHour.wednesdayEndTime = wednesday_end;
		addBusinessHour.thrusdayStartTime = thrusday_start;
		addBusinessHour.thrusdayEndTime = thrusday_end;
		addBusinessHour.fridayStartTime = friday_start;
		addBusinessHour.fridayEndTime = friday_end;
		addBusinessHour.saturdayStartTime = saturday_start;
		addBusinessHour.saturdayEndTime = saturday_end;
		addBusinessHour.sundayStartTime = sunday_start;
		addBusinessHour.sundayEndTime = sunday_end;
		addBusinessHour.days = days;
		addBusinessHour.timeZone = timeZone;
		addBusinessHour.save(function (err) {
			if (err) {
				req.flash('error', 'Something went wrong.');
				res.redirect(baseUrl + 'accountSettings');
			}
			req.flash('success', 'Business Hours added successfully.');
			res.redirect(baseUrl + 'accountSettings');
		});
	} else {
		businessHours.update(
			{ ispId: details._id },
			{
				$set: {
					mondayStartTime: monday_start,
					mondayEndTime: monday_end,
					tuesdayStartTime: tuesday_start,
					tuesdayEndTime: tuesday_end,
					wednesdayStartTime: wednesday_start,
					wednesdayEndTime: wednesday_end,
					thrusdayStartTime: thrusday_start,
					thrusdayEndTime: thrusday_end,
					fridayStartTime: friday_start,
					fridayEndTime: friday_end,
					saturdayStartTime: saturday_start,
					saturdayEndTime: saturday_end,
					sundayStartTime: sunday_start,
					sundayEndTime: sunday_end,
					days: days,
					timeZone: timeZone,
				},
			},
			async function (err, updatedUser) {
				if (err) {
					req.flash('error', 'Something went wrong.');
					res.redirect(baseUrl + 'accountSettings');
				} else {
					req.flash('success', 'Business Hours updated successfully.');
					res.redirect(baseUrl + 'accountSettings');
				}
			}
		);
	}
};

exports.addBreakHours = async function (req, res) {
	let ispId = req.session.userCustomerSession._id;
	let bodyData = req.body;
	const details = req.session.userCustomerSession;
	let breaks = [];
	breaks.push({
		startTime: req.body.breakStartTime,
		endTime: req.body.breakEndTime,
	});

	let breakCountsValue = req.body.breakCountsValue
		? parseInt(req.body.breakCountsValue)
		: 0;
	if (breakCountsValue > 1) {
		breakCountsValue--;
		for (let i = 1; i <= breakCountsValue; i++) {
			breaks.push({
				startTime: bodyData.breakStartTime1,
				endTime: bodyData.breakEndTime1,
			});
			req.body.breakStartTime1 = bodyData.breakStartTime1;
			req.body.breakEndTime1 = bodyData.breakEndTime1;
		}
	} else {
		req.body.breakStartTime1 = undefined;
		req.body.breakEndTime1 = undefined;
	}

	req.body.breaks = breaks;
	console.log('---breaks', breaks);
	// console.log('---body', req.body);
	let futureAppointmentsExists = false;
	let currentUTCTime = moment.utc();
	let appointments = await Appointments.find({
		status: { $in: ['Upcoming', 'Ongoing'] },
		service_proviver: new mongoose.Types.ObjectId(ispId),
		utc_start: { $gt: new Date(currentUTCTime) },
	});
	appointments = JSON.parse(JSON.stringify(appointments));
	appointments.forEach(appointmentTime => {
		let appointmentStartTime = moment(
			appointmentTime.start_time,
			'hh:mm A'
		).format('HH:mm');
		let appointmentEndTime = appointmentTime.end_time;
		console.log('appointmentStartTime', appointmentStartTime);
		console.log('appointmentEndTime', appointmentEndTime);
		breaks.forEach(time => {
			var startTime = moment(time.startTime, 'hh:mm A').format('HH:mm');
			var endTime = moment(time.endTime, 'hh:mm A').format('HH:mm');
			if (
				appointmentStartTime >= startTime &&
				appointmentStartTime < endTime &&
				appointmentEndTime > startTime &&
				appointmentEndTime <= endTime
			) {
				futureAppointmentsExists = true;
			}
		});
	});
	// finding futureAppointmentsExists
	if (futureAppointmentsExists) {
		console.log('----------futureAppointments- 121', futureAppointmentsExists);
		req.flash(
			'error',
			` You can't change the break hours because you already have some scheduled appointments for future dates.`
		);
		res.redirect(baseUrl + 'accountSettings');
		return false;
	}
	console.log('----------futureAppointments 125-', futureAppointmentsExists);

	let checkBusinessHours = await businessHours.find({ ispId: details._id });
	checkBusinessHours = JSON.parse(JSON.stringify(checkBusinessHours));
	if (checkBusinessHours.length == 0) {
		req.flash('error', 'Please add Business Hours first.');
		res.redirect(baseUrl + 'accountSettings');
	} else {
		businessHours.update(
			{ ispId: details._id },
			req.body,
			function (err, updatedUser) {
				if (err) {
					return done(err);
				} else {
					req.flash('success', 'Break Hours updated successfully.');
					res.redirect(baseUrl + 'accountSettings');
				}
			}
		);
	}
};

exports.removeBreakTime = function (req, res) {
	var id = req.params.id;
	var breakTimeId = req.params.value;
	console.log('id', id);
	console.log('breakTimeId', breakTimeId);
	req.body.breakStartTime1 = undefined;
	req.body.breakEndTime1 = undefined;
	businessHours.update({ _id: id }, req.body, function (err, updatedUser) {
		if (err) {
			return done(err);
		} else {
			req.flash('success', 'Break Hours remove successfully.');
			res.redirect(baseUrl + 'accountSettings');
		}
	});
};
exports.offDay = async function (req, res) {
	const details = req.session.userCustomerSession;
	let checkBusinessHours = await businessHours.findOne({ ispId: details._id });
	checkBusinessHours = JSON.parse(JSON.stringify(checkBusinessHours));
	let offDays = checkBusinessHours.days;

	let addingOffDates = req.body.offDate;
	let bookedAppointmentsDates = [];
	for (const appointmentDate of addingOffDates) {
		let appointments = await Appointments.find({
			status: { $in: ['Upcoming', 'Ongoing'] },
			service_proviver: new mongoose.Types.ObjectId(details._id),
			start_date: appointmentDate,
		});
		appointments = JSON.parse(JSON.stringify(appointments));
		if (appointments.length) {
			bookedAppointmentsDates.push(appointmentDate);
		}
	}
	if (bookedAppointmentsDates.length) {
		req.flash(
			'error',
			`You can't add off day because you already have some scheduled appointments for these ${bookedAppointmentsDates} future dates.`
		);
		res.redirect(baseUrl + 'accountSettings');
		return false;
	}

	var offDates = [];
	for (var i = 0; i < req.body.offDate.length; i++) {
		let date_value = req.body.offDate[i];
		date_value = moment.utc(date_value, 'MM-DD-YYYY').format('YYYY-MM-DD');
		console.log('date_value----------->', date_value);
		offDates.push(date_value);
	}

	req.body = {};
	req.body.offDates = offDates;

	if (offDays.length == 0) {
		req.flash('error', 'Please add Business Hours first.');
		res.redirect(baseUrl + 'accountSettings');
	} else {
		businessHours.update(
			{ ispId: details._id },
			req.body,
			function (err, updatedUser) {
				if (err) {
					return done(err);
				} else {
					req.flash('success', 'Off Day updated successfully.');
					res.redirect(baseUrl + 'accountSettings');
				}
			}
		);
	}
};
exports.removeOffDay = function (req, res) {
	var id = req.params.id;
	var offDay = req.params.value;
	console.log('id', id);
	console.log('offDay', offDay);
	req.body[`${offDay}`] = undefined;
	businessHours.update({ _id: id }, req.body, function (err, updatedUser) {
		if (err) {
			return done(err);
		} else {
			req.flash('success', 'Off day remove successfully.');
			res.redirect(baseUrl + 'accountSettings');
		}
	});
};
exports.cancelSubscription = async function (req, res) {
	const details = req.session.userCustomerSession;

	User.update(
		{ _id: details._id },
		{
			$set: {
				auto_renew: 'off',
				cancelSubscription: 'true',
			},
		},
		async function (err, updatedUser) {
			if (err) {
				return done(err);
			} else {
				await freeTrial.deleteMany({ service_proviver: details._id });
				await renewPlan.deleteMany({ service_proviver: details._id });
				req.flash(
					'success',
					'Your subscription is cancelled but it will run untill the subscription end date.'
				);
				res.redirect(baseUrl + 'accountSettings');
			}
		}
	);
};
exports.changePassword = function (req, res) {
	const details = req.session.userCustomerSession;
	const id = details._id;
	const newPassword = req.body.newPassword;
	console.log('newPassword', newPassword);
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');

	if (newPassword == req.body.currentPassword) {
		req.flash('error', 'Your old password should not be new password.');
		res.redirect('/settings');
	}

	User.update(
		{ _id: id },
		{
			$set: {
				password: bcrypt.hashSync(newPassword, bcrypt.genSaltSync(8), null),
				updated_date: day,
			},
		},
		async function (err, updatedUser) {
			if (err) {
				return done(err);
			} else {
				req.flash('success', 'Password change successful.');
				res.redirect('/settings');
			}
		}
	);
};
exports.loggedIn = async function (req, res, next) {
	if (req.session.userCustomerSession) {
		var userId = req.session.userCustomerSession._id;
		let userDetails = await User.findOne({ _id: userId });
		if (userDetails.status == 'active') {
			next();
		} else {
			req.flash(
				'error',
				'Your account is inactive or deleted. Please contact to admin.'
			);
			res.redirect(baseUrl);
		}
	} else {
		res.redirect(baseUrl);
	}
};

exports.loginFailed = async function (req, res) {
	res.redirect(baseUrl);
};

exports.checkMobileToken = async function (req, res, next) {
	console.log('SESSIN checkmobile: ', req.session.userCustomerSession);
	if (req.params.mobiletoken) {
		console.log('--------- checkMobileToken 425');
		var mobiletoken = req.params.mobiletoken;
		let userDetails = await User.findOne({ _id: mobiletoken });
		userDetails = JSON.parse(JSON.stringify(userDetails));
		console.log('--------- userDetails', userDetails);
		if (userDetails.status == 'active') {
			req.session.userCustomerSession = userDetails;
			req.app.locals.userCustomerSession = req.session.userCustomerSession;
			console.log('--------- checkMobileToken 425');
			next();
		} else {
			req.flash(
				'error',
				'Your account is inactive or deleted. Please contact to admin.'
			);
			res.redirect(baseUrl);
		}
	} else {
		console.log('--------- checkMobileToken 435');
		next();
	}
};

exports.checkUserType = function (req, res, next) {
	console.log(req.session.userCustomerSession.role_id);
	if (req.session.userCustomerSession) {
		if (req.session.userCustomerSession.role_id == 1) {
			next();
		} else {
			res.redirect(baseUrl + 'admin/draft');
		}
	} else {
		res.redirect(baseUrl + 'admin');
	}
};

exports.alluserss = function (req, res) {
	var data = {};
	data.aaparam = req.params.mail;
	data.bbmail = req.body.mail;
	User.find({}, function (err, user) {
		if (err) {
			return done(err);
		} else {
			data.userDetails = user;
			res.status(200);
			res.result = 'success';
			res.send(data);
		}
	});
};
exports.checkemailexist = function (req, res) {
	var email_id = req.body.email;
	console.log(email_id);
	User.findOne(
		{
			mail: new RegExp(email_id, 'i'),
			$or: [{ status: 'active' }, { status: 'inactive' }, { status: 'delete' }],
		},
		function (err, user) {
			if (err) {
				res.send('true');
			}
			// console.log(user.status);
			// console.log(user.verify);
			// console.log(user);
			if (!user) {
				//	console.log("Not user");
				res.send('true');
			} else if (user.status == 'delete') {
				//console.log("user :: true");
				res.send('true');
			} else {
				res.send('false');
			}
		}
	);
};
exports.checkServiceexist = function (req, res) {
	var other_service = req.body.otherService;
	ServiceCategories.findOne(
		{
			name: new RegExp(other_service, 'i'),
			status: 'active',
		},
		function (err, user) {
			if (err) {
				res.send('true');
			}
			// console.log(user.status);
			// console.log(user.verify);
			if (!user) {
				res.send('true');
			} else {
				res.send('false');
			}
		}
	);
};
exports.checkCurrentPassword = function (req, res) {
	const password = req.body.currentPassword;
	const details = req.session.userCustomerSession;
	const id = details._id;
	User.findOne(
		{
			_id: id,
		},
		function (err, user) {
			user = JSON.parse(JSON.stringify(user));
			const currentPassword = user.password;
			bcrypt.compare(password, currentPassword, (err, isMatch) => {
				if (err) {
					res.send('false');
				}
				if (!isMatch) {
					res.send('false');
				} else {
					res.send('true');
				}
			});
		}
	);
};
exports.checkToFromTime = async function (req, res) {
	let toTime = req.body.toTime;
	let fromTime = req.body.fromTime;
	console.log('toTime=============', toTime, moment(toTime, 'HH:mm A'));
	console.log('fromTime===========', fromTime, moment(fromTime, 'HH:mm A'));

	if (moment(fromTime, 'HH:mm A').isBefore(moment(toTime, 'HH:mm A'))) {
		res.send('true');
	} else {
		res.send('false');
	}

	// if (toTime.length > 0) {
	// 	var val = new Date("November 13, 2013 " + toTime);
	// 	val = val.getTime();
	// 	var par = new Date("November 13, 2013 " + fromTime);
	// 	par = par.getTime();
	// 	console.log("val", val);
	// 	console.log("par", par)
	// 	if (val > par) {
	// 		console.log("trueeeeeeeeeeeeeeeeeeeeee");
	// 		res.send('true');
	// 	} else {
	// 		console.log("falseeeeeeeeeeeeeeeeeeeeeeeeee")
	// 		res.send('false');
	// 	}
	// }
};
exports.checkOffDay = async function (req, res) {
	let ispId = req.body.ispId;
	let date = req.body.date;
	let checkOffDay = await businessHours.findOne({ ispId: ispId });
	checkOffDay = JSON.parse(JSON.stringify(checkOffDay));
	if (checkOffDay == null) {
		res.send('false');
		return false;
	}
	let checkOffDay1 = checkOffDay.offDate1;
	let checkOffDay2 = checkOffDay.offDate2;
	if (checkOffDay == null) {
		res.send('true');
	} else {
		checkOffDay = checkOffDay.offDate;

		if (date != checkOffDay) {
			if (date != checkOffDay1) {
				if (date != checkOffDay2) {
					res.send('true');
				} else {
					res.send('false');
				}
			} else {
				res.send('false');
			}
		} else {
			res.send('false');
		}
	}
};
exports.checkPastTime = async function (req, res) {
	let ispId = req.body.ispId;
	let date = req.body.date;
	console.log('req.body', req.body.date);
	let checkAppointments = await Appointments.find({
		$and: [
			{ service_proviver: ispId },
			{ start_date: date },
			{ status: 'Upcoming' },
		],
	});
	if (checkAppointments.length < 1) {
		console.log('True');
		res.send('true');
	} else {
		console.log('False');
		res.send('false');
	}

	// var todayDate = new Date().toISOString();
	// var todayTime = todayDate.split('T')[1];
	// todayDate = todayDate.split('T')[0];
	// todayTime = todayTime.split('.')[0];
	// time = moment.utc(time, 'hh:mm A').format('HH:mm:ss');
	// console.log("todayTime",todayTime);
	// console.log("time",time);
	// if(todayDate == date){
	// 	if(todayTime < time){
	// 		console.log("True");
	// 		res.send('true');
	// 	} else {
	// 		console.log("False");
	// 		res.send('false');
	// 	}
	// }
};
exports.checkIspAppointmentDate = async function (req, res) {
	let date = req.body.date;
	let ispId = req.body.ispId;
	console.log('req.body', req.body);
	let checkAppointments = await Appointments.find({
		$and: [
			{ service_proviver: ispId },
			{ start_date: date },
			{ status: 'Upcoming' },
		],
	});
	if (checkAppointments.length < 1) {
		console.log('True');
		res.send('true');
	} else {
		console.log('False');
		res.send('false');
	}
};
exports.updatePagePublic = function (req, res) {
	const details = req.session.userCustomerSession;

	let permission = req.body.permission;
	User.update(
		{ _id: details._id },
		{
			$set: {
				makePagePublic: permission,
			},
		},
		async function (err, updatedUser) {
			if (err) {
				return done(err);
			} else {
				console.log('permission', permission);
			}
		}
	);
};
exports.setAlert = async function (req, res) {
	const details = req.session.userCustomerSession;
	if (req.body.email == undefined) {
		req.body.email = false;
	}
	if (req.body.notifications == undefined) {
		req.body.notifications = false;
	}
	let email = req.body.email;
	let notifications = req.body.notifications;
	let hours = req.body.hours;
	let min = req.body.min;
	let sendAlert = [];
	let findAlert = await setAlert.findOne({ ispId: details._id });
	findAlert = JSON.parse(JSON.stringify(findAlert));
	if (findAlert == null) {
		sendAlert.push({
			ispId: details._id,
			email: email,
			notifications: notifications,
			hours: hours,
			min: min,
		});
		await setAlert.create(sendAlert);
		req.flash('success', 'Set alert added Successfully.');
		res.redirect(baseUrl + 'accountSettings');
	} else {
		await setAlert.update(
			{ _id: findAlert._id },
			req.body,
			function (err, updatedresult) {
				if (err) {
					console.log('------err', err);
					req.flash('error', 'Sorry something went wrong.');
					res.redirect(baseUrl + 'accountSettings');
				} else {
					req.flash('success', 'Set alert updated Successfully.');
					res.redirect(baseUrl + 'accountSettings');
				}
			}
		);
	}
};
exports.checkCustomeremailexist = function (req, res) {
	var email_id = req.body.email;
	console.log(email_id);
	User.findOne(
		{
			mail: new RegExp(email_id, 'i'),
			$or: [{ status: 'active' }, { status: 'inactive' }, { status: 'delete' }],
		},
		function (err, user) {
			if (err) {
				res.send('true');
			}
			if (user) {
				console.log(user);
				if (user.status == 'delete') {
					res.send('true');
				} else {
					res.send('false');
				}
			}

			if (!user) {
				res.send('true');
			}
		}
	);
};
exports.verifycode = function (req, res) {
	var otp_id = req.body.otp;
	// console.log(otp_id);
	User.findOne(
		{
			otp: new RegExp(otp_id, 'i'),
			$or: [{ status: 'active' }, { status: 'inactive' }],
		},
		function (err, user) {
			if (err) {
				res.send('true');
			}
			if (user) {
				res.send('true');
			}

			if (!user) {
				res.send('false');
			}
		}
	);
};

exports.checkemailexistexceptthis = function (req, res) {
	var email_id = req.body.mail;
	var user_id = req.body.user_id;
	User.findOne(
		{
			mail: new RegExp(email_id, 'i'),
			_id: { $ne: user_id },
			$or: [{ status: 'active' }, { status: 'inactive' }],
		},
		function (err, user) {
			if (err) {
				res.send('true');
			}
			if (user) {
				res.send('false');
			}

			if (!user) {
				res.send('true');
			}
		}
	);
};

exports.checkbarregistrationexist = function (req, res) {
	var bar_registration = req.body.bar_registration;
	User.findOne(
		{
			bar_registration: new RegExp(bar_registration, 'i'),
			$or: [{ status: 'active' }, { status: 'inactive' }],
		},
		function (err, user) {
			if (err) {
				res.send('true');
			}
			if (user) {
				res.send('false');
			}

			if (!user) {
				res.send('true');
			}
		}
	);
};

exports.checkbarregistrationexistexceptthis = function (req, res) {
	var bar_registration = req.body.bar_registration;
	var user_id = req.body.user_id;
	User.findOne(
		{
			bar_registration: new RegExp(bar_registration, 'i'),
			_id: { $ne: user_id },
			$or: [{ status: 'active' }, { status: 'inactive' }],
		},
		function (err, user) {
			if (err) {
				res.send('true');
			}
			if (user) {
				res.send('false');
			}

			if (!user) {
				res.send('true');
			}
		}
	);
};

exports.signup = function (req, res) {
	if (req.session.userCustomerSession) {
		res.redirect(baseUrl + 'admin/signup');
	} else {
		res.render('admin/signup', {
			error: req.flash('error'),
			success: req.flash('success'),
			session: req.session,
		});
	}
};

exports.logout = function (req, res) {
	if (req.session.userCustomerSession) {
		// req.logout(function(err) {
		// 	if (err) { return next(err); }
		// 	res.redirect(baseUrl);
		//   });
		//req.session.userCustomerSession.destroy();
		delete req.session.userCustomerSession;
		res.redirect(baseUrl);
	} else {
		res.render('home', {
			error: req.flash('error'),
			success: req.flash('success'),
			session: req.session,
			msg: '',
		});
	}
};

exports.checkandsendnewpassword = function (req, res) {
	//	console.log(req.body);
	var data = {};
	var active_hash = Math.random().toString(36).slice(-20);

	req.body.active_hash = active_hash;
	req.body.updated_date = new Date();

	User.findOne(
		{
			status: { $ne: 'delete' },
			mail: new RegExp(req.body.email, 'i'),
			$or: [{ role_id: '2' }, { role_id: '3' }],
		},
		function (err, userDetails) {
			if (err || !userDetails) {
				req.flash(
					'error',
					'Email address does not exist. Please use a registered email address.'
				);
				res.redirect(baseUrl);
			} else if (userDetails.verify == 0) {
				var mail = { email: req.body.email };
				//	console.log(mail);
				var data0 = {};
				data0 = req.session;
				Object.assign(data0, mail);
				req.session = data0;
				req.session.save();

				req.flash(
					'error',
					'Your account is not verified. Please verify your account first.$' +
						userDetails._id
				);
				res.redirect(baseUrl + 'verify');
			} else {
				User.update(
					{ _id: userDetails._id },
					req.body,
					function (err, updatedUser) {
						if (err) {
							req.flash('error', 'Sorry something went wrong.');
							res.redirect(baseUrl);
						} else {
							//ready content for send email
							var content = {};
							var content = {
								name: userDetails.name,
								email: userDetails.mail,
								subject: 'Reset Password',
								templatefoldername: 'resetPasswordCustomer',
								id: userDetails._id,
								token: active_hash,
								content:
									'A request was submitted to reset your account password. Please, click the link below to generate a new password. Disregard if the request to reset your password was not from you.',
							};
							//Sending new data via Email
							Email.send_email(content);

							req.flash(
								'success',
								'We have sent the reset password link to the registered email.'
							);
							res.redirect(baseUrl);
						}
					}
				);
			}
		}
	);
};
exports.reset_password_save = function (req, res) {
	//console.log("resetPassword : save")
	var data = {};
	var newPassword = req.body.password;
	req.body.password = bcrypt.hashSync(
		req.body.password,
		bcrypt.genSaltSync(8),
		null
	);
	req.body.verify = 1;
	req.body.updated_date = new Date();

	var active_hash = Math.random().toString(36).slice(-20);
	req.body.active_hash = active_hash;

	User.findOne({ _id: req.params.id, active_hash: req.params.token }).exec(
		function (err, userDetails) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(
					baseUrl +
						'admin/staff/resetpassword/' +
						req.params.id +
						'/' +
						req.params.token
				);
			} else {
				if (!userDetails) {
					//req.flash('error', 'Link has been expiredxfmkngblfnl.');
					//	console.log("reset_password_save :     link expired .");
					res.redirect(
						baseUrl +
							'customer/resetpassword/' +
							req.params.id +
							'/' +
							req.params.token
					);
				} else {
					User.update(
						{ _id: req.params.id },
						req.body,
						function (err, updatedUser) {
							if (err) {
								req.flash('error', 'Sorry something went wrong.');
								res.redirect(
									baseUrl +
										'customer/resetpassword/' +
										req.params.id +
										'/' +
										req.params.token
								);
							} else {
								//ready content for send email
								var content = {};
								var content = {
									name: userDetails.name,
									email: userDetails.mail,
									subject: 'New Credential',
									templatefoldername: 'accountActivatedCustomer',
									password: newPassword,
									content:
										'We have successfully reset your password, Please fill below credentials for login, after click on below login button.',
								};
								//Sending new data via Email
								// Email.send_email(content);

								req.flash(
									'success',
									'Password changed. Please login with your new password.'
								);
								res.redirect(baseUrl);
							}
						}
					);
				}
			}
		}
	);
};

exports.verifyOtp = async function (req, res) {
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	console.log('OTPSSN: ', req.session.webUser, req.session.email);
	// console.log("OTPSSN: ",req.session.webUser,req.session.email,req.session.passport.webUser,req.session.passport.email)
	if (!req.session.webUser && !req.session.email) {
		data.msg = ' ';
		req.flash('error', 'Incorrect verification code.');
		res.render('verifyCustomer.ejs', data);
		return;
	}
	var check = req.session.webUser;
	let email;
	if (check == undefined) {
		email = req.session.email;
	} else {
		email = req.session.webUser.email;
	}
	const otp = req.body.otp;
	const connectUser = [];
	console.log('after verified :' + email);
	User.findOne({ mail: email, otp: otp }, async function (err, result) {
		req.session.userCustomerSession = result;
		if (err) {
			data.msg = 'Please enter the correct verification code.';
			req.flash('error', 'Incorrect verification code.');
			res.render('verifyCustomer.ejs', data);
		} else {
			if (!result) {
				// req.session.msg = "Please enter correct verification code.";
				data.msg = 'Please enter the correct verification code.';
				req.flash('error', 'Incorrect verification code.');
				res.render('verifyCustomer.ejs', data);
			} else {
				User.update({ _id: result._id }, { verify: 1 }, function (err, result) {
					if (err) throw err;
				});
				await importContactSuccess
					.findOne({ mail: result.mail })
					.then(async checkMail => {
						checkMail = JSON.parse(JSON.stringify(checkMail));
						if (checkMail != null) {
							var cusAddress;
							var ispNotes;
							var ispNotesUpdate;
							if (checkMail.address != undefined) {
								cusAddress = checkMail.address;
								ispNotes = checkMail.notes;
								ispNotesUpdate = day;
							}
							connectUser.push({
								status: 'pending',
								ispId: checkMail.ispId,
								ispName: checkMail.ispName,
								ispMail: checkMail.ispEmail,
								IspProfileImage: checkMail.ispProfile,
								cusId: result._id,
								cusName: result.name,
								cusMail: result.mail,
								cusAddress: cusAddress,
								cusMobile: result.mobile,
								social_provider: result.social_provider,
								ispNotes: ispNotes,
								ispNotesUpdate: ispNotesUpdate,
								cusProfile: result.profileImage,
								ispInvite: 'true',
								createdDate: day,
							});
							await connectedList.create(connectUser);
							await importContactSuccess.findOneAndRemove({
								_id: checkMail._id,
							});
						}
						if (result.role_id == 3) {
							req.flash(
								'success',
								'Verification completed. Please, setup your profile.'
							);
							res.redirect(baseUrl + 'complete-profile');
						} else if (result.role_id == 2) {
							req.flash(
								'success',
								'Verification completed. Please, setup your profile.'
							);
							res.redirect(baseUrl + 'cus-complete-profile');
						}
					})
					.catch(err => {
						res.send(err);
					});
			}
		}
	});
};
exports.complete_profile = function (req, res) {
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;
	//res.render('customer/appointments/connected_Isp_Detail.ejs', data);
	User.find({ _id: req.app.locals.userCustomerSession._id })
		.populate('business_category', select[('name', '_id')])
		.exec(function (err, result) {
			if (err) {
				throw err;
			} else {
				data.userDetails = result[0]._doc;
				//console.log(" data 14 :",data.userDetails);
				res.render(
					'customer/onbording-screens/onboarding-complete-profile.ejs',
					data
				);
			}
		});
};
var past_work_image = require('../../models/isp/past_work_image');
exports.past_work_images = function (req, res) {
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	var details = req.app.locals.userCustomerSession;
	pastWorkImageUpload(req, res, function (err) {
		if (
			typeof req.files == 'undefined' ||
			typeof req.files['profileImage'] == 'undefined' ||
			req.files['profileImage'] == ''
		) {
			var profileImageNewName = 'avatar.png';
		} else {
			var profileImageNewName = req.files['profileImage'][0].filename;
			//console.log(req.files['profileImage'][0]);
		}

		var images = new past_work_image();
		images.userId = details._id;
		images.image = profileImageNewName;
		images.save(function (err, result) {
			if (err) {
				throw err;
			} else {
				req.flash('success', 'images added successfully.');
				res.redirect(baseUrl + 'my-profile/' + details._id);
			}
		});
	});
};

exports.delete_past_work_images = function (req, res) {
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	var details = req.app.locals.userCustomerSession;
	var imageName = req.params.id;
	var imgid = req.params.imgId;

	var filePath = 'public/uploads/profile/' + imageName;
	fs.unlink(filePath, function (err, result) {
		if (err) {
			console.log('image error--------------------', err);
			throw err;
		} else {
			console.log('Successfully deleted profile uploaded file.');
		}
	});

	past_work_image.remove({ _id: imgid }, function (err, result) {
		if (err) {
			throw err;
		} else {
			req.flash('success', 'Image deleted successfully.');
			res.redirect(baseUrl + 'my-profile/' + details._id);
		}
	});
};
exports.complete_profile_save = function (req, res) {
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	var service_category_id;
	profileImageUpload(req, res, async function (err) {
		console.log('req.body', req.body);
		console.log('req.body.otherService', req.body.otherService);
		if (req.body.otherService) {
			console.log('true');
			var s_cat = [];
			var count = 0;
			var s_data = await ServiceCategories.find({
				name: req.body.otherService,
				status: { $ne: 'delete' },
			}).then(res => {
				console.log('s_data-----', res);
				s_cat = res;
				if (s_cat.length == 0) {
					var day = moment.utc();
					var newService_category = new ServiceCategories();
					newService_category._id = mongoose.Types.ObjectId();
					service_category_id = newService_category._id;
					newService_category.name = req.body.otherService;
					newService_category.typ = 'Other';
					newService_category.count = 1;
					//newService_category.pagecontent = req.body.pagecontent;
					newService_category.status = 'active';
					newService_category.created_date = day;
					newService_category.updated_date = day;
					console.log(
						'newService_category-------------------------->',
						newService_category
					);
					newService_category.save();
				} else {
					if (res[0].count !== undefined) {
						count = res[0].count + 1;
					}
					service_category_id = res[0]._doc._id;
					ServiceCategories.update(
						{ name: req.body.otherService, status: { $ne: 'delete' } },
						{ count: count },
						function (err, updatedresult) {
							if (err) {
								return done(
									null,
									false,
									req.flash(
										'error',
										'This service category is already existed.'
									)
								);
							} else {
								console.log('result ---- >>', updatedresult);
								//return done(null, false, req.flash('error', 'This service category is already existed.'));
							}
						}
					);
				}
			});
			//console.log(s_data)
		}

		if (
			typeof req.files == 'undefined' ||
			typeof req.files['profileImage'] == 'undefined' ||
			req.files['profileImage'] == ''
		) {
			req.body.profileImage = req.body.uploaded_profileImage;
		} else {
			req.body.profileImage = req.files['profileImage'][0].filename;
			// to remove old uploaded certificate image
			if (
				req.body.uploaded_profileImage != '' ||
				req.body.uploaded_profileImage != 'null' ||
				req.body.uploaded_profileImage != 'Null' ||
				req.body.uploaded_profileImage != 'avatar.png'
			) {
				var filePath =
					'public/uploads/profile/' + req.body.uploaded_profileImage;
				if (req.body.uploaded_profileImage != 'avatar.png') {
					fs.unlink(filePath, function (err) {
						console.log('Successfully deleted profile uploaded file.');
					});
				}
			}
		}
		if (req.body.otherService) {
			req.body.business_category = service_category_id;
			req.body.business_category_name = req.body.otherService;
		} else {
			console.log('req.body.category', req.body.category);
			let business_category_name = await ServiceCategories.find({
				_id: req.body.category,
			});
			business_category_name = JSON.parse(
				JSON.stringify(business_category_name)
			);
			business_category_name = business_category_name[0].name;
			req.body.business_category_name = business_category_name;
		}
		req.body.updated_date = new Date();
		//req.body.profileImage = profileImageNewName;
		var date = req.body.birthdate;
		var a = {};
		if (req.body.lat && req.body.lng) {
			a.coordinates = [{ lat: req.body.lat, lng: req.body.lng }];
		} else {
			a.coordinates = [{ lat: '', lng: '' }];
		}
		req.body.location = a;
		req.body.zipcode = req.body.postal_code;
		date = moment(date).toDate();
		req.body.birthdate = date;
		//	console.log("lfjkbgkdbg ::::::::::::::  "+req.app.locals.userCustomerSession._id);
		User.update(
			{ _id: req.app.locals.userCustomerSession._id },
			req.body,
			async function (err, updatedUser) {
				if (err) {
					console.log(err);
					req.flash('error', 'Sorry something went wrong.');
					res.redirect(baseUrl + 'subscribe-to-plan');
				} else {
					//req.flash('success', 'Profile updated!.');
					let userDetails = await User.findOne({
						_id: req.app.locals.userCustomerSession._id,
					});
					req.session.userCustomerSession = userDetails;
					res.redirect(baseUrl + 'subscribe-to-plan');
				}
			}
		);
	});
};
exports.payment_info = function (req, res) {
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	//res.render('customer/appointments/connected_Isp_Detail.ejs', data);
	res.render('customer/onbording-screens/onboarding-payment_info.ejs', data);
};
exports.account_card_save = async function (req, res) {
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;

	//// card data variables ...
	let name = req.body.name;
	let cardNumber = req.body.cardNumber;
	let cvv = req.body.cvv;
	var expiress = req.body.expires;
	var month = expiress.split('-')[0];
	var year = expiress.split('-')[1];

	/// Account data variables..
	await stripe.tokens
		.create({
			card: {
				name: name,
				number: cardNumber,
				exp_month: month,
				exp_year: year,
				cvc: cvv,
			},
		})
		.then(async function (cardTokenCreated) {
			await stripe.customers
				.createSource(stripeCustomerId, { source: cardTokenCreated.id })
				.then(function (result) {
					req.flash(
						'success',
						'Payment details added succcessfully. Please subscribe to any plan'
					);
					res.redirect(baseUrl + 'subscribe-to-plan');
				})
				.catch(function (err) {
					req.flash('error', err.raw.message);
					res.redirect(baseUrl + 'payment-info');
				});
		})
		.catch(function (err) {
			req.flash('error', err.raw.message);
			res.redirect(baseUrl + 'payment-info');
		});
};

exports.subscribe_to_plan = async function (req, res) {
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	if (typeof stripeCustomerId != 'undefined') {
		var cardList = await stripe.customers.listSources(stripeCustomerId, {
			object: 'card',
			limit: 20,
		});
		cardList = JSON.parse(JSON.stringify(cardList));
		data.cardList = cardList.data;
	}
	Manage_subscription_plan.find({ status: 'active' }).exec(function (
		err,
		result
	) {
		if (err) {
			throw err;
		} else {
			// console.log("result----->>" , result);
			var annual_price = result[0]._doc.annual_price / 12;
			data.annual_price = annual_price.toFixed(2);
			data.monthly_price = result[0]._doc.monthly_price;
			data.subscription = result[0]._doc;
			res.render(
				'customer/onbording-screens/onboarding-subscribe-to-plan.ejs',
				data
			);
		}
	});
	//res.render('customer/appointments/connected_Isp_Detail.ejs', data);
};
exports.subscribe_paymentSaveCard = async (req, res) => {
	var freeTrialInfo = [];
	var renewInfo = [];
	var subscriptionsInfo = [];
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	var name = req.app.locals.userCustomerSession.name;
	var email = req.app.locals.userCustomerSession.mail;
	var userId = req.app.locals.userCustomerSession._id;
	var cardId = req.body.card_Id;
	var amount = req.body.amount1;
	var plan_name = req.body.plan_name;
	var coupon_code = req.body.coupon_code;
	var coupon_based_on = req.body.coupon_based_on;
	var discount = req.body.discount;
	var coupon_type = req.body.coupon_type;
	if (coupon_based_on == '') {
		coupon_code = '';
		coupon_based_on = '';
		discount = '';
		coupon_type = '';
	}
	amount = amount * 100;
	amount = amount.toFixed(2).toString();
	amount = parseFloat(amount);
	subscriptionsInfo.push({
		ispId: userId,
		name: name,
		mail: email,
		coupon_code: coupon_code,
		created_date: new Date(Date.now()),
	});
	if (coupon_code != '') {
		await manage_discount_coupons.findOne(
			{
				code_name: new RegExp(coupon_code, 'i'),
				status: 'active',
			},
			async function (err, couponData) {
				couponData = JSON.parse(JSON.stringify(couponData));
				var coupon_count = couponData.used_so_far;
				coupon_count = coupon_count + 1;
				var used_so_far = { used_so_far: coupon_count };
				await manage_discount_coupons.update(
					{ code_name: new RegExp(coupon_code, 'i') },
					used_so_far,
					function (err, updatedresult) {
						if (err) {
							console.log('------err', err);
							req.flash('error', 'Sorry something went wrong.');
							res.redirect(baseUrl + 'subscribe-to-plan');
						}
					}
				);
			}
		);
	}
	if (req.body.free_trial == 'on') {
		var free_trial_end_date = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
		freeTrialInfo.push({
			service_proviver: userId,
			email: email,
			plan_end_date: free_trial_end_date,
			plan_name: plan_name,
			plan_amount: amount,
			stripeCustomerId: stripeCustomerId,
			stripeCardId: cardId,
		});
		User.update(
			{ _id: userId },
			{
				$set: {
					subscriptionValidity: 'True',
					profileCompleted: true,
					plan_end_date: free_trial_end_date,
					last_paid_amount: 0,
					plan_name: 'Free Trial',
					auto_renew: req.body.auto_renew,
					free_trial: req.body.free_trial,
					coupon_code: coupon_code,
					coupon_based_on: coupon_based_on,
					coupon_type: coupon_type,
					discount: discount,
				},
			},
			async function (err, updatedUser) {
				if (err) {
					return done(err);
				} else {
					if (req.body.auto_renew == 'on') {
						var renew_end_date_with_freeTrial = new Date(
							Date.now() + 3 * 24 * 60 * 60 * 1000
						);
						renewInfo.push({
							service_proviver: userId,
							email: email,
							plan_end_date: renew_end_date_with_freeTrial,
							plan_name: plan_name,
							plan_amount: amount,
							stripeCustomerId: stripeCustomerId,
							stripeCardId: cardId,
						});
						await renewPlan.create(renewInfo);
					}
					await freeTrial.create(freeTrialInfo);
					await subscriptions.create(subscriptionsInfo);
					var userDetails = await User.findOne({ _id: userId });
					req.session.userCustomerSession = userDetails;
					req.flash('success', 'Free trial login successfully');
					res.redirect(baseUrl + 'import-contacts');
				}
			}
		);
		return false;
	}
	if (req.body.auto_renew == 'on') {
		var renew_end_date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
		renewInfo.push({
			service_proviver: userId,
			email: email,
			plan_end_date: renew_end_date,
			plan_name: plan_name,
			plan_amount: amount,
			stripeCustomerId: stripeCustomerId,
			stripeCardId: cardId,
		});
		await renewPlan.create(renewInfo);
	}
	await stripe.charges
		.create({
			amount: amount,
			currency: 'usd',
			description: 'subscription payment',
			customer: stripeCustomerId,
			source: cardId,
		})
		.then(async charge => {
			if (charge.status == 'succeeded') {
				let new_amount = req.body.amount1;
				var plan_end_date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
				subscriptionsInfo[0].plan_end_date = plan_end_date;
				subscriptionsInfo[0].last_paid_amount = new_amount;
				subscriptionsInfo[0].plan_name = req.body.plan_name;
				User.update(
					{ _id: userId },
					{
						$set: {
							last_paid_amount: new_amount,
							subscriptionValidity: 'True',
							profileCompleted: true,
							plan_end_date: plan_end_date,
							plan_name: req.body.plan_name,
							auto_renew: req.body.auto_renew,
							free_trial: req.body.free_trial,
							coupon_code: coupon_code,
							coupon_based_on: coupon_based_on,
							coupon_type: coupon_type,
							discount: discount,
						},
					},
					async function (err, updatedUser) {
						if (err) {
							return done(err);
						} else {
							await subscriptions.create(subscriptionsInfo);
							var userDetails = await User.findOne({ _id: userId });
							req.session.userCustomerSession = userDetails;
							req.flash('success', 'Payment complete!.');
							res.redirect(baseUrl + 'import-contacts');
						}
					}
				);
			} else {
				req.flash('success', 'Payment  has not been done.');
				res.redirect(baseUrl + 'import-contacts');
			}
		})
		.catch(err => {
			res.send(err);
		});
};

exports.subscribe_payment = async (req, res) => {
	var freeTrialInfo = [];
	var renewInfo = [];
	var subscriptionsInfo = [];
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	var name = req.app.locals.userCustomerSession.name;
	var email = req.app.locals.userCustomerSession.mail;
	var userId = req.app.locals.userCustomerSession._id;
	var stripeToken = req.body.stripeToken;
	var amount = req.body.amount1;
	var plan_name = req.body.plan_name;
	var coupon_code = req.body.coupon_code;
	var coupon_based_on = req.body.coupon_based_on;
	var discount = req.body.discount;
	var coupon_type = req.body.coupon_type;
	if (coupon_based_on == '') {
		coupon_code = '';
		coupon_based_on = '';
		discount = '';
		coupon_type = '';
	}
	amount = amount * 100;
	amount = amount.toFixed(2).toString();
	amount = parseFloat(amount);
	subscriptionsInfo.push({
		ispId: userId,
		name: name,
		mail: email,
		plan_name: plan_name,
		coupon_code: coupon_code,
		created_date: new Date(Date.now()),
	});
	if (coupon_code != '') {
		await manage_discount_coupons.findOne(
			{
				code_name: new RegExp(coupon_code, 'i'),
				status: 'active',
			},
			async function (err, couponData) {
				couponData = JSON.parse(JSON.stringify(couponData));
				var coupon_count = couponData.used_so_far;
				coupon_count = coupon_count + 1;
				var used_so_far = { used_so_far: coupon_count };
				await manage_discount_coupons.update(
					{ code_name: new RegExp(coupon_code, 'i') },
					used_so_far,
					function (err, updatedresult) {
						if (err) {
							console.log('------err', err);
							req.flash('error', 'Sorry something went wrong.');
							res.redirect(baseUrl + 'subscribe-to-plan');
						}
					}
				);
			}
		);
	}
	var addCard = await stripe.customers.createSource(stripeCustomerId, {
		source: stripeToken,
	});
	if (req.body.free_trial == 'on') {
		var free_trial_end_date = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
		freeTrialInfo.push({
			service_proviver: userId,
			email: email,
			plan_end_date: free_trial_end_date,
			plan_name: plan_name,
			plan_amount: amount,
			stripeCustomerId: stripeCustomerId,
			stripeCardId: addCard.id,
		});
		User.update(
			{ _id: userId },
			{
				$set: {
					subscriptionValidity: 'True',
					profileCompleted: true,
					plan_end_date: free_trial_end_date,
					last_paid_amount: 0,
					plan_name: 'Free Trial',
					auto_renew: req.body.auto_renew,
					free_trial: req.body.free_trial,
					coupon_code: coupon_code,
					coupon_based_on: coupon_based_on,
					coupon_type: coupon_type,
					discount: discount,
				},
			},
			async function (err, updatedUser) {
				if (err) {
					return done(err);
				} else {
					if (req.body.auto_renew == 'on') {
						var renew_end_date_with_freeTrial = new Date(
							Date.now() + 3 * 24 * 60 * 60 * 1000
						);
						renewInfo.push({
							service_proviver: userId,
							email: email,
							plan_end_date: renew_end_date_with_freeTrial,
							plan_name: plan_name,
							plan_amount: amount,
							stripeCustomerId: stripeCustomerId,
							stripeCardId: addCard.id,
						});
						await renewPlan.create(renewInfo);
					}
					await freeTrial.create(freeTrialInfo);
					await subscriptions.create(subscriptionsInfo);
					var userDetails = await User.findOne({ _id: userId });
					req.session.userCustomerSession = userDetails;
					req.flash('success', 'Free trial login successfully');
					res.redirect(baseUrl + 'import-contacts');
				}
			}
		);
		return false;
	}
	if (req.body.auto_renew == 'on') {
		var renew_end_date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
		renewInfo.push({
			service_proviver: userId,
			email: email,
			plan_end_date: renew_end_date,
			plan_name: plan_name,
			plan_amount: amount,
			stripeCustomerId: stripeCustomerId,
			stripeCardId: addCard.id,
		});
		await renewPlan.create(renewInfo);
	}
	await stripe.charges
		.create({
			amount: amount,
			currency: 'usd',
			description: 'subscription payment',
			customer: stripeCustomerId,
			source: addCard.id,
		})
		.then(async charge => {
			if (charge.status == 'succeeded') {
				let new_amount = req.body.amount1;
				var plan_end_date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
				subscriptionsInfo[0].plan_end_date = plan_end_date;
				subscriptionsInfo[0].last_paid_amount = new_amount;
				subscriptionsInfo[0].plan_name = req.body.plan_name;
				User.update(
					{ _id: userId },
					{
						$set: {
							last_paid_amount: new_amount,
							subscriptionValidity: 'True',
							profileCompleted: true,
							plan_end_date: plan_end_date,
							plan_name: req.body.plan_name,
							auto_renew: req.body.auto_renew,
							free_trial: req.body.free_trial,
							coupon_code: coupon_code,
							coupon_based_on: coupon_based_on,
							coupon_type: coupon_type,
							discount: discount,
						},
					},
					async function (err, updatedUser) {
						if (err) {
							return done(err);
						} else {
							await subscriptions.create(subscriptionsInfo);
							var userDetails = await User.findOne({ _id: userId });
							req.session.userCustomerSession = userDetails;
							req.flash('success', 'Payment complete!.');
							res.redirect(baseUrl + 'import-contacts');
						}
					}
				);
			} else {
				req.flash('success', 'Payment  has not been done.');
				res.redirect(baseUrl + 'import-contacts');
			}
		})
		.catch(err => {
			res.send(err);
		});
};
exports.import_contacts = function (req, res) {
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	res.render('customer/onbording-screens/onboarding-import-contact.ejs', data);
};
exports.select_contacts = async function (req, res) {
	const mail = req.app.locals.userCustomerSession.mail;
	data = {};
	data.importContact = await importContact.find({ ispEmail: mail });
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	res.render('customer/onbording-screens/onboarding-select-contacts.ejs', data);
};
exports.select_contacts_profile = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	const mail = details.mail;
	data = {};
	data.importContact = await importContact.find({ ispEmail: mail });
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	res.render('customer/importContacts/selectContacts.ejs', data);
};
exports.add_service = async function (req, res) {
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	res.render('customer/onbording-screens/onboarding-add-service.ejs', data);
};
var _service = require('../../models/customers/service');
var settings = require('../../models/admin/setting');

exports.add_service_save = async function (req, res) {
	var maximumServices = await settings.find({
		key_name: 'maximum_service_isp',
	});
	var ServiceCount = await _service.count({
		service_proviver: req.app.locals.userCustomerSession._id,
	});
	var details = req.app.locals.userCustomerSession;
	console.log('maximumServices-----------,,', maximumServices[0].value);
	console.log('ServiceCount-----------,,', ServiceCount);
	var day = moment.utc();
	//console.log("req.body outside,,",req.body);
	if (ServiceCount < maximumServices[0].value) {
		//	console.log("req.body.name -------------------->", req.body.name);

		//	console.log("inside ----------------------------------------------------");
		multipleProfileImageUpload(req, res, async function (err) {
			if (req.body.name !== undefined) {
				var arr = [];

				if (
					typeof req.files == 'undefined' ||
					typeof req.files['profileImage'] == 'undefined' ||
					req.files['profileImage'] == ''
				) {
					var profileImageNewName0 = 'avatar.png';
				} else {
					var profileImageNewName0 = req.files['profileImage'][0].filename;
					//console.log(req.files['profileImage'][0]);
				}
				console.log('profileImageNewName0---->>', profileImageNewName0);
				arr.push({
					name: req.body.name,
					service_proviver_name: details.name,
					service_proviver: details._id,
					business_category: details.business_category,
					icon: profileImageNewName0,
					hours: req.body.duration_hours,
					minutes: req.body.duration_minutes,
					advance: req.body.advance,
					cancellation: req.body.cancellation,
					price: req.body.price,
					description: req.body.description,
					allowded_customers: req.body.allowded_customers,
					status: 'active',
					created_date: day,
					updated_date: day,
				});

				var a = await _service.create(arr).then(result => {
					req.flash('success', 'Service added!');
					res.redirect(baseUrl + 'main');
				});
			} else {
				var rowCount = req.body.rowCount;
				var arr = [];
				for (var i = 1; i <= rowCount; i++) {
					if (
						typeof req.files == 'undefined' ||
						typeof req.files['profileImage'][i - 1] == 'undefined' ||
						req.files['profileImage'][i - 1] == ''
					) {
						var profileImageNewName = 'avatar.png';
					} else {
						var profileImageNewName = req.files['profileImage'][i - 1].filename;
						//console.log(req.files['profileImage'][0]);
					}

					var serviceName = req.body['ServiceName' + i];
					var description = req.body['description' + i];
					var duration_hours = req.body['duration_hours' + i];
					var duration_minutes = req.body['duration_minutes' + i];
					var cancellation = req.body['cancellation' + i];
					var price = req.body['price' + i];
					var allowded_customers = req.body['allowded_customers' + i];
					var advance = req.body['advance' + i];

					console.log('-------serviceName', serviceName);
					console.log('-------description', description);
					if (
						serviceName !== undefined &&
						description !== undefined &&
						price !== undefined
					) {
						arr.push({
							name: serviceName,
							service_proviver_name: details.name,
							service_proviver: details._id,
							business_category: details.business_category,
							icon: profileImageNewName,
							hours: duration_hours,
							minutes: duration_minutes,
							advance: advance,
							cancellation: cancellation,
							price: price,
							description: description,
							allowded_customers: allowded_customers,
							status: 'active',
							created_date: day,
							updated_date: day,
						});
					}
				}

				var a = await _service.create(arr).then(result => {
					req.flash('success', 'Service added!');
					res.redirect(baseUrl + 'main');
				});
			}
		});
	} else {
		req.flash('error', 'Business owner reach the maximum services limit.');
		res.redirect(baseUrl + 'main');
	}
};
exports.isp_account_save = async function (req, res) {
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;

	/// Account data variables..
	var account_holder_name = req.body.account_holder_name;
	var routing_number = req.body.routing_number;
	var account_number = req.body.account_number;

	var createdAccountToken = await stripe.tokens.create({
		bank_account: {
			country: 'US',
			currency: 'usd',
			account_holder_name: account_holder_name,
			account_holder_type: 'individual',
			routing_number: routing_number,
			account_number: account_number,
		},
	});

	var account = await stripe.customers
		.createSource(stripeCustomerId, { source: createdAccountToken.id })
		.then(function (resu) {
			console.log('error data ------------>>>', resu.raw);
			if (resu.error) {
				alert(resu.error.message);
			} else {
				console.log('bank account respone---', resu);
				var ob = {
					bankDetails: {
						bankAccountId: resu.id,
						account_number: req.body.account_number,
						account_holder_name: resu.account_holder_name,
						routing_number: resu.routing_number,
					},
				};
				User.update({ _id: req.app.locals.userCustomerSession._id }, ob).exec(
					function (err, result) {
						if (err) {
							throw err;
						} else {
							console.log('result---', result);
							req.flash('success', 'Account details added succcessfully.');
							res.redirect(baseUrl + 'main');
						}
					}
				);
			}
		})
		.catch(ress => {
			console.log('erroe in catch ', ress.message);
			req.flash(
				'error',
				'A bank account with that routing number and account number already exists for this user.'
			);
			res.redirect(baseUrl + 'main');
		});
	// console.log("card info....." , card);
	// console.log("account info....." , account);
};
exports.cus_complete_profile = function (req, res) {
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;
	//res.render('customer/appointments/connected_Isp_Detail.ejs', data);
	User.find({ _id: req.app.locals.userCustomerSession._id })
		.populate('business_category', select[('name', '_id')])
		.exec(function (err, result) {
			if (err) {
				throw err;
			} else {
				data.userDetails = result[0]._doc;
				//console.log(" data 14 :",data.userDetails);
				res.render(
					'customer/customer-onboarding-screens/onboarding-complete-profile.ejs',
					data
				);
			}
		});
};
exports.cus_complete_profile_save = function (req, res) {
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');

	profileImageUpload(req, res, function (err) {
		if (
			typeof req.files == 'undefined' ||
			typeof req.files['profileImage'] == 'undefined' ||
			req.files['profileImage'] == ''
		) {
			req.body.profileImage = req.body.uploaded_profileImage;
		} else {
			req.body.profileImage = req.files['profileImage'][0].filename;
			// to remove old uploaded certificate image
			if (
				req.body.uploaded_profileImage != '' ||
				req.body.uploaded_profileImage != 'null' ||
				req.body.uploaded_profileImage != 'Null' ||
				req.body.uploaded_profileImage != 'avatar.png'
			) {
				var filePath =
					'public/uploads/profile/' + req.body.uploaded_profileImage;
				if (req.body.uploaded_profileImage != 'avatar.png') {
					fs.unlink(filePath, function (err) {
						console.log('Successfully deleted profile uploaded file.');
					});
				}
			}
		}
		req.body.updated_date = new Date();
		var a = {};
		if (req.body.lat && req.body.lng) {
			a.coordinates = [{ lat: req.body.lat, lng: req.body.lng }];
		} else {
			a.coordinates = [{ lat: '', lng: '' }];
		}
		req.body.location = a;
		req.body.zipcode = req.body.postal_code;
		//req.body.profileImage = profileImageNewName;
		var date = req.body.birthdate;
		date = moment(date).toDate();
		req.body.birthdate = date;
		//	console.log("lfjkbgkdbg ::::::::::::::  "+req.app.locals.userCustomerSession._id);
		User.update(
			{ _id: req.app.locals.userCustomerSession._id },
			req.body,
			async function (err, updatedUser) {
				if (err) {
					req.flash('error', 'Sorry something went wrong.');
					res.render(
						'customer/customer-onboarding-screens/onboarding-payment-details.ejs',
						data
					);
					console.log(err);
				} else {
					// req.flash('success', 'Profile updated!.');
					let userDetails = await User.findOne({
						_id: req.app.locals.userCustomerSession._id,
					});
					req.session.userCustomerSession = userDetails;
					res.render(
						'customer/customer-onboarding-screens/onboarding-payment-details.ejs',
						data
					);
				}
			}
		);
	});
};
exports.cus_payment_info = function (req, res) {
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	//res.render('customer/appointments/connected_Isp_Detail.ejs', data);
	res.render(
		'customer/customer-onboarding-screens/onboarding-payment-details.ejs',
		data
	);
};
exports.cus_account_card_save = async function (req, res) {
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;

	//// card data variables ...
	let stripeToken = req.body.stripeToken;
	await stripe.customers
		.createSource(stripeCustomerId, { source: stripeToken })
		.then(function (result) {
			req.flash('success', 'Payment details added');
			res.redirect(baseUrl + 'main');
		})
		.catch(function (err) {
			req.flash('error', err.raw.message);
			res.redirect(baseUrl + 'cus-payment-info');
		});
};
exports.dashboard = function (req, res) {
	res.render('admin/dashboard', {
		error: req.flash('error'),
		success: req.flash('success'),
		session: req.session,
		active: 'dashboard',
	});
};

exports.allusers = function (req, res) {
	var data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;

	User.find({ status: 'active', role_id: '1' }, function (err, user) {
		if (err) {
			return done(err);
		} else {
			data.userDetails = user;
			res.render('admin/users/users', data);
		}
	});
};
exports.userHeaderProfile = function (req, res) {
	User.findOne(
		{ _id: req.session.userCustomerSession._id },
		function (err, user) {
			if (err) {
				res.send(err);
			} else {
				data.userDetails = user;
				//console.log(result);
				res.json(data);
			}
		}
	);
};

///////////  USER PROFILE ///////////////////////
var pasWorkImages = require('../../models/isp/past_work_image');
exports.edit = async function (req, res) {
	var stripeCustomerId = req.session.userCustomerSession.stripeCustomerId;
	var bank_account_id = req.session.userCustomerSession.bankAccountId;
	var params = {};
	params.deviceToken = req.session.userCustomerSession.token;
	params.title = 'Subtitle ..';
	params.body = 'Body of notification';
	params.notificationType = 'heigh';
	params.agendaId = 'kjlj654';
	console.log(params);
	//notification.sendNotification(params);
	var data = {};
	data.active = 'staff';
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.dateFormat = dateFormat;
	data.session = req.session;
	data.userDetails = req.session.userCustomerSession;

	if (typeof stripeCustomerId != 'undefined') {
		var cardList = await stripe.customers.listSources(stripeCustomerId, {
			object: 'card',
			limit: 20,
		});
		cardList = JSON.parse(JSON.stringify(cardList));
		data.cardList = cardList.data;
	}

	var pasworkImages = await pasWorkImages.find({
		userId: req.app.locals.userCustomerSession._id,
	});
	data.pasworkImages = pasworkImages;
	// var account_details = await stripe.customers.retrieveSource(
	// 	stripeCustomerId,
	// 	bank_account_id
	// 	).then(res=>{
	// 		console.log("ress------------>>>" , res);
	// 		data.bankDetails = res
	// 	});

	User.find({ _id: req.app.locals.userCustomerSession._id })
		.populate('business_category', select[('name', '_id')])
		.exec(function (err, result) {
			if (err) {
				throw err;
			} else {
				console.log('result[0]._doc.status', result[0]._doc.status);
				if (result[0]._doc.status != 'active') {
					req.flash('error', 'Your account has been Deleted or Inactivated');
					res.redirect(baseUrl + `logout`);
					return false;
				}
				data.userDetails = result[0]._doc;
				var business_category_id;
				var business_category_name;
				// console.log(" data 14 :",data.userDetails.business_category);
				if (data.userDetails.business_category == null) {
					data.business_category_id = business_category_id;
					data.business_category_name = business_category_name;
				} else {
					data.business_category_id = data.userDetails.business_category._id;
					data.business_category_name = data.userDetails.business_category.name;
				}
				var userLat;
				var userLng;
				if (
					result[0]._doc.location.coordinates == null ||
					result[0]._doc.location.coordinates[0] == null
				) {
					data.userLat = userLat;
					data.userLng = userLng;
				} else {
					data.userLat = result[0]._doc.location.coordinates[0].lat;
					data.userLng = result[0]._doc.location.coordinates[0].lng;
				}
				res.render('customer/my-profile/my-profile', data);
			}
		});

	// User.findOne({ '_id': req.params.id }, function (err, user) {
	// 	if (err) {
	// 		res.send(err);
	// 	} else {
	// 		userCard.find({}, function (err, result) {
	// 			if (err) {
	// 				throw err;
	// 			} else {
	// 				result.forEach(element => {
	// 					let number = "";
	// 					number = element.cardNumber;
	// 					//	console.log("number  :"+number.substring(number.length-4 , number.length));
	// 					element.cardNumber = number.substring(number.length - 4, number.length);
	// 				});
	// 				data.cards = result
	// 				data.userDetails = user;
	// 				//console.log(result);
	// 				res.render('customer/my-profile/my-profile', data);
	// 			}
	// 		})
	// 		//console.log(user);
	// 		//res.render('customer/my-profile/my-profile', data);
	// 	}
	// });
};

exports.update = async function (req, res) {
	var details = req.session.userCustomerSession;
	var stripeCustomerId = req.session.userCustomerSession.stripeCustomerId;
	var service_category_id;
	profilePastWorkImageUpload(req, res, async function (err) {
		let checkPastImage = req.files['pastWorkImage'];
		if (checkPastImage) {
			if (
				typeof req.files == 'undefined' ||
				typeof req.files['pastWorkImage'] == 'undefined' ||
				req.files['pastWorkImage'] == ''
			) {
				var profileImageNewName = 'avatar.png';
			} else {
				var profileImageNewName = req.files['pastWorkImage'][0].filename;
			}
			var images = new past_work_image();
			images.userId = details._id;
			images.image = profileImageNewName;
			images.save();
		}

		if (
			typeof req.files == 'undefined' ||
			typeof req.files['profileImage'] == 'undefined' ||
			req.files['profileImage'] == ''
		) {
			req.body.profileImage = req.body.uploaded_profileImage;
		} else {
			req.body.profileImage = req.files['profileImage'][0].filename;
			// to remove old uploaded certificate image
			if (
				req.body.uploaded_profileImage != '' ||
				req.body.uploaded_profileImage != 'null' ||
				req.body.uploaded_profileImage != 'Null' ||
				req.body.uploaded_profileImage != 'avatar.png'
			) {
				var filePath =
					'public/uploads/profile/' + req.body.uploaded_profileImage;
				if (req.body.uploaded_profileImage != 'avatar.png') {
					fs.unlink(filePath, function (err) {
						console.log('Successfully deleted profile uploaded file.');
					});
				}
			}
		}

		var data = {};
		if (req.app.locals.userCustomerSession.role_id == 3) {
			if (req.body.otherService) {
				var s_cat = [];
				var count = 0;
				var s_data = await ServiceCategories.find({
					name: req.body.otherService,
					status: { $ne: 'delete' },
				}).then(res => {
					console.log('s_data-----', res);
					s_cat = res;
					if (s_cat.length == 0) {
						var day = moment.utc();
						var newService_category = new ServiceCategories();
						newService_category._id = mongoose.Types.ObjectId();
						service_category_id = newService_category._id;
						newService_category.name = req.body.otherService;
						newService_category.typ = 'Other';
						newService_category.count = 1;
						//newService_category.pagecontent = req.body.pagecontent;
						newService_category.status = 'active';
						newService_category.created_date = day;
						newService_category.updated_date = day;
						newService_category.save();
						req.body.business_category_name = req.body.otherService;
						req.body.business_category_id = newService_category._id;
						// newService_category.save(function(err , result){
						// 	if(err){
						// 		console.log("error --- > - ,", err);
						// 	}else{
						// 		console.log("Result---> , " , result);
						// 	}
						// });
						console.log(
							'newService_category-------------------------->',
							newService_category
						);
					} else {
						if (res[0].count !== undefined) {
							count = res[0].count + 1;
						}
						service_category_id = res[0]._doc._id;
						ServiceCategories.update(
							{ name: req.body.otherService, status: { $ne: 'delete' } },
							{ count: count },
							function (err, updatedresult) {
								if (err) {
									req.flash('error', 'Sorry something went wrong.');
									res.redirect(
										baseUrl +
											`my-profile/${req.app.locals.userCustomerSession._id}`
									);
									console.log(err);
								}
							}
						);
					}
				});
				//console.log(s_data)
				req.body.business_category = service_category_id;
				req.body.business_category_name = req.body.otherService;
			} else {
				var business_category_name = await ServiceCategories.findOne({
					_id: req.body.category,
				});
				business_category_name = JSON.parse(
					JSON.stringify(business_category_name)
				).name;
				req.body.business_category = req.body.category;
				req.body.business_category_name = business_category_name;
			}
		}

		// if (req.app.locals.userCustomerSession.role_id == 3) {
		// 	var business_category_name = await ServiceCategories.findOne({ _id: req.body.category });
		// 	business_category_name = JSON.parse(JSON.stringify(business_category_name)).name;
		// 	req.body.business_category = req.body.category;
		// 	req.body.business_category_name = business_category_name;
		// 	//req.body.location.coordinates = [{"lat":req.body.lat,"lng":req.body.lng}];
		// }
		var a = {};
		if (req.body.lat && req.body.lng) {
			a.coordinates = [{ lat: req.body.lat, lng: req.body.lng }];
		} else {
			a.coordinates = [{ lat: '', lng: '' }];
		}
		req.body.location = a;
		req.body.zipcode = req.body.postal_code;
		req.body.updated_date = new Date();
		//req.body.profileImage = profileImageNewName;
		var date = req.body.birthdate;
		date = moment(date).toDate();
		req.body.birthdate = date;
		User.update(
			{ _id: req.app.locals.userCustomerSession._id },
			req.body,
			async function (err, updatedUser) {
				if (err) {
					req.flash('error', 'Sorry something went wrong.');
					res.redirect(
						baseUrl + `my-profile/${req.app.locals.userCustomerSession._id}`
					);
					console.log(err);
				} else {
					// req.flash('success', 'Profile updated!.');
					var userDetails = await User.findOne({
						_id: req.app.locals.userCustomerSession._id,
					});
					req.session.userCustomerSession = userDetails;
					await connectedList.updateMany(
						{ cusId: req.app.locals.userCustomerSession._id },
						{
							$set: {
								cusName: req.body.name,
								cusProfile: req.body.profileImage,
								cusMobile: req.body.mobile,
								cusAddress: req.body.address,
								cusBirthday: date,
							},
						}
					);
					await Appointments.updateMany(
						{ mail: req.app.locals.userCustomerSession.mail },
						{
							$set: {
								name: req.body.name,
								profile: req.body.profileImage,
								phone: req.body.mobile,
							},
						}
					);
					await sendReminder.updateMany(
						{ mail: req.app.locals.userCustomerSession.mail },
						{
							$set: {
								name: req.body.name,
								profile: req.body.profileImage,
								phone: req.body.mobile,
							},
						}
					);
					await paymentReminder.updateMany(
						{ cusMail: req.app.locals.userCustomerSession.mail },
						{
							$set: {
								name: req.body.name,
								profile: req.body.profileImage,
							},
						}
					);
					await connectedList.updateMany(
						{ ispId: req.app.locals.userCustomerSession._id },
						{
							$set: {
								ispName: req.body.name,
								IspProfileImage: req.body.profileImage,
							},
						}
					);
					await Appointments.updateMany(
						{ service_proviver: req.app.locals.userCustomerSession._id },
						{
							$set: {
								ispName: req.body.name,
								ispProfile: req.body.profileImage,
								ispPhone: req.body.mobile,
							},
						}
					);
					await sendReminder.updateMany(
						{ ispId: req.app.locals.userCustomerSession._id },
						{
							$set: {
								ispName: req.body.name,
								ispProfile: req.body.profileImage,
								ispPhone: req.body.mobile,
							},
						}
					);
					req.flash('success', 'Profile update successfully.');
					res.redirect(
						baseUrl + `my-profile/${req.app.locals.userCustomerSession._id}`
					);
				}
			}
		);
	});
};
exports.CardSave = async function (req, res) {
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;

	await stripe.customers
		.createSource(stripeCustomerId, { source: req.body.stripeToken })
		.then(function (result) {
			req.flash('success', 'Card added.');
			res.redirect(
				baseUrl + `my-profile/${req.app.locals.userCustomerSession._id}`
			);
		})
		.catch(function (err) {
			req.flash('error', err.raw.message);
			res.redirect(
				baseUrl + `my-profile/${req.app.locals.userCustomerSession._id}`
			);
		});

	// var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	// let name = req.body.name;
	// let cardNumber = req.body.cardNumber;
	// let cvv = req.body.cvv;
	// var expiress = req.body.expires;
	// var month = expiress.split('-')[0];
	// var year = expiress.split('-')[1];

	// await stripe.tokens.create({
	// 	card: {
	// 		name: name,
	// 		number: cardNumber,
	// 		exp_month: month,
	// 		exp_year: year,
	// 		cvc: cvv,
	// 	}
	// })
	// .then(async function (cardTokenCreated) {
	// 	await stripe.customers.createSource(stripeCustomerId, { source: cardTokenCreated.id })
	// 	.then(function (result) {
	// 		req.flash('success', 'Card added.');
	// 		res.redirect(baseUrl + `my-profile/${req.app.locals.userCustomerSession._id}`);
	// 	})
	// 	.catch(function (err) {
	// 		req.flash('error', err.raw.message);
	// 		res.redirect(baseUrl + `my-profile/${req.app.locals.userCustomerSession._id}`);
	// 	});
	// })
	// .catch(function (err) {
	// 	req.flash('error', err.raw.message);
	// 	res.redirect(baseUrl + `my-profile/${req.app.locals.userCustomerSession._id}`);
	// });
};
exports.CardSave_setting_page = async function (req, res) {
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;

	await stripe.customers
		.createSource(stripeCustomerId, { source: req.body.stripeToken })
		.then(function (result) {
			req.flash('success', 'Card added.');
			res.redirect(baseUrl + 'settings');
		})
		.catch(function (err) {
			req.flash('error', err.raw.message);
			res.redirect(baseUrl + 'settings');
		});
};
exports.CardSave_main_page = async function (req, res) {
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;

	await stripe.customers
		.createSource(stripeCustomerId, { source: req.body.stripeToken })
		.then(function (result) {
			req.flash('success', 'Card added.');
			res.redirect(baseUrl + 'main');
		})
		.catch(function (err) {
			req.flash('error', err.raw.message);
			res.redirect(baseUrl + 'main');
		});
};
exports.CardRemove = async function (req, res) {
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	var cardId = req.params.id;
	await stripe.customers.deleteSource(
		stripeCustomerId,
		cardId,
		function (err, confirmation) {
			if (err) {
				req.flash('error', 'Wrong credentials.');
				res.redirect(
					baseUrl + `my-profile/${req.app.locals.userCustomerSession._id}`
				);
			}
			req.flash('success', 'Card deleted successfully.');
			res.redirect(
				baseUrl + `my-profile/${req.app.locals.userCustomerSession._id}`
			);
		}
	);
};

exports.delete = function (req, res) {
	var data = {};

	User.findOneAndRemove({ _id: req.params.id }, function (err, userForDelete) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/users');
		} else {
			req.flash('success', 'Account deleted successfully.');
			res.redirect(baseUrl + 'admin/users');
		}
	});
};
exports.isp_home_circle = async function (req, res) {
	var data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.msg = '';
	var counter = 0;
	var obj = {};

	var userDetails = await User.findOne({
		_id: req.session.userCustomerSession._id,
	});

	var tasks = [
		function (callback) {
			var statusByStatus = ['active', 'inactive'];
			User.find({
				role_id: '3',
				status: { $in: statusByStatus },
				verify: 1,
				_id: req.app.locals.userCustomerSession._id,
			}).exec(function (err, result) {
				if (err) {
					callback();
				} else {
					//	console.log("gender------- " , result[0]._doc.gender);
					if (result[0] != null) {
						if (!result[0]._doc.bio) {
							console.log('result[0]._doc.bio:::  outside ');
						} else {
							counter += 1;
							obj.complete_profile = 'done';
						}

						// if (!result[0]._doc.bankDetails.bankAccountId) {
						// 	console.log("result[0]._doc.birthdate:::  outside ");
						// } else {
						// 	counter += 1;
						// 	obj.stripe_connect = "done";
						// }
					}
					callback();
				}
			});
		},
		function (callback) {
			service
				.find({ service_proviver: req.app.locals.userCustomerSession._id })
				.exec(function (err, services) {
					if (err) {
						callback();
					} else {
						// console.log("services length----", services.length);
						if (services.length > 0) {
							counter += 1;
							obj.add_service = 'done';
						}
						//console.log("service_categories  :"+JSON.stringify(service_categories));
						callback();
					}
				});
		},
		function (callback) {
			var statusByStatus = ['active', 'inactive'];
			importContactSuccess
				.find({
					ispId: req.app.locals.userCustomerSession._id,
				})
				.exec(function (err, result) {
					if (err) {
						callback();
					} else {
						if (result.length > 0) {
							counter += 1;
							obj.import_contacts = 'done';
						}
						callback();
					}
				});
		},
		function (callback) {
			var stripeCustomerId =
				req.app.locals.userCustomerSession.stripeCustomerId;
			if (typeof stripeCustomerId != 'undefined') {
				stripe.customers
					.listSources(stripeCustomerId, { object: 'card', limit: 20 })
					.then(cardList => {
						cardList = JSON.parse(JSON.stringify(cardList));
						if (cardList.data.length > 0) {
							counter += 1;
							obj.payments = 'done';
							callback();
						}
					});
			}
		},
		function (callback) {
			obj.bankDetails = undefined;
			if (
				userDetails.bankDetails.bankAccountId != undefined &&
				userDetails.bankDetails.bankAccountId != 'undefined'
			) {
				var bankAccountId = userDetails.bankDetails.bankAccountId;
				obj.bankDetails = bankAccountId;
				console.log('circle api err 2179', bankAccountId);
				stripeCheck.accounts.retrieve(bankAccountId).then(result => {
					if (result.charges_enabled) {
						counter += 1;
						obj.stripe_connect = 'done';
						callback();
						console.log('charge is enable');
					} else {
						//obj.stripe_connect = "notdone";
						console.log('charge is notttttt enable');
						callback();
					}
				});
			} else {
				obj.bankDetails = undefined;
				callback();
			}
		},
	];
	Async.series(tasks, function (err) {
		//series: for step by step and parallel: for suffle
		if (err) {
			console.log('circle api err 2194', err);
			res.json({
				data: 'home screen circle ',
				count: counter,
				success: false,
				obj,
			});
		} else {
			res.json({
				data: 'home screen circle ',
				count: counter,
				success: true,
				obj,
			});
		}
	});
};
exports.customer_home_circle = function (req, res) {
	var data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.msg = '';
	var counter = 0;
	var obj = {};

	var tasks = [
		function (callback) {
			var statusByStatus = ['active', 'inactive'];
			User.find({
				role_id: '2',
				status: { $in: statusByStatus },
				verify: 1,
				_id: req.app.locals.userCustomerSession._id,
			}).exec(function (err, result) {
				if (err) {
					callback();
				} else {
					//	console.log("gender------- " , result[0]._doc.gender);
					if (result[0] != null) {
						if (!result[0]._doc.birthdate) {
							console.log('result[0]._doc.birthdate:::  outside ');
						} else {
							counter += 1;
							obj.complete_profile = 'done';
						}
					}
					callback();
				}
			});
		},
		function (callback) {
			// console.log("req.app.locals.userCustomerSession._id",req.app.locals.userCustomerSession._id);
			connectedList
				.find({
					cusId: req.app.locals.userCustomerSession._id,
					status: 'success',
				})
				.exec(function (err, services) {
					if (err) {
						callback();
					} else {
						var s = JSON.parse(JSON.stringify(services));
						// console.log("services length----", s.length);
						if (s.length > 0) {
							counter += 1;
							obj.add_service = 'done';
						}
						//console.log("service_categories  :"+JSON.stringify(service_categories));
						callback();
					}
				});
		},
		function (callback) {
			Appointments.find({
				mail: req.app.locals.userCustomerSession.mail,
			}).exec(function (err, result) {
				if (err) {
					callback();
				} else {
					if (result.length > 0) {
						counter += 1;
						obj.appointments = 'done';
					}
					callback();
				}
			});
		},
		async function (callback) {
			var stripeCustomerId =
				req.app.locals.userCustomerSession.stripeCustomerId;
			if (typeof stripeCustomerId != 'undefined') {
				var cardList = await stripe.customers.listSources(stripeCustomerId, {
					object: 'card',
					limit: 20,
				});
				cardList = JSON.parse(JSON.stringify(cardList));
				//console.log("cardList.length--------", cardList);
				if (cardList.data.length > 0) {
					// console.log("cardList.data.length :: inside ");
					counter += 1;
					obj.payments = 'done';
					callback();
				}
			}
		},
	];
	Async.series(tasks, function (err) {
		//series: for step by step and parallel: for suffle
		if (err) {
			res.json({
				data: 'home screen circle ',
				count: counter,
				success: false,
				obj,
			});
		} else {
			console.log('obeject------ final ', obj);
			res.json({
				data: 'home screen circle ',
				count: counter,
				success: true,
				obj,
			});
		}
	});
};

exports.applyCoupon = function (req, res) {
	var mail = req.app.locals.userCustomerSession.mail;
	var role_id = req.app.locals.userCustomerSession.role_id;
	var coupon = req.query.coupon_code;
	var cusType = req.query.cusType;
	manage_discount_coupons.findOne(
		{
			code_name: new RegExp(coupon, 'i'),
			status: 'active',
		},
		async function (err, couponData) {
			couponData = JSON.parse(JSON.stringify(couponData));
			if (couponData != null) {
				var currentUtcTime = new Date().toISOString();
				currentUtcTime = currentUtcTime.split('.')[0];
				var finalTimeZone = moment.tz.guess();
				var dateTz = moment.tz(currentUtcTime, 'GMT');
				var currentDate = dateTz.clone().tz(finalTimeZone).format('YYYY-MM-DD');
				var coupon_based_on = couponData.coupon_based_on;
				var coupon_type = couponData.type;
				var discount = couponData.discount;
				var expiring_on = couponData.expiring_on;
				expiring_on = expiring_on.split('T')[0];
				let couponLength = 0;
				let user_so_far = couponData.used_so_far;
				let max_allowed = couponData.max_allowded_customers;
				let couponFor = couponData.content_for;
				let couponLimit = false;
				if (max_allowed <= user_so_far) {
					couponLimit = true;
				}
				if (coupon_type == 'One time') {
					couponLength = await Appointments.find({
						$and: [{ mail: mail }, { coupon_code: new RegExp(coupon, 'i') }],
					});
					couponLength = couponLength.length;
				}
				if (err) {
					return res.send({ status: 0, msg: 'err', data: {} });
				}
				if (coupon == '') {
					return res.send({
						status: 8,
						msg: 'Please enter coupon code.',
						data: {},
					});
				} else if (currentDate > expiring_on) {
					return res.send({
						status: 2,
						msg: 'This coupon code has expired',
						data: {},
					});
				} else if (couponLength >= 1) {
					return res.send({
						status: 4,
						msg: 'Coupon code already used',
						data: {},
					});
				} else if (couponLimit) {
					return res.send({
						status: 5,
						msg: 'Maximum limit reached.',
						data: {},
					});
				} else if (cusType == 'Customer' && couponFor == 'Business Owner') {
					return res.send({
						status: 6,
						msg: 'This coupon is not valid',
						data: {},
					});
				} else if (cusType == 'Business Owner' && couponFor == 'Customer') {
					return res.send({
						status: 7,
						msg: 'This coupon is not valid',
						data: {},
					});
				} else {
					return res.send({
						status: 1,
						msg: 'Coupon code Applied!',
						data: {
							discount: discount,
							coupon_based_on: coupon_based_on,
							coupon_type: coupon_type,
						},
					});
				}
			} else {
				return res.send({
					status: 3,
					msg: 'This coupon is not valid',
					data: {},
				});
			}
		}
	);
};

// exports.findBusinessSlots = async function (req, res) {
// try{
// let data = {};
// let ispIdParam = req.params.ispId;
// let serviceId = req.params.serviceId;
// let dateofAppointent = req.params.date; //YYYY-MM-DD
// let dayOfDate = moment(dateofAppointent).format('dddd');
// dayOfDate = dayOfDate.toLowerCase();
// var finalSlots = [];

// console.log('ispId --------',ispIdParam, serviceId, dateofAppointent ,dayOfDate);
// let checkBusinessHours = await businessHours.findOne({ispId: ispIdParam});
// checkBusinessHours = JSON.parse(JSON.stringify(checkBusinessHours));

// let onDays = checkBusinessHours.days;
// let offDates = checkBusinessHours.offDates;
// var breaks = checkBusinessHours.breaks;

// onDays = onDays.filter((element)=> element.day == dayOfDate);

// let isClosed = onDays[0].isClosed;
// let startTime = onDays[0].startTime;
// let endTime = onDays[0].endTime;
// let day = onDays[0].day;

// if(offDates.indexOf(dateofAppointent) == -1 && isClosed == true){
// res.send({data: [], message: 'Today is off day.'});
// }else if(isClosed == true){
// res.send({data: [], message: 'Business owner is not available today.'});
// }else{
////Find those slots which is already booked and exceed its limit to book so that we can remove to shwo list
// var serviceDetails = await service.findOne({_id: serviceId});
// serviceDetails = JSON.parse(JSON.stringify(serviceDetails));
// var maxCustomerAllow = parseInt(serviceDetails.allowded_customers);
// var minutuesInterval = parseInt(serviceDetails.minutes);
// console.log('-----------serviceDetails--', serviceDetails, minutuesInterval);

// startTime = moment(startTime, "hh:mm A").format('HH:mm');
// endTime = moment(endTime, "hh:mm A").format('HH:mm');
// console.log('startTime and endTime are--------',startTime, endTime);
// var slots = await intervals(startTime, endTime, minutuesInterval);
// console.log('slots--------',slots);
// finalSlots = [...slots];

//Find break slots and remove from the list
// let breakSlots = [];
// for(let i=0; i < breaks.length; i++){
// let breakStartTime = moment(breaks[i].startTime, "hh:mm A").format('HH:mm');
// let breakEndTime =  moment(breaks[i].endTime, "hh:mm A").format('HH:mm');

// let breakInterval = await intervals(breakStartTime, breakEndTime, minutuesInterval);
// console.log('breakInterval--------',breakInterval);
// breakSlots.push(...breakInterval);
// }

// breakSlots.forEach((slot) => {
// let isFoundSlot = false;
// finalSlots.forEach((finalSlot, finalSlotIndex) => {
// let appointmentStartTime = moment(slot, "hh:mm A").format('HH:mm');
// if (finalSlot == appointmentStartTime) {
// finalSlots.splice(finalSlotIndex, 1);
// isFoundSlot = true;
// }
// });
// });
// console.log('breakSlots--------',breakSlots);

// var bookedAppointmentsSlotsResult = await bookedAppointmentsSlots(serviceId, dateofAppointent, maxCustomerAllow);
// console.log('bookedAppointmentsSlotsResult--------',bookedAppointmentsSlotsResult);

// bookedAppointmentsSlotsResult.forEach((slot) => {
// let isFoundSlot = false;
// finalSlots.forEach((finalSlot, finalSlotIndex) => {
// let appointmentStartTime = moment(slot._id, "hh:mm A").format('HH:mm');
// if (finalSlot == appointmentStartTime) {
// console.log('appointmentStartTime to be deleted--------',appointmentStartTime);
// finalSlots.splice(finalSlotIndex, 1);
// isFoundSlot = true;
// }
// });
// });

// finalSlots = finalSlots.sort(function (a, b) {
// return new Date('1970/01/01 ' + a) - new Date('1970/01/01 ' + b)
// });

// console.log('finalSlots--------',finalSlots);

// data.status = 200;
// data.message = finalSlots.length;
// data.data = finalSlots;
// return res.send(data);
// }
// }catch(e){
// let data = {};
// data.status = 200;
// data.message = e;
// data.data = [];
// return res.send(data);
// }
// }

exports.findBusinessSlots = async function (req, res) {
	try {
		let data = {};
		let mail = req.app.locals.userCustomerSession.mail;
		let ispIdParam = req.body.ispId;
		let serviceId = req.body.serviceId;
		let dateofAppointent = moment(req.body.date, [
			'MM-DD-YYYY',
			'YYYY-MM-DD',
		]).format('YYYY-MM-DD'); //YYYY-MM-DD
		let todayDate = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
		// if(dateofAppointent){
		// 	dateofAppointent = req.body.date.split("-").reverse().join("-");
		// }

		//ISP Details
		let ispDetails = await User.findOne({ _id: ispIdParam });
		ispDetails = JSON.parse(JSON.stringify(ispDetails));

		let dayOfDate = moment(dateofAppointent, [
			'MM-DD-YYYY',
			'YYYY-MM-DD',
		]).format('dddd');
		let deviceTimeZone = req.body.timezone ? req.body.timezone : 'GMT';
		console.log(
			'requested body=================================',
			req.body.date
		);
		// console.log("requested body=================================", req.body.date.format());
		console.log(
			'requested body=================================',
			dateofAppointent
		);
		console.log('--------------deviceTimeZone', deviceTimeZone);

		dayOfDate = dayOfDate.toLowerCase();
		var finalSlots = [];

		console.log(
			'ispId --------',
			ispIdParam,
			serviceId,
			dateofAppointent,
			dayOfDate
		);
		let checkBusinessHours = await businessHours.findOne({ ispId: ispIdParam });
		checkBusinessHours = JSON.parse(JSON.stringify(checkBusinessHours));

		let onDays = checkBusinessHours.days;
		let offDates = checkBusinessHours.offDates;
		var breaks = checkBusinessHours.breaks;
		let businessTimeZone = checkBusinessHours.timeZone;

		onDays = onDays.filter(element => element.day == dayOfDate);

		let isClosed = onDays[0].isClosed;
		let startTime = onDays[0].startTime;
		let endTime = onDays[0].endTime;
		let day = onDays[0].day;

		//console.log('-------------offDates',offDates, dateofAppointent, offDates.indexOf(dateofAppointent));

		if (offDates.indexOf(dateofAppointent) != -1) {
			// && isClosed == true
			res.send({ data: [], message: 'Today is off day.' });
		} else if (isClosed == true) {
			res.send({ data: [], message: 'Business owner is not available today.' });
		} else {
			// Find those slots which is already booked and exceed its limit to book so that we can remove to shwo list
			var serviceDetails = await service.findOne({ _id: serviceId });
			serviceDetails = JSON.parse(JSON.stringify(serviceDetails));
			var maxCustomerAllow = parseInt(serviceDetails.allowded_customers);
			var minutuesInterval = parseInt(serviceDetails.minutes);

			startTime = moment(startTime, 'hh:mm A').format('HH:mm');
			endTime = moment(endTime, 'hh:mm A').format('HH:mm');
			//console.log('startTime and endTime are--------',startTime, endTime);
			var slots = await intervals(startTime, endTime, minutuesInterval);
			console.log('_________________slots', slots, startTime, endTime);

			finalSlots = [...slots];

			// Find break slots and remove from the list
			//let breakSlots = [];
			// for(let i=0; i < breaks.length; i++){
			// let breakStartTime = moment(breaks[i].startTime, "hh:mm A").format('HH:mm');
			// let breakEndTime =  moment(breaks[i].endTime, "hh:mm A").format('HH:mm');

			// let breakInterval = await intervals(breakStartTime, breakEndTime, minutuesInterval);
			// breakSlots.push(...breakInterval);
			// }

			// breakSlots.forEach((slot) => {
			// 	let isFoundSlot = false;
			// 	finalSlots.forEach((finalSlot, finalSlotIndex) => {
			// 		let appointmentStartTime = moment(slot, "hh:mm A").format('HH:mm');
			// 		if (finalSlot == appointmentStartTime) {
			// 			finalSlots.splice(finalSlotIndex, 1);
			// 			isFoundSlot = true;
			// 		}
			// 	});
			// });

			console.log('_______2379__________finalSlots', finalSlots);
			var finalSlotsArray = [...finalSlots];

			breaks.forEach(element1 => {
				var breakStartTime = moment(element1.startTime, 'hh:mm A').format(
					'HH:mm'
				);
				var breakEndTime = moment(element1.endTime, 'hh:mm A').format('HH:mm');

				finalSlots.forEach((finalSlot, finalSlotIndex) => {
					let finalSlotStartTime = finalSlot;
					let finalSlotEndTime = moment(finalSlot, 'HH:mm')
						.add(minutuesInterval, 'minutes')
						.format('HH:mm');
					console.log(
						'--------finalSlotStartTime------',
						finalSlotStartTime,
						finalSlotEndTime,
						breakStartTime,
						breakEndTime
					);
					if (
						(finalSlotStartTime > breakStartTime &&
							finalSlotStartTime < breakEndTime) ||
						(finalSlotEndTime > breakStartTime &&
							finalSlotEndTime < breakEndTime)
					) {
						let index = finalSlotsArray.indexOf(finalSlotStartTime);
						let deletedSlot = finalSlotsArray.splice(index, 1);
						console.log(
							'_______finalSlot for delete',
							finalSlotStartTime,
							index,
							deletedSlot
						);
						//return false;
					}
					//finalSlotsArray.push(finalSlots[finalSlotIndex]);
				});
			});
			console.log('_______2379__________finalSlotsArray', finalSlotsArray);

			var finalSlotsArray1 = [...finalSlotsArray];

			var bookedAppointmentsSlotsResult = await bookedAppointmentsSlots(
				serviceId,
				dateofAppointent,
				maxCustomerAllow
			);
			bookedAppointmentsSlotsResult.forEach(slot => {
				let isFoundSlot = false;
				finalSlotsArray1.forEach((finalSlot, finalSlotIndex) => {
					//console.log('-------------2420', slot._id);
					var dateWithTime = moment(slot._id).format();
					var dateTz = moment.tz(dateWithTime, 'GMT');
					var appointmentStartTime = dateTz
						.clone()
						.tz(businessTimeZone)
						.format('HH:mm');
					console.log('-------------2425', appointmentStartTime, finalSlot);

					if (finalSlot == appointmentStartTime) {
						let index = finalSlotsArray.indexOf(appointmentStartTime);
						finalSlotsArray.splice(index, 1);
						isFoundSlot = true;
					}
				});
			});

			console.log(
				'MULTIPE SLOTS CHECKED::::: ',
				JSON.stringify(finalSlotsArray)
			);
			//Test Changes Start
			var finalSlotsArray2 = [...finalSlotsArray];
			let appointments = await Appointments.aggregate([
				{
					$match: {
						start_date: dateofAppointent,
						status: { $in: ['Upcoming', 'Ongoing'] },
						$or: [{ ispEmail: mail }, { mail: mail }],
					},
				}, //serviceId: new mongoose.Types.ObjectId(serviceId)
			]);
			appointments = JSON.parse(JSON.stringify(appointments));
			appointments.forEach(appointmentTime => {
				let appointmentStartTime = moment(
					appointmentTime.start_time,
					'hh:mm A'
				).format('HH:mm');
				let appointmentEndTime = appointmentTime.end_time;
				// console.log("-------------------2673 appointmentStartTime", appointmentStartTime);
				console.log(
					'-------------------2673 appointmentEndTime',
					appointmentEndTime
				);
				finalSlotsArray2.filter(slot => {
					console.log(
						'-------------------2673 slot',
						slot,
						appointmentStartTime,
						appointmentEndTime
					);
					if (slot >= appointmentStartTime && slot < appointmentEndTime) {
						let index = finalSlotsArray.indexOf(slot);
						console.log('REMOVE 1: ', finalSlotsArray[index]);
						finalSlotsArray.splice(index, 1);
						console.log('index', index);
						console.log(slot, appointmentStartTime, appointmentEndTime);
						console.log('REMOVE 2: ', finalSlotsArray[index]);
					}
				});
			});
			console.log('New Time: ', new Date(), finalSlotsArray);

			//NEW
			//05 09 22 Comment
			// let appointments2 = await Appointments.aggregate([
			// 	{"$match": {start_date: dateofAppointent, status: {$in: ["Upcoming", "Ongoing"]},$or: [{ispEmail: ispDetails.mail}, {mail: ispDetails.mail}]}}, //serviceId: new mongoose.Types.ObjectId(serviceId)
			// ]);
			// appointments2 = JSON.parse(JSON.stringify(appointments2));
			// appointments2.forEach((appointmentTime) => {
			// 	let appointments2StartTime =  moment(appointmentTime.start_time, "hh:mm A").format('HH:mm');
			// 	let appointmentEndTime = appointmentTime.end_time;
			// 	// console.log("-------------------2673 appointments2StartTime", appointments2StartTime);
			// 	console.log("-------------------2673 appointmentEndTime", appointmentEndTime);
			// 	finalSlotsArray2.filter((slot)=>{
			// 	console.log("-------------------2673 slot", slot, appointments2StartTime, appointmentEndTime);
			// 		if( slot >= appointments2StartTime && slot < appointmentEndTime ){
			// 			let index = finalSlotsArray.indexOf(slot);
			// 			console.log("REMOVE 1: ",finalSlotsArray[index])
			// 			finalSlotsArray.splice(index, 1);
			// 			console.log("index",index);
			// 			console.log(slot,appointments2StartTime, appointmentEndTime)
			// 			console.log("REMOVE 2: ",finalSlotsArray[index])
			// 		}
			// 	});
			// });
			console.log('New Time: ', new Date(), finalSlotsArray);

			//Test Changes End

			// Sort array
			finalSlotsArray = finalSlotsArray.sort(function (a, b) {
				return new Date('1970/01/01 ' + a) - new Date('1970/01/01 ' + b);
			});

			console.log('-------------businessTimeZone', businessTimeZone);
			finalSlotsArray = finalSlotsArray.map(element => {
				var dateWithTime = moment(
					dateofAppointent + ' ' + element,
					'YYYY-MM-DD HH:mm'
				).format('YYYY-MM-DD HH:mm');
				console.log(
					'date with timeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
					dateWithTime
				);
				var dateTz = moment.tz(dateWithTime, businessTimeZone);
				element = dateTz.clone().tz(deviceTimeZone).format('HH:mm');
				console.log('------------------------------------element', element);
				return element;
			});

			// var finalResult = [];
			// finalSlotsArray.map((fslot) =>{
			// 	console.log(fslot)
			// 	console.log("Compare: ",dateofAppointent,todayDate)
			// 	console.log("Compare T: ",moment(fslot,"HH:mm"),moment(todayDate,"HH:mm"))
			// 	var dateTz = moment.tz(todayDate, businessTimeZone);
			// 	element = dateTz.clone().tz(deviceTimeZone).format("HH:mm");
			// 	console.log("::::::::> ---------------------------element", element);
			// 	if(moment(dateofAppointent,"YYYY-MM-DD").isSame(moment(todayDate,"YYYY-MM-DD"))){
			// 		if(moment(fslot,"HH:mm").isBefore(moment(element,"HH:mm"))){
			// 			console.log("BS: ",fslot)
			// 		}else{
			// 			finalResult.push(fslot)
			// 		}
			// 	}else{
			// 		finalResult.push(fslot)
			// 	}
			// });

			data.status = 200;
			data.message = finalSlotsArray.length;
			data.data = finalSlotsArray;
			console.log('data successs', data);
			return res.send(data);
		}
	} catch (e) {
		let data = {};
		data.status = 200;
		data.message = e;
		data.data = [];
		return res.send(data);
	}
};

/**
 * This will return booked slot, It should be removed from today found slots
 * As per the maxCustomerAllow returned slots are booked and it should not be available
 */
function bookedAppointmentsSlots(
	serviceId,
	dateofAppointent,
	maxCustomerAllow
) {
	console.log(
		'findAppointments callng--------',
		serviceId,
		dateofAppointent,
		maxCustomerAllow
	);
	return new Promise(async (resolve, reject) => {
		let appointments = await Appointments.aggregate([
			{
				$match: {
					start_date: dateofAppointent,
					status: { $in: ['Upcoming', 'Ongoing'] },
					serviceId: new mongoose.Types.ObjectId(serviceId),
				},
			}, //serviceId: new mongoose.Types.ObjectId(serviceId)
			{ $group: { _id: '$utc_start', count: { $sum: 1 } } },
		]);

		appointments = JSON.parse(JSON.stringify(appointments));
		console.log('appointments 2252--------', appointments);

		appointments = appointments.filter(
			element => element.count >= maxCustomerAllow
		); //element.count < maxCustomerAllow
		console.log('appointments after filter--------', appointments);
		resolve(appointments);
	});
}

function intervals(startString, endString, minutuesInterval) {
	console.log('intervals--------', startString, endString, minutuesInterval);
	var start = moment(startString, 'HH:mm');
	var end = moment(endString, 'HH:mm').subtract(minutuesInterval, 'minutes');

	start.minutes(Math.ceil(start.minutes() / 30) * 30);

	var slots = [];
	var current = moment(start);

	while (current <= end) {
		slots.push(current.format('HH:mm'));
		current.add(minutuesInterval, 'minutes');
	}
	return slots;
}

function futureAppointments(ispId) {
	return new Promise(async (resolve, reject) => {
		let currentUTCTime = moment.utc();
		let appointments = await Appointments.find({
			status: { $in: ['Upcoming', 'Ongoing'] },
			service_proviver: new mongoose.Types.ObjectId(ispId),
			utc_start: { $gt: new Date(currentUTCTime) },
		});
		appointments = JSON.parse(JSON.stringify(appointments));
		// console.log('----------futureAppointments-', appointments, appointments.length);
		if (appointments.length > 0) {
			resolve(true);
		} else {
			resolve(false);
		}
	});
}
module.exports.intervals = intervals;
module.exports.futureAppointments = futureAppointments;
module.exports.bookedAppointmentsSlots = bookedAppointmentsSlots;

exports.check_Service_Cetagory = async function (req, res) {
	let serviceName = req.body.name;
	let check = await ServiceCategories.findOne({ name: serviceName });
	if (!check) {
		res.send('true');
	} else {
		res.send('false');
	}
};

exports.couponCodeApply = function (req, res) {
	var mail = req.app.locals.userCustomerSession.mail;
	var coupon = req.query.coupon_code;
	manage_discount_coupons.findOne(
		{
			code_name: new RegExp(coupon, 'i'),
			status: 'active',
		},
		async function (err, couponData) {
			couponData = JSON.parse(JSON.stringify(couponData));
			if (couponData != null) {
				var currentUtcTime = new Date().toISOString();
				currentUtcTime = currentUtcTime.split('.')[0];
				var finalTimeZone = moment.tz.guess();
				var dateTz = moment.tz(currentUtcTime, 'GMT');
				var currentDate = dateTz.clone().tz(finalTimeZone).format('YYYY-MM-DD');
				var coupon_based_on = couponData.coupon_based_on;
				var coupon_type = couponData.type;
				var discount = couponData.discount;
				var expiring_on = couponData.expiring_on;
				expiring_on = expiring_on.split('T')[0];
				let user_so_far = couponData.used_so_far;
				let max_allowed = couponData.max_allowded_customers;
				let couponFor = couponData.content_for;
				let couponLimit = false;
				if (max_allowed <= user_so_far) {
					couponLimit = true;
				}
				// let couponLength = 0;
				// if(coupon_type == 'One time'){
				// couponLength = await User.find({
				// 	$and: [
				// 		{ mail: mail },
				// 		{ 'coupon_code': new RegExp(coupon, 'i') },
				// 	]
				// });
				// couponLength = couponLength.length;
				// }
				let couponLength = await User.find({ mail: mail });
				couponLength = JSON.parse(JSON.stringify(couponLength));
				couponLength = couponLength[0].coupon_code;
				if (couponLength) {
					couponLength = 1;
				} else {
					couponLength = 0;
				}
				if (err) {
					return res.send({ status: 0, msg: 'err', data: {} });
				}
				if (coupon == '') {
					return res.send({
						status: 8,
						msg: 'Please enter coupon code.',
						data: {},
					});
				} else if (currentDate > expiring_on) {
					return res.send({
						status: 2,
						msg: 'This coupon code has expired',
						data: {},
					});
				} else if (couponLength >= 1) {
					return res.send({
						status: 4,
						msg: 'Coupon code already used',
						data: {},
					});
				} else if (couponLimit) {
					return res.send({
						status: 5,
						msg: 'Maximum limit reached.',
						data: {},
					});
				} else if (couponFor == 'Customer') {
					return res.send({
						status: 6,
						msg: 'This coupon is not valid',
						data: {},
					});
				} else {
					return res.send({
						status: 1,
						msg: 'Coupon code Applied!',
						data: {
							discount: discount,
							coupon_based_on: coupon_based_on,
							coupon_type: coupon_type,
						},
					});
				}
			} else {
				return res.send({
					status: 3,
					msg: 'This coupon is not valid',
					data: {},
				});
			}
		}
	);
};
exports.couponCodeApplied = async function (req, res) {
	var userId = req.app.locals.userCustomerSession._id;
	var coupon = req.body.couponCode;
	var discountedAmount = req.body.discountedAmount;
	var coupon_based_on = req.body.coupon_based_on;
	var coupon_type = req.body.coupon_type;
	var discount = req.body.discount;
	if (coupon_type == '') {
		req.flash(
			'error',
			'Coupon code does not applied. Please choose diffrent coupon code.'
		);
		res.redirect('/settings');
		return false;
	}
	var checkRenewPlan = await renewPlan.findOne({ service_proviver: userId });
	if (checkRenewPlan) {
		renewPlan.update(
			{ service_proviver: userId },
			{
				$set: {
					plan_amount: discountedAmount * 100,
				},
			},
			async function (err, updatedUser) {
				if (err) {
					return done(err);
				} else {
					User.update(
						{ _id: userId },
						{
							$set: {
								coupon_code: coupon,
								coupon_based_on: coupon_based_on,
								coupon_type: coupon_type,
								discount: discount,
							},
						},
						async function (err, updatedUser) {
							if (err) {
								return done(err);
							} else {
								console.log('updatedUser', updatedUser);
							}
						}
					);
				}
			}
		);
	}
	req.flash('success', 'Your coupon code apply successfully.');
	res.redirect('/settings');
};
exports.getTimeZone = async function (req, res) {
	try {
		let data = {};
		let deviceTimeZone = req.body.timezone ? req.body.timezone : 'GMT';
		req.session.deviceTimeZone = deviceTimeZone;
		req.app.locals.userCustomerSession.deviceTimeZone = deviceTimeZone;
		console.log('--------------deviceTimeZone', deviceTimeZone);
		console.log('req.session.deviceTimeZone', req.session.deviceTimeZone);
		console.log(
			'req.app.locals.userCustomerSession.deviceTimeZone',
			req.app.locals.userCustomerSession.deviceTimeZone
		);

		data.status = 200;
		data.message = 'Done';
		data.data = deviceTimeZone;
		return res.send(data);
	} catch (e) {
		let data = {};
		data.status = 200;
		data.message = e;
		data.data = [];
		return res.send(data);
	}
};
