var numeral = require('numeral');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var lowerCase = require('lower-case');
var Setting = require('../../models/admin/setting');
var trim = require('trim');
var moment = require('moment');
var fs = require('fs');


exports.edit = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	Setting.find({}, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/setting/edit', data);
		}
	});
}

exports.update = function (req, res) {
	console.log('------------req.body', req.body);
	Setting.update(
		{
			key_name: req.body.key_name
		},
		{
			key_name: req.body.key_name,
			value:req.body[req.body.key_name],
			created_date: moment.utc(),
			updated_date: moment.utc(),
		},
		{ upsert: true }

		, function (err, updatedresult) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/setting');
			} else {
				var message = req.body.key_name;
				var updated_message = "";
				if(message == 'maximum_service_isp'){
                   updated_message = "Manage Service ISP Updated!"; 
				}
				else if(message == "maximum_allowed_customers"){
				   updated_message = "Maximum Allowed Customers Updated!"; 
				}
				else if(message == "tracking_code"){
					updated_message = "Tracking Order Updated!"; 
				 }
				 else if(message == "from_email"){
					updated_message = "Email Address Updated!";
				 }
				req.flash('success', updated_message);
				res.redirect(baseUrl + 'admin/setting');
			}
		});
}
