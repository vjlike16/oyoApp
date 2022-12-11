var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Customer = require('../../models/home');
var subscriptions = require('../../models/isp/subscriptionsData');
var Email = require('../../../lib/email.js');

var Async = require('async');
var usersSubscription = require('../../models/admin/users_subscription');
const moment = require('moment');
const appointments = require('../../models/customers/appointments');


exports.dashboard = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	var ispsCount = 0;
	var customerCount = 0;

	var statusByStatus = ['active', 'inactive'];
	var todayDate = dateFormat(Date.now(), "yyyy");
	let date = new Date(todayDate, 0, 1);

	const ispReports = [ 
		{ key: 'Jan', value: 0 , value1: 0},
		{ key: 'Feb', value: 0 , value1: 0},
		{ key: 'Mar', value: 0 , value1: 0},
		{ key: 'Apr', value: 0 , value1: 0},
		{ key: 'May', value: 0 , value1: 0},
		{ key: 'Jun', value: 0 , value1: 0},
		{ key: 'Jul', value: 0 , value1: 0},
		{ key: 'Aug', value: 0 , value1: 0},
		{ key: 'Sep', value: 0 , value1: 0},
		{ key: 'Oct', value: 0 , value1: 0},
		{ key: 'Nov', value: 0 , value1: 0},
		{ key: 'Dec', value: 0 , value1: 0}
	];

	var tasks = [
		function (callback) {
			appointments.count({}, function (err, count) {
				if (err) {
					data.appointmentCount = 0;
					callback();
				} else {
					console.log("appointmentCount ------- ." , count)
					data.appointmentCount = count;
					callback();
				}
			});
		},
		function (callback) {
			appointments.count({'status': "Cancelled"}, function (err, count) {
				if (err) {  
					data.cancellationsCount = 0;
					callback();
				} else {
					console.log("cancellationsCount ,,,," , count)
					data.cancellationsCount = count;
					callback();
				}
			});
		},
		function (callback) {
			Customer.count({'status': { $ne: 'delete' } , "plan_name": 'Free Trial', role_id: 3 }, function (err, count) {
				if (err) {
					data.free_trialCount = 0;
					callback();
				} else {
					//console.log("customers count " , count);
					customerCount = count;
					data.free_trialCount = count;
					callback();
				}
			});
		},
		function (callback) {
			Customer.count({'status': { $ne: 'delete' }, "plan_name" :"Monthly Subscription", role_id: 3  }, function (err, count) {
				if (err) {
					data.subscriptionCount = 0;
					callback();
				} else {
					//console.log("customers count " , count);
					customerCount = count;
					data.subscriptionCount = count;
					callback();
				}
			});
		},
		function (callback) {
			Customer.count({ role_id: '2', 'status': { $in: statusByStatus } }, function (err, count) {
				if (err) {
					data.customerCount = 0;
					callback();
				} else {
					//console.log("customers count " , count);
					customerCount = count;
					data.customerCount = count;
					callback();
				}
			});
		},
		function (callback) {
			Customer.count({ role_id: '3', 'status': { $in: statusByStatus } }, function (err, count) {
				if (err) {
					data.ispsCount = 0;
					callback();
				} else {
				//	console.log("isp count " , count);
                    ispsCount = count;
					data.ispsCount = count;
					callback();
				}
			});
		},
		async function (callback) {
			var users = await subscriptions.find({created_date: { $gt : date}}).select(['_id', 'created_date','last_paid_amount']);
			
			const paymentReports = [ 
				{ key: 'Jan', value: 0 },
				{ key: 'Feb', value: 0 },
				{ key: 'Mar', value: 0 },
				{ key: 'Apr', value: 0 },
				{ key: 'May', value: 0 },
				{ key: 'Jun', value: 0 },
				{ key: 'Jul', value: 0 },
				{ key: 'Aug', value: 0 },
				{ key: 'Sep', value: 0 },
				{ key: 'Oct', value: 0 },
				{ key: 'Nov', value: 0 },
				{ key: 'Dec', value: 0 }
			];
			if (users) { 
				users.forEach(function (user, key, value) {
					let monthName = moment(user.created_date).format("MMM");
					let amount = user.last_paid_amount;
					console.log("user.last_paid_amount -----> , ",user.last_paid_amount);
					paymentReports.map(index => index.key == monthName ? index.value += amount : index.value);
				});
			}
			data.paymentReports = paymentReports;
			data.min = '';
			data.max = '';
			//console.log(JSON.stringify(paymentReports)); 

			var users = await Customer.find({
			    'status': { $in: statusByStatus },'role_id':3, created_date: { $gt : date}
			}).select(['_id', 'created_date','last_paid_amount', 'status']);

			if (users) { 
				users.forEach(function (user, key, value) {
					let monthName = moment(user.created_date).format("MMM");
					ispReports.map(index => index.key == monthName ? index.value+=1 : index.value);
				});
			}
			var users = await Customer.find({
			    'status': { $in: statusByStatus }, role_id: '2', created_date: { $gt : date}
			}).select(['_id', 'created_date','last_paid_amount', 'status']);
		
			if (users) { 
				users.forEach(function (user, key, value) {
					let monthName = moment(user.created_date).format("MMM");
					ispReports.map(index => index.key == monthName ? index.value1+=1 : index.value);
				});
			}
			data.ispReports = ispReports;
			data.isp_min = '';
			data.isp_max = '';
			callback();
		},
	];
	Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
		if (err) {
			data.customerCount = customerCount;
			data.ispsCount = ispsCount;
			console.log("dash---,," , data);
			console.log("Hi to "+req.device.type.toUpperCase()+" User");
			res.render('admin/dashboard', data);
		} else {
			res.render('admin/dashboard', data);
		}
	});
}
exports.paymentfilter = function (req, res) {
	
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	var ispsCount = 0;
	var customerCount = 0;

	var date1 =new Date(req.body.min);
	var	min = moment(date1,"yyyy-mm-dd");
	var date2 =new Date(req.body.max);
	date2.setDate(date2.getDate() + 1);
	var	max = moment(date2,"yyyy-mm-dd");


	var statusByStatus = ['active', 'inactive'];
	var todayDate = dateFormat(Date.now(), "yyyy-mm-dd");

	var tasks = [
		function (callback) {
			appointments.count({}, function (err, count) {
				if (err) {
					data.appointmentCount = 0;
					callback();
				} else {
					console.log("appointmentCount ------- ." , count)
					data.appointmentCount = count;
					callback();
				}
			});
		},
		function (callback) {
			appointments.count({'status': "Cancelled"}, function (err, count) {
				if (err) {  
					data.cancellationsCount = 0;
					callback();
				} else {
					console.log("cancellationsCount ,,,," , count)
					data.cancellationsCount = count;
					callback();
				}
			});
		},
		function (callback) {
			Customer.count({'status': { $in: statusByStatus } , "free_trial": 'on' }, function (err, count) {
				if (err) {
					data.free_trialCount = 0;
					callback();
				} else {
					//console.log("customers count " , count);
					customerCount = count;
					data.free_trialCount = count;
					callback();
				}
			});
		},
		function (callback) {
			Customer.count({'status': { $in: statusByStatus }, "subscriptionValidity" :true  }, function (err, count) {
				if (err) {
					data.subscriptionCount = 0;
					callback();
				} else {
					//console.log("customers count " , count);
					customerCount = count;
					data.subscriptionCount = count;
					callback();
				}
			});
		},
		function (callback) {
			Customer.count({ role_id: '2', 'status': { $in: statusByStatus } }, function (err, count) {
				if (err) {
					data.customerCount = 0;
					callback();
				} else {
					//console.log("customers count " , count);
					customerCount = count;
					data.customerCount = count;
					callback();
				}
			});
		},
		function (callback) {
			Customer.count({ role_id: '3', 'status': { $in: statusByStatus } }, function (err, count) {
				if (err) {
					data.ispsCount = 0;
					callback();
				} else {
				//	console.log("isp count " , count);
                    ispsCount = count;
					data.ispsCount = count;
					callback();
				}
			});
		},

		async function (callback) {
			var users = await subscriptions.find({
				created_date: {  
					$gte: min,  
					$lte: max
				}
			}).select(['_id', 'created_date','last_paid_amount']);
			
			const paymentReports = [ 
				{ key: 'Jan', value: 0 },
				{ key: 'Feb', value: 0 },
				{ key: 'Mar', value: 0 },
				{ key: 'Apr', value: 0 },
				{ key: 'May', value: 0 },
				{ key: 'Jun', value: 0 },
				{ key: 'Jul', value: 0 },
				{ key: 'Aug', value: 0 },
				{ key: 'Sep', value: 0 },
				{ key: 'Oct', value: 0 },
				{ key: 'Nov', value: 0 },
				{ key: 'Dec', value: 0 }
			];
			if (users) { 
				users.forEach(function (user, key, value) {
					let monthName = moment(user.created_date).format("MMM");
					let amount = user.last_paid_amount;
					//console.log("last paid amount ---->" , amount);
					paymentReports.map(index => index.key == monthName ? index.value += parseFloat(amount) : index.value);
				});
			}
			data.paymentReports = paymentReports;
			data.min = min;
			date2.setDate(date2.getDate() - 1)
	        max = moment(date2,"yyyy-mm-dd");
			data.max = max;
		//	console.log(JSON.stringify(paymentReports)); 
		var users1 = await Customer.find({
			'status': { $in: statusByStatus },'is_customer_to_isp':true
		}).select(['_id', 'created_date','last_paid_amount', 'status']);

		const ispReports = [ 
		{ key: 'Jan', value: 0 , value1: 0},
		{ key: 'Feb', value: 0 , value1: 0},
		{ key: 'Mar', value: 0 , value1: 0},
		{ key: 'Apr', value: 0 , value1: 0},
		{ key: 'May', value: 0 , value1: 0},
		{ key: 'Jun', value: 0 , value1: 0},
		{ key: 'Jul', value: 0 , value1: 0},
		{ key: 'Aug', value: 0 , value1: 0},
		{ key: 'Sep', value: 0 , value1: 0},
		{ key: 'Oct', value: 0 , value1: 0},
		{ key: 'Nov', value: 0 , value1: 0},
		{ key: 'Dec', value: 0 , value1: 0}
		];
		var users01 = await Customer.find({
			'status': { $in: statusByStatus }, role_id: 3,
			// created_date: {  
			// 	$gte: isp_min,  
			// 	$lte: isp_max
			// }
		}).select(['_id', 'created_date','last_paid_amount', 'status']);
		
		if (users01) { 
			users01.forEach(function (user, key, value) {
				let monthName = moment(user.created_date).format("MMM");
				ispReports.map(index => index.key == monthName ? index.value += 1 : index.value);
			});
		}
		var users1 = await Customer.find({
			'status': { $in: statusByStatus }, role_id: 2,
			// created_date: {  
			// 	$gte: isp_min,  
			// 	$lte: isp_max
			// }
		}).select(['_id', 'created_date','last_paid_amount', 'status']);
		
		if (users1) { 
			users1.forEach(function (user, key, value) {
				let monthName = moment(user.created_date).format("MMM");
				ispReports.map(index => index.key == monthName ? index.value1 += 1 : index.value);
			});
		}
		data.ispReports = ispReports;
		data.isp_min = '';
		data.isp_max = '';
		callback();
		},
	];
	Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
		if (err) {
			// data.customerCount = 0;
			// data.ispsCount = 0;
			data.customerCount = customerCount;
			data.ispsCount = ispsCount;
			res.render('admin/dashboard', data);
		} else {
			res.render('admin/dashboard', data);
		}
	});
}
exports.ispfilter = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	var ispsCount = 0;
	var customerCount = 0;

	var date1 =new Date(req.body.isp_min);
	var	isp_min = moment(date1,"yyyy-mm-dd");
	var date2 =new Date(req.body.isp_max);
	date2.setDate(date2.getDate() + 1)
	var	isp_max = moment(date2,"yyyy-mm-dd");


	var statusByStatus = ['active', 'inactive'];
	var todayDate = dateFormat(Date.now(), "yyyy-mm-dd");

	const ispReports = [ 
		{ key: 'Jan', value: 0 , value1: 0},
		{ key: 'Feb', value: 0 , value1: 0},
		{ key: 'Mar', value: 0 , value1: 0},
		{ key: 'Apr', value: 0 , value1: 0},
		{ key: 'May', value: 0 , value1: 0},
		{ key: 'Jun', value: 0 , value1: 0},
		{ key: 'Jul', value: 0 , value1: 0},
		{ key: 'Aug', value: 0 , value1: 0},
		{ key: 'Sep', value: 0 , value1: 0},
		{ key: 'Oct', value: 0 , value1: 0},
		{ key: 'Nov', value: 0 , value1: 0},
		{ key: 'Dec', value: 0 , value1: 0}
	];

	var tasks = [
		function (callback) {
			appointments.count({}, function (err, count) {
				if (err) {
					data.appointmentCount = 0;
					callback();
				} else {
					console.log("appointmentCount ------- ." , count)
					data.appointmentCount = count;
					callback();
				}
			});
		},
		function (callback) {
			appointments.count({'status': "Cancelled"}, function (err, count) {
				if (err) {  
					data.cancellationsCount = 0;
					callback();
				} else {
					console.log("cancellationsCount ,,,," , count)
					data.cancellationsCount = count;
					callback();
				}
			});
		},
		function (callback) {
			Customer.count({'status': { $in: statusByStatus } , "free_trial": 'on' }, function (err, count) {
				if (err) {
					data.free_trialCount = 0;
					callback();
				} else {
					//console.log("customers count " , count);
					customerCount = count;
					data.free_trialCount = count;
					callback();
				}
			});
		},
		function (callback) {
			Customer.count({'status': { $in: statusByStatus }, "subscriptionValidity" :true  }, function (err, count) {
				if (err) {
					data.subscriptionCount = 0;
					callback();
				} else {
					//console.log("customers count " , count);
					customerCount = count;
					data.subscriptionCount = count;
					callback();
				}
			});
		},
		function (callback) {
			Customer.count({ role_id: '2', 'status': { $in: statusByStatus } }, function (err, count) {
				if (err) {
					data.customerCount = 0;
					callback();
				} else {
					//console.log("customers count " , count);
					customerCount = count;
					data.customerCount = count;
					callback();
				}
			});
		},
		function (callback) {
			Customer.count({ role_id: '3', 'status': { $in: statusByStatus } }, function (err, count) {
				if (err) {
					data.ispsCount = 0;
					callback();
				} else {
				//	console.log("isp count " , count);
                    ispsCount = count;
					data.ispsCount = count;
					callback();
				}
			});
		},
		async function (callback) {
			var users = await Customer.find({
			    'status': { $in: statusByStatus }, role_id: 3,
				created_date: {  
					$gte: isp_min,  
					$lte: isp_max
				}
			}).select(['_id', 'created_date','last_paid_amount', 'status']);
			
			if (users) { 
				users.forEach(function (user, key, value) {
					let monthName = moment(user.created_date).format("MMM");
					ispReports.map(index => index.key == monthName ? index.value += 1 : index.value);
				});
			}
			var users1 = await Customer.find({
			    'status': { $in: statusByStatus }, role_id: 2,
				created_date: {  
					$gte: isp_min,  
					$lte: isp_max
				}
			}).select(['_id', 'created_date','last_paid_amount', 'status']);
			
			if (users1) { 
				users1.forEach(function (user, key, value) {
					let monthName = moment(user.created_date).format("MMM");
					ispReports.map(index => index.key == monthName ? index.value1 += 1 : index.value);
				});
			}
			data.ispReports = ispReports;
			data.isp_min = isp_min;
			date2.setDate(date2.getDate() - 1)
	        isp_max = moment(date2,"yyyy-mm-dd");
			data.isp_max = isp_max;
		//	console.log(JSON.stringify(ispReports)); 

		var users2 = await Customer.find({
			'status': { $in: statusByStatus },
			 role_id: '3',
		}).select(['_id', 'created_date','last_paid_amount', 'status']);
		
		const paymentReports = [ 
			{ key: 'Jan', value: 0 },
			{ key: 'Feb', value: 0 },
			{ key: 'Mar', value: 0 },
			{ key: 'Apr', value: 0 },
			{ key: 'May', value: 0 },
			{ key: 'Jun', value: 0 },
			{ key: 'Jul', value: 0 },
			{ key: 'Aug', value: 0 },
			{ key: 'Sep', value: 0 },
			{ key: 'Oct', value: 0 },
			{ key: 'Nov', value: 0 },
			{ key: 'Dec', value: 0 }
		];
		if (users2) { 
			users2.forEach(function (user, key, value) {
				let monthName = moment(user.created_date).format("MMM");
				let amount = user.last_paid_amount;
				paymentReports.map(index => index.key == monthName ? index.value += amount : index.value);
			});
		}
		data.paymentReports = paymentReports;
		data.min = '';
		data.max = '';
		callback();
		},
	];
	Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
		if (err) {
			data.customerCount = customerCount;
			data.ispsCount = ispsCount;
			res.render('admin/dashboard', data);
		} else {
			res.render('admin/dashboard', data);
		}
	});
}


