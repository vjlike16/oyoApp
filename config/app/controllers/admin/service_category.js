var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var lowerCase = require('lower-case');
var Service_category = require('../../models/admin/service_category');
var trim = require('trim');
var moment = require('moment');
var fs = require('fs');

/* For Image Upload Configration */
const multer = require('multer')
const Storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads/profile')
	},
	filename: function (req, file, cb) {
		//cb(null, datetimestamp+'_'+file.originalname);
		var datetimestamp = Date.now();
		var fileOriginalname = file.originalname;
		fileOriginalname = fileOriginalname.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
		cb(null, datetimestamp + '_' + fileOriginalname);
		//cb(null, datetimestamp+'_');

	}
});
const upload = multer({ storage: Storage });
var profileImageUpload = upload.fields([{ name: 'profileImage', maxCount: 1 }]);
/* end */


exports.listing = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;

	var statusByStatus = ['active', 'inactive'];
	Service_category.find({
		'status': { $in: statusByStatus }
	})
		.sort({ 'created_date': -1 })
		.exec(function (err, result) {
			if (err) {
				data.result = '';
				res.render('admin/service_category/listing', data);
			} else {
				data.result = result;
				res.render('admin/service_category/listing', data);
			}
		});

}

exports.add = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	res.render('admin/service_category/add', data);
}


exports.save = function (req, res) {
	var newService_category = new Service_category();
	var day = moment.utc();

	profileImageUpload(req, res, function (err) {
		if (typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == '') {
			var profileImageNewName = 'avatar.png';
		} else {
			var profileImageNewName = req.files['profileImage'][0].filename;
			console.log(req.files['profileImage'][0]);
		}

		newService_category.icon = profileImageNewName;
		newService_category._id = mongoose.Types.ObjectId();
		newService_category.name = req.body.name;
		newService_category.pagecontent = req.body.pagecontent;
		newService_category.status = 'active';
		newService_category.created_date = day;
		newService_category.updated_date = day;

		newService_category.save(function (err) {
			if (err)
				throw err;

			req.flash('success', 'Category added!');
			res.redirect(baseUrl + 'admin/service_category');
		});
	});
}


exports.edit = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	Service_category.findOne({ '_id': req.params.id }, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/service_category/edit', data);
		}
	});
}

exports.view = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	Service_category.findOne({ '_id': req.params.id }, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/service_category/view', data);
		}
	});

}

exports.update = function (req, res) {
	var data = {};

	profileImageUpload(req, res, function (err) {
		if (typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == '') {
			req.body.icon = req.body.uploaded_profileImage;
		} else {
			req.body.icon = req.files['profileImage'][0].filename;
			// to remove old uploaded certificate image
			if (req.body.uploaded_profileImage != '' || req.body.uploaded_profileImage != 'null' || req.body.uploaded_profileImage != 'Null') {
				var filePath = 'public/uploads/profile/' + req.body.uploaded_profileImage;
				fs.unlink(filePath, function (err) {
					console.log('successfully deleted profile uploaded file');
				});
			}
		}

		req.body.updated_date = moment.utc();
		Service_category.update({ _id: req.body._id }, req.body, function (err, updatedresult) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/service_category');
			} else {
				req.flash('success', 'Service Category updated!');
				res.redirect(baseUrl + 'admin/service_category');
			}
		});
	});
}

exports.changeStatus = function (req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = req.params.status;

	Service_category.update({ _id: req.params.id }, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/service_category');
		} else {
			req.flash('success', 'Record updated successfully.');
			res.redirect(baseUrl + 'admin/service_category');
		}
	});
}

exports.delete = function (req, res) {
	var data = {};

	Service_category.findOneAndRemove({ _id: req.params.id }, function (err, resultForDelete) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/service_category');
		} else {
			req.flash('success', 'Category deleted!');
			res.redirect(baseUrl + 'admin/service_category');
		}
	});
}

exports.checknameexist = function (req, res) {
	var name = req.body.name;
	Service_category.findOne(
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
	Service_category.findOne(
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
