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
			value: req.body[req.body.key_name],
			created_date: moment.utc(),
			updated_date: moment.utc(),
		},
		{ upsert: true }

		, function (err, updatedresult) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/setting');
			} else {
				req.flash('success', 'Record updated successfully.');
				res.redirect(baseUrl + 'admin/setting');
			}
		});
}
