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
var sendReminder = require('../../models/isp/sendReminder');
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
		.sort({$natural:-1})
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
	let popupContentReminder = [];
	var newService_category = new manage_pop_content();

	profileImageUpload(req, res, function (err) {
		if (typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == '') {
			var profileImageNewName = 'avatar.png';
		} else {
			var profileImageNewName = req.files['profileImage'][0].filename;
			console.log(req.files['profileImage'][0]);
		}
		
		let {content_for,content_title,content,expiring_on,name}=req.body;
		var dobj = expiring_on;
		if(req.body.Customer == 'on' && !req.body.BusinessOwner){
			content_for = 'Customer';
		} else if(req.body.BusinessOwner == 'on' && !req.body.Customer){
			content_for = 'Business Owner';
		} else {
			content_for = 'Both';
		}
		newService_category.content_image = profileImageNewName; 
		newService_category.name =name;
		newService_category.content_for =content_for;
		newService_category.content_title =content_title;
		newService_category.content =content; 
		newService_category.status = 'active'; 
		newService_category.expiring_on =dobj;
		newService_category.save(async function (err, user) {
			if (err) {
				throw err;
			}
			user = JSON.parse(JSON.stringify(user));
			popupContentReminder.push({
				_id: user._id,
				notificationType: 'Popup Content',
				status: 'active',
				content_for: content_for,
				content_title: content_title,
				content: content,
				expiring_on: dobj,
				ispProfile: profileImageNewName
			}); 
			await sendReminder.create(popupContentReminder);
			req.flash('success', 'Pop up content created!');
			res.redirect(baseUrl + 'admin/manage_pop_content');
		});
	});
}

exports.edit = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.moment = moment;
	data.lowerCase = lowerCase;
	data.trim = trim;

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
	let popupContentReminder = [];
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

		var expiring_on = req.body.expiring_on;
		let content_for;
		if(req.body.Customer == 'on' && !req.body.BusinessOwner){
			content_for = 'Customer';
		} else if(req.body.BusinessOwner == 'on' && !req.body.Customer){
			content_for = 'Business Owner';
		} else {
			content_for = 'Both';
		}
		req.body.content_for = content_for;
		manage_pop_content.update({ _id: req.body._id }, req.body, async function (err, updatedresult) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/manage_pop_content');
			} else {
				await sendReminder.findOneAndRemove({_id: req.body._id});
				popupContentReminder.push({
					_id: req.body._id,
					notificationType: 'Popup Content',
					status: 'active',
					content_for: content_for,
					content_title: req.body.content_title,
					content: req.body.content,
					expiring_on: expiring_on,
					ispProfile: req.body.content_image
				}); 
				await sendReminder.create(popupContentReminder);

				req.flash('success', 'POP up content updated!');
				res.redirect(baseUrl + 'admin/manage_pop_content');
			}
		});
	});
}

exports.changeStatus = function (req, res) {
	var data = {};
	var statusMessage = "";
	if(req.params.status == "active"){
        statusMessage = "Activated";
	}
	else{
		statusMessage = "Inactivated";
	}
	req.body.updated_date = new Date();
	req.body.status = req.params.status;

	manage_pop_content.update({ _id: req.params.id }, req.body, async function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/manage_pop_content');
		} else {
			await sendReminder.update({ _id: req.params.id }, req.body);
			req.flash('success', `Popup Content ${statusMessage}!`);
			res.redirect(baseUrl + 'admin/manage_pop_content');
		}
	});
}

exports.delete = function (req, res) {
	var data = {};

	manage_pop_content.findOneAndRemove({ _id: req.params.id }, async function (err, resultForDelete) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/manage_pop_content');
		} else {
			await sendReminder.findOneAndRemove({ _id: req.params.id });
			req.flash('success', 'POP up content deleted!');
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
