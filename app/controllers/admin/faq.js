var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var lowerCase = require('lower-case');
var faq = require('../../models/admin/faq');
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

	var striptags = require('striptags');
	data.striptags = striptags; 

	var statusByStatus = ['active', 'inactive'];
	faq.find({
		'status': { $in: statusByStatus } 
	})
		.sort({ 'created_date': -1 })
		.exec(function (err, result) { 
			if (err) {
				data.result = '';
				res.render('admin/faq/listing', data);
			} else {
				data.result = result;
				res.render('admin/faq/listing', data);
			}
		});
 
}

exports.add = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	res.render('admin/faq/add', data);
}
exports.save = function (req, res) {
	var newfaq = new faq();
	var day = moment.utc();
		newfaq._id = mongoose.Types.ObjectId();
		newfaq.question = req.body.question;
		newfaq.answer = req.body.answer; 
		newfaq.status = 'active';
		newfaq.created_date = day; 
		newfaq.updated_date = day; 

		newfaq.save(function (err) {
			if (err)
				throw err;

			req.flash('success', 'FAQ added!');
			//console.log("DATA OF FORM  :"+JSON.stringify(newfaq));
			res.redirect(baseUrl + 'admin/faq');
		});
}


exports.edit = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	faq.findOne({ '_id': req.params.id }, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/faq/edit', data);
		}
	});
}

exports.view = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	faq.findOne({ '_id': req.params.id }, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/faq/view', data);
		}
	});
 
}

exports.update = function (req, res) {
		req.body.updated_date = moment.utc();
		faq.update({ _id: req.body._id }, req.body, function (err, updatedresult) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/faq');
			} else {
				req.flash('success', 'FAQ updated!');
				res.redirect(baseUrl + 'admin/faq');
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

	faq.update({ _id: req.params.id }, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/faq');
		} else {
			req.flash('success', `FAQ  ${statusMessage} Successfully.`);
			res.redirect(baseUrl + 'admin/faq');
		}
	});
}

exports.delete = function (req, res) {
	faq.findOneAndRemove({ _id: req.params.id }, function (err, resultForDelete) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/faq');
		} else {
			req.flash('success', 'FAQ deleted!');
			res.redirect(baseUrl + 'admin/faq');
		}
	});
}

exports.checknameexist = function (req, res) {
	var name = req.body.name;
	faq.findOne(
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
	faq.findOne(
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
