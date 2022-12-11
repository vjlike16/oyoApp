var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var User = require('../../models/home');
var ServiceCategories = require('../../models/admin/service_category');
var importContactSuccess = require('../../models/isp/importContactSuccess');
var Draft = require('../../models/admin/draft');
var Contact = require('../../models/admin/contact');
var fs = require('fs');
var Async = require('async');
var mongoose = require('mongoose');
var Email = require('../../../lib/email.js');
var State = require('../../models/admin/state');
var CustomerUpload = require('../../models/admin/customer_upload');
var multiparty = require('multiparty');
var secToMin = require('sec-to-min');
var Court = require('../../models/admin/court');
const SECRET_KEY =
	'sk_test_51JVSy4CzX7kFjfHZ0WqNOWnQPs4K3Cwv0YyK75zhtqvNYPVL07zwSbWGA24Abgg5sxa8SMcLUBGO0Ip8k8SggXbU00q0DhCFD7';
const stripe = require('stripe')(SECRET_KEY);
var moment = require('moment');

/* For Image Upload Configration */
const multer = require('multer');
const Storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads/profile');
	},
	filename: function (req, file, cb) {
		var datetimestamp = Date.now();
		cb(null, datetimestamp + '_' + file.originalname);
	},
});
const upload = multer({ storage: Storage });
var multipleFileUpload = upload.fields([{ name: 'profileImage', maxCount: 1 }]);
/* end */

/*
	For check token
	Required parameter
	Header :- user_id, active_hash, device_id
	post :- 
*/
exports.checkDeviceUserActiveToken = function (req, res, next) {
	var data = {};
	var user_id = req.headers.user_id;
	var active_hash = req.headers.active_hash;
	var device_id = req.headers.device_id;
	var is_login = 1;

	if (!active_hash) {
		data.status = 'failure';
		data.message = 'Sorry active hash is missing.';
		data.response = {};
		return res.send(data);
	}

	if (!user_id) {
		data.status = 'failure';
		data.message = 'Sorry user id is missing.';
		data.response = {};
		return res.send(data);
	}

	if (!device_id) {
		data.status = 'failure';
		data.message = 'Sorry device id is missing.';
		data.response = {};
		return res.send(data);
	}

	User.findOne(
		{ is_login: 1, _id: user_id, device_id: device_id },
		function (err, user) {
			if (err) {
				data.status = 'failure';
				data.message = 'Token has been expired.';
				data.response = {};
				return res.send(data);
			}

			if (user) {
				if (user.active_hash == active_hash) {
					if (user.status === 'inactive') {
						data.status = 'failure';
						data.message = 'Your account is inactive.';
						data.response = {};
						return res.send(data);
					}

					next();
				} else {
					data.status = 'failure';
					data.message = 'Sorry token has been expired.';
					data.response = {};
					return res.send(data);
				}
			} else {
				data.status = 'failure';
				data.message = 'Token has been expired.';
				data.response = {};
				return res.send(data);
			}
		}
	);
};

/*
	Name: LOGIN
	Header :- 
	Method: POST
	URL: /mobile/user/login
	post :- email*, password* (* asterisk parameters are required)
*/
exports.login = function (req, res) {
	var data = {};
	var email = req.body.email;
	var password = req.body.password;
	var active_code = Math.random().toString(36).slice(-20);
	var userType;
	if (req.device.type == 'phone') {
		userType = 'MobileUser';
	} else {
		userType = 'WebUser';
	}
	console.log('userType', userType);
	if (!email) {
		data.status = 'failure';
		data.message = 'Please enter email address.';
		data.response = {};
		return res.send(data);
	}

	if (!password) {
		data.status = 'failure';
		data.message = 'Please enter password.';
		data.response = {};
		return res.send(data);
	}

	User.findOne(
		{
			mail: new RegExp(email, 'i'),
			//'role_id': 2
		},
		function (err, user) {
			if (err) {
				data.status = 'failure';
				data.message = 'Something went wrong.';
				data.response = {};
				return res.send(data);
			}

			if (user) {
				bcrypt.compare(
					req.body.password,
					user.password,
					function (err, isMatch) {
						if (isMatch) {
							if (user.status === 'inactive') {
								data.status = 'failure';
								data.message =
									'Your account not activated, please check your email';
								data.response = {};
								return res.send(data);
							}

							if (user.verify === 0) {
								data.status = 'notVerified';
								data.message =
									'Your account not verified, Please check your email.';
								data.response = {};
								return res.send(data);
							}

							var login_time = new Date();
							var logout_time = '';
							var is_login = 1;

							User.findOneAndUpdate(
								{ _id: user._id },
								{
									$set: {
										login_time: login_time,
										logout_time: logout_time,
										// device_id: device_id,
										is_login: is_login,
										active_code: active_code,
										userType: userType,
									},
								},
								{ new: true },
								function (err, updatedUser) {
									if (err) {
										data.status = 'failure';
										data.message = 'Something went wrong.';
										data.response = {};
										return res.send(data);
									} else {
										updatedUser.password = '';
										data.status = 'success';
										data.message = 'Successfully logged in.';
										data.response = updatedUser;
										return res.send(data);
									}
								}
							);
						} else {
							data.status = 'failure';
							data.message = 'Incorrect Email Address or Password';
							data.response = {};
							return res.send(data);
						}
					}
				);
			} else {
				data.status = 'failure';
				data.message = 'Incorrect Email Address or Password';
				data.response = {};
				res.send(data);
			}
		}
	);
};

/*
	SIGNUP FUNCTION
	Method: POST
	URL: /mobile/user/signup
	Header :- 
	post :- email, password
*/
exports.signUp = function (req, res) {
	var data = {};

	var newCustomer = new User();
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	var new_id = mongoose.Types.ObjectId();
	var active_code = Math.random().toString(36).slice(-20);

	multipleFileUpload(req, res, async function (err) {
		var name = req.body.name;
		var email = req.body.email;
		//var password = req.body.password;
		var mobile = req.body.mobile;
		var newPassword = req.body.password;
		var heard_about = req.body.heard_about;
		req.body.password = bcrypt.hashSync(
			req.body.password,
			bcrypt.genSaltSync(8),
			null
		);

		if (!name) {
			data.status = 'failure';
			data.message = 'Please enter full name.';
			data.response = {};
			return res.send(data);
		}

		if (!mobile) {
			data.status = 'failure';
			data.message = 'Please enter mobile number.';
			data.response = {};
			return res.send(data);
		}

		if (!newPassword) {
			data.status = 'failure';
			data.message = 'Please enter password.';
			data.response = {};
			return res.send(data);
		}

		if (!email) {
			data.status = 'failure';
			data.message = 'Please enter email address.';
			data.response = {};
			return res.send(data);
		}

		if (!heard_about) {
			data.status = 'failure';
			data.message = 'Please enter heard about us.';
			data.response = {};
			return res.send(data);
		}

		if (req.body.account_as != 'customer') {
			if (req.body.otherService) {
				var service_category_id = '';
				var count = 0;
				var s_cat = await ServiceCategories.find({
					name: req.body.otherService,
				});
				s_cat = JSON.parse(JSON.stringify(s_cat));
				if (s_cat.length == 0) {
					day = moment.utc();
					var newService_category = new ServiceCategories();
					newService_category._id = mongoose.Types.ObjectId();
					service_category_id = newService_category._id;
					newService_category.name = req.body.otherService;
					newService_category.typ = 'Other';
					newService_category.count = 1;
					newService_category.status = 'active';
					newService_category.created_date = day;
					newService_category.updated_date = day;
					newService_category.save();
				} else {
					console.log('s_cat', s_cat);
					console.log('s_cat[0].count', s_cat[0].count);
					if (s_cat[0].count !== undefined) {
						count = s_cat[0].count + 1;
					}
					service_category_id = s_cat[0]._id;
					ServiceCategories.update(
						{ name: req.body.otherService, status: { $ne: 'delete' } },
						{ count: count },
						function (err, updatedresult) {
							if (err) {
								return done(
									null,
									false,
									req.flash(
										'error',
										'This service category is already existed.'
									)
								);
							} else {
								console.log('result ---- >>', updatedresult);
							}
						}
					);
				}
			}
			var business_category_name;
			if (req.body.category == 'other') {
				business_category_name = req.body.otherService;
			} else {
				business_category_name = await ServiceCategories.find({
					_id: req.body.category,
				});
				business_category_name = JSON.parse(
					JSON.stringify(business_category_name)
				);
				business_category_name = business_category_name[0].name;
			}
			var alphaText = '';
			var numText = '';
			var alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			for (let i = 0; i < 3; i++) {
				alphaText += alphabets.charAt(
					Math.floor(Math.random() * alphabets.length)
				);
			}
			var num = '0123456789';
			for (let i = 0; i < 3; i++) {
				numText += num.charAt(Math.floor(Math.random() * num.length));
			}
			var inviteCode = numText + alphaText;
		}

		var OTP = Math.floor(100000 + Math.random() * 900000);
		var role_id;
		if (req.body.account_as == 'customer') {
			role_id = 2;
		} else {
			role_id = 3;
		}

		/**check email unique start**/
		User.findOne(
			{
				mail: new RegExp(email, 'i'),
				$or: [{ status: 'active' }, { status: 'inactive' }],
			},
			async function (err, user) {
				if (user) {
					data.status = 'failure';
					data.message =
						'This email address already exists. Please sign in or use another one.';
					data.response = {};
					return res.send(data);
				} else {
					day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
					const stripe_customer = await stripe.customers.create({
						email: email,
						name: name,
						address: {
							line1: '510 Townsend St',
							postal_code: '98140',
							city: 'San Francisco',
							state: 'CA',
							country: 'US',
						},
					});

					if (
						typeof req.files == 'undefined' ||
						typeof req.files['profileImage'] == 'undefined' ||
						req.files['profileImage'] == ''
					) {
						var profileImageNewName = 'null';
					} else {
						var profileImageNewName = req.files['profileImage'][0].filename;
					}

					newCustomer.profileImage = 'avatar.png';
					newCustomer.name = name;
					newCustomer.mail = email;
					newCustomer.password = req.body.password;
					newCustomer.mobile = mobile;

					newCustomer._id = new_id;
					newCustomer.stripeCustomerId = stripe_customer.id;
					newCustomer.status = 'active';
					newCustomer.verify = 0; //inactive for email actiavators
					newCustomer.role_id = role_id;
					if (req.device.type == 'phone') {
						newCustomer.userType = 'MobileUser';
					} else {
						newCustomer.userType = 'WebUser';
					}
					newCustomer.heard_about = heard_about;
					newCustomer.otp = OTP;
					newCustomer.active_code = active_code;
					newCustomer.created_date = day;
					newCustomer.updated_date = day;

					newCustomer.address = req.body.address;
					newCustomer.city = req.body.city;
					newCustomer.website = req.body.website;
					newCustomer.country = req.body.country;
					newCustomer.zipcode = req.body.postal_code;
					if (req.body.lat && req.body.lng) {
						newCustomer.location.coordinates = [
							{ lat: req.body.lat, lng: req.body.lng },
						];
					} else {
						newCustomer.location.coordinates = [{ lat: ' ', lng: ' ' }];
					}
					newCustomer.state = req.body.state;
					newCustomer.business_name = req.body.business_name;
					if (req.body.otherService) {
						newCustomer.business_category = service_category_id;
						newCustomer.business_category_name = req.body.otherService;
					} else {
						newCustomer.business_category = req.body.category;
						newCustomer.business_category_name = business_category_name;
					}
					newCustomer.inviteCode = inviteCode;
					newCustomer.makePagePublic = true;

					newCustomer.login_time = '';
					newCustomer.logout_time = '';
					newCustomer.device_id = '';
					newCustomer.is_login = 0;

					/***save function start***/
					console.log('save function start');
					newCustomer.save(function (err, result) {
						if (err) {
							data.status = 'failure';
							data.message = 'Sorry something went wrong.';
							data.response = err;
							res.send(data);
						} else {
							//ready content for send email
							var content = {};
							var content = {
								name: name,
								email: email,
								otp: OTP,
								subject: 'Email verification code',
								templatefoldername: 'otpGenerate',
								id: new_id,
								token: active_code,
								content: `Congratulations! You are Registered. Please, use the verification code to activate your account. Verification code ${OTP}.`,
							};
							//Sending new password via Email
							Email.send_email(content);
							data.status = 'success';
							data.message =
								'Congratulations! Your account was successfully created. Please verify your account.';
							data.response = result;
							return res.send(data);
						}
					});
				}
			}
		);
	});
};
/*
	Name: Socail Media login
	Header :- 
	URL: /mobile/user/socailMediaName
	Method: POST
	post :- email
*/
exports.google = function (req, res) {
	var data = {};

	var newCustomer = new User();
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	var new_id = mongoose.Types.ObjectId();
	var active_code = Math.random().toString(36).slice(-20);
	var email = req.body.email;
	var name = req.body.name;
	var login_time = new Date();
	var logout_time = '';
	var is_login = 1;
	if (!email) {
		data.status = 'failure';
		data.message = 'Please enter email address.';
		data.response = {};
		return res.send(data);
	}

	User.findOne({ mail: new RegExp(email, 'i') }, function (err, user) {
		if (err) {
			data.status = 'failure';
			data.message = 'Something went wrong.';
			data.response = {};
			return res.send(data);
		}
		if (user) {
			if (user.status === 'inactive') {
				data.status = 'failure';
				data.message = 'Your account not activated, please check your email';
				data.response = {};
				return res.send(data);
			}

			User.findOneAndUpdate(
				{ _id: user._id },
				{
					$set: {
						login_time: login_time,
						logout_time: logout_time,
						is_login: is_login,
						active_code: active_code,
					},
				},
				{ new: true },
				function (err, updatedUser) {
					if (err) {
						data.status = 'failure';
						data.message = 'Something went wrong.';
						data.response = {};
						return res.send(data);
					} else {
						updatedUser.password = '';
						data.status = 'success';
						data.message = 'Successfully logged in.';
						data.response = updatedUser;
						return res.send(data);
					}
				}
			);
		} else {
			multipleFileUpload(req, res, async function (err) {
				var password = Math.floor(Math.random() * 99999999 * 54);
				const stripe_customer = await stripe.customers.create({
					email: email,
					name: name,
					address: {
						line1: '510 Townsend St',
						postal_code: '98140',
						city: 'San Francisco',
						state: 'CA',
						country: 'US',
					},
				});
				newCustomer.profileImage = 'avatar.png';
				newCustomer.name = name;
				newCustomer.mail = email;
				newCustomer.password = newCustomer.generateHash(password);

				newCustomer._id = new_id;
				newCustomer.social_provider = 'Google';
				newCustomer.stripeCustomerId = stripe_customer.id;
				newCustomer.status = 'active';
				newCustomer.verify = '1';
				newCustomer.role_id = '2';
				if (req.device.type == 'phone') {
					newCustomer.userType = 'MobileUser';
				} else {
					newCustomer.userType = 'WebUser';
				}
				newCustomer.active_code = active_code;
				newCustomer.created_date = day;
				newCustomer.updated_date = day;
				newCustomer.login_time = login_time;
				newCustomer.logout_time = logout_time;
				newCustomer.is_login = is_login;

				newCustomer.save(async function (err, result) {
					if (err) {
						data.status = 'failure';
						data.message = 'Sorry something went wrong.';
						data.response = err;
						res.send(data);
					} else {
						var content = {
							name: name,
							email: email,
							password: password,
							subject: 'Account creation successful',
							templatefoldername: 'socialLogin',
							content: 'Thanks for contacting with us.',
						};
						Email.send_email(content);

						await importContactSuccess
							.findOne({ mail: email })
							.then(async checkMail => {
								checkMail = JSON.parse(JSON.stringify(checkMail));
								if (checkMail != null) {
									var cusAddress;
									var ispNotes;
									var ispNotesUpdate;
									if (checkMail.address != undefined) {
										cusAddress = checkMail.address;
										ispNotes = checkMail.notes;
										ispNotesUpdate = day;
									}
									connectUser.push({
										status: 'pending',
										ispId: checkMail.ispId,
										ispName: checkMail.ispName,
										ispMail: checkMail.ispEmail,
										IspProfileImage: checkMail.ispProfile,
										cusId: result._id,
										cusName: result.name,
										cusMail: result.mail,
										cusAddress: cusAddress,
										cusMobile: result.mobile,
										social_provider: result.social_provider,
										ispNotes: ispNotes,
										ispNotesUpdate: ispNotesUpdate,
										cusProfile: result.profileImage,
										ispInvite: 'true',
										createdDate: day,
									});
									await connectedList.create(connectUser);
									await importContactSuccess.findOneAndRemove({
										_id: checkMail._id,
									});
								}
							})
							.catch(error => {
								console.log('Import contact social login error', error);
							});

						data.status = 'success';
						data.message = 'Account created successfully';
						data.response = result;
						return res.send(data);
					}
				});
			});
		}
	});
};
exports.facebook = function (req, res) {
	var data = {};

	var newCustomer = new User();
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	var new_id = mongoose.Types.ObjectId();
	var active_code = Math.random().toString(36).slice(-20);

	var email = req.body.email;
	var name = req.body.name;
	var login_time = new Date();
	var logout_time = '';
	var is_login = 1;
	if (!email) {
		data.status = 'failure';
		data.message = 'Please enter email address.';
		data.response = {};
		return res.send(data);
	}

	User.findOne({ mail: new RegExp(email, 'i') }, function (err, user) {
		if (err) {
			data.status = 'failure';
			data.message = 'Something went wrong.';
			data.response = {};
			return res.send(data);
		}
		if (user) {
			if (user.status === 'inactive') {
				data.status = 'failure';
				data.message = 'Your account not activated, please check your email';
				data.response = {};
				return res.send(data);
			}

			User.findOneAndUpdate(
				{ _id: user._id },
				{
					$set: {
						login_time: login_time,
						logout_time: logout_time,
						is_login: is_login,
						active_code: active_code,
					},
				},
				{ new: true },
				function (err, updatedUser) {
					if (err) {
						data.status = 'failure';
						data.message = 'Something went wrong.';
						data.response = {};
						return res.send(data);
					} else {
						updatedUser.password = '';
						data.status = 'success';
						data.message = 'Successfully logged in.';
						data.response = updatedUser;
						return res.send(data);
					}
				}
			);
		} else {
			multipleFileUpload(req, res, async function (err) {
				var password = Math.floor(Math.random() * 99999999 * 54);
				const stripe_customer = await stripe.customers.create({
					email: email,
					name: name,
					address: {
						line1: '510 Townsend St',
						postal_code: '98140',
						city: 'San Francisco',
						state: 'CA',
						country: 'US',
					},
				});
				newCustomer.profileImage = 'avatar.png';
				newCustomer.name = name;
				newCustomer.mail = email;
				newCustomer.password = newCustomer.generateHash(password);

				newCustomer._id = new_id;
				newCustomer.social_provider = 'Facebook';
				newCustomer.stripeCustomerId = stripe_customer.id;
				newCustomer.status = 'active';
				newCustomer.verify = '1';
				newCustomer.role_id = '2';
				if (req.device.type == 'phone') {
					newCustomer.userType = 'MobileUser';
				} else {
					newCustomer.userType = 'WebUser';
				}
				newCustomer.active_code = active_code;
				newCustomer.created_date = day;
				newCustomer.updated_date = day;

				newCustomer.login_time = login_time;
				newCustomer.logout_time = logout_time;
				newCustomer.is_login = is_login;

				newCustomer.save(async function (err, result) {
					if (err) {
						data.status = 'failure';
						data.message = 'Sorry something went wrong.';
						data.response = err;
						res.send(data);
					} else {
						var content = {
							name: name,
							email: email,
							password: password,
							subject: 'Account creation successful',
							templatefoldername: 'socialLogin',
							content: 'Thanks for contacting with us.',
						};
						Email.send_email(content);

						await importContactSuccess
							.findOne({ mail: email })
							.then(async checkMail => {
								checkMail = JSON.parse(JSON.stringify(checkMail));
								if (checkMail != null) {
									var cusAddress;
									var ispNotes;
									var ispNotesUpdate;
									if (checkMail.address != undefined) {
										cusAddress = checkMail.address;
										ispNotes = checkMail.notes;
										ispNotesUpdate = day;
									}
									connectUser.push({
										status: 'pending',
										ispId: checkMail.ispId,
										ispName: checkMail.ispName,
										ispMail: checkMail.ispEmail,
										IspProfileImage: checkMail.ispProfile,
										cusId: result._id,
										cusName: result.name,
										cusMail: result.mail,
										cusAddress: cusAddress,
										cusMobile: result.mobile,
										social_provider: result.social_provider,
										ispNotes: ispNotes,
										ispNotesUpdate: ispNotesUpdate,
										cusProfile: result.profileImage,
										ispInvite: 'true',
										createdDate: day,
									});
									await connectedList.create(connectUser);
									await importContactSuccess.findOneAndRemove({
										_id: checkMail._id,
									});
								}
							})
							.catch(error => {
								console.log('Import contact social login error', error);
							});

						data.status = 'success';
						data.message = 'Account created successfully';
						data.response = result;
						return res.send(data);
					}
				});
			});
		}
	});
};
exports.apple = function (req, res) {
	var data = {};

	var newCustomer = new User();
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	var new_id = mongoose.Types.ObjectId();
	var active_code = Math.random().toString(36).slice(-20);

	var email = req.body.email;
	var name = email.split('@')[0];
	var login_time = new Date();
	var logout_time = '';
	var is_login = 1;
	if (!email) {
		data.status = 'failure';
		data.message = 'Please enter email address.';
		data.response = {};
		return res.send(data);
	}

	User.findOne({ mail: new RegExp(email, 'i') }, function (err, user) {
		if (err) {
			data.status = 'failure';
			data.message = 'Something went wrong.';
			data.response = {};
			return res.send(data);
		}
		if (user) {
			if (user.status === 'inactive') {
				data.status = 'failure';
				data.message = 'Your account not activated, please check your email';
				data.response = {};
				return res.send(data);
			}

			User.findOneAndUpdate(
				{ _id: user._id },
				{
					$set: {
						login_time: login_time,
						logout_time: logout_time,
						is_login: is_login,
						active_code: active_code,
					},
				},
				{ new: true },
				function (err, updatedUser) {
					if (err) {
						data.status = 'failure';
						data.message = 'Something went wrong.';
						data.response = {};
						return res.send(data);
					} else {
						updatedUser.password = '';
						data.status = 'success';
						data.message = 'Successfully logged in.';
						data.response = updatedUser;
						return res.send(data);
					}
				}
			);
		} else {
			multipleFileUpload(req, res, async function (err) {
				var password = Math.floor(Math.random() * 99999999 * 54);
				const stripe_customer = await stripe.customers.create({
					email: email,
					name: name,
					address: {
						line1: '510 Townsend St',
						postal_code: '98140',
						city: 'San Francisco',
						state: 'CA',
						country: 'US',
					},
				});
				newCustomer.profileImage = 'avatar.png';
				newCustomer.name = name;
				newCustomer.mail = email;
				newCustomer.password = newCustomer.generateHash(password);

				newCustomer._id = new_id;
				newCustomer.social_provider = 'Apple';
				newCustomer.stripeCustomerId = stripe_customer.id;
				newCustomer.status = 'active';
				newCustomer.verify = '1';
				newCustomer.role_id = '2';
				if (req.device.type == 'phone') {
					newCustomer.userType = 'MobileUser';
				} else {
					newCustomer.userType = 'WebUser';
				}
				newCustomer.active_code = active_code;
				newCustomer.created_date = day;
				newCustomer.updated_date = day;

				newCustomer.login_time = login_time;
				newCustomer.logout_time = logout_time;
				newCustomer.is_login = is_login;

				newCustomer.save(async function (err, result) {
					if (err) {
						data.status = 'failure';
						data.message = 'Sorry something went wrong.';
						data.response = err;
						res.send(data);
					} else {
						var content = {
							name: name,
							email: email,
							password: password,
							subject: 'Account creation successful',
							templatefoldername: 'socialLogin',
							content: 'Thanks for contacting with us.',
						};
						Email.send_email(content);

						await importContactSuccess
							.findOne({ mail: email })
							.then(async checkMail => {
								checkMail = JSON.parse(JSON.stringify(checkMail));
								if (checkMail != null) {
									var cusAddress;
									var ispNotes;
									var ispNotesUpdate;
									if (checkMail.address != undefined) {
										cusAddress = checkMail.address;
										ispNotes = checkMail.notes;
										ispNotesUpdate = day;
									}
									connectUser.push({
										status: 'pending',
										ispId: checkMail.ispId,
										ispName: checkMail.ispName,
										ispMail: checkMail.ispEmail,
										IspProfileImage: checkMail.ispProfile,
										cusId: result._id,
										cusName: result.name,
										cusMail: result.mail,
										cusAddress: cusAddress,
										cusMobile: result.mobile,
										social_provider: result.social_provider,
										ispNotes: ispNotes,
										ispNotesUpdate: ispNotesUpdate,
										cusProfile: result.profileImage,
										ispInvite: 'true',
										createdDate: day,
									});
									await connectedList.create(connectUser);
									await importContactSuccess.findOneAndRemove({
										_id: checkMail._id,
									});
								}
							})
							.catch(error => {
								console.log('Import contact social login error', error);
							});

						data.status = 'success';
						data.message = 'Account created successfully';
						data.response = result;
						return res.send(data);
					}
				});
			});
		}
	});
};
exports.linkedin = function (req, res) {
	var data = {};

	var newCustomer = new User();
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	var new_id = mongoose.Types.ObjectId();
	var active_code = Math.random().toString(36).slice(-20);

	var email = req.body.email;
	var name = req.body.name;
	var login_time = new Date();
	var logout_time = '';
	var is_login = 1;
	if (!email) {
		data.status = 'failure';
		data.message = 'Please enter email address.';
		data.response = {};
		return res.send(data);
	}

	User.findOne({ mail: new RegExp(email, 'i') }, function (err, user) {
		if (err) {
			data.status = 'failure';
			data.message = 'Something went wrong.';
			data.response = {};
			return res.send(data);
		}
		if (user) {
			if (user.status === 'inactive') {
				data.status = 'failure';
				data.message = 'Your account not activated, please check your email';
				data.response = {};
				return res.send(data);
			}

			User.findOneAndUpdate(
				{ _id: user._id },
				{
					$set: {
						login_time: login_time,
						logout_time: logout_time,
						is_login: is_login,
						active_code: active_code,
					},
				},
				{ new: true },
				function (err, updatedUser) {
					if (err) {
						data.status = 'failure';
						data.message = 'Something went wrong.';
						data.response = {};
						return res.send(data);
					} else {
						updatedUser.password = '';
						data.status = 'success';
						data.message = 'Successfully logged in.';
						data.response = updatedUser;
						return res.send(data);
					}
				}
			);
		} else {
			multipleFileUpload(req, res, async function (err) {
				var password = Math.floor(Math.random() * 99999999 * 54);
				const stripe_customer = await stripe.customers.create({
					email: email,
					name: name,
					address: {
						line1: '510 Townsend St',
						postal_code: '98140',
						city: 'San Francisco',
						state: 'CA',
						country: 'US',
					},
				});
				newCustomer.profileImage = 'avatar.png';
				newCustomer.name = name;
				newCustomer.mail = email;
				newCustomer.password = newCustomer.generateHash(password);

				newCustomer._id = new_id;
				newCustomer.social_provider = 'LinkedIn';
				newCustomer.stripeCustomerId = stripe_customer.id;
				newCustomer.status = 'active';
				newCustomer.verify = '1';
				newCustomer.role_id = '2';
				if (req.device.type == 'phone') {
					newCustomer.userType = 'MobileUser';
				} else {
					newCustomer.userType = 'WebUser';
				}
				newCustomer.active_code = active_code;
				newCustomer.created_date = day;
				newCustomer.updated_date = day;

				newCustomer.login_time = login_time;
				newCustomer.logout_time = logout_time;
				newCustomer.is_login = is_login;

				newCustomer.save(async function (err, result) {
					if (err) {
						data.status = 'failure';
						data.message = 'Sorry something went wrong.';
						data.response = err;
						res.send(data);
					} else {
						var content = {
							name: name,
							email: email,
							password: password,
							subject: 'Account creation successful',
							templatefoldername: 'socialLogin',
							content: 'Thanks for contacting with us.',
						};
						Email.send_email(content);

						await importContactSuccess
							.findOne({ mail: email })
							.then(async checkMail => {
								checkMail = JSON.parse(JSON.stringify(checkMail));
								if (checkMail != null) {
									var cusAddress;
									var ispNotes;
									var ispNotesUpdate;
									if (checkMail.address != undefined) {
										cusAddress = checkMail.address;
										ispNotes = checkMail.notes;
										ispNotesUpdate = day;
									}
									connectUser.push({
										status: 'pending',
										ispId: checkMail.ispId,
										ispName: checkMail.ispName,
										ispMail: checkMail.ispEmail,
										IspProfileImage: checkMail.ispProfile,
										cusId: result._id,
										cusName: result.name,
										cusMail: result.mail,
										cusAddress: cusAddress,
										cusMobile: result.mobile,
										social_provider: result.social_provider,
										ispNotes: ispNotes,
										ispNotesUpdate: ispNotesUpdate,
										cusProfile: result.profileImage,
										ispInvite: 'true',
										createdDate: day,
									});
									await connectedList.create(connectUser);
									await importContactSuccess.findOneAndRemove({
										_id: checkMail._id,
									});
								}
							})
							.catch(error => {
								console.log('Import contact social login error', error);
							});

						data.status = 'success';
						data.message = 'Account created successfully';
						data.response = result;
						return res.send(data);
					}
				});
			});
		}
	});
};
/*
	Name: Verify OTP
	Header :- 
	URL: /mobile/user/verifyOtp
	Method: POST
	post :- otp*, userId* (* asterisk parameters are required)
*/

exports.verifyOtp = async function (req, res) {
	var data = {};

	let otp = req.body.otp;
	let userId = req.body.userId;

	const connectUser = [];
	User.findOne({ _id: userId, otp: otp }, async function (err, result) {
		if (err || !result) {
			data.status = 'error';
			data.message = 'Please enter the correct verification code.';
			data.response = {};

			return res.send(data);
		} else {
			Object.assign(result, { verify: 1 });
			result.save();

			data.role_id = result.role_id;
			data.active_code = Math.random().toString(36).slice(-20);
			data.status = 'success';
			data.message = 'Verification completed. Please, setup your profile.';
			data.response = {};

			return res.send(data);
		}
	});
};

exports.service_categories = function (req, res) {
	ServiceCategories.find({ status: 'active', typ: { $ne: 'Other' } })
		.sort({ created_date: -1 })
		.exec(function (err, service_categories) {
			if (err) {
				data.service_categories = [];
				res.json([]);
			} else {
				var servicesArray = [];
				service_categories = JSON.parse(JSON.stringify(service_categories));
				console.log(service_categories);
				service_categories.forEach(element => {
					servicesArray.push({ label: element.name, value: element._id });
				});
				// servicesArray.push({label: 'Other', value: 'other'});
				res.json(servicesArray);
			}
		});
};

/*
	FORGOTPASSWORD FUNCTION
	Required parameter
	Header :- 
	post :- email
*/
exports.forgotPassword = function (req, res) {
	var data = {};
	var active_hash = Math.random().toString(36).slice(-20);
	req.body.active_hash = active_hash;
	//req.body.updated_date = new Date();

	var email = req.body.email;
	if (!email) {
		data.status = 'failure';
		data.message = 'Please enter email address.';
		return res.send(data);
	}

	User.findOne(
		{
			status: { $ne: 'delete' },
			mail: new RegExp(email, 'i'),
			role_id: { $in: ['2', '3'] },
		},
		function (err, user) {
			if (err || !user) {
				data.status = 'failure';
				data.message =
					'Email address does not exist. Please use a registered email address.';
				return res.send(data);
			}

			if (user) {
				if (user.status === 'inactive') {
					data.status = 'failure';
					data.message = 'Your account not activated, please check your email';
					return res.send(data);
				}

				User.update(
					{ _id: user._id },
					{
						$set: {
							active_hash: req.body.active_hash,
						},
					},
					function (err, updatedUser) {
						if (err) {
							data.status = 'failure';
							data.message = 'Something went wrong.';
							return res.send(data);
						} else {
							// ready content for send email
							var content = {
								name: user.name,
								email: user.mail,
								subject: 'Reset Password',
								templatefoldername: 'resetPasswordMobile',
								id: user._id,
								token: active_hash,
								content:
									'A request was submitted to reset your account password. Please, click the link below to generate a new password. Disregard if the request to reset your password was not from you.',
							};
							// Sending new data via Email
							Email.send_email(content);

							data.status = 'success';
							data.message =
								'We have sent the reset password link to the registered email.';
							return res.send(data);
						}
					}
				);
			} else {
				data.status = 'failure';
				data.message = 'Sorry your account not exits, please create account.';
				return res.send(data);
			}
		}
	);
};

/*
	CHECK DATE TIME SLOT FREE
	Required parameter
	Header :- 
	post :- 
    Created Oct 2017
*/
exports.checkDateTimeSlot = function (req, res) {
	var preference_time = req.body.prefered_dates;
	var preference_date = req.body.prefered_times;

	var statusByStatus = ['active', 'inactive'];
	Customer.count(
		{
			preference_date: preference_date,
			preference_time: preference_time,
			status: { $in: statusByStatus },
		},
		function (err, count) {
			if (count > 9) {
				data.status = 'failure';
				data.message = 'This time slot is not free. Please use another slot.';
				data.response = {};
				return res.send(data);
			} else {
				next();
			}
		}
	);
};

/*
	CHECK EMAIL EXCEPT 
	Required parameter
	Header :- 
	post :- email, user_id
    Created Oct 2017
*/
exports.checkemailexistexceptthis = function (req, res, next) {
	var data = {};
	var email = req.body.email;
	var user_id = req.body.user_id;

	if (!email) {
		data.status = 'failure';
		data.message = 'Please enter email.';
		data.response = {};
		return res.send(data);
	}
	if (!user_id) {
		data.status = 'failure';
		data.message = 'Please enter user id.';
		data.response = {};
		return res.send(data);
	}

	User.findOne(
		{
			mail: new RegExp(email_id, 'i'),
			_id: { $ne: user_id },
			$or: [{ status: 'active' }, { status: 'inactive' }],
		},
		function (err, user) {
			if (err) {
				next();
			}
			if (user) {
				data.status = 'failure';
				data.message = 'This email id already exists.';
				data.response = {};
				return res.send(data);
			}

			if (!user) {
				next();
			}
		}
	);
};

/*
	CHECK REGISTRATION EXCEPT ID FUNCTION
	Required parameter
	Header :- 
	post :- bar_registration, user_id
    Created Oct 2017
*/
exports.checkbarregistrationexistexceptthis = function (req, res, next) {
	var data = {};
	var bar_registration = req.body.bar_registration;
	var user_id = req.body.user_id;

	if (!bar_registration) {
		data.status = 'failure';
		data.message = 'Please enter bar registration.';
		data.response = {};
		return res.send(data);
	}

	if (!user_id) {
		data.status = 'failure';
		data.message = 'Please enter user id.';
		data.response = {};
		return res.send(data);
	}

	User.findOne(
		{
			bar_registration: new RegExp(bar_registration, 'i'),
			_id: { $ne: user_id },
			$or: [{ status: 'active' }, { status: 'inactive' }],
		},
		function (err, user) {
			if (err) {
				next();
			}
			if (user) {
				data.status = 'failure';
				data.message = 'This bar registration already exists.';
				data.response = {};
				return res.send(data);
			}

			if (!user) {
				next();
			}
		}
	);
};

exports.dashboard = function (req, res) {
	var data = {};
	var result = {};
	var commonResult = {};
	var user_id = req.headers.user_id;

	if (!user_id) {
		data.status = 'failure';
		data.message = 'Sorry user id is missing.';
		data.response = {};
		return res.send(data);
	}

	var tasks = [
		function (callback) {
			CustomerUpload.count({ user: user_id }).exec(function (err, uploadCount) {
				if (err) {
					result.upload_count = 0;
					callback();
				} else {
					result.upload_count = uploadCount;
					callback();
				}
			});
		},
		function (callback) {
			User.findOne({ _id: user_id })
				.select(['_id', 'total_time', 'plan_end_date'])
				.exec(function (err, users) {
					if (err) {
						result.total_time_in_min = 0;
						result.word_used = 0;
						result.plan_expired_date = 0;
						callback();
					} else {
						result.total_time_in_min = users.total_time;
						result.word_used = users.word_used;
						result.plan_expired_date = users.plan_end_date;
						callback();
					}
				});
		},
		function (callback) {
			Draft.aggregate([
				{
					$match: { user: mongoose.Types.ObjectId(user_id), status: 'active' },
				},
				{
					$group: {
						_id: null,
						totalTimeUsed: { $sum: '$time_used' }, // in seconds
						count: { $sum: 1 },
					},
				},
			]).exec(function (err, usedTime) {
				if (err) {
					result.draft_count = 0;
					result.used_time_in_sec = 0;
					callback();
				} else {
					if (usedTime && usedTime != '') {
						result.draft_count = usedTime[0].count;
						if (usedTime[0].totalTimeUsed && usedTime[0].totalTimeUsed != 0) {
							//var totalTimeUsedVar = secToMin(usedTime[0].totalTimeUsed);
							result.used_time_in_sec = usedTime[0].totalTimeUsed;
						} else {
							result.used_time_in_sec = 0;
						}
						callback();
					} else {
						result.draft_count = 0;
						result.used_time_in_sec = 0;
						callback();
					}
				}
			});
		},
	];
	Async.series(tasks, function (err) {
		//series: for step by step and parallel: for suffle
		if (err) {
			result.total_time_in_min = 0;
			result.used_time_in_sec = 0;
			result.total_word = 0;
			result.word_used = 0;
			result.upload_count = 0;
			result.draft_count = 0;
			result.plan_expired_date = '0';
			data.response = result;
			data.status = 'failure';
			data.message = 'Sorry account does not exits.';
			return res.send(data);
		} else {
			data.status = 'success';
			data.message = 'Successfully.';
			data.response = result;
			return res.send(data);
		}
	});
};

/*
	LOGOUT FUNCTION
	Required parameter
	Header :- user_id, active_hash, device_id
	post :- 
    Created Oct 2017
*/
exports.logout = async function (req, res) {
	var data = {};
	var user_id = req.headers.user_id;

	var login_time = '';
	var logout_time = new Date();
	var device_id = '';
	var is_login = 0;
	if (req.session.userCustomerSession) {
		let updatedUser = await User.findOneAndUpdate(
			{ _id: user_id },
			{ $set: { token: '', device_id: '' } }
		);

		data.status = 'success';
		data.message = 'Successfully logged out.';
		data.response = updatedUser;
		return res.send(data);
	} else {
		data.status = 'error';
		data.message = 'Error logged out.';
		return res.send(data);
	}
};

exports.edit = function (req, res) {
	var data = {};

	User.findOne({ _id: req.params.id }, function (err, user) {
		if (err) {
			res.send(err);
		} else {
			data.userDetails = user;
			res.render('admin/users/edit', data);
		}
	});
};

exports.update = function (req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.mail = req.body.mail.toLowerCase();
	User.update({ _id: req.body._id }, req.body, function (err, updatedUser) {
		if (err) {
			req.flash('error', 'Sorry something went wrong');
			res.redirect(baseUrl + 'admin/users');
		} else {
			req.flash('success', 'Account Updated Successfully');
			res.redirect(baseUrl + 'admin/users');
		}
	});
};

exports.sendOtpAgain = async function (req, res) {
	const userExist = await User.findOne({ _id: req.body.userId });
	console.log('userExist', userExist);
	if (userExist) {
		var OTP = userExist.otp;
		const uddateOtp = await User.update(function (err) {
			if (err) {
				throw err;
			} else {
				var content = {
					name: userExist.name,
					email: userExist.mail,
					otp: OTP,
					subject: 'Email verification code',
					templatefoldername: 'otpGenerate',
					id: userExist._id,
					token: userExist.active_hash,
					content: `Congratulations! You are Registered. Please, use the verification code to activate your account. Verification code ${OTP}.`,
				};
				//Sending new data via Email
				Email.send_email(content);
				var data = {};
				data.body = req.body.userId;
				data.status = 'success';
				data.message =
					'A verification code was sent to your registered email address.';
				data.response = {};
				return res.send(data);
			}
		});
	} else {
		data.status = 'error';
		data.message = 'verification code send failed';
		data.response = {};
		return res.send(data);
	}
};

exports.checkSubscriptionValidity = async function (req, res) {
	let userId = req.params.id;
	console.log('userId', userId);
	const userExist = await User.findOne({ _id: userId });
	let subscriptionValidity = userExist.subscriptionValidity;
	console.log('subscriptionValidity', subscriptionValidity);
	var data = {};
	if (subscriptionValidity) {
		data.status = 'success';
		data.message = 'Subscription is valid.';
		data.response = subscriptionValidity;
		return res.send(data);
	} else {
		data.status = 'error';
		data.message = 'Please Renew your subscription.';
		data.response = subscriptionValidity;
		return res.send(data);
	}
};

exports.upgradeToIsp = async function (req, res) {
	let data = {};
	data.msg = '';
	data.error = req.flash('error');
	data.success = req.flash('success');
	data.session = req.flash('session');
	ServiceCategories.find({})
		.sort({ created_date: -1 })
		.exec(function (err, service_categories) {
			if (err) {
				data.service_categories = '';
				res.render('home.ejs', data);
			} else {
				data.service_categories = service_categories;
				res.render('home.ejs', data);
			}
		});
};
/*
	Contact FUNCTION
	Required parameter
	Header :- user_id
	post :- name, email, mobile, message
    Created Nov 2017
*/
exports.contact = function (req, res) {
	var data = {};
	var newContact = new Contact();
	var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	var new_id = mongoose.Types.ObjectId();

	var user_id = req.headers.user_id;
	var name = req.body.name;
	var email = req.body.email;
	var mobile = req.body.mobile;
	var message = req.body.message;
	if (!user_id) {
		data.status = 'failure';
		data.message = 'Sorry user id is missing.';
		data.response = {};
		return res.send(data);
	}
	if (!name) {
		data.status = 'failure';
		data.message = 'Please enter name.';
		data.response = {};
		return res.send(data);
	}

	if (!email) {
		data.status = 'failure';
		data.message = 'Please enter email.';
		data.response = {};
		return res.send(data);
	}
	if (!mobile) {
		data.status = 'failure';
		data.message = 'Please enter mobile number.';
		data.response = {};
		return res.send(data);
	}

	if (!message) {
		data.status = 'failure';
		data.message = 'Please enter message.';
		data.response = {};
		return res.send(data);
	}
	newContact._id = new_id;
	newContact.status = 'active';
	newContact.created_date = day;
	newContact.updated_date = day;

	newContact.user = user_id;
	newContact.name = name;
	newContact.email = email;
	newContact.mobile = mobile;
	newContact.message = message;
	newContact.save(function (err) {
		if (err) {
			data.status = 'failure';
			data.message = 'Sorry something went wrong.';
			data.response = {};
			return res.send(data);
		} else {
			//ready content for send email
			var content = {};
			var content = {
				name: name,
				email: email,
				//'email': 'gourav.saini@otssolutions.com', //Admin Email
				message: message,
				subject: 'Contact us',
				templatefoldername: 'contact',
				content: 'Thanks for contacting with us.',
			};
			//Sending new data via Email
			Email.send_email(content);

			data.status = 'success';
			data.message =
				'Thanks for contacting with us, we will get back to you later.';
			data.response = {};
			return res.send(data);
		}
	});
};

/*
	For check Current Balance Time
	Required parameter
	Header :- user_id, active_hash, device_id
	post :- 
    Created Oct 2017
*/

exports.checkCurrentBalanceTime = function (req, res) {
	var data = {};
	var result = {};
	var commonResult = {};
	var user_id = req.headers.user_id;

	if (!user_id) {
		data.status = 'failure';
		data.message = 'Sorry user id is missing.';
		data.response = {};
		return res.send(data);
	}

	var tasks = [
		function (callback) {
			User.findOne({ _id: user_id })
				.select(['_id', 'total_time'])
				.exec(function (err, users) {
					console.log('##### First ######');
					console.log(users);
					console.log('###########');
					if (err || !users || users.total_time == 0) {
						data.status = 'failure';
						data.message =
							"Sorry you don't have time balance. Please contact to admin.";
						data.response = {};
						return res.send(data);
						callback();
					} else {
						result.total_time_in_min = users.total_time;
						callback();
					}
				});
		},
		function (callback) {
			Draft.aggregate([
				{
					$match: {
						user: mongoose.Types.ObjectId(user_id),
						status: { $ne: 'delete' },
					},
				},
				{
					$group: {
						_id: null,
						totalTimeUsed: { $sum: '$time_used' }, // in seconds
						count: { $sum: 1 },
					},
				},
			]).exec(function (err, usedTime) {
				console.log('##### Second ######');
				console.log(usedTime);
				console.log('###########');
				if (err) {
					result.total_balance_time_in_min = result.total_time_in_min;
					result.used_time_in_min = 0;
					result.used_time_in_second = 0;
					//next();
					callback();
				} else {
					if (usedTime && usedTime != '') {
						if (usedTime[0].totalTimeUsed && usedTime[0].totalTimeUsed != 0) {
							result.used_time_in_second = usedTime[0].totalTimeUsed;
							result.used_time_in_min = secToMin(usedTime[0].totalTimeUsed);
							var totalTimeUsedInMinVar = secToMin(usedTime[0].totalTimeUsed);
							var total_balance_time_in_min =
								result.total_time_in_min - totalTimeUsedInMinVar;
							if (total_balance_time_in_min == 0) {
								data.status = 'failure';
								data.message =
									"Sorry you don't have time balance. Please contact to admin.";
								data.response = {};
								return res.send(data);
							}
						} else {
							var total_balance_time_in_min = result.total_time_in_min;
							if (total_balance_time_in_min == 0) {
								data.status = 'failure';
								data.message =
									"Sorry you don't have time balance. Please contact to admin.";
								data.response = {};
								return res.send(data);
							}
						}
						callback();
					} else {
						var total_balance_time_in_min = result.total_time_in_min;
						if (total_balance_time_in_min == 0) {
							data.status = 'failure';
							data.message =
								"Sorry you don't have time balance. Please contact to admin.";
							data.response = {};
							return res.send(data);
						}
					}
				}
			});
		},
	];
	Async.series(tasks, function (err) {
		//series: for step by step and parallel: for suffle
		if (err) {
			data.status = 'failure';
			data.message =
				"Sorry you don't have time balance. Please contact to admin.";
			data.response = {};
			return res.send(data);
		} else {
			data.status = 'success';
			data.message = 'Successfully.';
			data.response = result;
			return res.send(data);
		}
	});
};
