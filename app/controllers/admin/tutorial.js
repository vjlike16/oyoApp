var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var lowerCase = require('lower-case');
var faq = require('../../models/admin/tutorial');
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
				res.render('admin/tutorial/listing', data);
			} else {
				data.result = result;
				res.render('admin/tutorial/listing', data);
			}
		});
 
}

exports.add = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	res.render('admin/tutorial/add', data);
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

			req.flash('success', 'Tutorial added successfully.');
			//console.log("DATA OF FORM  :"+JSON.stringify(newfaq));
			res.redirect(baseUrl + 'admin/tutorial');
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
			res.render('admin/tutorial/edit', data);
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
			res.render('admin/tutorial/view', data);
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
				req.flash('success', 'Tutorial updated successfully.');
				res.redirect(baseUrl + 'admin/tutorial');
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
			res.redirect(baseUrl + 'admin/tutorial');
		} else {
			req.flash('success', `FAQ  ${statusMessage} Successfully.`);
			res.redirect(baseUrl + 'admin/tutorial');
		}
	});
}

exports.delete = function (req, res) {
	faq.findOneAndRemove({ _id: req.params.id }, function (err, resultForDelete) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/tutorial');
		} else {
			req.flash('success', 'Tutorial deleted Successfully.');
			res.redirect(baseUrl + 'admin/tutorial');
		}
	});
}
