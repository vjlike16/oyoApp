var ServiceCategories = require('../../models/admin/service_category');
var Customer = require('../../models/home');
var businessOwner = require('../../models/home');
var Appointment = require('../../models/customers/appointments');
var ispService = require('../../models/customers/service');
var businessHours = require('../../models/isp/businessHours');
var sendReminder = require('../../models/isp/sendReminder');
var paymentReminder = require('../../models/isp/paymentReminder');
var pastWorkImages = require('../../models/isp/past_work_image');
var Async = require('async');
var Email = require('../../../lib/email');
const { select } = require('underscore');
var mongoose = require('mongoose');
var moment = require('moment');
const { baseUrl } = require('../../../config/constants');
var notification = require('../../../lib/notificationLib');
var dateFormat = require('dateformat');
const service = require('../../models/customers/service');
const connected = require('../../models/customers/connectedList');
const axios = require('axios');
var google01 = require('googleapis');
var OAuth2 = google01.Auth.OAuth2Client;
var clientSecrets = require('../admin/token.json');
const customerNotes = require('../../models/customers/customerNotes');
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
var Connected_ISPs = [];
var newArray = [];

exports.connectedIspList = async function (req, res) {
	var cusId = req.app.locals.userCustomerSession._id;
	var cusMail = req.app.locals.userCustomerSession.mail;
	var connectedISPsId = [];
	Connected_ISPs = [];
	newArray = [];
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.name_category = '';
	data.address = '';
	data.inviteCode = '';
	data.dateFormat = dateFormat;
	var connectedISPs = await connected.find({
		cusMail: cusMail,
		ispMail: { $ne: cusMail },
		status: 'success',
	});
	connectedISPs = JSON.parse(JSON.stringify(connectedISPs));
	if (connectedISPs.length > 0) {
		connectedISPs.forEach(connectedId => {
			var ids = connectedId.ispId;
			connectedISPsId.push(ids);
		});
		var isp = await businessOwner
			.find({
				_id: connectedISPsId,
				role_id: 3,
				verify: 1,
				status: 'active',
				makePagePublic: { $ne: 'false' },
				subscriptionValidity: { $ne: 'false' },
				business_category: { $exists: true },
				gender: { $ne: ' ' },
			})
			.sort({ name: 1 });
		isp = JSON.parse(JSON.stringify(isp));
		for (const element of isp) {
			let lat = '',
				lng = '';
			if (element.location.coordinates.length > 0) {
				if (element.location.coordinates[0] != null) {
					lat = element.location.coordinates[0].lat;
					lng = element.location.coordinates[0].lng;
				} else {
					lat = 'no';
					lng = 'no';
				}
			} else {
				lat = 'no';
				lng = 'no';
			}
			let connectedListData = await connected.findOne({
				cusId: cusId,
				ispId: element._id,
			});
			connectedListData = JSON.parse(JSON.stringify(connectedListData));
			let lastTrasaction = await Appointment.find({
				mail: cusMail,
				service_proviver: element._id,
			})
				.sort({ $natural: -1 })
				.limit(1);
			lastTrasaction = JSON.parse(JSON.stringify(lastTrasaction));
			if (lastTrasaction.length != 1) {
				lastTrasaction = undefined;
			} else {
				lastTrasaction = lastTrasaction[0].created_date;
			}
			//console.log("connectedListData",connectedListData);
			if (element.business_category && element.business_name) {
				newArray.push({
					_id: element._id,
					business_category: element.business_category_name,
					business_category_id: element.business_category,
					business_name: element.business_name,
					address: element.address,
					name: element.name,
					connect: 'yes',
					status: 'success',
					order: 1,
					profileImage: element.profileImage,
					avgRating: element.avgRating,
					connectedSince: connectedListData.createdDate,
					lastTrasaction: lastTrasaction,
					lat: lat,
					lng: lng,
					latlng: [{ lat: lat, lng: lng }],
				});
			}
		}
		let ispNotConnected = await businessOwner
			.find({
				_id: { $nin: connectedISPsId },
				bankDetails: { $exists: true },
				mail: { $ne: cusMail },
				role_id: 3,
				verify: 1,
				status: 'active',
				makePagePublic: { $ne: 'false' },
				subscriptionValidity: { $ne: 'false' },
				business_category: { $exists: true },
				gender: { $ne: ' ' },
			})
			.sort({ name: 1 });
		let ele = JSON.parse(JSON.stringify(ispNotConnected));
		// for( let i=0; i<ele.length; i++){
		for (const element of ele) {
			let lat = '',
				lng = '';
			if (element.location.coordinates.length > 0) {
				if (element.location.coordinates[0] != null) {
					lat = element.location.coordinates[0].lat;
					lng = element.location.coordinates[0].lng;
				} else {
					lat = 'no';
					lng = 'no';
				}
			} else {
				lat = 'no';
				lng = 'no';
			}
			let lastTrasaction = await Appointment.find({
				mail: cusMail,
				service_proviver: element._id,
			})
				.sort({ $natural: -1 })
				.limit(1);
			lastTrasaction = JSON.parse(JSON.stringify(lastTrasaction));
			if (lastTrasaction.length != 1) {
				lastTrasaction = undefined;
			} else {
				lastTrasaction = lastTrasaction[0].created_date;
			}
			if (element.business_category && element.business_name) {
				newArray.push({
					_id: element._id,
					business_category: element.business_category_name,
					business_category_id: element.business_category,
					business_name: element.business_name,
					address: element.address,
					name: element.name,
					connect: 'yes',
					status: 'pending',
					order: 2,
					profileImage: element.profileImage,
					avgRating: element.avgRating,
					lastTrasaction: lastTrasaction,
					lat: lat,
					lng: lng,
					latlng: [{ lat: lat, lng: lng }],
				});
			}
		}
	} else {
		let ispNotConnected = await businessOwner
			.find({
				mail: { $ne: cusMail },
				role_id: 3,
				verify: 1,
				status: 'active',
				makePagePublic: { $ne: 'false' },
				subscriptionValidity: { $ne: 'false' },
				bankDetails: { $exists: true },
			})
			.sort({ name: 1 });
		ispNotConnected = JSON.parse(JSON.stringify(ispNotConnected));
		ispNotConnected.forEach(async element => {
			let lat = '',
				lng = '';
			if (element.location.coordinates.length > 0) {
				if (element.location.coordinates[0] != null) {
					lat = element.location.coordinates[0].lat;
					lng = element.location.coordinates[0].lng;
				} else {
					lat = 'no';
					lng = 'no';
				}
			} else {
				lat = 'no';
				lng = 'no';
			}
			if (element.business_category && element.business_name) {
				newArray.push({
					_id: element._id,
					business_category: element.business_category_name,
					business_category_id: element.business_category,
					business_name: element.business_name,
					address: element.address,
					name: element.name,
					connect: 'yes',
					status: 'pending',
					order: 2,
					profileImage: element.profileImage,
					avgRating: element.avgRating,
					lat: lat,
					lng: lng,
					latlng: [{ lat: lat, lng: lng }],
				});
			}
		});
	}

	data.result = newArray;
	console.log('BO LIST::::: AFter LOGIN::: ', JSON.stringify(data.result));
	//For aplaphabetic pagination
	if (req.query.filterby != undefined) {
		data.result = await data.result.filter(
			element => element.name.toLowerCase().charAt(0) == req.query.filterby
		);

		await data.result.sort(function (a, b) {
			a = a.name.toLowerCase();
			b = b.name.toLowerCase();
			return a < b ? -1 : a > b ? 1 : 0;
		});

		await data.result.sort(function (a, b) {
			return a.connect == 'yes' && a.status == 'success';
		});

		data.result.reverse();
	}
	data.urlQuery = req.query.filterby == undefined ? 'all' : req.query.filterby;
	res.render('customer/appointments/connected_Isp_List.ejs', data);
};

exports.allIspList = async function (req, res) {
	var cusId = req.app.locals.userCustomerSession._id;
	var cusMail = req.app.locals.userCustomerSession.mail;
	var connectedISPsId = [];
	Connected_ISPs = [];
	newArray = [];
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.name_category = '';
	data.address = '';
	data.inviteCode = '';
	data.dateFormat = dateFormat;
	var connectedISPs = await connected.find({
		cusMail: cusMail,
		ispMail: { $ne: cusMail },
		status: 'success',
	});
	connectedISPs = JSON.parse(JSON.stringify(connectedISPs));
	if (connectedISPs.length > 0) {
		connectedISPs.forEach(connectedId => {
			var ids = connectedId.ispId;
			connectedISPsId.push(ids);
		});
		let ispNotConnected = await businessOwner
			.find({
				_id: { $nin: connectedISPsId },
				bankDetails: { $exists: true },
				mail: { $ne: cusMail },
				role_id: 3,
				verify: 1,
				status: 'active',
				makePagePublic: { $ne: 'false' },
			})
			.sort({ name: 1 });
		let ele = JSON.parse(JSON.stringify(ispNotConnected));
		// for( let i=0; i<ele.length; i++){
		for (const element of ele) {
			let lat = '',
				lng = '';
			if (element.location.coordinates.length > 0) {
				if (element.location.coordinates[0] != null) {
					lat = element.location.coordinates[0].lat;
					lng = element.location.coordinates[0].lng;
				} else {
					lat = 'no';
					lng = 'no';
				}
			} else {
				lat = 'no';
				lng = 'no';
			}
			let lastTrasaction = await Appointment.find({
				mail: cusMail,
				service_proviver: element._id,
			})
				.sort({ $natural: -1 })
				.limit(1);
			lastTrasaction = JSON.parse(JSON.stringify(lastTrasaction));
			if (lastTrasaction.length != 1) {
				lastTrasaction = undefined;
			} else {
				lastTrasaction = lastTrasaction[0].created_date;
			}
			newArray.push({
				_id: element._id,
				business_category: element.business_category_name,
				business_category_id: element.business_category,
				business_name: element.business_name,
				address: element.address,
				name: element.name,
				connect: 'yes',
				status: 'pending',
				order: 2,
				profileImage: element.profileImage,
				avgRating: element.avgRating,
				lastTrasaction: lastTrasaction,
				lat: lat,
				lng: lng,
				latlng: [{ lat: lat, lng: lng }],
			});
		}
	} else {
		let ispNotConnected = await businessOwner
			.find({
				mail: { $ne: cusMail },
				role_id: 3,
				verify: 1,
				status: 'active',
				makePagePublic: { $ne: 'false' },
				bankDetails: { $exists: true },
			})
			.sort({ name: 1 });
		ispNotConnected = JSON.parse(JSON.stringify(ispNotConnected));
		ispNotConnected.forEach(async element => {
			let lat = '',
				lng = '';
			if (element.location.coordinates.length > 0) {
				if (element.location.coordinates[0] != null) {
					lat = element.location.coordinates[0].lat;
					lng = element.location.coordinates[0].lng;
				} else {
					lat = 'no';
					lng = 'no';
				}
			} else {
				lat = 'no';
				lng = 'no';
			}
			newArray.push({
				_id: element._id,
				business_category: element.business_category_name,
				business_category_id: element.business_category,
				business_name: element.business_name,
				address: element.address,
				name: element.name,
				connect: 'yes',
				status: 'pending',
				order: 2,
				profileImage: element.profileImage,
				avgRating: element.avgRating,
				lat: lat,
				lng: lng,
				latlng: [{ lat: lat, lng: lng }],
			});
		});
	}
	newArray.sort(function (a, b) {
		return a.order - b.order;
	});
	data.result = newArray;
	res.render('customer/appointments/all_Isp_List.ejs', data);
};

exports.google_map = function (req, res) {
	var data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.msg = '';
	data.name_category = '';
	data.address = '';
	var Userlat, Userlng;
	if (req.app.locals.userCustomerSession.location.coordinates[0]) {
		Userlat = req.app.locals.userCustomerSession.location.coordinates[0].lat;
		Userlng = req.app.locals.userCustomerSession.location.coordinates[0].lng;
		data.Userlat = Userlat;
		data.Userlng = Userlng;
	} else {
		data.Userlat = 28.6627934;
		data.Userlng = 77.1867755;
	}
	//console.log("lat lng of map ,, " , lat ,"---" , lng);
	console.log('data.Userlat', data.Userlat, 'data.Userlng', data.Userlng);

	var tasks = [
		function (callback) {
			var statusByStatus = ['active', 'inactive'];
			Customer.find({
				role_id: '3',
				status: { $in: statusByStatus },
			})
				.populate('business_category', select[('name', '_id')])
				.populate('subscription', 'plan_name')
				.exec(function (err, result) {
					callback();
				});
		},
		function (callback) {
			ServiceCategories.find({})
				.sort()
				.exec(function (err, service_categories) {
					if (err) {
						data.service_categories = '';
						callback();
					} else {
						data.service_categories = service_categories;
						callback();
					}
				});
		},
	];
	Async.series(tasks, function (err) {
		//series: for step by step and parallel: for suffle
		if (err) {
			data.service_categories = '';
			res.render('customer/loggedIn-service-providers/connected-isp-map', data);
		} else {
			data.result = newArray;
			res.render('customer/loggedIn-service-providers/connected-isp-map', data);
		}
	});
};

exports.connectedIspDetail = async function (req, res) {
	var data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	var finalTimeZone =
		req.session.deviceTimeZone ||
		req.app.locals.userCustomerSession.deviceTimeZone ||
		'America/Chicago';
	console.log(
		'finalTimeZone----------------------------------->',
		finalTimeZone
	);
	var email = req.app.locals.userCustomerSession.mail;
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	var cusId = req.app.locals.userCustomerSession._id;
	var ispId = req.params.id;
	let lastTrasaction = await Appointment.find({
		mail: email,
		service_proviver: ispId,
	})
		.sort({ $natural: -1 })
		.limit(1);
	lastTrasaction = JSON.parse(JSON.stringify(lastTrasaction));
	if (lastTrasaction.length != 1) {
		lastTrasaction = undefined;
	} else {
		lastTrasaction = lastTrasaction[0].created_date;
	}
	var connectedIsp = await connected.find({ cusId: cusId, ispId: ispId });
	var notes = require('../../models/customers/customerNotes');
	let myNotes;
	let myNotesUpdate;
	var customersNotes = await notes.findOne({ cusId: cusId, ispId: ispId });
	customersNotes = JSON.parse(JSON.stringify(customersNotes));
	if (customersNotes) {
		myNotes = customersNotes;
		myNotesUpdate = customersNotes.customerNotesUpdate;
	}
	connectedIsp = JSON.parse(JSON.stringify(connectedIsp));
	let checkStatus;
	let connectedSince;
	let connectedId;
	let isTodayOff;
	if (connectedIsp.length != 1) {
		checkStatus = 'Not sent';
	} else {
		checkStatus = connectedIsp[0].status;
		connectedSince = connectedIsp[0].createdDate;
		connectedId = connectedIsp[0]._id;
		//myNotes = connectedIsp[0].customerNotes;
		//myNotesUpdate = connectedIsp[0].customerNotesUpdate;
	}
	let ispBusinessHours = await businessHours.findOne({ ispId: ispId });
	ispBusinessHours = JSON.parse(JSON.stringify(ispBusinessHours));
	var dateDataArr = [];
	if (ispBusinessHours != null) {
		let ispTimeZone = ispBusinessHours.timeZone;
		console.log(
			'ispTimeZone------------------------------------->',
			ispTimeZone
		);
		var dateData = ispBusinessHours.days;
		dateData.forEach((timeData, index) => {
			var timeDataWeek;
			if (index == 0) {
				timeDataWeek = 'Monday';
			} else if (index == 1) {
				timeDataWeek = 'Tuesday';
			} else if (index == 2) {
				timeDataWeek = 'Wednesday';
			} else if (index == 3) {
				timeDataWeek = 'Thrusday';
			} else if (index == 4) {
				timeDataWeek = 'Friday';
			} else if (index == 5) {
				timeDataWeek = 'Saturday';
			} else {
				timeDataWeek = 'Sunday';
			}
			let startTime;
			let endTime;
			if (timeData.endTime != '') {
				let startTimeTz = moment(timeData.startTime, 'hh:mm A').format('HH:mm');
				var startDateWithTime = moment(
					'2022-03-28 ' + startTimeTz,
					'YYYY-MM-DD HH:mm'
				).format('YYYY-MM-DD HH:mm');
				var startdateTz = moment.tz(startDateWithTime, ispTimeZone);
				startTime = startdateTz.clone().tz(finalTimeZone).format('hh:mm A');

				let endTimeTz = moment(timeData.endTime, 'hh:mm A').format('HH:mm');
				var endDateWithTime = moment(
					'2022-03-28 ' + endTimeTz,
					'YYYY-MM-DD HH:mm'
				).format('YYYY-MM-DD HH:mm');
				var enddateTz = moment.tz(endDateWithTime, ispTimeZone);
				endTime = enddateTz.clone().tz(finalTimeZone).format('hh:mm A');
			} else {
				startTime = 'Closed';
				endTime = 'Closed';
			}
			dateDataArr.push({
				index: index,
				day: timeDataWeek,
				startTime: startTime,
				endTime: endTime,
			});
		});
		// console.log("dateDataArr",dateDataArr);
		// }
		// if(ispBusinessHours != null){
		var todayDate = new Date();
		var weekDay = todayDate.getDay();
		var todayDay;
		todayDate = todayDate.toISOString();
		todayDate = todayDate.split('T')[0];
		// Date Convert start
		const momentTz = require('moment-timezone');
		var dateTz = momentTz.tz(todayDate, 'GMT');
		todayDate = dateTz.clone().tz(finalTimeZone).format('YYYY-MM-DD');
		// Date Convet finish
		if (weekDay == 0) {
			todayDay = 'sunday';
		} else if (weekDay == 1) {
			todayDay = 'monday';
		} else if (weekDay == 2) {
			todayDay = 'tuesday';
		} else if (weekDay == 3) {
			todayDay = 'wednesday';
		} else if (weekDay == 4) {
			todayDay = 'thrusday';
		} else if (weekDay == 5) {
			todayDay = 'friday';
		} else {
			todayDay = 'saturday';
		}
		var todayEndTime = todayDay + 'EndTime';
		var todayStartTime = todayDay + 'StartTime';
		todayEndTime = ispBusinessHours[todayEndTime];
		todayStartTime = ispBusinessHours[todayStartTime];

		var currentTime = new Date().toISOString();
		currentTime = currentTime.split('.')[0];
		// Time Convert start
		var timeTz = momentTz.tz(currentTime, 'GMT');
		currentTime = timeTz.clone().tz(finalTimeZone).format();
		currentTime = currentTime.split('+')[0];
		var currentDate = currentTime.split('T')[0];
		// console.log("currentDate",currentDate);
		// Time Convet finish

		if (ispBusinessHours.offDate != undefined) {
			var offDate = ispBusinessHours.offDate;
			offDate = offDate.split('T')[0];
			if (offDate == todayDate) {
				isTodayOff = 'true';
			} else {
				if (todayEndTime == 'Closed') {
					isTodayOff = 'true';
				} else {
					let startTime = momentTz(todayStartTime, 'hh:mm A').format('HH:mm');
					startTime = moment(
						currentDate + ' ' + startTime,
						'YYYY-MM-DD HH:mm'
					).format('YYYY-MM-DD HH:mm');
					startTime = moment.tz(startTime, ispTimeZone);
					startTime = startTime.clone().tz(finalTimeZone).format();
					startTime = startTime.split('+')[0];

					let endTime = momentTz(todayEndTime, 'hh:mm A').format('HH:mm');
					endTime = moment(
						currentDate + ' ' + endTime,
						'YYYY-MM-DD HH:mm'
					).format('YYYY-MM-DD HH:mm');
					endTime = moment.tz(endTime, ispTimeZone);
					endTime = endTime.clone().tz(finalTimeZone).format();
					endTime = endTime.split('+')[0];

					console.log('startTime', startTime);
					console.log('currentTime', currentTime);
					console.log('endTime', endTime);
					if (currentTime >= startTime && currentTime < endTime) {
						isTodayOff = 'false';
					} else {
						isTodayOff = 'true';
					}
					let startTimeTz = moment(todayEndTime, 'hh:mm A').format('HH:mm');
					let startDateWithTime = moment(
						'2022-03-28 ' + startTimeTz,
						'YYYY-MM-DD HH:mm'
					).format('YYYY-MM-DD HH:mm');
					let startdateTz = moment.tz(startDateWithTime, ispTimeZone);
					todayEndTime = startdateTz
						.clone()
						.tz(finalTimeZone)
						.format('hh:mm A');
				}
			}
		}
	}
	data.dateDataArr = dateDataArr;
	data.isTodayOff = isTodayOff;
	data.todayEndTime = todayEndTime;
	data.dateFormat = dateFormat;
	data.checkStatus = checkStatus;
	data.lastTrasaction = lastTrasaction;
	data.connectedSince = connectedSince;
	data.connectedId = connectedId;
	data.myNotes = myNotes;
	data.myNotesUpdate = myNotesUpdate;
	data.userId = req.params.id;
	data.businessHours = ispBusinessHours;
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.msg = '';
	var id = req.params.id;
	var isp = await businessOwner
		.find({ role_id: '3', verify: '1', status: 'active' })
		.sort({ name: 1 });
	isp = JSON.parse(JSON.stringify(isp));
	var a = isp.find(res => res._id == id);
	data.appointments = await Appointment.find({
		ispEmail: a.mail,
		status: 'Completed',
		rate: { $exists: true },
	}).sort({ $natural: -1 });
	data.ratingAppointments = await Appointment.find({
		ispEmail: a.mail,
		status: 'Completed',
		rate: { $exists: true },
	})
		.sort({ $natural: -1 })
		.limit(2);
	data.cusHistory = await Appointment.find({
		mail: email,
		ispEmail: a.mail,
	}).sort({ $natural: -1 });
	data.cusHistoryLimit = await Appointment.find({
		mail: email,
		ispEmail: a.mail,
	})
		.sort({ $natural: -1 })
		.limit(3);
	data.pastWorkImages = await pastWorkImages.find({ userId: id });
	data.avgRating = a.avgRating;
	var business_category_name = await ServiceCategories.find({
		_id: a.business_category,
	});
	business_category_name = JSON.parse(JSON.stringify(business_category_name));
	business_category_name = business_category_name[0].name;
	service
		.find({ service_proviver: a._id, business_category: a.business_category })
		.exec(async function (err, service) {
			if (err) {
				data.services = '';
			} else {
				data.services = service;
				if (typeof stripeCustomerId != 'undefined') {
					var cardList = await stripe.customers.listSources(stripeCustomerId, {
						object: 'card',
						limit: 20,
					});
					cardList = JSON.parse(JSON.stringify(cardList));
					data.cardList = cardList.data;
				}
				if (isp.length == 0) {
					data.result = '';
					res.render('customer/appointments/connected_Isp_Detail.ejs', data);
				} else {
					data.result = a;
					data.business_category_name = business_category_name;
					res.render('customer/appointments/connected_Isp_Detail.ejs', data);
				}
			}
		});
};

exports.customSearch = async function (req, res) {
	let status;
	let connectedISPsId = [];
	let cusMail = req.app.locals.userCustomerSession.mail;
	let inviteCode = req.app.locals.userCustomerSession.inviteCode;
	let connectedISPs = await connected.find({
		cusMail: cusMail,
		status: 'success',
	});
	connectedISPs = JSON.parse(JSON.stringify(connectedISPs));
	if (connectedISPs.length > 0) {
		connectedISPs.forEach(connectedId => {
			var ids = connectedId.ispId;
			connectedISPsId.push(ids);
		});
	} else {
		status = 'pending';
	}
	newArray = [];
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	var name_category = req.body.name_category;
	var address = req.body.location;
	data.name_category = name_category;
	data.address = address;
	var tasks = [
		function (callback) {
			Customer.aggregate([
				{
					$match: {
						$and: [
							{ role_id: 3 },
							{ verify: 1 },
							{ status: 'active' },
							{ inviteCode: { $ne: inviteCode } },
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
					$match: {
						$and: [
							{
								$or: [
									{ name: { $regex: `${name_category}`, $options: 'i' } },
									{
										'services.name': {
											$regex: `${name_category}`,
											$options: 'i',
										},
									},
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
						callback();
					} else {
						result.forEach(element => {
							let lat = '',
								lng = '';
							if (element.location.coordinates.length > 0) {
								if (element.location.coordinates[0] != null) {
									lat = element.location.coordinates[0].lat;
									lng = element.location.coordinates[0].lng;
								} else {
									lat = 'no';
									lng = 'no';
								}
							} else {
								lat = 'no';
								lng = 'no';
							}
							let ispId = element._id;
							ispId = JSON.stringify(ispId);
							ispId = JSON.parse(ispId);
							let checkId = connectedISPsId.includes(ispId);
							if (checkId) {
								status = 'success';
							} else {
								status = 'pending';
							}
							if (Connected_ISPs.indexOf(element._id.toString()) > -1) {
								newArray.push({
									_id: element._id,
									business_category: element.services.name,
									business_category_id: element.services._id,
									business_name: element.business_name,
									address: element.address,
									name: element.name,
									avgRating: element.avgRating,
									connect: 'yes',
									status: status,
									profileImage: element.profileImage,
									lat: lat,
									lng: lng,
									latlng: [{ lat: lat, lng: lng }],
								});
							} else {
								newArray.push({
									_id: element._id,
									business_category: element.services.name,
									business_category_id: element.services._id,
									business_name: element.business_name,
									address: element.address,
									name: element.name,
									avgRating: element.avgRating,
									connect: 'no',
									profileImage: element.profileImage,
									status: status,
									lat: lat,
									lng: lng,
									latlng: [{ lat: lat, lng: lng }],
								});
							}
						});
						callback();
					}
				});
		},
		function (callback) {
			ServiceCategories.find({ status: 'active' })
				.sort({ created_date: -1 })
				.exec(function (err, service_categories) {
					if (err) {
						data.service_categories = '';
						callback();
					} else {
						data.service_categories = service_categories;
						callback();
					}
				});
		},
	];
	Async.series(tasks, function (err) {
		//series: for step by step and parallel: for suffle
		newArray.sort((a, b) => a.name.localeCompare(b.name));
		data.result = newArray;
		// console.log("newArray",newArray);
		data.urlQuery =
			req.query.filterby == undefined ? 'all' : req.query.filterby;
		res.render('customer/appointments/connected_Isp_List.ejs', data);
	});
};
exports.customSearchForMap = async function (req, res) {
	let status;
	let connectedISPsId = [];
	let cusMail = req.app.locals.userCustomerSession.mail;
	let inviteCode = req.app.locals.userCustomerSession.inviteCode;
	let connectedISPs = await connected.find({
		cusMail: cusMail,
		status: 'success',
	});
	connectedISPs = JSON.parse(JSON.stringify(connectedISPs));
	if (connectedISPs.length > 0) {
		connectedISPs.forEach(connectedId => {
			var ids = connectedId.ispId;
			connectedISPsId.push(ids);
		});
	} else {
		status = 'pending';
	}
	newArray = [];
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	var name_category = req.body.name_category;
	var address = req.body.location;
	data.name_category = name_category;
	data.address = address;
	var Userlat = '';
	var Userlng = '';
	if (req.app.locals.userCustomerSession.location.coordinates[0]) {
		Userlat = req.app.locals.userCustomerSession.location.coordinates[0].lat;
		Userlng = req.app.locals.userCustomerSession.location.coordinates[0].lng;
	}
	data.Userlat = Userlat;
	data.Userlng = Userlng;
	var tasks = [
		function (callback) {
			Customer.aggregate([
				{
					$match: {
						$and: [
							{ role_id: 3 },
							{ verify: 1 },
							{ status: 'active' },
							{ inviteCode: { $ne: inviteCode } },
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
					$match: {
						$and: [
							{
								$or: [
									{ name: { $regex: `${name_category}`, $options: 'i' } },
									{
										'services.name': {
											$regex: `${name_category}`,
											$options: 'i',
										},
									},
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
						callback();
					} else {
						result.forEach(element => {
							let lat = '',
								lng = '';
							if (element.location.coordinates.length > 0) {
								if (element.location.coordinates[0] != null) {
									lat = element.location.coordinates[0].lat;
									lng = element.location.coordinates[0].lng;
								} else {
									lat = 'no';
									lng = 'no';
								}
							} else {
								lat = 'no';
								lng = 'no';
							}
							let ispId = element._id;
							ispId = JSON.stringify(ispId);
							ispId = JSON.parse(ispId);
							let checkId = connectedISPsId.includes(ispId);
							if (checkId) {
								status = 'success';
							} else {
								status = 'pending';
							}
							if (Connected_ISPs.indexOf(element._id.toString()) > -1) {
								newArray.push({
									_id: element._id,
									business_category: element.services.name,
									business_category_id: element.services._id,
									business_name: element.business_name,
									address: element.address,
									name: element.name,
									avgRating: element.avgRating,
									connect: 'yes',
									status: status,
									profileImage: element.profileImage,
									lat: lat,
									lng: lng,
									latlng: [{ lat: lat, lng: lng }],
								});
							} else {
								newArray.push({
									_id: element._id,
									business_category: element.services.name,
									business_category_id: element.services._id,
									business_name: element.business_name,
									address: element.address,
									name: element.name,
									avgRating: element.avgRating,
									connect: 'no',
									profileImage: element.profileImage,
									status: status,
									lat: lat,
									lng: lng,
									latlng: [{ lat: lat, lng: lng }],
								});
							}
						});
						callback();
					}
				});
		},
		function (callback) {
			ServiceCategories.find({ status: 'active' })
				.sort({ created_date: -1 })
				.exec(function (err, service_categories) {
					if (err) {
						data.service_categories = '';
						callback();
					} else {
						data.service_categories = service_categories;
						callback();
					}
				});
		},
	];
	Async.series(tasks, function (err) {
		//series: for step by step and parallel: for suffle
		//newArray.sort((a, b) => a.name.localeCompare(b.name));
		data.result = newArray;
		// console.log("newArray",newArray);
		res.render('customer/loggedIn-service-providers/connected-isp-map', data);
	});
};

exports.connect_with_isp = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	var cusId = details._id;
	var cusName = details.name;
	var cusMail = details.mail;
	var cusProfile = details.profileImage;
	var cusBirthday = details.birthdate;
	var lastTrasaction = details.last_transaction;
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');

	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	var isp_id = req.params.id;

	var checkConnectedIsp = await connected.find({ cusId: cusId, ispId: isp_id });
	checkConnectedIsp = JSON.parse(JSON.stringify(checkConnectedIsp));
	let status;
	if (checkConnectedIsp.length != 1) {
		status = 'Not sent';
	} else {
		status = checkConnectedIsp[0].status;
	}
	if (status == 'success') {
		console.log('Customer already connected to business owner.');
		req.flash('error', 'Customer already connected to business owner.');
		res.redirect(baseUrl + `connectedIspDetail/${isp_id}`);
	} else if (status == 'pending') {
		console.log('You have already send the connection request.');
		req.flash('error', 'You have already send the connection request.');
		res.redirect(baseUrl + `connectedIspDetail/${isp_id}`);
	} else {
		var connectedList = [];
		await businessOwner
			.findOne({ _id: isp_id })
			.then(ispData => {
				ispData = JSON.parse(JSON.stringify(ispData));
				var ispId = ispData._id;
				var ispName = ispData.name;
				var ispMail = ispData.mail;
				var ispProfile = ispData.profileImage;
				connectedList.push({
					status: 'pending',
					ispId: ispId,
					ispName: ispName,
					ispMail: ispMail,
					IspProfileImage: ispProfile,
					cusId: cusId,
					cusName: cusName,
					cusMail: cusMail,
					cusProfile: cusProfile,
					cusBirthday: cusBirthday,
					cusAddress: details.address,
					cusMobile: details.mobile,
					social_provider: details.social_provider,
					notificationType: 'Connection',
					ispEmail: ispMail,
					ispProfile: ispProfile,
					name: cusName,
					mail: cusMail,
					profile: cusProfile,
					phone: details.mobile,
					created_date: day,
				});
			})
			.catch(err => {
				res.send(err);
			});
		await connected.create(connectedList);
		await sendReminder.create(connectedList);
		console.log('Successfully send request to business owner.');
		req.flash('success', 'Successfully send request to business owner.');
		res.redirect(baseUrl + `connectedIspDetail/${isp_id}`);
	}
};
exports.remove = function (req, res) {
	var details = req.app.locals.userCustomerSession;
	var cus_id = details._id;
	var isp_id = req.params.id;

	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	connected.findOneAndRemove(
		{ ispId: isp_id, cusId: cus_id },
		function (err, removeConnection) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'main');
			} else {
				req.flash(
					'success',
					'Business owner successfully removed from the customer.'
				);
				res.redirect(baseUrl + `connectedIspDetail/${isp_id}`);
			}
		}
	);
};
exports.editAppointment = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	var date = req.body.date1;

	var time = req.body.time1;
	var finalTimeZone = req.body.timezone;
	console.log('Check Case 1 :', finalTimeZone);
	// var title = req.body.title1;
	var date_time = date + '/' + time;
	var utc_date = req.body.utc_date1;
	var appointmentId = req.body.appointmentId;

	var result = await Appointment.findOne({ _id: appointmentId });
	var title = result.title;
	var serviceProvider = result.service_proviver;

	var data = await Customer.find({ _id: serviceProvider });
	data = data[0]._doc;
	var ispEmail = data.mail;
	var ispPhone = data.mobile;
	var ispName = data.business_name;

	var services_data = await ispService.find({
		service_proviver: serviceProvider,
		name: title,
	});
	var duration_minutes = parseInt(services_data[0]._doc.minutes);
	var duration = duration_minutes;
	duration = duration.toString();
	let utc_time = moment.utc(time, 'hh:mm A').format('HH:mm');
	let end_time = moment.utc(time, 'hh:mm A').add(duration, 'm').format('HH:mm');
	let end_date = date + 'T' + end_time;
	let calendar_start_date = moment.utc(time, 'hh:mm A').format('HH:mm:ss');
	calendar_start_date = date + 'T' + calendar_start_date;
	let calendar_end_date = moment.utc(end_time, 'hh:mm A').format('HH:mm:ss');
	calendar_end_date = date + 'T' + calendar_end_date;
	// IST Time Convert start
	console.log('Check Case 111 :', date, utc_time);
	var dateWithTime = moment(date + ' ' + utc_time).format('YYYY-MM-DD HH:mm');
	console.log('Check Case 1 :', dateWithTime);
	var dateTz = moment.tz(dateWithTime, finalTimeZone);
	var utc_start = dateTz.clone().tz('GMT').format();

	var endDateWithTime = moment(date + ' ' + end_time).format(
		'YYYY-MM-DD HH:mm'
	);
	var dateTzz = moment.tz(endDateWithTime, finalTimeZone);
	var utc_end = dateTzz.clone().tz('GMT').format();
	console.log('utc_start', utc_start);
	console.log('utc_end', utc_end);
	// IST Time Convet finish

	let day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	let outlookEvent = 'false';
	let googleEvent = 'false';
	let outlookEventId = result.outlookEventId;
	if (req.session.outlookLogin == 'True') {
		outlookEvent = 'true';
		const accessToken = req.session.access_token;
		const apiUrl = 'https://graph.microsoft.com/v1.0/me';
		const body = {
			subject: `${title}`,
			start: {
				dateTime: `${calendar_start_date}`,
				timeZone: `${finalTimeZone}`,
			},
			end: {
				dateTime: `${calendar_end_date}`,
				timeZone: `${finalTimeZone}`,
			},
		};
		axios({
			method: 'PATCH',
			url: `${apiUrl}/events/${outlookEventId}`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			data: body,
		}).then(function (response) {
			// console.log("response",response);
		});
	}
	if (req.session.googleLogin == 'True') {
		googleEvent = 'true';
		var token = req.session.googleToken;
		oauth2Client.setCredentials(token);
		const { google } = require('googleapis');
		const calendar = google.calendar({ version: 'v3', oauth2Client });

		var event = {
			summary: `${title}`,
			start: {
				dateTime: `${calendar_start_date}`,
				timeZone: `${finalTimeZone}`,
			},
			end: {
				dateTime: `${calendar_end_date}`,
				timeZone: `${finalTimeZone}`,
			},
			reminders: {
				useDefault: false,
				overrides: [
					{ method: 'email', minutes: 24 * 60 },
					{ method: 'popup', minutes: 10 },
				],
			},
		};
		calendar.events.update(
			{
				auth: oauth2Client,
				calendarId: 'primary',
				eventId: result.googleEventId,
				resource: event,
			},
			async function (err, updateEvent) {
				if (err) {
					console.log(
						'There was an error contacting the Calendar service: ' + err
					);
				}
				// console.log("updateEvent",updateEvent);
			}
		);
	}
	if (result.ispOutlookEvent) {
		const accessToken = result.ispOutlookToken.access_token;
		console.log('IspAccessToken', accessToken);
		var ispOutlookEventId = result.ispOutlookEventId;
		const apiUrlIsp = 'https://graph.microsoft.com/v1.0/me';
		const bodyIsp = {
			subject: `${title}`,
			start: {
				dateTime: `${calendar_start_date}`,
				timeZone: `${finalTimeZone}`,
			},
			end: {
				dateTime: `${calendar_end_date}`,
				timeZone: `${finalTimeZone}`,
			},
		};
		axios({
			method: 'PATCH',
			url: `${apiUrlIsp}/events/${ispOutlookEventId}`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			data: bodyIsp,
		}).then(function (response) {
			// console.log("response",response);
		});
	}
	if (result.ispGoogleEvent) {
		var tokenIsp = result.ispGoogleToken;
		oauth2Client.setCredentials(tokenIsp);
		const { google } = require('googleapis');
		const calendar = google.calendar({ version: 'v3', oauth2Client });

		var eventIsp = {
			summary: `${title}`,
			start: {
				dateTime: `${calendar_start_date}`,
				timeZone: `${finalTimeZone}`,
			},
			end: {
				dateTime: `${calendar_end_date}`,
				timeZone: `${finalTimeZone}`,
			},
			reminders: {
				useDefault: false,
				overrides: [
					{ method: 'email', minutes: 24 * 60 },
					{ method: 'popup', minutes: 10 },
				],
			},
		};
		calendar.events.update(
			{
				auth: oauth2Client,
				calendarId: 'primary',
				eventId: result.ispGoogleEventId,
				resource: eventIsp,
			},
			async function (err, updateEvent) {
				if (err) {
					console.log(
						'There was an error contacting the Calendar service: ' + err
					);
				}
				// console.log("updateEvent",updateEvent);
			}
		);
	}
	await Appointment.update(
		{ _id: appointmentId },
		{
			$set: {
				utc_date: utc_date,
				start_date: date,
				start_time: time,
				end_date: end_date,
				utc_start: utc_start,
				utc_end: utc_end,
				updated_date: day,
				outlookEvent: outlookEvent,
				googleEvent: googleEvent,
			},
		}
	).then(update => {
		var content = {
			name: details.name,
			email: details.mail,
			subject: 'OYO App-Appointment Details',
			templatefoldername: 'appointment',
			id: details._id,
			token: details.active_hash,
			date: date_time,
			title: title,
			ispName: ispName,
			ispEmail: ispEmail,
			ispPhone: ispPhone,
		};
		Email.send_email(content);
		req.flash('success', 'Appointment updated!');
		res.redirect('/appointments');
	});
};
exports.IspEditAppointment = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	var date = req.body.date;
	var time = req.body.time;
	var appointmentId = req.body.IspappointmentId;

	var result = await Appointment.findOne({ _id: appointmentId });
	var title = result.title;
	var serviceProvider = result.service_proviver;

	var data = await Customer.find({ _id: serviceProvider });
	data = data[0]._doc;
	var ispEmail = data.mail;
	var ispPhone = data.mobile;
	var ispName = data.business_name;

	var services_data = await ispService.find({
		service_proviver: serviceProvider,
		name: title,
	});
	var duration_hours = parseInt(services_data[0]._doc.hours);
	var duration_minutes = parseInt(services_data[0]._doc.minutes);
	var duration = duration_hours * 60 + duration_minutes;
	duration = duration.toString();
	let end_time = moment.utc(time, 'hh:mm A').add(duration, 'm').format('HH:mm');
	let utc_time = moment.utc(time, 'hh:mm A').format('HH:mm');
	let end_date = date + 'T' + end_time;
	let utc_date = date + 'T' + utc_time;
	var date_time = date + '/' + time;

	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');

	await Appointment.update(
		{ _id: appointmentId },
		{
			$set: {
				utc_date: utc_date,
				end_date: end_date,
				start_date: date,
				start_time: time,
				updated_date: day,
			},
		}
	).then(update => {
		var content = {
			name: details.name,
			email: details.mail,
			subject: 'OYO App-Appointment Details',
			templatefoldername: 'appointment',
			id: details._id,
			token: details.active_hash,
			date: date_time,
			title: title,
			ispName: ispName,
			ispEmail: ispEmail,
			ispPhone: ispPhone,
		};
		Email.send_email(content);
		req.flash('success', 'Appointment updated!');
		res.redirect('/appointments');
	});
};
exports.cancelAppointment = async function (req, res) {
	let appointmentId = req.body.appointmentId1;
	let appointment = await Appointment.find({ _id: appointmentId });
	appointment = JSON.parse(JSON.stringify(appointment));
	let chargeId = appointment[0].charge;
	let fullPayment = appointment[0].full_payment;
	let reason = req.body.reason;
	var reminderData = [];
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	reminderData.push({
		ispId: appointment[0].service_proviver,
		notificationType: 'Appointment',
		status: 'Cancelled',
		title: appointment[0].title,
		start_date: appointment[0].start_date,
		start_time: appointment[0].start_time,
		utc_start: appointment[0].utc_start,
		utc_end: appointment[0].utc_end,
		name: appointment[0].name,
		mail: appointment[0].mail,
		profile: appointment[0].profile,
		phone: appointment[0].phone,
		ispName: appointment[0].ispName,
		ispEmail: appointment[0].ispEmail,
		ispProfile: appointment[0].ispProfile,
		ispPhone: appointment[0].ispPhone,
		created_date: day,
	});
	if (req.session.outlookLogin == 'True') {
		const outlookEventId = appointment[0].outlookEventId;
		const accessToken = req.session.access_token;
		const apiUrl = 'https://graph.microsoft.com/v1.0/me';
		axios({
			method: 'post',
			url: `${apiUrl}/events/${outlookEventId}/cancel`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		}).then(function (response) {
			// console.log("response",response);
		});
	}
	if (req.session.googleLogin == 'True') {
		const googleEventId = appointment[0].googleEventId;
		var token = req.session.googleToken;
		oauth2Client.setCredentials(token);
		const { google } = require('googleapis');
		const calendar = google.calendar({ version: 'v3', oauth2Client });
		calendar.events.delete(
			{
				auth: oauth2Client,
				calendarId: 'primary',
				eventId: googleEventId,
			},
			async function (err, event) {
				if (err) {
					console.log(
						'There was an error contacting the Calendar service: ' + err
					);
				}
				// console.log("event",event);
			}
		);
	}
	if (appointment[0].ispOutlookEvent) {
		const accessToken = appointment[0].ispOutlookToken.access_token;
		console.log('IspAccessToken', accessToken);
		var ispOutlookEventId = appointment[0].ispOutlookEventId;
		const apiUrlIsp = 'https://graph.microsoft.com/v1.0/me';
		axios({
			method: 'post',
			url: `${apiUrlIsp}/events/${ispOutlookEventId}/cancel`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		}).then(function (response) {
			// console.log("response",response);
		});
	}
	if (appointment[0].ispGoogleEvent) {
		var tokenIsp = appointment[0].ispGoogleToken;
		console.log('tokenIsp', tokenIsp);
		oauth2Client.setCredentials(tokenIsp);
		const { google } = require('googleapis');
		const calendar = google.calendar({ version: 'v3', oauth2Client });
		calendar.events.delete(
			{
				auth: oauth2Client,
				calendarId: 'primary',
				eventId: appointment[0].ispGoogleEventId,
			},
			async function (err, deleteEvent) {
				if (err) {
					console.log(
						'There was an error contacting the Calendar service: ' + err
					);
				}
				// console.log("deleteEvent",deleteEvent);
			}
		);
	}
	await Appointment.update(
		{ _id: appointmentId },
		{
			$set: {
				status: 'Cancelled',
				cancel_reason: reason,
				updated_date: day,
			},
		},
		async function (err, appointmentDelete) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect('/appointments');
			} else {
				if (chargeId != '') {
					await stripe.refunds.create({
						charge: chargeId,
					});
				}
				await sendReminder.create(reminderData);
				await paymentReminder.deleteMany({ appointmentId: appointmentId });
				req.flash('success', 'Appointment cancelled!.');
				res.redirect('/appointments');
			}
		}
	);
};
exports.ispCancelAppointment = async function (req, res) {
	var appointmentId = req.body.ispCancelAppointmentId;
	var chargeId = await Appointment.find({ _id: appointmentId });
	chargeId = JSON.parse(JSON.stringify(chargeId));
	chargeId = chargeId[0].charge;
	var reason = req.body.reason;
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');

	await Appointment.update(
		{ _id: appointmentId },
		{
			$set: {
				status: 'Cancelled',
				cancel_reason: reason,
				updated_date: day,
				ispCancel: true,
			},
		},
		{ upsert: true },
		async function (err, appointmentDelete) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect('/appointments');
			} else {
				if (chargeId != '') {
					await stripe.refunds.create({
						charge: chargeId,
					});
				}
				req.flash('success', 'Appointment cancelled!');
				res.redirect('/appointments');
			}
		}
	);
};
exports.completePaymentSaveCard = async function (req, res) {
	var completePaymentNotification = [];
	var tipPayment = [];
	var appointmentId = req.body.remainingAmountappointmentId;
	var remainingAmount = req.body.remainingAmount1;
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	var cardId = req.body.existingCardRadio;
	var tipAmount = 0;

	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');

	await Appointment.findOne({ _id: appointmentId }, async function (err, user) {
		if (err) {
			return done(err);
		} else {
			let amount = user.amount;
			let totalAmount = parseFloat(amount) + parseFloat(remainingAmount);
			totalAmount = totalAmount.toString();

			completePaymentNotification.push({
				end_time: user.end_time,
				end_date: user.end_date,
				start_time: user.start_time,
				start_date: user.start_date,
				utc_date: user.utc_date,
				utc_start: user.utc_start,
				utc_end: user.utc_end,
				full_payment: true,
				remaining_payment: remainingAmount,
				amount: totalAmount,
				title: user.title,
				name: user.name,
				mail: user.mail,
				profile: user.profile,
				phone: user.phone,
				ispName: user.ispName,
				ispEmail: user.ispEmail,
				ispProfile: user.ispProfile,
				ispPhone: user.ispPhone,
				notificationType: 'Complete Payment',
				ispId: user.service_proviver,
			});
			tipPayment.push({
				appointmentId: appointmentId,
				cusMail: user.mail,
				name: user.name,
				profile: user.profile,
				ispId: user.service_proviver,
				ispName: user.ispName,
				title: user.title,
				type: 'TipPayment',
			});
			if (req.body.tipValue1) {
				tipAmount = req.body.tipValue1;
				tipAmount = parseFloat(tipAmount);
				remainingAmount = parseFloat(remainingAmount);
				remainingAmount += tipAmount;
			}
			remainingAmount = (remainingAmount * 100).toFixed(2);
			remainingAmount = parseFloat(remainingAmount);
			await stripe.charges
				.create({
					amount: remainingAmount,
					currency: 'usd',
					description: 'Complete remaining amount',
					customer: stripeCustomerId,
					source: cardId,
					transfer_data: {
						destination: user.ispAccId,
					},
				})
				.then(charge => {
					Appointment.update(
						{ _id: appointmentId },
						{
							$set: {
								charge: charge.id,
								remaining_payment: 0,
								full_payment: true,
								tip: tipAmount,
								updated_date: day,
								created_date: day,
								amount: totalAmount,
							},
						},
						async function (err, updatedUser) {
							if (err) {
								return done(err);
							} else {
								let checkReminder = await paymentReminder.findOne({
									appointmentId: appointmentId,
								});
								if (checkReminder) {
									await paymentReminder.deleteMany({
										appointmentId: appointmentId,
									});
								}
								if (req.body.tipValue1) {
									await paymentReminder.create(tipPayment);
									req.flash('success', 'Tip sent successfully.');
								} else {
									await sendReminder.create(completePaymentNotification);
									req.flash('success', 'Payment processed successfully.');
								}
								res.redirect('/appointments');
							}
						}
					);
				});
		}
	});
};
exports.completePayment = async function (req, res) {
	var completePaymentNotification = [];
	var appointmentId = req.body.remainingAmountappointmentId;
	var remainingAmount = req.body.remainingAmount1;
	var stripeCustomerId = req.app.locals.userCustomerSession.stripeCustomerId;
	var stripeToken = req.body.stripeToken;
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	var tipAmount = 0;

	await Appointment.findOne({ _id: appointmentId }, async function (err, user) {
		if (err) {
			return done(err);
		} else {
			let amount = user.amount;
			let totalAmount = parseInt(amount) + parseInt(remainingAmount);
			totalAmount = totalAmount.toString();

			completePaymentNotification.push({
				end_time: user.end_time,
				end_date: user.end_date,
				start_time: user.start_time,
				start_date: user.start_date,
				utc_date: user.utc_date,
				utc_start: user.utc_start,
				utc_end: user.utc_end,
				full_payment: true,
				remaining_payment: remainingAmount,
				amount: totalAmount,
				title: user.title,
				name: user.name,
				mail: user.mail,
				profile: user.profile,
				phone: user.phone,
				ispName: user.ispName,
				ispEmail: user.ispEmail,
				ispProfile: user.ispProfile,
				ispPhone: user.ispPhone,
				notificationType: 'Complete Payment',
				ispId: user.service_proviver,
			});
			if (req.body.tipValue1) {
				tipAmount = req.body.tipValue1;
				tipAmount = parseFloat(tipAmount);
				remainingAmount = parseFloat(remainingAmount);
				remainingAmount += tipAmount;
			}
			remainingAmount = (remainingAmount * 100).toFixed(2);
			remainingAmount = parseFloat(remainingAmount);

			var addCard = await stripe.customers.createSource(stripeCustomerId, {
				source: stripeToken,
			});

			await stripe.charges
				.create({
					amount: remainingAmount,
					currency: 'usd',
					description: 'Complete remaining amount',
					customer: stripeCustomerId,
					source: addCard.id,
					transfer_data: {
						destination: user.ispAccId,
					},
				})
				.then(charge => {
					Appointment.update(
						{ _id: appointmentId },
						{
							$set: {
								charge: charge.id,
								remaining_payment: 0,
								full_payment: true,
								tip: tipAmount,
								updated_date: day,
								created_date: day,
								amount: totalAmount,
							},
						},
						async function (err, updatedUser) {
							if (err) {
								return done(err);
							} else {
								let checkReminder = await paymentReminder.findOne({
									appointmentId: appointmentId,
								});
								if (checkReminder) {
									await paymentReminder.deleteMany({
										appointmentId: appointmentId,
									});
								}
								if (req.body.tipValue1) {
									req.flash('success', 'Tip sent successfully.');
								} else {
									await sendReminder.create(completePaymentNotification);
									req.flash('success', 'Payment processed successfully.');
								}
								res.redirect('/appointments');
							}
						}
					);
				});
		}
	});
};
exports.sendReview = async function (req, res) {
	var appointmentId = req.body.CompleteAppointmentId;
	var ispEmail = req.body.CompleteAppointmentIspEmail;
	var review = req.body.cusReview.trim();
	var rate = req.body.rate;
	let totalPoints = 0;
	let count = 0;
	rate = rate == 0 || rate == undefined ? 0 : rate;
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	let avgRating = await Appointment.find({
		ispEmail: ispEmail,
		_id: { $ne: appointmentId },
	});
	avgRating = JSON.parse(JSON.stringify(avgRating));
	if (avgRating.length > 0) {
		count++;
		avgRating.forEach(rating => {
			let points = rating.rate;
			if (points != undefined) {
				count++;
				points = parseInt(points);
				totalPoints = totalPoints + points;
			}
		});
		totalPoints = totalPoints + parseInt(rate);
		var avgIspRating = totalPoints / count;
		avgIspRating = Math.round(avgIspRating);
		await businessOwner.update(
			{ mail: ispEmail },
			{
				$set: {
					avgRating: avgIspRating || 0,
				},
			}
		);
	} else {
		await businessOwner.update(
			{ mail: ispEmail },
			{
				$set: {
					avgRating: rate || 0,
				},
			}
		);
	}
	await Appointment.update(
		{ _id: appointmentId },
		{
			$set: {
				review: review,
				rate: rate,
				updated_date: day,
				rated_date: day,
			},
		},
		async function (err, appointmentReview) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect('/appointments');
			} else {
				req.flash('success', 'Review submitted!');
				res.redirect('/appointments');
			}
		}
	);
};
exports.cusOngoingForm = async function (req, res) {
	var appointmentId = req.body.OngoingAppointmentId;
	var remainigPayment = req.body.OngoingRemainigPayment;
	var amountPaid = req.body.OngoingAmountPaid;
	var paymentForm = req.body.payment_form;
	var totalPayment = parseFloat(amountPaid) + parseFloat(remainigPayment);
	totalPayment = totalPayment.toFixed(2);
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');

	if (paymentForm == 'Card') {
		var appointmentData = await Appointment.findOne({ _id: appointmentId });
		appointmentData = JSON.parse(JSON.stringify(appointmentData));
		var cusEmail = appointmentData.mail;
		var cusStripeId = await Customer.findOne({ mail: cusEmail });
		cusStripeId = JSON.parse(JSON.stringify(cusStripeId));
		if (cusStripeId == null) {
			console.log('true');
			req.flash(
				'error',
				'Your appointment cannot be completed, this customer has no account.'
			);
			res.redirect('/appointments');
			return false;
		}
		cusStripeId = cusStripeId.stripeCustomerId;
		const cards = await stripe.customers.listSources(cusStripeId, {
			object: 'card',
			limit: 1,
		});
		if (cards.data.length == 0) {
			let reminder = [];
			reminder.push({
				appointmentId: appointmentId,
				cusMail: appointmentData.mail,
				name: appointmentData.name,
				profile: appointmentData.profile,
				ispName: appointmentData.ispName,
				title: appointmentData.title,
				start_date: appointmentData.start_date,
				remaining_payment: appointmentData.remaining_payment,
				type: 'PaymentFailedReminder',
				stripeError: 'Customer card not found',
			});
			let checkReminder = await paymentReminder.findOne({
				$and: [
					{ appointmentId: appointmentId },
					{ type: 'PaymentFailedReminder' },
				],
			});
			if (checkReminder) {
				await paymentReminder.findOneAndRemove({
					$and: [
						{ appointmentId: appointmentId },
						{ type: 'PaymentFailedReminder' },
					],
				});
				await paymentReminder.create(reminder);
			} else {
				await paymentReminder.create(reminder);
			}
			req.flash('error', 'Customer card not found');
			res.redirect('/appointments');
			return false;
		}

		var cardId = cards.data[0].id;
		totalPayment = parseFloat(totalPayment);
		await stripe.charges
			.create({
				amount: totalPayment * 100,
				currency: 'usd',
				description: 'Appointment Remaining Payment',
				customer: cusStripeId,
				source: cardId,
			})
			.then(charge => {
				Appointment.update(
					{ _id: appointmentId },
					{
						$set: {
							full_payment: true,
							status: 'Completed',
							remaining_payment: 0,
							amount: totalPayment,
							updated_date: day,
							created_date: day,
						},
					},
					async function (err, appointmentReview) {
						if (err) {
							req.flash('error', 'Sorry something went wrong.');
							res.redirect('/appointments');
						} else {
							await paymentReminder.deleteMany({
								appointmentId: appointmentId,
							});
							req.flash(
								'success',
								'Your payment and appointment completed successfully.'
							);
							res.redirect('/appointments');
						}
					}
				);
			})
			.catch(async error => {
				let reminder = [];
				reminder.push({
					appointmentId: appointmentId,
					cusMail: appointmentData.mail,
					name: appointmentData.name,
					profile: appointmentData.profile,
					ispName: appointmentData.ispName,
					title: appointmentData.title,
					start_date: appointmentData.start_date,
					remaining_payment: appointmentData.remaining_payment,
					type: 'PaymentFailedReminder',
					stripeError: error.raw.message,
				});
				let checkReminder = await paymentReminder.findOne({
					$and: [
						{ appointmentId: appointmentId },
						{ type: 'PaymentFailedReminder' },
					],
				});
				if (checkReminder) {
					await paymentReminder.findOneAndRemove({
						$and: [
							{ appointmentId: appointmentId },
							{ type: 'PaymentFailedReminder' },
						],
					});
					await paymentReminder.create(reminder);
				} else {
					await paymentReminder.create(reminder);
				}
				req.flash(
					'error',
					error.raw.message == 'Your card has expired.'
						? 'Customer card has expired.'
						: error.raw.message
				);
				res.redirect('/appointments');
			});
		return false;
	}

	await Appointment.update(
		{ _id: appointmentId },
		{
			$set: {
				full_payment: true,
				status: 'Completed',
				remaining_payment: 0,
				amount: totalPayment,
				updated_date: day,
			},
		},
		async function (err, appointmentReview) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect('/appointments');
			} else {
				req.flash('success', 'Appointment completed!');
				res.redirect('/appointments');
			}
		}
	);
};
exports.inviteCode = async function (req, res) {
	data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	var name_category = req.body.name_category;
	let ISP = await businessOwner.findOne({
		$and: [
			{
				$or: [
					{ name: { $regex: `${name_category}`, $options: 'i' } },
					{ inviteCode: { $regex: `${name_category}`, $options: 'i' } },
				],
			},
			{ role_id: 3 },
		],
	});
	ISP = JSON.parse(JSON.stringify(ISP));
	if (ISP != null) {
		req.flash('success', 'Your searched Business Owner');
		res.redirect(`/connectedIspDetail/${ISP._id}`);
	} else {
		req.flash('error', 'Your searched Business Owner not found');
		res.redirect('/main');
	}
};
exports.customerNotes = function (req, res) {
	let ispId = req.body.ispId;
	let connectedId = req.body.connectedId;
	let myNotes = req.body.myNotes;
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');

	if (req.body.connectedId == '') {
		req.flash('error', 'Please send connection request first');
		res.redirect(`/connectedIspDetail/${ispId}`);
	} else {
		connected.update(
			{ _id: connectedId },
			{
				$set: {
					customerNotes: myNotes,
					customerNotesUpdate: day,
				},
			},
			function (err, updatedUser) {
				if (err) {
					return done(err);
				} else {
					req.flash('success', 'Notes saved');
					res.redirect(`/connectedIspDetail/${ispId}`);
				}
			}
		);
	}
};

exports.customerNewNotes = function (req, res) {
	var details = req.app.locals.userCustomerSession;
	let ispId = req.body.ispId;
	let connectedId = req.body.connectedId;
	let myNotes = req.body.myNotes;
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');

	customerNotes.findOne(
		{ ispId: ispId, cusId: details._id },
		function (er, result) {
			console.log('data ---------->', result);
			if (result == null) {
				var notes = new customerNotes();
				notes.ispId = ispId;
				notes.ispMail = req.body.mail;
				notes.IspProfileImage = req.body.profileImage;
				notes.cusId = details._id;
				notes.cusMail = details.mail;
				notes.cusProfile = details.profileImage;
				notes.cusBirthday = details.birthdate;
				notes.cusMobile = details.mobile;
				notes.createdDate = day;
				notes.customerNotesUpdate = day;
				notes.customerNotes = myNotes;
				notes.cusAddress = details.address;

				notes.save(function (err, result) {
					if (err) {
						console.log('saved eror ', err);
						req.flash('error', 'Notes have not saved');
						res.redirect(`/connectedIspDetail/${ispId}`);
					} else {
						console.log('saved result ', result);
						req.flash('success', 'Notes saved');
						res.redirect(`/connectedIspDetail/${ispId}`);
					}
				});
			} else {
				customerNotes.update(
					{ ispId: ispId, cusId: details._id },
					{
						$set: {
							customerNotes: myNotes,
							customerNotesUpdate: day,
						},
					},
					function (err, updatedUser) {
						if (err) {
							return done(err);
						} else {
							req.flash('success', 'Notes saved');
							res.redirect(`/connectedIspDetail/${ispId}`);
						}
					}
				);
			}
		}
	);
};
exports.deleteCustomerNotes = function (req, res) {
	customerNotes.update(
		{ _id: req.params.id },
		{ $unset: { customerNotes: '' } },
		function (err, updatedUser) {
			if (err) {
				return done(err);
			} else {
				req.flash('success', 'You notes deleted successfully');
				res.redirect(`/connectedIspDetail/${req.params.ispId}`);
			}
		}
	);
};
exports.noShow = function (req, res) {
	Appointment.update(
		{ _id: req.params.id },
		{
			$set: {
				status: 'No Show',
			},
		},
		function (err, updatedUser) {
			if (err) {
				return done(err);
			} else {
				req.flash('success', 'Customer appointment No Show Updated!');
				res.redirect('/appointments');
			}
		}
	);
};
