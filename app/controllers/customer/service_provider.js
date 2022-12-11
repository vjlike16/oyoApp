var ServiceCategories = require('../../models/admin/service_category');
const service = require('../../models/customers/service');
const connectedList = require('../../models/customers/connectedList');
const businessHours = require('../../models/isp/businessHours');
var sendReminder = require('../../models/isp/sendReminder');
var pastWorkImages = require('../../models/isp/past_work_image');
var Appointment = require('../../models/customers/appointments');
var Customer = require('../../models/home');
var Async = require('async');
const { select } = require('underscore');
var mongoose = require('mongoose');
var moment = require('moment');
var dateFormat = require('dateformat');
/* For Image Upload Configration */
const multer = require('multer');
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
const upload = multer({ storage: Storage });
var profileImageUpload = upload.fields([{ name: 'profileImage', maxCount: 1 }]);
var newArray = [];

exports.listing = async function (req, res) {
	var data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.msg = '';
	data.name_category = '';
	data.address = '';

	Customer.aggregate([
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
	]).exec(function (err, result) {
		if (err) {
			data.result = '';
			res.render('customer/service_provider/listing', data);
		} else {
			data.result = result;
			console.log(data.result);
			res.render('customer/service_provider/listing', data);
		}
	});
};

exports.serviceProvider = async function (req, res) {
	var data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.msg = '';
	var id = req.params.id;
	var finalTimeZone = req.session.deviceTimeZone || moment.tz.guess();
	let ispBusinessHours = await businessHours.findOne({ ispId: id });
	ispBusinessHours = JSON.parse(JSON.stringify(ispBusinessHours));
	if (ispBusinessHours != null) {
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
		currentTime = timeTz.clone().tz(finalTimeZone).format('HH:mm:ss');
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
					let endTime = momentTz(todayEndTime, 'hh:mm A').format('HH:mm');
					if (currentTime >= startTime && currentTime < endTime) {
						isTodayOff = 'false';
					} else {
						isTodayOff = 'true';
					}
				}
			}
		}
	}
	data.isTodayOff = isTodayOff;
	data.todayEndTime = todayEndTime;
	data.businessHours = ispBusinessHours;

	service.find({ service_proviver: id }).exec(async function (err, service) {
		if (err) {
			data.services = '';
		} else {
			data.services = service;
			Customer.findById({
				_id: id,
			})
				.populate('business_category', select[('name', '_id')])
				.populate('subscription', 'plan_name')
				.exec(async function (err, result) {
					if (err) {
						data.result = '';
						res.render('customer/service_provider/isp-detail', data);
					} else {
						data.appointments = await Appointment.find({
							ispEmail: result._doc.mail,
							status: 'Completed',
							rate: { $exists: true },
						}).sort({ $natural: -1 });
						data.pastWorkImages = await pastWorkImages.find({
							userId: result._doc._id,
						});
						data.avgRating = result.avgRating;
						data.result = result;
						res.render('customer/service_provider/isp-detail', data);
					}
				});
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
	Customer.aggregate([
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
				res.render('customer/service_provider/map', data);
			} else {
				data.result = result;
				result.forEach(element => {
					//console.log("data  :");
					//console.log(element);
					//console.log(element.services.name);
				});
				//console.dir((result));
				res.render('customer/service_provider/map', data);
			}
		});
};
exports.google_map = function (req, res) {
	var data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.msg = '';
	data.name_category = '';
	data.address = '';

	Customer.aggregate([
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
	]).exec(function (err, result) {
		if (err) {
			data.result = '';
			res.render('customer/service_provider/map', data);
		} else {
			data.result = result;
			res.render('customer/service_provider/map', data);
		}
	});
};
exports.myServices = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	var userId = details._id;
	var data = {};
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.session;
	data.msg = '';

	data.businessHours = await businessHours.find({ ispId: userId });
	data.services = await service.find({ service_proviver: userId });
	res.render('customer/services/services.ejs', data);
};
exports.editService = async function (req, res) {
	let day = moment.utc();

	profileImageUpload(req, res, async function (err) {
		if (
			typeof req.files == 'undefined' ||
			typeof req.files['profileImage'] == 'undefined' ||
			req.files['profileImage'] == ''
		) {
			var profileImageNewName = req.body.old_uploaded_image;
		} else {
			var profileImageNewName = req.files['profileImage'][0].filename;
		}
		await service.update(
			{ _id: req.body.service_id },
			{
				$set: {
					name: req.body.name,
					icon: profileImageNewName,
					//hours: req.body.duration_hours,
					minutes: req.body.duration_minutes,
					advance: req.body.advance,
					cancellation: req.body.cancellation,
					price: req.body.price,
					description: req.body.description,
					allowded_customers: req.body.allowded_customers,
					updated_date: day,
				},
			},
			async function (err, updatedUser) {
				if (err) {
					return done(err);
				} else {
					req.flash('success', 'Service edited.');
					res.redirect(baseUrl + 'myServices');
				}
			}
		);
	});
};
exports.deleteService = async function (req, res) {
	service.findOneAndRemove(
		{ _id: req.params.id },
		function (err, serviceDelete) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'myServices');
			} else {
				req.flash('success', 'Service deleted.');
				res.redirect(baseUrl + 'myServices');
			}
		}
	);
};
var settings = require('../../models/admin/setting');
exports.add_service = async function (req, res) {
	let newService = [];
	let details = req.app.locals.userCustomerSession;
	let addService = new service();
	let day = moment.utc();
	var maximumServices = await settings.find({
		key_name: 'maximum_service_isp',
	});
	var ServiceCount = await service.count({
		service_proviver: req.app.locals.userCustomerSession._id,
	});
	if (ServiceCount < maximumServices[0].value) {
		profileImageUpload(req, res, async function (err) {
			if (
				typeof req.files == 'undefined' ||
				typeof req.files['profileImage'] == 'undefined' ||
				req.files['profileImage'] == ''
			) {
				var profileImageNewName = 'avatar.png';
			} else {
				var profileImageNewName = req.files['profileImage'][0].filename;
			}
			addService.name = req.body.name;
			addService.service_proviver_name =
				req.app.locals.userCustomerSession.name;
			addService.service_proviver = req.app.locals.userCustomerSession._id;
			addService.business_category =
				req.app.locals.userCustomerSession.business_category;
			addService.icon = profileImageNewName;
			//addService.hours = req.body.duration_hours;
			addService.minutes = req.body.duration_minutes;
			addService.advance = req.body.advance;
			addService.cancellation = req.body.cancellation;
			addService.price = req.body.price;
			addService.description = req.body.description;
			addService.allowded_customers = req.body.allowded_customers;
			addService.status = 'active';
			addService.created_date = day;
			addService.updated_date = day;

			var connectedUser = await connectedList.find({
				ispId: details._id,
				status: 'success',
			});
			connectedUser = JSON.parse(JSON.stringify(connectedUser));
			if (connectedUser.length > 0) {
				connectedUser.forEach(connectedId => {
					newService.push({
						notificationType: 'New Service',
						cusId: connectedId.cusId,
						name: connectedId.cusName,
						mail: connectedId.cusMail,
						profile: connectedId.cusProfile,
						ispId: details._id,
						ispName: details.name,
						ispEmail: details.mail,
						ispProfile: details.profileImage,
						ispServiceName: req.body.name,
						created_date: day,
					});
				});
			}
			addService.save(async function (err) {
				if (err) {
					throw err;
				}
				await sendReminder.create(newService);
				req.flash('success', 'Service added!');
				res.redirect(baseUrl + 'myServices');
			});
		});
	} else {
		req.flash('error', 'Business owner reach the maximum services limit.');
		res.redirect(baseUrl + 'myServices');
	}
};
