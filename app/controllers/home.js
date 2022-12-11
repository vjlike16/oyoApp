var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var passport = require('passport');
var ServiceCategories = require('../models/admin/service_category');
var Manage_subscription_plan = require('../models/admin/manage_subscription_plan');
var manage_discount_coupons = require('../models/admin/manage_discount_coupons');
var Managepopup = require('../models/admin/manage_pop_content');
var home = require('../models/home');
var userCard = require('../models/customers/userCard');
var services = require('../models/customers/service');
var freeTrial = require('../models/customers/freeTrial');
const renewPlan = require('../models/customers/renewPlan');
var connectedList = require('../models/customers/connectedList');
var Appointment = require('../models/customers/appointments');
var businessHours = require('../models/isp/businessHours');
var setAlert = require('../models/isp/setAlert');
var sendReminder = require('../models/isp/sendReminder');
var paymentReminder = require('../models/isp/paymentReminder');
var subscriptions = require('../models/isp/subscriptionsData');
var slot = require('../models/isp/slots');
var Email = require('../../lib/email');
const { select } = require('underscore');
const { match } = require('underscore');
var mongoose = require('mongoose');
var notification = require('../../lib/notificationLib');
const test = require('../models/customers/test');
const test2 = require('../models/customers/test2');

var moment = require('moment');
var querystring = require('querystring');
var outlook = require('node-outlook');
var pages = require('../../config/outlook/pages');
var authHelper = require('../../config/outlook/authHelper');
const faq_request = require('../models/customers/faq_request');
const { baseUrl } = require('../../config/constants');
const axios = require('axios');

var google01 = require('googleapis');
var OAuth2 = google01.Auth.OAuth2Client;
var clientSecrets = require('../controllers/admin/token.json');
var oauth2Client = new OAuth2(
	clientSecrets.web.client_id,
	clientSecrets.web.client_secret,
	clientSecrets.web.redirect_uris[0]
);

const PUBLISHABLE_KEY =
	'pk_test_51JVSy4CzX7kFjfHZXLy3xhQI9PWrWq3UqAX4x8R4gdemNqMMm97wketwWDtTXjbT2oORsbz4q9Jxlt8v58MKHN4W00xsqmcYKX';
const SECRET_KEY =
	'sk_test_51JVSy4CzX7kFjfHZ0WqNOWnQPs4K3Cwv0YyK75zhtqvNYPVL07zwSbWGA24Abgg5sxa8SMcLUBGO0Ip8k8SggXbU00q0DhCFD7';
const stripe = require('stripe')(SECRET_KEY);

exports.loggedIn = function (req, res, next) {
	if (req.session.user) {
		// req.session.passport._id
		next();
	} else {
		res.redirect('/login');
	}
};
exports.main = async function (req, res) {
	console.log('main------ 55', req.app.locals.userCustomerSession);
	var details = req.app.locals.userCustomerSession;
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	let connectedISPsId = [];
	let expireNotification = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	data = {};
	data.details = details;
	data.businessHours = await businessHours.find({ ispId: details._id });
	data.bankDetails = false;
	if (typeof stripeCustomerId != 'undefined') {
		var cardList = await stripe.customers.listSources(stripeCustomerId, {
			object: 'card',
			limit: 20,
		});
		cardList = JSON.parse(JSON.stringify(cardList));
		data.cardList = cardList.data;
		data.bankDetails = true;
	}
	data.dateFormat = dateFormat;
	//data.msg = req.body.msg;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.name_category = '';
	//console.log("main : page");
	let welcomeMsg = await home.findOne({
		_id: req.app.locals.userCustomerSession._id,
	});
	welcomeMsg = JSON.parse(JSON.stringify(welcomeMsg));
	data.welcomeMsg = welcomeMsg.welcomeMsg;
	if (req.app.locals.userCustomerSession.role_id == 3) {
		data.upcomingAppointments = await Appointment.find({
			$and: [
				{ $or: [{ ispEmail: details.mail }, { mail: details.mail }] },
				{ status: 'Upcoming' },
			],
		})
			.sort({ $natural: -1 })
			.limit(2);
		data.connectedList = await connectedList
			.find({
				$or: [{ ispId: details._id }, { cusId: details._id }],
				status: ['pending', 'success'],
			})
			.sort({ $natural: -1 })
			.limit(2);
		data.tipAppointments = await Appointment.find({
			service_proviver: details._id,
			tip: { $ne: 0 },
		})
			.sort({ $natural: -1 })
			.limit(1);
		data.paymentAppointments = await Appointment.find({
			service_proviver: details._id,
			amount: { $ne: 0 },
		})
			.sort({ $natural: -1 })
			.limit(1);
		data.sendPaymentAppointments = await Appointment.find({
			mail: details.mail,
			status: 'Upcoming',
		})
			.sort({ $natural: -1 })
			.limit(2);
		data.cancelledAppointments = await Appointment.find({
			service_proviver: details._id,
			status: 'Cancelled',
		})
			.sort({ $natural: -1 })
			.limit(1);
		data.bookedAppointments = await Appointment.find({
			service_proviver: details._id,
			status: 'Upcoming',
		})
			.sort({ $natural: -1 })
			.limit(1);
		data.ratingReview = await Appointment.find({
			service_proviver: details._id,
			status: 'Completed',
			rate: { $exists: true },
		})
			.sort({ $natural: -1 })
			.limit(2);

		let ispManagepopup = await Managepopup.find({
			content_for: { $ne: 'Customer' },
			status: { $ne: 'inactive' },
			expiring_on: { $gte: new Date() },
		})
			.sort({ $natural: -1 })
			.limit(1);
		ispManagepopup = JSON.parse(JSON.stringify(ispManagepopup));
		if (ispManagepopup.length > 0) {
			data.managePopup = ispManagepopup[0];
			let userClosedPopupIds = ispManagepopup[0].userClosedPopup;
			let checkId = userClosedPopupIds.includes(details._id);
			if (checkId) {
				data.userClosedPopup = true;
			} else {
				data.userClosedPopup = false;
			}
		} else {
			data.userClosedPopup = true;
		}

		home.findOne(
			{ _id: req.app.locals.userCustomerSession._id },
			function (err, result) {
				if (err) {
					throw err;
				} else {
					if (result.profileCompleted) {
						res.render('main.ejs', data);
					} else {
						res.redirect(baseUrl + 'complete-profile');
					}
				}
			}
		);
	} else {
		data.sendReminder = await sendReminder
			.find({
				mail: details.mail,
				notificationType: 'Reminder',
				status: { $ne: 'inactive' },
				createdDate: { $gte: expireNotification },
			})
			.sort({ $natural: -1 })
			.limit(2);
		data.customerAppointments = await Appointment.find({
			mail: details.mail,
			status: 'Upcoming',
		})
			.sort({ $natural: -1 })
			.limit(2);
		data.connectedList = await connectedList
			.find({ cusId: details._id, status: ['pending', 'success'] })
			.sort({ $natural: -1 })
			.limit(2);
		data.paymentAppointments = await Appointment.find({
			mail: details.mail,
			status: 'Upcoming',
		})
			.sort({ $natural: -1 })
			.limit(2);
		let connectedISPs = await connectedList.find({
			cusId: details._id,
			status: 'success',
		});
		connectedISPs = JSON.parse(JSON.stringify(connectedISPs));
		if (connectedISPs.length > 0) {
			connectedISPs.forEach(connectedId => {
				var ids = connectedId.ispId;
				connectedISPsId.push(ids);
			});
		}
		data.ispServices = await services
			.find({ service_proviver: connectedISPsId })
			.sort({ $natural: -1 })
			.limit(2);

		let cusManagepopup = await Managepopup.find({
			content_for: { $ne: 'Business Owner' },
			expiring_on: { $gte: new Date() },
		})
			.sort({ $natural: -1 })
			.limit(1);
		cusManagepopup = JSON.parse(JSON.stringify(cusManagepopup));
		if (cusManagepopup.length) {
			data.managePopup = cusManagepopup[0];
			let userClosedPopupIds = cusManagepopup[0].userClosedPopup;
			let checkId = userClosedPopupIds.includes(details._id);
			if (checkId) {
				data.userClosedPopup = true;
			} else {
				data.userClosedPopup = false;
			}
		} else {
			data.userClosedPopup = true;
		}
		console.log(':::::: BUSI ', data.businessHours);
		res.render('main.ejs', data);
	}
};
exports.notification = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	let connectedISPsId = [];
	data = {};
	if (typeof stripeCustomerId != 'undefined') {
		var cardList = await stripe.customers.listSources(stripeCustomerId, {
			object: 'card',
			limit: 20,
		});
		cardList = JSON.parse(JSON.stringify(cardList));
		data.cardList = cardList.data;
	}
	data.dateFormat = dateFormat;
	//data.msg = req.body.msg;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.name_category = '';
	let expireNotification = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
	console.log('NOTIFIC::::', expireNotification);
	//console.log("main : page");
	let check = await sendReminder
		.find({ amount: { $ne: 0 } })
		.sort({ $natural: -1 })
		.limit(1);
	check = JSON.parse(JSON.stringify(check));
	if (check.length > 0) {
		let checkId = check[0]._id;
		await sendReminder.findByIdAndUpdate(
			{ _id: checkId },
			{ $push: { is_seen: details._id } }
		);
	}
	if (req.app.locals.userCustomerSession.role_id == 3) {
		data.sendReminder = await sendReminder
			.find({
				status: { $ne: 'inactive' },
				createdDate: { $gte: expireNotification },
			})
			.sort({ $natural: -1 });
		data.managepopup = await Managepopup.find({
			content_for: { $ne: 'Customer' },
			expiring_on: { $gte: new Date() },
		}).sort({ $natural: -1 });
		res.render('../views/customer/main/isp/notifications.ejs', data);
	} else {
		data.sendReminder = await sendReminder
			.find({
				status: { $ne: 'inactive' },
				createdDate: { $gte: expireNotification },
			})
			.sort({ $natural: -1 });
		data.connectedList = await connectedList
			.find({
				cusMail: details.mail,
				status: ['pending', 'success'],
				createdDate: { $gte: expireNotification },
			})
			.sort({ $natural: -1 });
		data.managepopup = await Managepopup.find({
			content_for: { $ne: 'Business Owner' },
			expiring_on: { $gte: new Date() },
		}).sort({ $natural: -1 });
		res.render('../views/customer/main/isp/notifications.ejs', data);
	}
};
exports.paymentHistory = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	var mobile = details.mobile;
	var role_id = details.role_id;
	data = {};
	data.userId = details._id;
	data.userEmail = details.mail;
	data.mobile = mobile;
	data.role_id = role_id;

	if (typeof stripeCustomerId != 'undefined') {
		var cardList = await stripe.customers.listSources(stripeCustomerId, {
			object: 'card',
			limit: 20,
		});
		cardList = JSON.parse(JSON.stringify(cardList));
		data.cardList = cardList.data;
	}
	let condition = {};
	if (role_id == 3) {
		condition = {
			$or: [{ cusMail: details.mail }, { ispId: details._id }],
		};
	} else {
		condition = { cusMail: details.mail };
	}
	var check = await paymentReminder
		.find(condition)
		.sort({ $natural: -1 })
		.limit(1);
	if (!check) {
	} else {
		check = JSON.parse(JSON.stringify(check));
		if (check.length > 0) {
			let checkId = check[0]._id;
			await paymentReminder.findByIdAndUpdate(
				{ _id: checkId },
				{ $push: { is_seen: details._id } }
			);
		}
		//data.msg = req.body.msg;
		data.error = req.flash('error');
		data.success = req.flash('success');
		data.session = req.session;
		data.dateFormat = dateFormat;
		data.paymentReminder = await paymentReminder.find().sort({ $natural: -1 });
		data.ispAppointments = await Appointment.find({
			$or: [
				{ service_proviver: details._id },
				{ ispEmail: details.mail },
				{ mail: details.mail },
			],
			status: ['Upcoming', 'Ongoing'],
		}).sort({ $natural: -1 });
		data.ispHistory = await Appointment.find({
			amount: { $ne: 0 },
			$or: [
				{ service_proviver: details._id },
				{ ispEmail: details.mail },
				{ mail: details.mail },
			],
		}).sort({ $natural: -1 });
		data.cusHistory = await Appointment.find({
			amout: { $ne: 0 },
			mail: details.mail,
		}).sort({ $natural: -1 });
		await res.render('../views/customer/payment/paymentHistory.ejs', data);
	}
};
exports.settings = async function (req, res) {
	let details = req.app.locals.userCustomerSession;
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	let amount = await Manage_subscription_plan.find({ status: 'active' });
	data.monthly_price = amount[0]._doc.monthly_price;
	res.render('../views/customer/settings/settings.ejs', data);
};
exports.accountSettings = async function (req, res) {
	let details = req.app.locals.userCustomerSession;
	let businessHoursDetails = await businessHours.findOne({
		ispId: details._id,
	});
	businessHoursDetails = JSON.parse(JSON.stringify(businessHoursDetails));
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.userDetails = await home.findOne({ _id: details._id });
	data.setAlert = await setAlert.findOne({ ispId: details._id });
	if (businessHoursDetails == null) {
		businessHoursDetails = undefined;
		data.businessHours = businessHoursDetails;
	} else {
		data.businessHours = businessHoursDetails;
	}
	res.render('../views/customer/settings/account_settings.ejs', data);
};
exports.appointments = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	var mobile = details.mobile;
	var role_id = details.role_id;
	data = {};
	//data.msg = req.body.msg;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.outlook = req.session.outlookLogin;
	data.google = req.session.googleLogin;
	data.userEmail = details.mail;
	data.mobile = mobile;
	data.role_id = role_id;
	// ISP appointments
	data.ispAppointments = await Appointment.find({
		$or: [
			{ service_proviver: details._id },
			{ ispEmail: details.mail },
			{ mail: details.mail },
		],
	});
	// Cutomer appointments
	data.appointmentsData = await Appointment.find({ mail: details.mail });
	if (typeof stripeCustomerId != 'undefined') {
		var cardList = await stripe.customers.listSources(stripeCustomerId, {
			object: 'card',
			limit: 20,
		});
		cardList = JSON.parse(JSON.stringify(cardList));
		data.cardList = cardList.data;
	} else {
		data.cardList = '';
	}
	if (role_id == '3') {
		await res.render(
			'../views/customer/appointments/ispAppointments.ejs',
			data
		);
	} else {
		await res.render('../views/customer/appointments/appointments.ejs', data);
	}
};
exports.authorize = function (req, res) {
	var details = req.app.locals.userCustomerSession;
	var authCode = req.query.code;
	var deviceTimeZone = req.session.deviceTimeZone;
	console.log('deviceTimeZone', deviceTimeZone);
	if (authCode) {
		//   console.log('Retrieved auth code in /authorize: ' + authCode);
		authHelper.getTokenFromCode(authCode, tokenReceived, req, res);
	} else {
		// redirect to home
		console.log(
			'/authorize called without a code parameter, redirecting to login'
		);
		res.redirect(baseUrl + 'appointments');
	}
	function tokenReceived(req, res, error, token) {
		if (error) {
			console.log('ERROR getting token:' + error);
			res.send('ERROR getting token: ' + error);
		} else {
			// save tokens in session
			req.session.access_token = token.token.access_token;
			req.session.refresh_token = token.token.refresh_token;
			req.session.email = authHelper.getEmailFromIdToken(token.token.id_token);
			req.session.outlookLogin = 'True';

			Appointment.find({
				$or: [{ ispEmail: details.mail }, { mail: details.mail }],
			}).exec(function (err, result) {
				if (err) {
					throw err;
				} else {
					result.forEach(appointments => {
						if (details.role_id == '2') {
							if (!appointments._doc.outlookEvent) {
								let title = appointments._doc.title;
								let start_time = appointments._doc.utc_date;
								let end_time = appointments._doc.end_date;
								let ispEmail = appointments._doc.ispEmail;

								const accessToken = token.token.access_token;
								const apiUrl = 'https://graph.microsoft.com/v1.0/me';
								const body = {
									subject: `${title}`,
									start: {
										dateTime: `${start_time}`,
										timeZone: `${deviceTimeZone}`,
									},
									end: {
										dateTime: `${end_time}`,
										timeZone: `${deviceTimeZone}`,
									},
								};
								axios({
									method: 'post',
									url: `${apiUrl}/events`,
									headers: {
										Authorization: `Bearer ${accessToken}`,
										'Content-Type': 'application/json',
									},
									data: body,
								}).then(async function (response) {
									await Appointment.update(
										{ _id: appointments._doc._id },
										{
											$set: {
												outlookEvent: true,
												outlookEventId: response.data.id,
											},
										}
									);
								});
							}
						}
						if (details.role_id == '3') {
							if (!appointments._doc.ispOutlookEvent) {
								let title = appointments._doc.title;
								let date = appointments._doc.start_date;
								let time = appointments._doc.start_time;
								let end_time = appointments._doc.end_time;
								let calendar_start_date = moment
									.utc(time, 'hh:mm A')
									.format('HH:mm:ss');
								calendar_start_date = date + 'T' + calendar_start_date;
								let calendar_end_date = moment
									.utc(end_time, 'hh:mm A')
									.format('HH:mm:ss');
								calendar_end_date = date + 'T' + calendar_end_date;

								const accessToken = token.token.access_token;
								const apiUrl = 'https://graph.microsoft.com/v1.0/me';
								const body = {
									subject: `${title}`,
									start: {
										dateTime: `${calendar_start_date}`,
										timeZone: `${deviceTimeZone}`,
									},
									end: {
										dateTime: `${calendar_end_date}`,
										timeZone: `${deviceTimeZone}`,
									},
								};
								axios({
									method: 'post',
									url: `${apiUrl}/events`,
									headers: {
										Authorization: `Bearer ${accessToken}`,
										'Content-Type': 'application/json',
									},
									data: body,
								}).then(async function (response) {
									await Appointment.update(
										{ _id: appointments._doc._id },
										{
											$set: {
												ispOutlookEvent: true,
												ispOutlookEventId: response.data.id,
												ispOutlookToken: token.token,
											},
										}
									);
								});
							}
						}
					});
				}
			});
			req.flash('success', 'Your events are exported to outlook successfully');
			res.redirect(baseUrl + 'appointments');
		}
	}
};
exports.sync = function (req, res) {
	var token = req.session.access_token;
	var email = req.session.email;
	if (token === undefined || email === undefined) {
		console.log('/sync called while not logged in');
		res.redirect('/');
		return;
	}

	// Set the endpoint to API v2
	outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
	// Set the user's email as the anchor mailbox
	outlook.base.setAnchorMailbox(req.session.email);
	// Set the preferred time zone
	outlook.base.setPreferredTimeZone('Eastern Standard Time');

	// Use the syncUrl if available
	var requestUrl = req.session.syncUrl;
	if (requestUrl === undefined) {
		// Calendar sync works on the CalendarView endpoint
		requestUrl = outlook.base.apiEndpoint() + '/Me/CalendarView';
	}

	// Set up our sync window from midnight on the current day to
	// midnight 7 days from now.
	var startDate = moment().startOf('day');
	var endDate = moment(startDate).add(7, 'days');
	// The start and end date are passed as query parameters
	var params = {
		startDateTime: startDate.toISOString(),
		endDateTime: endDate.toISOString(),
	};

	// Set the required headers for sync
	var headers = {
		Prefer: [
			// Enables sync functionality
			'odata.track-changes',
			// Requests only 5 changes per response
			'odata.maxpagesize=5',
		],
	};

	var apiOptions = {
		url: requestUrl,
		token: token,
		headers: headers,
		query: params,
	};

	outlook.base.makeApiCall(apiOptions, function (error, response) {
		if (error) {
			console.log(JSON.stringify(error));
			res.send(JSON.stringify(error));
		} else {
			if (response.statusCode !== 200) {
				console.log('API Call returned ' + response.statusCode);
				res.send('API Call returned ' + response.statusCode);
			} else {
				var nextLink = response.body['@odata.nextLink'];
				if (nextLink !== undefined) {
					req.session.syncUrl = nextLink;
				}
				var deltaLink = response.body['@odata.deltaLink'];
				if (deltaLink !== undefined) {
					req.session.syncUrl = deltaLink;
				}
				res.send(pages.syncPage(email, response.body.value));
			}
		}
	});
};
exports.upgradeToIspPaymentSaveCard = async function (req, res) {
	var freeTrialInfo = [];
	var renewInfo = [];
	var subscriptionsInfo = [];
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	var name = req.app.locals.userCustomerSession.name;
	var email = req.app.locals.userCustomerSession.mail;
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	var userId = req.body.userId;
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
		plan_name: plan_name,
		coupon_code: coupon_code,
		created_date: new Date(Date.now()),
	});
	let new_role_id = 3;
	var alphaText = '';
	var numText = '';
	var alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var num = '0123456789';
	for (let i = 0; i < 3; i++) {
		alphaText += alphabets.charAt(Math.floor(Math.random() * alphabets.length));
	}
	for (let i = 0; i < 3; i++) {
		numText += num.charAt(Math.floor(Math.random() * num.length));
	}
	var inviteCode = numText + alphaText;
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
							res.redirect(baseUrl + 'appointments');
						}
					}
				);
			}
		);
	}
	home.findOne({ mail: email }, async function (err, user) {
		var role_id = user.role_id;
		if (err) {
			return done(err);
		} else {
			if (role_id == 2) {
				if (req.body.free_trial == 'on') {
					var free_trial_end_date = new Date(
						Date.now() + 1 * 24 * 60 * 60 * 1000
					);
					freeTrialInfo.push({
						service_proviver: userId,
						email: email,
						plan_end_date: free_trial_end_date,
						plan_name: plan_name,
						plan_amount: amount,
						stripeCustomerId: stripeCustomerId,
						stripeCardId: cardId,
					});
					home.update(
						{ _id: userId },
						{
							$set: {
								role_id: new_role_id,
								subscriptionValidity: 'True',
								is_customer_to_isp: 'True',
								profileCompleted: true,
								makePagePublic: true,
								customer_to_isp: day,
								plan_end_date: free_trial_end_date,
								plan_name: 'Free Trial',
								auto_renew: req.body.auto_renew,
								free_trial: req.body.free_trial,
								inviteCode: inviteCode,
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
								if (
									req.app.locals.userCustomerSession.userType == 'MobileUser'
								) {
									delete req.session.userCustomerSession;
									res.redirect(baseUrl + 'mobile/upgradeToIsp');
								} else {
									var userDetails = await home.findOne({ _id: userId });
									req.session.userCustomerSession = userDetails;
									req.flash(
										'success',
										'Upgrade to Business Owner completed! Please, login again.'
									);
									delete req.session.userCustomerSession;
									res.redirect(baseUrl);
								}
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
			}
			await stripe.charges
				.create({
					amount: amount,
					currency: 'usd',
					description: 'Upgrade To Business Owner',
					customer: stripeCustomerId,
					source: cardId,
					// application_fee_amount: application_fee_amount,
					// transfer_data: {
					// 	//amount: finalAmountForConnectedAccount,
					// 	destination: stripe_account_id,
					// },
				})
				.then(charge => {
					if (user.plan_end_date != undefined) {
						var currentUtcTime = new Date().toISOString();
						currentUtcTime = currentUtcTime.split('.')[0];
						var plan_end_date = user.plan_end_date;
						plan_end_date = plan_end_date.toISOString();
						plan_end_date = plan_end_date.split('.')[0];
						Date.prototype.addDays = function (days) {
							var date = new Date(this.valueOf());
							date.setDate(date.getDate() + days);
							return date;
						};
						if (currentUtcTime <= plan_end_date) {
							plan_end_date = user.plan_end_date;
							plan_end_date = plan_end_date.addDays(2);
						} else {
							plan_end_date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
						}
					} else {
						plan_end_date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
					}
					let new_amount = req.body.amount1;
					subscriptionsInfo[0].plan_end_date = plan_end_date;
					subscriptionsInfo[0].last_paid_amount = new_amount;
					subscriptionsInfo[0].plan_name = req.body.plan_name;
					if (role_id == 3) {
						home.update(
							{ _id: userId },
							{
								$set: {
									last_paid_amount: new_amount,
									subscriptionValidity: 'True',
									profileCompleted: true,
									cancelSubscription: false,
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
									if (req.body.auto_renew == 'on') {
										console.log('userId', userId);
										var checkRenewPlan = await renewPlan.findOne({
											service_proviver: userId,
										});
										console.log('checkRenewPlan', checkRenewPlan);
										if (checkRenewPlan) {
											await renewPlan.update(
												{ service_proviver: userId },
												{
													$set: {
														plan_end_date: plan_end_date,
														stripeCustomerId: stripeCustomerId,
														stripeCardId: cardId,
													},
												}
											);
										} else {
											renewInfo.push({
												service_proviver: userId,
												email: email,
												plan_end_date: plan_end_date,
												plan_name: plan_name,
												plan_amount: amount,
												stripeCustomerId: stripeCustomerId,
												stripeCardId: cardId,
											});
											await renewPlan.create(renewInfo);
										}
									}
									await subscriptions.create(subscriptionsInfo);
									var userDetails = await home.findOne({ _id: userId });
									req.session.userCustomerSession = userDetails;
									req.flash(
										'success',
										'Your subscription plan has been renewed'
									);
									res.redirect('/accountSettings');
								}
							}
						);
					} else {
						home.update(
							{ _id: userId },
							{
								$set: {
									role_id: new_role_id,
									last_paid_amount: new_amount,
									subscriptionValidity: 'True',
									is_customer_to_isp: 'True',
									profileCompleted: true,
									makePagePublic: true,
									customer_to_isp: day,
									plan_end_date: plan_end_date,
									plan_name: req.body.plan_name,
									auto_renew: req.body.auto_renew,
									free_trial: req.body.free_trial,
									inviteCode: inviteCode,
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
									if (
										req.app.locals.userCustomerSession.userType == 'MobileUser'
									) {
										delete req.session.userCustomerSession;
										res.redirect(baseUrl + 'mobile/upgradeToIsp');
									} else {
										var userDetails = await home.findOne({ _id: userId });
										req.session.userCustomerSession = userDetails;
										req.flash(
											'success',
											'Upgrade to Business Owner completed! Please, login again.'
										);
										delete req.session.userCustomerSession;
										res.redirect(baseUrl);
									}
								}
							}
						);
					}
				})
				.catch(err => {
					console.log('err.raw.message', err.raw.message);
					req.flash('error', err.raw.message);
					res.redirect(baseUrl + `main`);
				});
		}
	});
};
exports.upgradeToIspPayment = async function (req, res) {
	var freeTrialInfo = [];
	var renewInfo = [];
	var subscriptionsInfo = [];
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	var name = req.app.locals.userCustomerSession.name;
	var email = req.app.locals.userCustomerSession.mail;
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	var userId = req.body.userId;
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
	let new_role_id = 3;
	var alphaText = '';
	var numText = '';
	var alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var num = '0123456789';
	for (let i = 0; i < 3; i++) {
		alphaText += alphabets.charAt(Math.floor(Math.random() * alphabets.length));
	}
	for (let i = 0; i < 3; i++) {
		numText += num.charAt(Math.floor(Math.random() * num.length));
	}
	var inviteCode = numText + alphaText;
	var stripeToken = req.body.stripeToken;
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
							res.redirect(baseUrl + 'appointments');
						}
					}
				);
			}
		);
	}
	home.findOne({ mail: email }, async function (err, user) {
		var role_id = user.role_id;
		if (err) {
			return done(err);
		} else {
			var addCard = await stripe.customers.createSource(stripeCustomerId, {
				source: stripeToken,
			});
			if (role_id == 2) {
				if (req.body.free_trial == 'on') {
					var free_trial_end_date = new Date(
						Date.now() + 1 * 24 * 60 * 60 * 1000
					);
					freeTrialInfo.push({
						service_proviver: userId,
						email: email,
						plan_end_date: free_trial_end_date,
						plan_name: plan_name,
						plan_amount: amount,
						stripeCustomerId: stripeCustomerId,
						stripeCardId: addCard.id,
					});
					home.update(
						{ _id: userId },
						{
							$set: {
								role_id: new_role_id,
								subscriptionValidity: 'True',
								is_customer_to_isp: 'True',
								profileCompleted: true,
								makePagePublic: true,
								customer_to_isp: day,
								plan_end_date: free_trial_end_date,
								plan_name: 'Free Trial',
								auto_renew: req.body.auto_renew,
								free_trial: req.body.free_trial,
								inviteCode: inviteCode,
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
								if (
									req.app.locals.userCustomerSession.userType == 'MobileUser'
								) {
									delete req.session.userCustomerSession;
									res.redirect(baseUrl + 'mobile/upgradeToIsp');
								} else {
									var userDetails = await home.findOne({ _id: userId });
									req.session.userCustomerSession = userDetails;
									req.flash(
										'success',
										'Upgrade to Business Owner completed! Please, login again.'
									);
									delete req.session.userCustomerSession;
									res.redirect(baseUrl);
								}
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
			}
			await stripe.charges
				.create({
					amount: amount,
					currency: 'usd',
					description: 'Upgrade To Business Owner',
					customer: stripeCustomerId,
					source: addCard.id,
				})
				.then(charge => {
					if (user.plan_end_date != undefined) {
						var currentUtcTime = new Date().toISOString();
						currentUtcTime = currentUtcTime.split('.')[0];
						var plan_end_date = user.plan_end_date;
						plan_end_date = plan_end_date.toISOString();
						plan_end_date = plan_end_date.split('.')[0];
						Date.prototype.addDays = function (days) {
							var date = new Date(this.valueOf());
							date.setDate(date.getDate() + days);
							return date;
						};
						if (currentUtcTime <= plan_end_date) {
							console.log('True');
							plan_end_date = user.plan_end_date;
							plan_end_date = plan_end_date.addDays(2);
						} else {
							console.log('False');
							plan_end_date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
						}
					} else {
						plan_end_date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
					}
					let new_amount = req.body.amount1;
					subscriptionsInfo[0].plan_end_date = plan_end_date;
					subscriptionsInfo[0].last_paid_amount = new_amount;
					subscriptionsInfo[0].plan_name = req.body.plan_name;
					if (role_id == 3) {
						home.update(
							{ _id: userId },
							{
								$set: {
									last_paid_amount: new_amount,
									subscriptionValidity: 'True',
									profileCompleted: true,
									cancelSubscription: false,
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
									if (req.body.auto_renew == 'on') {
										var checkRenewPlan = await renewPlan.findOne({
											service_proviver: userId,
										});
										if (checkRenewPlan) {
											await renewPlan.update(
												{ service_proviver: userId },
												{
													$set: {
														plan_end_date: plan_end_date,
														stripeCustomerId: stripeCustomerId,
														stripeCardId: addCard.id,
													},
												}
											);
										} else {
											renewInfo.push({
												service_proviver: userId,
												email: email,
												plan_end_date: plan_end_date,
												plan_name: plan_name,
												plan_amount: amount,
												stripeCustomerId: stripeCustomerId,
												stripeCardId: addCard.id,
											});
											await renewPlan.create(renewInfo);
										}
									}
									await subscriptions.create(subscriptionsInfo);
									var userDetails = await home.findOne({ _id: userId });
									req.session.userCustomerSession = userDetails;
									req.flash(
										'success',
										'Your subscription plan has been renewed'
									);
									res.redirect('/accountSettings');
								}
							}
						);
					} else {
						home.update(
							{ _id: userId },
							{
								$set: {
									role_id: new_role_id,
									last_paid_amount: new_amount,
									subscriptionValidity: 'True',
									is_customer_to_isp: 'True',
									profileCompleted: true,
									makePagePublic: true,
									customer_to_isp: day,
									plan_end_date: plan_end_date,
									plan_name: req.body.plan_name,
									auto_renew: req.body.auto_renew,
									free_trial: req.body.free_trial,
									inviteCode: inviteCode,
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
									if (
										req.app.locals.userCustomerSession.userType == 'MobileUser'
									) {
										delete req.session.userCustomerSession;
										res.redirect(baseUrl + 'mobile/upgradeToIsp');
									} else {
										var userDetails = await home.findOne({ _id: userId });
										req.session.userCustomerSession = userDetails;
										req.flash(
											'success',
											'Upgrade to Business Owner completed! Please, login again.'
										);
										delete req.session.userCustomerSession;
										res.redirect(baseUrl);
									}
								}
							}
						);
					}
				})
				.catch(err => {
					res.send(err);
				});
		}
	});
};
exports.paymentSaveCard = async (req, res) => {
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	var cardId = req.body.existingCardRadio;
	var ispAccId = req.body.ispAccId;
	var deviceTimeZone = req.session.deviceTimeZone;

	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');

	var details = req.app.locals.userCustomerSession;
	var finalTimeZone = req.body.timezone;
	var phone = details.mobile;
	var role_id = details.role_id;
	var profile = details.profileImage;
	var profileUrl = baseUrl + 'uploads/profile/' + profile;
	var tip = req.body.tip1;
	var paymentType = req.body.selectedRadio;
	var serviceProvider = req.body.userId;
	var title = req.body.title;
	var date = req.body.date;
	var time = req.body.time;
	var price = req.body.price;
	var discountAmount = req.body.discountAmount;
	var coupon_code = req.body.coupon_code;
	var coupon_based_on = req.body.coupon_based_on;
	var discount = req.body.discount;
	var coupon_type = req.body.coupon_type;
	var createAppointment = [];
	var connectionRequest = [];
	var reminderData = [];

	var stripeError;
	var data = await home.find({ _id: serviceProvider });
	data = data[0]._doc;
	var ispProfile = data.profileImage;
	var ispProfileUrl = baseUrl + 'uploads/profile/' + ispProfile;
	var ispEmail = data.mail;
	var ispPhone = data.mobile;
	var ispName = data.name;
	if (role_id == '3') {
		var ispAppointment = 'true';
	}
	var outlookEvent = '';
	var googleEvent = '';
	if (req.session.outlookLogin == 'True') {
		outlookEvent = 'true';
	} else {
		outlookEvent = 'false';
	}
	if (req.session.googleLogin == 'True') {
		googleEvent = 'true';
	} else {
		googleEvent = 'false';
	}
	for (let i = 0; i < req.body.title.length; i++) {
		title = req.body.title[i];
		date = req.body.date[i];
		time = req.body.time[i];
		price = req.body.price[i];
		var full_payment;
		var remaining_payment;
		var googleEventId;
		var outlookEventId;

		var services_data = await services.find({
			service_proviver: serviceProvider,
			name: title,
		});
		var serviceId = services_data[0]._doc._id;
		var duration_minutes = parseInt(services_data[0]._doc.minutes);
		var duration = duration_minutes;
		duration = duration.toString();
		var cancellation = services_data[0]._doc.cancellation;
		// Logic for cancellation time according to createed date
		var createdDate = day.split(' ')[0];
		var createdTime = day.split(' ')[1];
		// var cancellationTime = moment.utc(createdTime, 'hh:mm A').add(cancellation, 'm').format('HH:mm');
		createdTime = createdDate + 'T' + createdTime;
		// cancellationTime = createdDate+'T'+cancellationTime
		// Logic for cancellation time according to appointment date
		let cancelTime = moment(time, 'hh:mm A').format('HH:mm:ss');
		cancelTime = date + 'T' + cancelTime;
		var cancellationTime = moment(cancelTime)
			.subtract(cancellation, 'm')
			.format('YYYY-MM-DD[T]HH:mm:ss');
		// Logic End
		// Logic end

		var advance = services_data[0]._doc.advance;
		if (paymentType == 'service_advance_radio_val') {
			advance = (advance * price) / 100;
			remaining_payment = price - advance;
			remaining_payment = remaining_payment.toFixed(2);
			advance = advance.toFixed(2);
			price = advance;
			price = parseFloat(price) - parseFloat(discountAmount);
			price = price.toFixed(2).toString();
			priceTip = parseFloat(price) + parseFloat(tip);
			priceTip = priceTip * 100;
			priceTip = priceTip.toFixed(2);
			priceTip = parseFloat(priceTip);
		} else {
			price = parseFloat(price) - parseFloat(discountAmount);
			price = price.toFixed(2).toString();
			var priceTip = parseFloat(price) + parseFloat(tip);
			priceTip = priceTip * 100;
			priceTip = priceTip.toFixed(2);
			priceTip = parseFloat(priceTip);
		}
		if (paymentType == 'service_price_radio_val') {
			full_payment = true;
			remaining_payment = 0;
		} else {
			full_payment = false;
		}
		var date_time = date + '/' + time;
		let utc_time = moment.utc(time, 'hh:mm A').format('HH:mm');
		let end_time = moment
			.utc(time, 'hh:mm A')
			.add(duration, 'm')
			.format('HH:mm');
		let utc_date = date + 'T' + utc_time;
		let end_date = date + 'T' + end_time;
		console.log('utc_date-----------994', utc_date);
		let calendar_start_date = moment.utc(time, 'hh:mm A').format('HH:mm:ss');
		calendar_start_date = date + 'T' + calendar_start_date;
		let calendar_end_date = moment.utc(end_time, 'hh:mm A').format('HH:mm:ss');
		calendar_end_date = date + 'T' + calendar_end_date;
		// IST Time Convert start
		var dateWithTime = moment(date + ' ' + utc_time, 'YYYY-MM-DD HH:mm').format(
			'YYYY-MM-DD HH:mm'
		);
		var dateTz = moment.tz(dateWithTime, finalTimeZone);
		var utc_start = dateTz.clone().tz('GMT').format();

		var endDateWithTime = moment(
			date + ' ' + end_time,
			'YYYY-MM-DD HH:mm'
		).format('YYYY-MM-DD HH:mm');
		var dateTzz = moment.tz(endDateWithTime, finalTimeZone);
		var utc_end = dateTzz.clone().tz('GMT').format();
		console.log('utc_start', utc_start);
		console.log('utc_end', utc_end);
		// IST Time Convet finish

		if (req.session.outlookLogin == 'True') {
			//console.log("outlook login true");
			console.log('deviceTimeZone', deviceTimeZone);
			const accessToken = req.session.access_token;
			const apiUrl = 'https://graph.microsoft.com/v1.0/me';
			const body = {
				subject: `${title}`,
				start: {
					dateTime: `${calendar_start_date}`,
					timeZone: `${deviceTimeZone}`,
				},
				end: {
					dateTime: `${calendar_end_date}`,
					timeZone: `${deviceTimeZone}`,
				},
			};
			await axios({
				method: 'post',
				url: `${apiUrl}/events`,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				data: body,
			}).then(function (response) {
				outlookEventId = response.data.id;
				console.log('outlookEventId', outlookEventId);
			});
		}
		if (req.session.googleLogin == 'True') {
			console.log('deviceTimeZone', deviceTimeZone);
			//console.log("google login true");
			var token = req.session.googleToken;
			oauth2Client.setCredentials(token);
			const { google } = require('googleapis');
			const calendar = google.calendar({ version: 'v3', oauth2Client });

			var event = {
				summary: `${title}`,
				start: {
					dateTime: `${calendar_start_date}`,
					timeZone: `${deviceTimeZone}`,
				},
				end: {
					dateTime: `${calendar_end_date}`,
					timeZone: `${deviceTimeZone}`,
				},
				reminders: {
					useDefault: false,
					overrides: [
						{ method: 'email', minutes: 24 * 60 },
						{ method: 'popup', minutes: 10 },
					],
				},
			};
			let getGoogleEvent = await calendar.events.insert({
				auth: oauth2Client,
				calendarId: 'primary',
				resource: event,
			});
			googleEventId = getGoogleEvent.data.id;
			console.log('googleEventId', googleEventId);
		}
		console.log('outlookEventId 1203', outlookEventId);
		console.log('googleEventId 1203', googleEventId);
		createAppointment.push({
			updated_date: day,
			created_date: day,
			customer: details._id,
			ispAccId: ispAccId,
			service_proviver: serviceProvider,
			serviceId: serviceId,
			full_payment: full_payment,
			remaining_payment: remaining_payment,
			amount: price,
			tip: tip,
			charge: '',
			end_time: end_time,
			end_date: end_date,
			start_time: time,
			start_date: date,
			utc_date: utc_date,
			utc_start: utc_start,
			utc_end: utc_end,
			createdTime: createdTime,
			cancellationTime: cancellationTime,
			cancellation: true,
			finalTimeZone: finalTimeZone,
			status: 'Upcoming',
			title: title,
			name: details.name,
			mail: details.mail,
			profile: profile,
			phone: phone,
			ispName: ispName,
			ispEmail: ispEmail,
			ispProfile: ispProfile,
			ispPhone: ispPhone,
			ispAppointment: ispAppointment,
			outlookEvent: outlookEvent,
			googleEvent: googleEvent,
			outlookEventId: outlookEventId,
			googleEventId: googleEventId,
			coupon_code: coupon_code,
			coupon_based_on: coupon_based_on,
			coupon_type: coupon_type,
			discount: discount,
			ispId: serviceProvider,
			notificationType: 'Appointment',
		});
		var content = {
			name: details.name,
			email: details.mail,
			subject: 'OYO App-Appointment Details',
			templatefoldername: 'appointment',
			id: details._id,
			token: details.active_hash,
			date: moment.utc(date_time, 'YYYY-MM-DD').format('MM-DD-YYYY HH:mm'),
			title: title,
			ispName: ispName,
			ispEmail: ispEmail,
			ispPhone: ispPhone,
		};
		if (priceTip != '0') {
			await stripe.charges
				.create({
					amount: priceTip,
					currency: 'usd',
					description: title,
					customer: stripeCustomerId,
					source: cardId,
					//application_fee_amount: 500, //This is a comission if have
					transfer_data: {
						//amount: finalAmountForConnectedAccount, // We can send some seperate defined amount to connected account
						destination: ispAccId,
					},
				})
				.then(charge => {
					//console.log('--------chargeid--', charge);
					createAppointment[0].charge = charge.id;
				})
				.catch(err => {
					stripeError = err.raw.message;
				});
		}
	}
	console.log('err.raw.message', stripeError);
	if (stripeError) {
		req.flash('error', stripeError);
		res.redirect('/appointments');
		return false;
	} else {
		console.log('err.raw.message-------------------------->', stripeError);
		Email.send_email(content);
		var success = await Appointment.create(createAppointment);
		var appointmentReminder = await sendReminder.create(createAppointment);
		success = JSON.parse(JSON.stringify(success));
		let reminder = [];
		success.forEach(appointmentData => {
			reminder.push({
				appointmentId: appointmentData._id,
				cusMail: appointmentData.mail,
				name: appointmentData.name,
				profile: appointmentData.profile,
				ispId: appointmentData.service_proviver,
				ispName: appointmentData.ispName,
				title: appointmentData.title,
				start_date: appointmentData.start_date,
				utc_start: appointmentData.utc_start,
				utc_end: appointmentData.utc_end,
				full_payment: appointmentData.full_payment,
				amount: appointmentData.amount,
				remaining_payment: appointmentData.remaining_payment,
				type: 'AppointmentReminder',
			});
		});
		await paymentReminder.create(reminder);

		await connectedList
			.find({ cusId: details._id, ispId: serviceProvider })
			.then(async status => {
				if (status.length != 1) {
					console.log('profile', profile);
					console.log('ispProfile', ispProfile);
					connectionRequest.push({
						status: 'pending',
						ispId: serviceProvider,
						ispName: ispName,
						ispMail: ispEmail,
						IspProfileImage: ispProfile,
						cusId: details._id,
						cusName: details.name,
						cusMail: details.mail,
						cusAddress: details.address,
						cusMobile: details.mobile,
						cusProfile: profile,
						cusBirthday: details.birthdate,
						social_provider: details.social_provider,
						lastTrasaction: day,
					});
					reminderData.push({
						ispId: serviceProvider,
						notificationType: 'Connection',
						status: 'pending',
						name: details.name,
						mail: details.mail,
						profile: profile,
						phone: details.mobile,
						ispName: ispName,
						ispEmail: ispEmail,
						ispProfile: ispProfile,
						ispPhone: ispPhone,
						ispAccId: ispAccId,
						created_date: day,
					});
				} else {
					await connectedList.update(
						{ cusMail: details.mail, ispMail: ispEmail },
						{
							$set: {
								lastTrasaction: day,
							},
						}
					);
				}
			})
			.catch(err => {
				res.send(err);
			});
		var successConnectedList = await connectedList.create(connectionRequest);
		var connectionReminder = await sendReminder.create(reminderData);

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
								res.redirect(baseUrl + 'appointments');
							}
						}
					);
				}
			);
		}
		await home.update(
			{ _id: details._id },
			{
				$set: {
					last_paid_amount: price,
					last_transaction: day,
				},
			},
			async function (err, updatedUser) {
				if (err) {
					return done(err);
				} else {
					var userDetails = await home.findOne({ _id: details._id });
					req.session.userCustomerSession = userDetails;
					req.flash(
						'success',
						'Your appointment has been successfully booked.'
					);
					res.redirect('/appointments');
				}
			}
		);
	}
};

exports.payment = async (req, res) => {
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	var stripeToken = req.body.stripeToken;
	var ispAccId = req.body.ispAccId;
	var deviceTimeZone = req.session.deviceTimeZone;

	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');

	var details = req.app.locals.userCustomerSession;
	var finalTimeZone = req.body.timezone;
	var phone = details.mobile;
	var role_id = details.role_id;
	var profile = details.profileImage;
	var profileUrl = baseUrl + 'uploads/profile/' + profile;
	var tip = req.body.tip1;
	var paymentType = req.body.selectedRadio;
	var serviceProvider = req.body.userId;
	var title = req.body.title;
	var date = req.body.date;
	var time = req.body.time;
	var price = req.body.price;
	var discountAmount = req.body.discountAmount;
	var coupon_code = req.body.coupon_code;
	var coupon_based_on = req.body.coupon_based_on;
	var discount = req.body.discount;
	var coupon_type = req.body.coupon_type;
	var createAppointment = [];
	var connectionRequest = [];
	var reminderData = [];

	var stripeError;
	var data = await home.find({ _id: serviceProvider });
	data = data[0]._doc;
	var ispProfile = data.profileImage;
	var ispProfileUrl = baseUrl + 'uploads/profile/' + ispProfile;
	var ispEmail = data.mail;
	var ispPhone = data.mobile;
	var ispName = data.name;
	if (role_id == '3') {
		var ispAppointment = 'true';
	}
	var outlookEvent = '';
	var googleEvent = '';
	if (req.session.outlookLogin == 'True') {
		outlookEvent = 'true';
	} else {
		outlookEvent = 'false';
	}
	if (req.session.googleLogin == 'True') {
		googleEvent = 'true';
	} else {
		googleEvent = 'false';
	}
	var addCard = await stripe.customers
		.createSource(stripeCustomerId, { source: stripeToken })
		.catch(err => {
			console.error('ERROR MSG :::::', err);
			req.flash('error', err.raw.message);
			res.redirect('/appointments');
			return false;
		});

	for (let i = 0; i < req.body.title.length; i++) {
		title = req.body.title[i];
		date = req.body.date[i];
		time = req.body.time[i];
		price = req.body.price[i];
		var full_payment;
		var remaining_payment;
		var googleEventId;
		var outlookEventId;

		var services_data = await services.find({
			service_proviver: serviceProvider,
			name: title,
		});
		var serviceId = services_data[0]._doc._id;
		var duration_minutes = parseInt(services_data[0]._doc.minutes);
		var duration = duration_minutes;
		duration = duration.toString();
		var cancellation = services_data[0]._doc.cancellation;
		// Logic for cancellation time according to createed date
		var createdDate = day.split(' ')[0];
		var createdTime = day.split(' ')[1];
		// var cancellationTime = moment.utc(createdTime, 'hh:mm A').add(cancellation, 'm').format('HH:mm');
		createdTime = createdDate + 'T' + createdTime;
		// cancellationTime = createdDate+'T'+cancellationTime
		// Logic for cancellation time according to appointment date
		let cancelTime = moment(time, 'hh:mm A').format('HH:mm:ss');
		cancelTime = date + 'T' + cancelTime;
		var cancellationTime = moment(cancelTime)
			.subtract(cancellation, 'm')
			.format('YYYY-MM-DD[T]HH:mm:ss');
		// Logic End
		// Logic end

		var advance = services_data[0]._doc.advance;
		if (paymentType == 'service_advance_radio_val') {
			advance = (advance * price) / 100;
			remaining_payment = price - advance;
			remaining_payment = remaining_payment.toFixed(2);
			advance = advance.toFixed(2);
			price = advance;
			price = parseFloat(price) - parseFloat(discountAmount);
			price = price.toFixed(2).toString();
			priceTip = parseFloat(price) + parseFloat(tip);
			priceTip = priceTip * 100;
			priceTip = priceTip.toFixed(2);
			priceTip = parseFloat(priceTip);
		} else {
			price = parseFloat(price) - parseFloat(discountAmount);
			price = price.toFixed(2).toString();
			var priceTip = parseFloat(price) + parseFloat(tip);
			priceTip = priceTip * 100;
			priceTip = priceTip.toFixed(2);
			priceTip = parseFloat(priceTip);
		}
		if (paymentType == 'service_price_radio_val') {
			full_payment = true;
			remaining_payment = 0;
		} else {
			full_payment = false;
		}
		var date_time = date + '/' + time;
		let utc_time = moment.utc(time, 'hh:mm A').format('HH:mm');
		let end_time = moment
			.utc(time, 'hh:mm A')
			.add(duration, 'm')
			.format('HH:mm');
		let utc_date = date + 'T' + utc_time;
		let end_date = date + 'T' + end_time;
		let calendar_start_date = moment.utc(time, 'hh:mm A').format('HH:mm:ss');
		calendar_start_date = date + 'T' + calendar_start_date;
		let calendar_end_date = moment.utc(end_time, 'hh:mm A').format('HH:mm:ss');
		calendar_end_date = date + 'T' + calendar_end_date;

		// IST Time Convert start
		var dateWithTime = moment(date + ' ' + utc_time, 'YYYY-MM-DD HH:mm').format(
			'YYYY-MM-DD HH:mm'
		);
		var dateTz = moment.tz(dateWithTime, finalTimeZone);
		var utc_start = dateTz.clone().tz('GMT').format();

		var endDateWithTime = moment(
			date + ' ' + end_time,
			'YYYY-MM-DD HH:mm'
		).format('YYYY-MM-DD HH:mm');
		var dateTzz = moment.tz(endDateWithTime, finalTimeZone);
		var utc_end = dateTzz.clone().tz('GMT').format();
		console.log('utc_start', utc_start);
		console.log('utc_end', utc_end);
		// IST Time Convet finish

		if (req.session.outlookLogin == 'True') {
			console.log('deviceTimeZone', deviceTimeZone);
			const accessToken = req.session.access_token;
			const apiUrl = 'https://graph.microsoft.com/v1.0/me';
			const body = {
				subject: `${title}`,
				start: {
					dateTime: `${calendar_start_date}`,
					timeZone: `${deviceTimeZone}`,
				},
				end: {
					dateTime: `${calendar_end_date}`,
					timeZone: `${deviceTimeZone}`,
				},
			};
			// const authAxios = axios.create({
			// 	apiUrl: apiUrl,
			// 	headers: {
			// 		Authorization: `Bearer ${accessToken}`,
			// 		'Content-Type': 'application/json',
			// 	},
			// 	data: body
			// });
			// const sendevent = await authAxios.post(`${apiUrl}/events`);
			await axios({
				method: 'post',
				url: `${apiUrl}/events`,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				data: body,
			}).then(function (response) {
				outlookEventId = response.data.id;
				console.log('outlookEventId', outlookEventId);
			});
		}
		if (req.session.googleLogin == 'True') {
			console.log('deviceTimeZone', deviceTimeZone);
			var token = req.session.googleToken;
			oauth2Client.setCredentials(token);
			const { google } = require('googleapis');
			const calendar = google.calendar({ version: 'v3', oauth2Client });

			var event = {
				summary: `${title}`,
				start: {
					dateTime: `${calendar_start_date}`,
					timeZone: `${deviceTimeZone}`,
				},
				end: {
					dateTime: `${calendar_end_date}`,
					timeZone: `${deviceTimeZone}`,
				},
				reminders: {
					useDefault: false,
					overrides: [
						{ method: 'email', minutes: 24 * 60 },
						{ method: 'popup', minutes: 10 },
					],
				},
			};
			let getGoogleEvent = await calendar.events.insert({
				auth: oauth2Client,
				calendarId: 'primary',
				resource: event,
			});
			googleEventId = getGoogleEvent.data.id;
			console.log('googleEventId', googleEventId);
		}
		console.log('outlookEventId 1596', outlookEventId);
		console.log('googleEventId 1596', googleEventId);
		createAppointment.push({
			updated_date: day,
			created_date: day,
			customer: details._id,
			service_proviver: serviceProvider,
			serviceId: serviceId,
			ispAccId: ispAccId,
			full_payment: full_payment,
			remaining_payment: remaining_payment,
			amount: price,
			tip: tip,
			charge: '',
			end_time: end_time,
			end_date: end_date,
			start_time: time,
			start_date: date,
			utc_date: utc_date,
			utc_start: utc_start,
			utc_end: utc_end,
			createdTime: createdTime,
			cancellationTime: cancellationTime,
			cancellation: true,
			finalTimeZone: finalTimeZone,
			status: 'Upcoming',
			title: title,
			name: details.name,
			mail: details.mail,
			profile: profile,
			phone: phone,
			ispName: ispName,
			ispEmail: ispEmail,
			ispProfile: ispProfile,
			ispPhone: ispPhone,
			ispAppointment: ispAppointment,
			outlookEvent: outlookEvent,
			googleEvent: googleEvent,
			outlookEventId: outlookEventId,
			googleEventId: googleEventId,
			coupon_code: coupon_code,
			coupon_based_on: coupon_based_on,
			coupon_type: coupon_type,
			discount: discount,
			notificationType: 'Appointment',
			ispId: serviceProvider,
		});
		var content = {
			name: details.name,
			email: details.mail,
			subject: 'OYO App-Appointment Details',
			templatefoldername: 'appointment',
			id: details._id,
			token: details.active_hash,
			date: moment.utc(date_time, 'YYYY-MM-DD').format('MM-DD-YYYY'),
			title: title,
			ispName: ispName,
			ispEmail: ispEmail,
			ispPhone: ispPhone,
		};
		Email.send_email(content);
		if (priceTip != '0') {
			await stripe.charges
				.create({
					amount: priceTip,
					currency: 'usd',
					description: title,
					customer: stripeCustomerId,
					source: addCard.id,
					transfer_data: {
						destination: ispAccId,
					},
				})
				.then(charge => {
					createAppointment[0].charge = charge.id;
				})
				.catch(err => {
					stripeError = err.raw.message;
				});
		}
	}
	console.log('err.raw.message', stripeError);
	if (stripeError) {
		req.flash('error', 'Business Owner has not setup Stripe account.');
		res.redirect('/appointments');
		return false;
	}
	var success = await Appointment.create(createAppointment);
	var appointmentReminder = await sendReminder.create(createAppointment);
	success = JSON.parse(JSON.stringify(success));
	let reminder = [];
	success.forEach(appointmentData => {
		reminder.push({
			appointmentId: appointmentData._id,
			cusMail: appointmentData.mail,
			name: appointmentData.name,
			profile: appointmentData.profile,
			ispId: appointmentData.service_proviver,
			ispName: appointmentData.ispName,
			title: appointmentData.title,
			start_date: appointmentData.start_date,
			utc_start: appointmentData.utc_start,
			utc_end: appointmentData.utc_end,
			full_payment: appointmentData.full_payment,
			amount: appointmentData.amount,
			remaining_payment: appointmentData.remaining_payment,
			type: 'AppointmentReminder',
		});
	});
	await paymentReminder.create(reminder);

	await connectedList
		.find({ cusMail: details.mail, ispMail: ispEmail })
		.then(async status => {
			if (status.length != 1) {
				connectionRequest.push({
					status: 'pending',
					ispId: serviceProvider,
					ispName: ispName,
					ispMail: ispEmail,
					IspProfileImage: ispProfile,
					cusId: details._id,
					cusName: details.name,
					cusMail: details.mail,
					cusProfile: profile,
					cusAddress: details.address,
					cusMobile: details.mobile,
					cusBirthday: details.birthdate,
					social_provider: details.social_provider,
					lastTrasaction: day,
					createdDate: day,
				});
				reminderData.push({
					ispId: serviceProvider,
					notificationType: 'Connection',
					status: 'pending',
					name: details.name,
					mail: details.mail,
					profile: profile,
					phone: details.mobile,
					ispName: ispName,
					ispEmail: ispEmail,
					ispProfile: ispProfile,
					ispPhone: ispPhone,
					ispAccId: ispAccId,
					created_date: day,
				});
			} else {
				await connectedList.update(
					{ cusMail: details.mail, ispMail: ispEmail },
					{
						$set: {
							lastTrasaction: day,
						},
					}
				);
			}
		})
		.catch(err => {
			res.send(err);
		});
	var successConnectedList = await connectedList.create(connectionRequest);
	var connectionReminder = await sendReminder.create(reminderData);

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
							res.redirect(baseUrl + 'appointments');
						}
					}
				);
			}
		);
	}
	await home.update(
		{ _id: details._id },
		{
			$set: {
				last_paid_amount: price,
				last_transaction: day,
			},
		},
		async function (err, updatedUser) {
			if (err) {
				return done(err);
			} else {
				var userDetails = await home.findOne({ _id: details._id });
				req.session.userCustomerSession = userDetails;
				req.flash('success', 'Your appointment has been successfully booked.');
				res.redirect('/appointments');
			}
		}
	);
	// await stripe.customers.create({
	//     email:req.body.stripeEmail,
	//     source:req.body.stripeToken,
	//     name:name,
	//     address: {
	//         line1: '510 Townsend St',
	//         postal_code: '98140',
	//         city: 'San Francisco',
	//         state: 'CA',
	//         country: 'US',
	//     },
	//     description:req.body.title1
	// })
	// .then((customer) => {

	// 	var amount = req.body.amount1*100;
	// 	var title = req.body.title1;
	// 	console.log(req.body);
	// 	console.log("***************************202",amount, title);
	//     return stripe.charges.create({
	//         amount:amount,
	//         description:title,
	//         currency:'USD',
	//         customer:customer.id
	//     })
	// })
	// .then((charge) => {
	// 	console.log(req.body);
	// 	var details = req.app.locals.userCustomerSession;
	// 	var amount = req.body.amount1;
	// 	var date = req.body.date1;
	// 	var time = req.body.time1;
	// 	var date_time = date+'/'+time;
	// 	var title = req.body.title1;
	// 	var utc_date = req.body.utc_date1;

	// 	var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");

	// 	var newAppointment= new Appointment();

	// 	newAppointment.updated_date = day;
	// 	newAppointment.created_date = day;
	// 	// newAppointment.event_link = "www.google.com";
	// 	newAppointment.amount = amount;
	// 	// newAppointment.end_date = "2021-08-10T15:38:50.890+00:00";
	// 	newAppointment.start_time = time;
	// 	newAppointment.start_date = date;
	// 	newAppointment.utc_date = utc_date;
	// 	newAppointment.status = "Incomplete";
	// 	newAppointment.title = title;
	// 	newAppointment.name = details.name;
	// 	newAppointment.mail = details.mail;

	// 	var content = {
	// 		'name': details.name,
	// 		'email': details.mail,
	// 		'subject': 'OYO App-Appointment Details',
	// 		'templatefoldername': 'appointment',
	// 		'id': details._id,
	// 		'token': details.active_hash,
	// 		'date': date_time,
	// 		'title': title,
	// 	};
	// 	Email.send_email(content);

	// 	newAppointment.save(function(err) {
	// 		if (err){
	// 			res.send(err)
	//         }else{
	// 			req.flash('success', 'Your appointment has been successfully booked.');
	// 			res.redirect('/appointments');
	//         }
	// 	});
	//     // res.redirect('/connectedIspDetail');
	// })
	// .catch((err) => {
	//     res.send(err)
	// })
};

exports.upgradeToIsp = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;

	data = {};
	data.userId = req.params.id;
	data.dateFormat = dateFormat;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	console.log('upgradeToIsp : page');

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
			var annual_price = result[0]._doc.annual_price / 12;
			data.annual_price = annual_price.toFixed(2);
			data.monthly_price = result[0]._doc.monthly_price;
			data.subscription = result[0]._doc;
			res.render('../views/customer/upgrade-to-isp/upgrade-to-isp.ejs', data);
		}
	});
	// res.render('../views/customer/upgrade-to-isp/upgrade-to-isp.ejs', data);
};

exports.home = function (req, res) {
	if (req.session.userCustomerSession) {
		res.redirect(baseUrl + 'main');
	}
	// var params = {};
	// params.deviceToken = 'e5Ix7OQNlNHKk92yZqO49T:APA91bER-G_XEBVxOq2RxtONr67dZANpxWVsRCaiV-_dYfmZ7AZtY3J-KB0SM1qTAix81tHoY83SZYEAM8zWXOMQRC7XQozg9HTX3awztkC2QRPUDIphxj7qXXXJIc6PCbK-i552_a12';
	// params.title = "Subtitle ..";
	// params.body = "Body of notification";
	// params.notificationType = "heigh";
	// params.agendaId = "kjlj654"
	// console.log(params);
	// notification.sendNotification(params);
	data = {};
	data.msg = '';
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	ServiceCategories.find({})
		.sort({ created_date: -1 })
		.exec(function (err, service_categories) {
			if (err) {
				data.service_categories = '';
				res.render('home.ejs', data);
			} else {
				data.service_categories = service_categories;
				//console.log("service_categories  :"+JSON.stringify(service_categories));
				res.render('home.ejs', data);
			}
		});
};
exports.customSearch = function (req, res) {
	data = {};
	data.msg = req.body.msg;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	data.msg = '';
	var name_category = req.body.name_category;
	var address = req.body.location;
	data.name_category = name_category;
	data.address = address;

	console.log('name', name_category);
	home
		.aggregate([
			{
				$match: {
					$and: [
						{ role_id: 3 },
						{ verify: 1 },
						{ status: 'active' },
						{ makePagePublic: { $ne: false } },
						{ bankDetails: { $exists: true } },
						{ subscriptionValidity: { $ne: false } },
					],
				},
			},
			{
				$lookup: {
					from: 'service_categories',
					localField: 'business_category',
					foreignField: '_id',
					as: 'services',
				},
			},
			{
				$unwind: '$services',
			},
			{
				$lookup: {
					from: 'businesshours',
					localField: '_id',
					foreignField: 'ispId',
					as: 'businesshours',
				},
			},
			{
				$unwind: '$businesshours',
			},
			// {
			// 	"$lookup": {
			// 		from: 'services',
			// 		localField: '_id',
			// 		foreignField: 'service_proviver',
			// 		as: 'services_pro',
			// 	}

			// },
			// {
			// 	"$unwind": "$services_pro"
			// },
			// {
			// 	$addFields: {
			// 		"service_name": '$services.name'
			// 	}
			// },
			// {
			{
				$match: {
					$and: [
						{
							$or: [
								{ name: { $regex: name_category, $options: 'i' } },
								{ 'services.name': { $regex: name_category, $options: 'i' } },
								{ inviteCode: { $regex: `${name_category}`, $options: 'i' } },
							],
						},
					],
				},
			},
			{
				$match: {
					$and: [
						{
							$or: [
								{ address: { $regex: address, $options: 'i' } },
								{ zipcode: { $regex: address, $options: 'i' } },
							],
						},
					],
				},
			},
		])
		.sort({ created_date: -1 })
		.exec(function (err, result) {
			if (err) {
				data.result = '';
				console.log(
					'BO LIST::::: Before LOGIN1::: ',
					JSON.stringify(data.result)
				);
				res.render('customer/service_provider/listing', data);
			} else {
				data.result = result;
				// result.forEach(element => {
				//console.log("data  :");
				//console.log(element);
				//console.log(element.services.name);
				// });
				//console.dir((result));
				// data.result = await data.result.filter((arr, index, self) => index === self.findIndex((t) => (t._id === arr._id && t.name === arr.name)))
				console.log(
					'BO LIST::::: Before LOGIN2::: ',
					JSON.stringify(data.result)
				);
				res.render('customer/service_provider/listing', data);
			}
		});
};

exports.verify = function (req, res) {
	data = {};
	console.log(req.session.msg);
	data.msg = '';
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	ServiceCategories.find({})
		.sort({ created_date: -1 })
		.exec(function (err, service_categories) {
			if (err) {
				data.service_categories = '';
				res.render('verifyCustomer.ejs', data);
			} else {
				data.service_categories = service_categories;
				//console.log("service_categories  :"+JSON.stringify(service_categories));
				res.render('verifyCustomer.ejs', data);
			}
		});
};
exports.support = function (req, res) {
	res.render('customer/support.ejs', {
		error: req.flash('error'),
		success: req.flash('success'),
		session: req.session,
		active: 'home',
		msg: '',
	});
};

exports.signup = function (req, res) {
	if (req.session.user) {
		res.redirect('/home');
	} else {
		res.render('home', {
			error: req.flash('error'),
			success: req.flash('success'),
			session: req.session,
		});
	}
};

exports.login = function (req, res) {
	if (req.session.user) {
		res.redirect('/home');
	} else {
		res.render('login', {
			error: req.flash('error'),
			success: req.flash('success'),
			session: req.session,
		});
	}
};

exports.logout = function (req, res) {
	if (req.session.user) {
		//req.session.destroy();
		delete req.session.user;
		res.redirect('/login');
	} else {
		res.render('login', {
			error: req.flash('error'),
			success: req.flash('success'),
			session: req.session,
		});
	}
};
exports.service_categories = function (req, res) {
	ServiceCategories.find({ status: 'active', typ: { $ne: 'Other' } })
		.sort({ created_date: -1 })
		.exec(function (err, service_categories) {
			if (err) {
				data.service_categories = '';
				res.json([]);
			} else {
				//console.log("service_categories  :"+JSON.stringify(service_categories));
				res.json(service_categories);
			}
		});
};
exports.loggedIn_service_categories = function (req, res) {
	ServiceCategories.find({ status: 'active', typ: { $ne: 'Other' } })
		.sort({ created_date: -1 })
		.exec(function (err, service_categories) {
			if (err) {
				data.service_categories = '';
				res.json([]);
			} else {
				res.json(service_categories);
				// ServiceCategories.find({'status' : 'active' , "name":req.session.userCustomerSession.business_category_name , "typ":"other"})
				// .sort({ 'created_date': -1 })
				// .exec(function (err, service_categories1) {
				// 	if (err) {
				// 		data.service_categories = "";
				// 		res.json([]);
				// 	} else {
				// 		console.log("service_categories  :"+(service_categories));
				// 		console.log("service_categories1  :"+(service_categories1));
				// 		res.json([... service_categories, ... service_categories1]);
				// 	}
				// });
				//console.log("service_categories  :"+JSON.stringify(service_categories));
				// res.json(service_categories);
			}
		});
};
exports.token = function (req, res) {
	var token = req.body.token;
	var data = req.session.userCustomerSession;
	Object.assign(data, { token: token });
	req.session.userCustomerSession = data;
	req.session.save();
	//console.log("tokennn  : set         :");
	console.log(req.session.userCustomerSession);
};

// Main Page routes ////
exports.userClosedPopup = async function (req, res) {
	let details = req.app.locals.userCustomerSession;
	let ManagepopupId = req.body.managePopupId;
	await Managepopup.findByIdAndUpdate(
		{ _id: ManagepopupId },
		{ $push: { userClosedPopup: details._id } }
	);
};
exports.userClosedWelcomeMsg = async function (req, res) {
	let details = req.app.locals.userCustomerSession;
	await home.update(
		{ _id: details._id },
		{
			$set: {
				welcomeMsg: true,
			},
		}
	);
};
// Customers routes
exports.newServices = async function (req, res) {
	let details = req.app.locals.userCustomerSession;
	let connectedISPsId = [];
	let connectedISPs = await connectedList.find({
		cusMail: details.mail,
		status: 'success',
	});
	connectedISPs = JSON.parse(JSON.stringify(connectedISPs));
	if (connectedISPs.length > 0) {
		connectedISPs.forEach(connectedId => {
			var ids = connectedId.ispId;
			connectedISPsId.push(ids);
		});
	}
	data = {};
	data.dateFormat = dateFormat;
	data.ispServices = await services
		.find({ service_proviver: connectedISPsId })
		.sort({ $natural: -1 });
	// data.services = await services.find({ispEmail : details.mail, status: "Upcoming"}).sort({$natural:-1});
	//data.msg = req.body.msg;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	res.render('../views/customer/main/customer/new_services.ejs', data);
};
exports.customerNewConnections = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	data = {};
	data.dateFormat = dateFormat;
	data.connectedList = await connectedList
		.find({ cusId: details._id, status: ['pending', 'success'] })
		.sort({ $natural: -1 });
	//data.msg = req.body.msg;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	res.render('../views/customer/main/customer/new_connections.ejs', data);
};
exports.customerPayment = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	data = {};
	if (typeof stripeCustomerId != 'undefined') {
		var cardList = await stripe.customers.listSources(stripeCustomerId, {
			object: 'card',
			limit: 20,
		});
		cardList = JSON.parse(JSON.stringify(cardList));
		data.cardList = cardList.data;
	}
	data.dateFormat = dateFormat;
	data.appointments = await Appointment.find({
		mail: details.mail,
		status: 'Upcoming',
	}).sort({ $natural: -1 });
	//data.msg = req.body.msg;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	res.render('../views/customer/main/customer/new_payment.ejs', data);
};
exports.newAppointments = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	let expireNotification = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	data = {};
	data.dateFormat = dateFormat;
	data.appointments = await sendReminder
		.find({
			mail: details.mail,
			notificationType: 'Reminder',
			status: { $ne: 'inactive' },
			createdDate: { $gte: expireNotification },
		})
		.sort({ $natural: -1 });
	//data.msg = req.body.msg;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	res.render('../views/customer/main/customer/new_appointments.ejs', data);
};

// ISP routes
exports.upcomingAppointments = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	data = {};
	data.dateFormat = dateFormat;
	data.appointments = await Appointment.find({
		service_proviver: details._id,
		status: 'Upcoming',
	}).sort({ $natural: -1 });
	//data.msg = req.body.msg;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	res.render('../views/customer/main/isp/upcoming_appointments.ejs', data);
};
exports.newConnections = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	data = {};
	data.dateFormat = dateFormat;
	data.connectedList = await connectedList
		.find({
			$or: [{ ispId: details._id }, { cusId: details._id }],
			status: ['pending', 'success'],
			ispInvite: { $ne: true },
		})
		.sort({ $natural: -1 });
	//data.msg = req.body.msg;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	res.render('../views/customer/main/isp/new_connections.ejs', data);
};
exports.newPaymentsTips = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	data = {};
	data.dateFormat = dateFormat;
	data.appointments = await Appointment.find({
		service_proviver: details._id,
	}).sort({ $natural: -1 });
	//data.msg = req.body.msg;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	res.render('../views/customer/main/isp/new_payment.ejs', data);
};
exports.newBookedAppointments = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	data = {};
	data.dateFormat = dateFormat;
	data.appointments = await Appointment.find({
		service_proviver: details._id,
		status: ['Upcoming', 'Cancelled'],
	}).sort({ $natural: -1 });
	//data.msg = req.body.msg;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	res.render(
		'../views/customer/main/isp/booked_cancelled_appointments.ejs',
		data
	);
};
exports.ratings = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	data = {};
	data.dateFormat = dateFormat;
	data.appointments = await Appointment.find({
		service_proviver: details._id,
		status: 'Completed',
		rate: { $exists: true },
	}).sort({ $natural: -1 });
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	res.render('../views/customer/main/isp/ratings.ejs', data);
};
exports.acceptConnection = async function (req, res) {
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	let reminderData = [];
	let data = await connectedList.findOne({ _id: req.params.id });
	reminderData.push({
		ispId: data.ispId,
		notificationType: 'Connection',
		status: 'success',
		name: data.cusName,
		mail: data.cusMail,
		profile: data.cusProfile,
		phone: data.cusMobile,
		ispName: data.ispName,
		ispEmail: data.ispMail,
		ispProfile: data.IspProfileImage,
		created_date: day,
	});
	connectedList.update(
		{ _id: req.params.id },
		{
			$set: {
				status: 'success',
				createdDate: day,
				ispInvite: 'false',
			},
		},
		async function (err, updatedUser) {
			if (err) {
				return done(err);
			} else {
				await sendReminder.create(reminderData);
				req.flash('success', 'Connection accepted.');
				res.redirect(baseUrl + 'main');
			}
		}
	);
};
exports.denyConnection = async function (req, res) {
	connectedList.findOneAndRemove(
		{ _id: req.params.id },
		function (err, denyConnection) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'main');
			} else {
				req.flash('error', 'Connection denied.');
				res.redirect(baseUrl + 'main');
			}
		}
	);
};
exports.sendReminder = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	let reminder = [];
	reminder.push({
		appointmentId: req.body.id,
		ispName: details.name,
		cusMail: req.body.cusMail,
		name: req.body.name,
		profile: req.body.profile,
		title: req.body.title,
		start_date: req.body.start_date,
		utc_start: req.body.utc_start,
		utc_end: req.body.utc_end,
		amount: req.body.amount,
		remaining_payment: req.body.remaining_payment,
		type: 'BOreminder',
	});
	console.log('🚀 ~ file: home.js ~ line 2792 ~ reminder', reminder);
	let checkReminder = await paymentReminder.findOne({
		appointmentId: req.body.id,
		type: 'BOreminder',
	});
	if (checkReminder) {
		req.flash('error', 'Reminder already sent.');
		res.redirect(baseUrl + 'paymentHistory');
	} else {
		await paymentReminder
			.create(reminder)
			.then(data => {
				req.flash('success', 'Reminder sent.');
				res.redirect(baseUrl + 'paymentHistory');
			})
			.catch(err => {
				req.flash('error', 'Error sending reminder. Please try again later!');
				res.redirect(baseUrl + 'paymentHistory');
			});
	}
};

exports.unReadNotification = async function (req, res) {
	let data = {};
	try {
		let sessionDetails = req.app.locals.userCustomerSession;
		let userId = sessionDetails._id;
		let role_id = sessionDetails.role_id;
		var unReadNotification;
		if (role_id == 3) {
			unReadNotification = await sendReminder
				.find({
					status: { $ne: 'inactive' },
					$or: [
						{ service_proviver: sessionDetails._id },
						{ content_for: { $ne: 'Customer' } },
					],
				})
				.sort({ $natural: -1 })
				.limit(1);
		} else {
			unReadNotification = await sendReminder
				.find({
					status: { $ne: 'inactive' },
					$or: [
						{ mail: sessionDetails.mail },
						{ content_for: { $ne: 'Business Owner' } },
					],
				})
				.sort({ $natural: -1 })
				.limit(1);
		}
		unReadNotification = JSON.parse(JSON.stringify(unReadNotification));
		let userSeenNotification;
		if (unReadNotification.length > 0) {
			let unReadNotificationIds = unReadNotification[0].is_seen;
			let checkId = unReadNotificationIds.includes(userId);
			if (checkId) {
				userSeenNotification = 1;
			} else {
				userSeenNotification = 0;
			}
		} else {
			userSeenNotification = 0;
		}
		data.status = 'success';
		data.message = 'send count';
		data.response = userSeenNotification;
		return res.send(data);
	} catch (e) {
		data.status = 'success';
		data.message = 'send count';
		data.response = 0;
		return res.send(data);
	}
};
exports.unReadPaymentReminder = async function (req, res) {
	let data = {};
	try {
		let sessionDetails = req.app.locals.userCustomerSession;
		let userId = sessionDetails._id;
		let role_id = sessionDetails.role_id;
		var unReadPaymentReminder;
		if (role_id == 3) {
			unReadPaymentReminder = await paymentReminder
				.find({
					$or: [{ cusMail: sessionDetails.mail }, { ispId: userId }],
				})
				.sort({ $natural: -1 })
				.limit(1);
		} else {
			unReadPaymentReminder = await paymentReminder
				.find({ cusMail: sessionDetails.mail })
				.sort({ $natural: -1 })
				.limit(1);
		}
		unReadPaymentReminder = JSON.parse(JSON.stringify(unReadPaymentReminder));
		let userSeenPaymentReminder;
		if (unReadPaymentReminder.length > 0) {
			let unReadPaymentReminderIds = unReadPaymentReminder[0].is_seen;
			let checkId = unReadPaymentReminderIds.includes(userId);
			if (checkId) {
				userSeenPaymentReminder = 1;
			} else {
				userSeenPaymentReminder = 0;
			}
		} else {
			userSeenPaymentReminder = 1;
		}
		data.status = 'success';
		data.message = 'send count';
		data.response = userSeenPaymentReminder;
		return res.send(data);
	} catch (e) {
		data.status = 'success';
		data.message = 'send count';
		data.response = 0;
		return res.send(data);
	}
};

exports.privacyPolicy = function (req, res) {
	data = {};
	data.msg = '';
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');

	res.render('privacyPolicy.ejs', data);
};

exports.termsConditions = function (req, res) {
	data = {};
	data.msg = '';
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');

	res.render('termsConditions.ejs', data);
};
