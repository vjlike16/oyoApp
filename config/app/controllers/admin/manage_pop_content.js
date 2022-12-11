var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var lowerCase = require('lower-case');

var trim = require('trim');
var moment = require('moment');
var fs = require('fs');

/* For Image Upload Configration */
const multer = require('multer');
const manage_pop_content = require('../../models/admin/manage_pop_content');
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

/* working now */
exports.listing = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;

	var statusByStatus = ['active', 'inactive'];
	manage_pop_content.find({
		'status': { $in: statusByStatus }
	})
		.sort({ 'created_date': -1 })
		.exec(function (err, result) {
			if (err) {
				data.result = '';
				res.render('admin/manage_pop_content/listing', data);
			} else {
				data.result = result;
				res.render('admin/manage_pop_content/listing', data);
			}
		});

}

/* working now */
exports.add = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	res.render('admin/manage_pop_content/add', data);
}


exports.save = function (req, res) {
	var newService_category = new manage_pop_content();
	

	profileImageUpload(req, res, function (err) {
		if (typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == '') {
			var profileImageNewName = 'avatar.png';
		} else {
			var profileImageNewName = req.files['profileImage'][0].filename;
			console.log(req.files['profileImage'][0]);
		}

		//var test = req.body.expiring_on;
//var mtest = moment(test,"MM-DD-YYYY")
//mtest.toISOString()
//"2015-07-13T06:00:00.000Z"

	const {content_title,content,expiring_on,name}=req.body;
	var day = moment.tz('America/Chicago');
		newService_category.content_image = profileImageNewName;
		newService_category.name =name
		newService_category.content_title =content_title ;
		newService_category.content =content;
		newService_category.status = 'active';
		
	//console.log("printit" + req.body.expiring_on)
		newService_category.expiring_on =day;
		newService_category.save(function (err) {
			if (err)
				throw err;

			req.flash('success', 'Content saved successfully.');
			res.redirect(baseUrl + 'admin/manage_pop_content');
		});
	});
}


exports.edit = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	manage_pop_content.findOne({ '_id': req.params.id }, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/manage_pop_content/edit', data);
		}
	});
}

exports.view = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	manage_pop_content.findOne({ '_id': req.params.id }, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/manage_popup_content/view', data);
		}
	});

}

exports.update = function (req, res) {
	var data = {};

	profileImageUpload(req, res, function (err) {
		if (typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == '') {
			req.body.content_image = req.body.uploaded_profileImage;
		} else {
			req.body.content_image = req.files['profileImage'][0].filename;
			// to remove old uploaded certificate image
			if (req.body.uploaded_profileImage != '' || req.body.uploaded_profileImage != 'null' || req.body.uploaded_profileImage != 'Null') {
				var filePath = 'public/uploads/profile/' + req.body.uploaded_profileImage;
				fs.unlink(filePath, function (err) {
					console.log('successfully deleted profile uploaded file');
				});
			}
		}

		req.body.updated_date = moment.tz("America/Chicago");
		manage_pop_content.update({ _id: req.body._id }, req.body, function (err, updatedresult) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/manage_pop_content');
			} else {
				req.flash('success', 'Record updated successfully.');
				res.redirect(baseUrl + 'admin/manage_pop_content');
			}
		});
	});
}

exports.changeStatus = function (req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = req.params.status;

	manage_pop_content.update({ _id: req.params.id }, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/manage_pop_content');
		} else {
			req.flash('success', 'Record updated successfully.');
			res.redirect(baseUrl + 'admin/manage_pop_content');
		}
	});
}

exports.delete = function (req, res) {
	var data = {};

	manage_pop_content.findOneAndRemove({ _id: req.params.id }, function (err, resultForDelete) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/manage_pop_content');
		} else {
			req.flash('success', 'Record deleted successfully.');
			res.redirect(baseUrl + 'admin/manage_pop_content');
		}
	});
}

exports.checknameexist = function (req, res) {
	var name = req.body.name;
	manage_pop_content.findOne(
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
	manage_pop_content.findOne(
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
