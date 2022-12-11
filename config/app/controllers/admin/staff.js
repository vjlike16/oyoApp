var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var User = require('../../models/home');
var Email = require('../../../lib/email.js');
var fs = require('fs');
var mongoose = require('mongoose');
var lowerCase = require('lower-case');
var trim = require('trim');

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
var cpUpload = upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'bar_registration_certificate', maxCount: 8 }]);
var singleUpload = upload.fields([{ name: 'profileImage', maxCount: 1 }]);
/**** end ****/

exports.save = function (req, res) {
	var newUser = new User();
	var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
	var new_id = mongoose.Types.ObjectId();
	var active_code = Math.random().toString(36).slice(-20);

	cpUpload(req, res, function (err) {
		if (typeof req.files == 'undefined' || typeof req.files['bar_registration_certificate'] == 'undefined' || req.files['bar_registration_certificate'] == '') {
			var barRegistrationCertificateNewName = 'null';
		} else {
			var barRegistrationCertificateNewName = req.files['bar_registration_certificate'][0].filename;
		}

		if (typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == '') {
			var profileImageNewName = 'null';
		} else {
			var profileImageNewName = req.files['profileImage'][0].filename;
		}

		if (req.body.role_id == 'steno_l1') {
			newUser.role_id = req.body.steno_l1;
		} else {
			newUser.role_id = req.body.role_id;
		}

		newUser.profileImage = profileImageNewName;
		newUser.bar_registration_certificate = barRegistrationCertificateNewName;

		newUser.mail = req.body.mail;
		newUser.password = newUser.generateHash(Math.floor((Math.random() * 222) * 999));
		newUser.name = req.body.name;
		newUser.mobile = req.body.mobile;
		newUser.alternate_mobile = req.body.alternate_mobile;
		newUser.dob = req.body.dob;
		newUser.doa = req.body.doa;
		newUser.address = req.body.address;

		newUser.name_of_colleage = req.body.name_of_colleage;
		newUser.university = req.body.university;
		newUser.passing_year = req.body.passing_year;

		newUser.registered_bar_council = req.body.registered_bar_council;
		newUser.name_of_bar_registered_with = req.body.name_of_bar_registered_with;

		newUser.verify = 0;
		newUser.active_hash = active_code;

		newUser._id = new_id;
		newUser.status = 'active';
		newUser.created_date = day;
		newUser.updated_date = day;

		newUser.save(function (err) {
			if (err)
				throw err;

			//ready content for send email						
			var content = {};
			var content = {
				'name': req.body.name,
				'email': req.body.mail,
				'subject': 'Welcome to OYO',
				'templatefoldername': 'createPassword',
				'id': new_id,
				'token': active_code
			};

			//Sending new password via Email
			Email.send_email(content);

			req.flash('success', 'Staff created successfully.');
			res.redirect(baseUrl + 'admin/staff');

		});
	});
}

exports.update = function (req, res) {
	cpUpload(req, res, function (err) {

		if (typeof req.files == 'undefined' || typeof req.files['bar_registration_certificate'] == 'undefined' || req.files['bar_registration_certificate'] == '') {
			req.body.bar_registration_certificate = req.body.uploaded_bar_registration_certificate;
			// to remove old uploaded certificate image
		} else {
			req.body.bar_registration_certificate = req.files['bar_registration_certificate'][0].filename;
			if (req.body.uploaded_bar_registration_certificate != '' || req.body.uploaded_bar_registration_certificate != 'null' || req.body.uploaded_bar_registration_certificate != 'Null') {
				var filePath = 'public/uploads/profile/' + req.body.uploaded_bar_registration_certificate;
				fs.unlink(filePath, function (err) {
					console.log('Successfully deleted certificate uploaded file.');
				});
			}
		}


		if (typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == '') {
			req.body.profileImage = req.body.uploaded_profileImage;
		} else {
			req.body.profileImage = req.files['profileImage'][0].filename;
			// to remove old uploaded certificate image
			if (req.body.uploaded_profileImage != '' || req.body.uploaded_profileImage != 'null' || req.body.uploaded_profileImage != 'Null') {
				var filePath = 'public/uploads/profile/' + req.body.uploaded_profileImage;
				fs.unlink(filePath, function (err) {
					console.log('Successfully deleted profile uploaded file.');
				});
			}
		}

		if (req.body.role_id == 'steno_l1') {
			req.body.role_id = req.body.steno_l1;
		} else {
			req.body.role_id = req.body.role_id;
		}
		req.body.updated_date = new Date();
		User.update({ _id: req.body._id }, req.body, function (err, updatedUser) {
			if (err) {
				req.flash('success', 'Staff updated successfully.');
				res.redirect(baseUrl + 'admin/staff');
			} else {
				req.flash('success', 'Staff updated successfully.');
				res.redirect(baseUrl + 'admin/staff');
			}

		});
	});
}

exports.login = function (req, res) {
	if (req.session.userAdminSession) {
		res.redirect(baseUrl + 'admin/dashboard');
	} else {
		res.render('admin/login', {
			error: req.flash("error"),
			success: req.flash("success"),
			session: req.session
		});
	}
}

exports.loggedIn = function (req, res, next) {
	if (req.session.userAdminSession) { // req.session.passport._id
		next();
	} else {
		res.redirect(baseUrl + 'admin');
	}
}

exports.add = function (req, res) {
	res.render('admin/staff/add', {
		error: req.flash("error"),
		success: req.flash("success"),
		session: req.session
	});
}

exports.resetpassword = function (req, res) {
	res.render('admin/resetpassword', {
		error: req.flash("error"),
		success: req.flash("success"),
		session: req.session
	});
}

exports.reset_password_save = function (req, res) {
	var data = {};
	var newPassword = req.body.password;
	req.body.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
	req.body.verify = 1;
	req.body.updated_date = new Date();

	var active_hash = Math.random().toString(36).slice(-20);
	req.body.active_hash = active_hash;

	User.findOne({ '_id': req.params.id, 'active_hash': req.params.token })
		.exec(function (err, userDetails) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/staff/resetpassword/' + req.params.id + '/' + req.params.token);
			} else {
				if (!userDetails) {
					req.flash('error', 'Link has been expired.');
					res.redirect(baseUrl + 'admin/staff/resetpassword/' + req.params.id + '/' + req.params.token);
				} else {
					User.update({ _id: req.params.id }, req.body, function (err, updatedUser) {
						if (err) {
							req.flash('error', 'Sorry something went wrong.');
							res.redirect(baseUrl + 'admin/staff/resetpassword/' + req.params.id + '/' + req.params.token);
						} else {
							//ready content for send email						
							var content = {};
							var content = {
								'name': userDetails.name,
								'email': userDetails.mail,
								'subject': 'New Credential',
								'templatefoldername': 'accountActivated',
								'password': newPassword,
								'content': 'We have successfully reset your password, Please fill below credentials for login, after click on below login button.'
							};
							//Sending new data via Email
							Email.send_email(content);

							req.flash('success', 'Password set successfully.');
							res.redirect(baseUrl + 'admin');
						}
					});
				}
			}
		});

}

exports.createpassword = function (req, res) {
	res.render('admin/createpassword', {
		error: req.flash("error"),
		success: req.flash("success"),
		session: req.session
	});
}

exports.create_password_save = function (req, res) {
	var data = {};
	var newPassword = req.body.password;
	req.body.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
	req.body.verify = 1;
	req.body.updated_date = new Date();
	var active_hash = Math.random().toString(36).slice(-20);
	req.body.active_hash = active_hash;

	User.findOne({ '_id': req.params.id, 'active_hash': req.params.token })
		.exec(function (err, userDetails) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/staff/createpassword/' + req.params.id + '/' + req.params.token);
			} else {
				if (!userDetails) {
					req.flash('error', 'Link has been expired.');
					res.redirect(baseUrl + 'admin/staff/createpassword/' + req.params.id + '/' + req.params.token);
				} else {
					User.update({ _id: req.params.id }, req.body, function (err, updatedUser) {
						if (err) {
							req.flash('error', 'Sorry something went wrong.');
							res.redirect(baseUrl + 'admin/staff/createpassword/' + req.params.id + '/' + req.params.token);
						} else {
							//ready content for send email						
							var content = {};
							var content = {
								'name': userDetails.name,
								'email': userDetails.mail,
								'subject': 'Account Activated',
								'templatefoldername': 'accountActivated',
								'password': newPassword,
								'content': "Welcome to OYO! Thank you so much for joining us. We have successfully activated your account, Please fill below credentials for login, after click on below login button."
							};
							//Sending new data via Email
							Email.send_email(content);

							req.flash('success', 'Password set successfully.');
							res.redirect(baseUrl + 'admin');
						}
					});
				}
			}
		});

}

exports.reset_password_by_admin = function (req, res) {
	var data = {};
	var active_hash = Math.random().toString(36).slice(-20);
	var id = req.params.id;

	req.body.active_hash = active_hash;
	req.body.updated_date = new Date();

	User.findOne({ '_id': req.params.id }, function (err, userDetails) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/staff');
		} else {
			User.update({ _id: req.params.id }, req.body, function (err, updatedUser) {
				if (err) {
					req.flash('error', 'Sorry something went wrong.');
					res.redirect(baseUrl + 'admin/staff');
				} else {
					//ready content for send email						
					var content = {};
					var content = {
						'name': userDetails.name,
						'email': userDetails.mail,
						'subject': 'Reset Password',
						'templatefoldername': 'resetPassword',
						'id': id,
						'token': active_hash,
						'content': 'Please click on below Reset Password button to reset your password.'
					};
					//Sending new data via Email
					Email.send_email(content);

					req.flash('success', 'We have sent the reset password link to the registered email.');
					res.redirect(baseUrl + 'admin/staff');
				}
			});
		}
	});
}

exports.allusers = function (req, res) {
	var data = {};
	data.active = 'users';
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;


	var statusByStatus = ['active', 'inactive'];
	User.find({
		role_id: { $in: [4, 5, 6, 7, 8] }, 'status': { $in: statusByStatus }
	})
		.select(['_id', 'name', 'mail', 'status', 'created_date'])
		.sort({ 'created_date': -1 })
		.exec(function (err, result) {
			if (err) {
				data.result = '';
				res.render('admin/staff/users', data);
			} else {
				data.result = result;
				res.render('admin/staff/users', data);
			}
		});
}

exports.listingWithDatatable = function (req, res) {
	var lengthLocal = parseInt(req.body);
	var lengthLocal = parseInt(req.body.length);
	var skipLocal = parseInt(req.body.start);

	var statusByStatus = req.body.sort_by_status;
	if (statusByStatus == '') {
		statusByStatus = ['active', 'inactive'];
	}

	var extra_sort_field_name = req.body.extra_sort_field_name;
	var extra_sort_field_value = req.body.extra_sort_field_value;

	if (!extra_sort_field_value) {
		extra_sort_field_name = 'created_date';
	}


	if (extra_sort_field_value == 'ascending') {
		extra_sort_field_value = 1;
	} else if (extra_sort_field_value == 'descending') {
		extra_sort_field_value = -1;
	} else {
		extra_sort_field_value = -1;
	}


	/**For get data  **/
	User.find({
		role_id: { $in: [4, 5, 6, 7, 8] }, 'status': { $in: statusByStatus },
		'$or': [
			{ name: new RegExp(req.body.search.value, 'i') },
			{ mail: new RegExp(req.body.search.value, 'i') },
			{ status: new RegExp(req.body.search.value, 'i') }
		]
	})
		.limit(lengthLocal)
		.skip(skipLocal)
		//.sort({'name': -1})
		.sort({ [extra_sort_field_name]: extra_sort_field_value }) //working code
		.exec(function (err, result) {
			if (err) {
				console.log(err);
			} else {
				/**For get count **/
				User.count({
					role_id: { $in: [4, 5, 6, 7, 8] }, 'status': { $in: statusByStatus },
					'$or': [
						{ name: new RegExp(req.body.search.value, 'i') },
						{ mail: new RegExp(req.body.search.value, 'i') },
						{ status: new RegExp(req.body.search.value, 'i') }
					]
				}, function (err, count) {
					if (err) {
						res.send(err);
					} else {
						res.json({
							data: result,
							recordsFiltered: count,
							recordsTotal: count
						});
					}
				});
			}
		});
}



exports.edit = function (req, res) {
	var data = {};
	data.active = 'staff';
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	User.findOne({ '_id': req.params.id }, function (err, user) {
		if (err) {
			res.send(err);
		} else {
			data.userDetails = user;
			res.render('admin/staff/edit', data);
		}
	});
}

exports.view = function (req, res) {
	var data = {};
	data.active = 'staff';
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	User.findOne({ '_id': req.params.id }, function (err, user) {
		if (err) {
			res.send(err);
		} else {
			data.userDetails = user;
			res.render('admin/staff/view', data);
		}
	});
}

exports.editprofile = function (req, res) {
	var data = {};
	data.active = 'staff';
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	User.findOne({ '_id': req.params.id }, function (err, user) {
		if (err) {
			res.send(err);
		} else {
			data.userDetails = user;
			res.render('admin/staff/editprofile', data);
		}
	});
}

exports.updatebystaff = function (req, res) {
	singleUpload(req, res, function (err) {
		if (typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == '') {
			req.body.profileImage = req.body.uploaded_profileImage;
		} else {
			req.body.profileImage = req.files['profileImage'][0].filename;
			// to remove old uploaded certificate image
			if (req.body.uploaded_profileImage != '' || req.body.uploaded_profileImage != 'null' || req.body.uploaded_profileImage != 'Null') {
				var filePath = 'public/uploads/profile/' + req.body.uploaded_profileImage;
				fs.unlink(filePath, function (err) {
					console.log('Successfully deleted profile uploaded file.');
				});
			}
		}


		req.body.updated_date = new Date();

		/** Update all request data **/
		req.body.updated_date = new Date();
		User.update({ _id: req.body._id }, req.body, function (err, updatedUser) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/dashboard');
			} else {
				User.findOne({ '_id': req.body._id }, function (err, user) {
					if (err) {
						req.flash('error', 'Sorry something went wrong.');
						res.redirect(baseUrl + 'admin/dashboard');
					} else {
						//Update session
						req.session.userAdminSession = user;
						req.flash('success', 'Profile updated!');
						res.redirect(baseUrl + 'admin/dashboard');
					}
				});
			}
		});

	})
}

exports.delete = function (req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = 'delete';

	User.update({ _id: req.params.id }, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/staff');
		} else {
			req.flash('success', 'Staff deleted successfully.');
			res.redirect(baseUrl + 'admin/staff');
		}
	});
}

exports.changepassword = function (req, res) {
	res.render('admin/staff/changepassword', {
		error: req.flash("error"),
		success: req.flash("success"),
		session: req.session
	});
}


exports.changeStatus = function (req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = req.params.status;

	User.update({ _id: req.params.id }, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/staff');
		} else {
			req.flash('success', 'Staff updated successfully.');
			res.redirect(baseUrl + 'admin/staff');
		}
	});
}

exports.changepasswordsave = function (req, res) {
	var data = {};
	currentPassword = bcrypt.hashSync(req.body.currentpassword, bcrypt.genSaltSync(8), null);

	//For compare password matched or not
	bcrypt.compare(req.body.currentpassword, req.session.userAdminSession.password, function (err, isMatch) {
		if (isMatch) {

			req.body.password = bcrypt.hashSync(req.body.newpassword, bcrypt.genSaltSync(8), null);
			req.body.updated_date = new Date();
			User.update({ _id: req.session.userAdminSession._id }, req.body, function (err, updatedUser) {
				if (err) {
					req.flash('error', 'Sorry something went wrong.');
					res.redirect(baseUrl + 'admin/staff/changepassword');
				} else {
					User.findOne({ '_id': req.session.userAdminSession._id }, function (err, user) {
						if (err) {
							req.flash('error', 'Sorry something went wrong.');
							res.redirect(baseUrl + 'admin/staff/changepassword');
						} else {
							//Update session
							req.session.userAdminSession = user;
							req.flash('success', 'Password updated successfully.');
							res.redirect(baseUrl + 'admin/staff/changepassword');
						}
					});

				}
			});
		} else {

			req.flash('error', 'Sorry current password does not matched.');
			res.redirect(baseUrl + 'admin/staff/changepassword');
		}
	});
} 