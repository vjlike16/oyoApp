var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var lowerCase = require('lower-case');
var manage_subscription_plan = require('../../models/admin/manage_subscription_plan');
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
	manage_subscription_plan.find({
		'status': { $in: statusByStatus }
	})
		.sort({ 'created_date': -1 })
		.exec(function (err, result) { 
			if (err) {
				data.result = '';
				res.render('admin/manage_subscription_plan/listing', data);
			} else {
				data.result = result;
				res.render('admin/manage_subscription_plan/listing', data);
			}
		});  
 
}

exports.add = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	res.render('admin/manage_subscription_plan/add', data);
}


exports.save = function (req, res) {
	var newmanage_subscription_plan = new manage_subscription_plan();
	var day = moment.utc();

		newmanage_subscription_plan._id = mongoose.Types.ObjectId();
		newmanage_subscription_plan.plan_name = req.body.plan_name;
		newmanage_subscription_plan.trial_duration = req.body.trial_duration; 
		newmanage_subscription_plan.status = 'active';
		newmanage_subscription_plan.annual_price = req.body.annual_price; 
		newmanage_subscription_plan.monthly_price = req.body.monthly_price; 
		newmanage_subscription_plan.created_date = day;
		newmanage_subscription_plan.updated_date = day; 

		newmanage_subscription_plan.save(function (err) {
			if (err)
				throw err;

			req.flash('success', 'Subscription Plan Created Successfully.');
			res.redirect(baseUrl + 'admin/manage_subscription_plan');
		});
}


exports.edit = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	manage_subscription_plan.findOne({ '_id': req.params.id }, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			data.result.expiring_on = new String (result.expiring_on)
			res.render('admin/manage_subscription_plan/edit', data);
		}
	});
}

exports.view = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	manage_subscription_plan.findOne({ '_id': req.params.id }, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/manage_subscription_plan/view', data);
		}
	});
 
}

exports.update = function (req, res) {
		req.body.updated_date = moment.utc();
		manage_subscription_plan.update({ _id: req.body._id }, req.body, function (err, updatedresult) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/manage_subscription_plan');
			} else {
				req.flash('success', 'Subscription Plan Updated Successfully.');
				res.redirect(baseUrl + 'admin/manage_subscription_plan');
			}
		});
}

exports.changeStatus = function (req, res) {
	req.body.updated_date = new Date();
	req.body.status = req.params.status;
	var statusMessage = "";
	if(req.params.status == "active"){
        statusMessage = "Activated";
	}
	else{
		statusMessage = "Inactivated";
	}

	manage_subscription_plan.update({ _id: req.params.id }, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/manage_subscription_plan');
		} else {
			req.flash('success', `Subscription Plan ${statusMessage} Successfully.`);
			res.redirect(baseUrl + 'admin/manage_subscription_plan');
		}
	});
}

exports.delete = function (req, res) {
	manage_subscription_plan.findOneAndRemove({ _id: req.params.id }, function (err, resultForDelete) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/manage_subscription_plan');
		} else {
			req.flash('success', 'Subscription Plan Deleted Successfully.');
			res.redirect(baseUrl + 'admin/manage_subscription_plan');
		}
	});
}

exports.checknameexist = function (req, res) {
	var name = req.body.name;
	manage_subscription_plan.findOne(
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
	manage_subscription_plan.findOne(
		{
			'name': new RegExp(name, 'i'), '_id': { $ne: user_id },
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
