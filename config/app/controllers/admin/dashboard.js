var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Customer = require('../../models/home');
var Email = require('../../../lib/email.js');

var Async = require('async');
var usersSubscription = require('../../models/admin/users_subscription');

exports.dashboard = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;

	var statusByStatus = ['active', 'inactive'];
	var todayDate = dateFormat(Date.now(), "yyyy-mm-dd");

	var tasks = [
		function (callback) {
			Customer.count({ role_id: '2', 'status': { $in: statusByStatus } }, function (err, count) {
				if (err) {
					data.customerCount = 0;
					callback();
				} else {
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
					data.ispsCount = count;
					callback();
				}
			});
		},
	];
	Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
		if (err) {
			data.customerCount = 0;
			data.ispsCount = 0;
			res.render('admin/dashboard', data);
		} else {
			res.render('admin/dashboard', data);
		}
	});
}


