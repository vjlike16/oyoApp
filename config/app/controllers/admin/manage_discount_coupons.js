var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var lowerCase = require('lower-case');
var manage_discount_coupons = require('../../models/admin/manage_discount_coupons');
var trim = require('trim');
var moment = require('moment');


exports.listing = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;

	var statusByStatus = ['active', 'inactive'];
	manage_discount_coupons.find({
		'status': { $in: statusByStatus }
	})
		.sort({ 'created_date': -1 })
		.exec(function (err, result) { 
			if (err) {
				data.result = '';
				res.render('admin/manage_discount_coupons/listing', data);
			} else {
				data.result = result;
				res.render('admin/manage_discount_coupons/listing', data);
			}
		});
 
}

exports.add = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	res.render('admin/manage_discount_coupons/add', data);
}


exports.save = function (req, res) {
	var newmanage_discount_coupons = new manage_discount_coupons();
	var day = moment.utc();

		newmanage_discount_coupons._id = mongoose.Types.ObjectId();
		newmanage_discount_coupons.code_name = req.body.code_name;
		newmanage_discount_coupons.max_allowed = req.body.max_allowed; 
		newmanage_discount_coupons.status = 'active';
		newmanage_discount_coupons.type = req.body.type; 
		newmanage_discount_coupons.type = req.body.used_so_far; 
		newmanage_discount_coupons.expiring_on = req.body.expiring_on;
		newmanage_discount_coupons.created_date = day;
		newmanage_discount_coupons.updated_date = day; 

		newmanage_discount_coupons.save(function (err) {
			if (err)
				throw err;

			req.flash('success', 'Content saved successfully.');
		//	console.log("DATA OF FORM  :"+JSON.stringify(newmanage_discount_coupons));
			res.redirect(baseUrl + 'admin/manage_discount_coupons');
		});
}


exports.edit = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	manage_discount_coupons.findOne({ '_id': req.params.id }, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			data.result.expiring_on = new String (result.expiring_on)
			res.render('admin/manage_discount_coupons/edit', data);
		}
	});
}

exports.view = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	manage_discount_coupons.findOne({ '_id': req.params.id }, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/manage_discount_coupons/view', data);
		}
	});
 
}

exports.update = function (req, res) {
		req.body.updated_date = moment.utc();
		manage_discount_coupons.update({ _id: req.body._id }, req.body, function (err, updatedresult) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/manage_discount_coupons');
			} else {
				req.flash('success', 'Record updated successfully.');
				res.redirect(baseUrl + 'admin/manage_discount_coupons');
			}
		});
}

exports.changeStatus = function (req, res) {
	req.body.updated_date = new Date();
	req.body.status = req.params.status;

	manage_discount_coupons.update({ _id: req.params.id }, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/manage_discount_coupons');
		} else {
			req.flash('success', 'Record updated successfully.');
			res.redirect(baseUrl + 'admin/manage_discount_coupons');
		}
	});
}

exports.delete = function (req, res) {
	manage_discount_coupons.findOneAndRemove({ _id: req.params.id }, function (err, resultForDelete) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/manage_discount_coupons');
		} else {
			req.flash('success', 'Record deleted successfully.');
			res.redirect(baseUrl + 'admin/manage_discount_coupons');
		}
	});
}

exports.checknameexist = function (req, res) {
	var name = req.body.name;
	manage_discount_coupons.findOne(
		{
			'name': new RegExp(name, 'i'),
			$or: [{ 'status': 'active' }, { 'status': 'inactive' }]
		}, function (err, user) {
			if (err) {
				res.send('true');
			}
			if (user) {
				res.send('false');
			}

			if (!user) {
				res.send('true');
			}
		});
}

exports.checknameexistexceptthis = function (req, res) {
	var name = req.body.name;
	var user_id = req.body.user_id;
	manage_discount_coupons.findOne(
		{
			'name': new RegExp(name, 'i'), '_id': { $ne: user_id },
			$or: [{ 'status': 'active' }, { 'status': 'inactive' }]
		}, function (err, user) {
			console.log("user",user);
			if (err) {
				res.send('true');
			}
			if (user) {
				res.send('false');
			}

			if (!user) {
				res.send('true');
			}
		});
}
