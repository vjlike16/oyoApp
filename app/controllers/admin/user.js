var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var User = require('../../models/home');
var Email = require('../../../lib/email.js');
//var DataTable = require('mongoose-datatable');

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
	if (req.session.userAdminSession) {
		next();
	} else {
		res.redirect(baseUrl + 'admin');
	}
}

exports.checkUserType = function (req, res, next) {
	console.log(req.session.userAdminSession.role_id);
	if (req.session.userAdminSession) {
		if (req.session.userAdminSession.role_id == 1) {
			next();
		} else {
			res.redirect(baseUrl + 'admin/draft');
		}
	} else {
		res.redirect(baseUrl + 'admin');
	}
}

exports.alluserss = function (req, res) {
	var data = {};
	data.aaparam = req.params.mail;
	data.bbmail = req.body.mail;
	User.find({}, function (err, user) {
		if (err) {
			return done(err);
		} else {
			data.userDetails = user;
			res.status(200);
			res.result = 'success';
			res.send(data);
		}
	});
}
exports.checkemailexist = function (req, res) {
	var email_id = req.body.mail;
	User.findOne(
		{
			'mail': new RegExp(email_id, 'i'),
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


exports.checkemailexistexceptthis = function (req, res) {
	var email_id = req.body.mail;
	var user_id = req.body.user_id;
	User.findOne(
		{
			'mail': new RegExp(email_id, 'i'), '_id': { $ne: user_id },
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

exports.checkbarregistrationexist = function (req, res) {
	var bar_registration = req.body.bar_registration;
	User.findOne({
		'bar_registration': new RegExp(bar_registration, 'i'),
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

exports.checkbarregistrationexistexceptthis = function (req, res) {
	var bar_registration = req.body.bar_registration;
	var user_id = req.body.user_id;
	User.findOne({
		'bar_registration': new RegExp(bar_registration, 'i'), '_id': { $ne: user_id },
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


exports.signup = function (req, res) {
	if (req.session.userAdminSession) {
		res.redirect(baseUrl + 'admin/signup');
	} else {
		res.render('admin/signup', {
			error: req.flash("error"),
			success: req.flash("success"),
			session: req.session
		});
	}
}

exports.logout = function (req, res) {
	if (req.session.userAdminSession) {
		// req.logout(function(err) {
		// 	if (err) { return next(err); }
		// 	res.redirect(baseUrl + 'admin');
		//   });
		//req.session.userAdminSession.destroy();
		delete req.session.userAdminSession;
		res.redirect(baseUrl + 'admin');
	} else {
		res.render('admin', {
			error: req.flash("error"),
			success: req.flash("success"),
			session: req.session
		});
	}
}

exports.forgotpassword = function (req, res) {
	res.render('admin/forgotpassword', {
		error: req.flash("error"),
		success: req.flash("success"),
		session: req.session
	});
}

exports.checkandsendnewpassword = function (req, res) {
	var data = {};
	var active_hash = Math.random().toString(36).slice(-20);
	var id = req.params.id;

	req.body.active_hash = active_hash;
	req.body.updated_date = new Date();

	User.findOne({
		'status': { $ne: 'delete' }, 'mail': new RegExp(req.body.email, 'i'),
		$or: [{ 'role_id': '1' }, { 'role_id': '3' }, { 'role_id': '4' }, { 'role_id': '5' }, { 'role_id': '6' }, { 'role_id': '7' }, { 'role_id': '8' }]
	}, function (err, userDetails) {
		if (err || !userDetails) {
			req.flash('error', 'Email address does not exist. Please use a registered email address.');
			res.redirect(baseUrl + 'admin/forgotpassword');
		} else {
			User.update({ _id: userDetails._id }, req.body, function (err, updatedUser) {
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
						'id': userDetails._id,
						'token': active_hash,
						'content': 'A request was submitted to reset your account password. Please, click the link below to generate a new password. Disregard if the request to reset your password was not from you.'
					};
					//Sending new data via Email
					Email.send_email(content);

					req.flash('success', 'An email has been sent with password reset instructions.');
					res.redirect(baseUrl + 'admin/forgotpassword');
				}
			});
		}
	});
}

exports.dashboard = function (req, res) {
	res.render('admin/dashboard', {
		error: req.flash("error"),
		success: req.flash("success"),
		session: req.session,
		active: 'dashboard'
	});
}

exports.allusers = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	User.find({ 'status': 'active', 'role_id': '1' }, function (err, user) {
		if (err) {
			return done(err);
		} else {
			data.userDetails = user;
			res.render('admin/users/users', data);
		}
	});
}



exports.edit = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	User.findOne({ '_id': req.params.id }, function (err, user) {
		if (err) {
			res.send(err);
		} else {
			data.userDetails = user;
			res.render('admin/users/edit', data);
		}
	});
}

exports.update = function (req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.mail = req.body.mail.toLowerCase();
	User.update({ _id: req.body._id }, req.body, function (err, updatedUser) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/users');
		} else {
			req.flash('success', 'Account updated successfully.');
			res.redirect(baseUrl + 'admin/users');
		}
	});
}

exports.delete = function (req, res) {
	var data = {};

	User.findOneAndRemove({ _id: req.params.id }, function (err, userForDelete) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/users');
		} else {
			req.flash('success', 'Account deleted successfully.');
			res.redirect(baseUrl + 'admin/users');
		}
	});
}
