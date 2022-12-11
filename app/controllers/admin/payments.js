
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var lowerCase = require('lower-case');
var payments = require('../../models/admin/payment');
var appointments = require('../../models/customers/appointments');
var subscriptions = require('../../models/isp/subscriptionsData');
var home = require('../../models/home');
var trim = require('trim');
var moment = require('moment');
var fs = require('fs');


exports.listing = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim; 

	subscriptions.find().sort({$natural:-1})
	.exec(function (err, result) { 
		if (err) {
			data.result = '';
			res.render('admin/payments/listing', data);
		} else {
			data.result = result;
			data.min = '';
			data.max = '';
			res.render('admin/payments/listing', data); 
		}
	});
	// payments.find()
	// .populate('discount_code').populate('subscription')
	// 	.sort({ 'created_date': -1 })
	// 	.exec(function (err, result) { 
	// 		if (err) {
	// 			data.result = '';
	// 			res.render('admin/payments/listing', data);
	// 		} else {
	// 			data.result = result;
	// 			data.min = '';
	// 			data.max = '';
	// 			res.render('admin/payments/listing', data); 
	// 		}
	// 	});
}

exports.appointments_listing = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim; 

	appointments.find({})
	//.populate('discount_code').populate('subscription')
		.sort({ 'created_date': -1 })
		.exec(function (err, result) { 
			if (err) {
				data.result = '';
				res.render('admin/payments/appointments_listing', data);
			} else {
				console.log("result----" , result);
				data.result = result;
				data.min = '';
				data.max = '';
				res.render('admin/payments/appointments_listing', data); 
			}
		});
 
}

exports.view = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	payments.findOne({ '_id': req.params.id }, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/payments/view', data);
		}
	});
 
}
exports.exportToCsv = function (req, res) {
	var userEmailsInForm = req.body.userEmailsInForm;
	userEmailsInForm = userEmailsInForm.split(",");

	const Json2csvParser = require('json2csv').Parser;
	subscriptions.find()
	    .sort({ 'created_date': -1 })
		.exec(async function (err, result) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/payments');
			} else {
				// Making Array for export
				var dataArray = [];
				for (var i = 0; i < result.length; i++) {
					let Discount_code =  (result[i].coupon_code == null) ? '' : result[i].coupon_code;
					let subscription;

					 if(!result[i].last_paid_amount){
						var isAfter = moment(result[i].created_date).add(3, 'days').isAfter(moment());
						if(isAfter){
							subscription = "Free Trial";
						}else{
							subscription = "Inactive";
						}
					}else {
						subscription = "Monthly";
					}
					console.log("Created Date-->",result[i].created_date)
					let created_date = dateFormat(result[i].created_date, "mm-dd-yyyy h:MM TT");
					console.log("created_date", created_date)
					dataArray.push({ "S. No.": i+1, "Business Owner Name": result[i].name,'Subscription Type': subscription, "Paid Amount": result[i].last_paid_amount, "Discount Code": Discount_code, "Created": dateFormat(created_date, "mm-dd-yyyy h:MM TT")});
					console.log("CREATED AT:", dateFormat(created_date, "mm-dd-yyyy h:MM TT"))
				}

				//Exporting
			//	dataArray.reverse();
				const json2csvParser = new Json2csvParser();
				const csv = json2csvParser.parse(dataArray);

				var CurrentTimeStamp = moment.utc();
				var datetimestamp = dateFormat(CurrentTimeStamp, "yyyy_dd_mm'T'HH_MM_ss");
				var fileName = "payments_" + datetimestamp + ".csv";
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
exports.datefilter = function (req, res) {
	
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;

	var date1 =new Date(req.body.min);
	var	min = moment(date1,"yyyy-dd-mm");
	var date2 =new Date(req.body.max);
	date2.setDate(date2.getDate() + 1);
	var	max = moment(date2,"yyyy-dd-mm");
	home.find({
		created_date: {  
			$gte: min,  
			$lte: max
		}
	}) 
	.populate('discount_code').populate('subscription')
	.sort({ 'created_date': -1 })
	.exec(function (err, result) { 
		if (err) {
			data.result = '';
			res.render('admin/payments/listing', data);
		} else {
			data.result = result;
			console.log('admin/payments/listing'  + result);
			data.min = min;
			date2.setDate(date2.getDate() - 1);
			max = moment(date2,"yyyy-dd-mm");
			data.max = max;
			res.render('admin/payments/listing', data); 
		}
	});
}

exports.appointment_exportToCsv = function (req, res) {
	var userEmailsInForm = req.body.userEmailsInForm;
	userEmailsInForm = userEmailsInForm.split(",");
	const Json2csvParser = require('json2csv').Parser;
	appointments.find()
	//.populate('discount_code').populate('subscription')
		.sort({ 'created_date': -1 })
		.exec(async function (err, result) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/appointments');
			} else {
				// Making Array for export
				var dataArray = [];
				for (var i = 0; i < result.length; i++) {
					dataArray.push({ "S. No.": i+1, "Name": result[i].name, "Service Name": result[i].title, "Paid Amount": result[i].amount, "Coupon Code": result[i].coupon_code, "Created": dateFormat(result[i].created_date, "mm-dd-yyyy h:MM TT"), "Status": result[i].status });
				}

				//Exporting
				const json2csvParser = new Json2csvParser();
				const csv = json2csvParser.parse(dataArray);

				var CurrentTimeStamp = moment.utc();
				var datetimestamp = dateFormat(CurrentTimeStamp, "yyyy_mm_dd'T'HH_MM_ss");
				var fileName = "appointments_" + datetimestamp + ".csv";
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
exports.appointment_datefilter = function (req, res) {
	
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;

	var date1 =new Date(req.body.min);
	var	min = moment(date1,"yyyy-dd-mm");
	var date2 =new Date(req.body.max);
	date2.setDate(date2.getDate() + 1);
	var	max = moment(date2,"yyyy-dd-mm");
	appointments.find({
		created_date: {  
			$gte: min,  
			$lte: max
		}
	}) 
	//.populate('discount_code').populate('subscription')
	.sort({ 'created_date': -1 })
	.exec(function (err, result) { 
		if (err) {
			data.result = '';
			res.render('admin/payments/appointments_listing', data);
		} else {
			data.result = result;
			console.log('admin/payments/appointments_listing'  + result);
			data.min = min;
			date2.setDate(date2.getDate() - 1);
			max = moment(date2,"yyyy-dd-mm");
			data.max = max;
			res.render('admin/payments/appointments_listing', data); 
		}
	});
}






