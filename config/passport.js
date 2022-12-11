var LocalStrategy = require('passport-local').Strategy;
const facebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

var moment = require('moment');

var User = require('../app/models/home');
var Email = require('../lib/email.js');
var bcrypt = require('bcrypt-nodejs');
var Async = require('async');

var configAuth = require('./auth.js');
var constant = require('../config/constants');
var dateFormat = require('dateformat');
var fs = require('fs');
//var bcrypt = require('bcrypt-nodejs');
const SECRET_KEY =
	'sk_test_51JVSy4CzX7kFjfHZ0WqNOWnQPs4K3Cwv0YyK75zhtqvNYPVL07zwSbWGA24Abgg5sxa8SMcLUBGO0Ip8k8SggXbU00q0DhCFD7';
const stripe = require('stripe')(SECRET_KEY);

const express = require('express');
const router = express.Router();
var mongoose = require('mongoose');
var ServiceCategories = require('../app/models/admin/service_category');
var importContactSuccess = require('../app/models/isp/importContactSuccess');
var connectedList = require('../app/models/customers/connectedList');
//expose this function to our app using module.exports
module.exports = function (passport) {
	// =========================================================================
	// passport session setup ==================================================
	// =========================================================================
	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	// used to serialize the user for the session
	passport.serializeUser(function (user, done) {
		done(null, user);
	});

	// used to deserialize the user
	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});

	// =========================================================================
	// LOCAL SIGNUP ============================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

	passport.use(
		'local-signup',
		new LocalStrategy(
			{
				// by default, local strategy uses username and password, we will override with email
				usernameField: 'email',
				passwordField: 'password',
				passReqToCallback: true, // allows us to pass back the entire request to the callback
			},
			function (req, email, password, done) {
				// asynchronous
				// User.findOne wont fire unless data is sent back
				process.nextTick(function () {
					// find a user whose email is the same as the forms email
					// we are checking to see if the user trying to login already exists
					//User.findOne({ 'mail' :  email , 'role_id' :1}, function(err, user) {
					User.findOne({ mail: email }, function (err, user) {
						// if there are any errors, return the error
						if (err) return done(err);

						// check to see if theres already a user with that email
						if (user) {
							return done(
								null,
								false,
								req.flash('error', 'That email is already taken.')
							);
						} else {
							User.find()
								.sort([['_id', 'descending']])
								.limit(1)
								.exec(async function (err, userdata) {
									// if there is no user with that email
									// create the user
									var newUser = new User();

									// set the user's local credentials
									const stripe_customer = await stripe.customers.create({
										email: email,
										name: req.body.username,
										address: {
											line1: '510 Townsend St',
											postal_code: '98140',
											city: 'San Francisco',
											state: 'CA',
											country: 'US',
										},
									});
									var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');

									// var active_code = bcrypt.hashSync(Math.floor((Math.random() * 99999999) *54), null, null);
									var active_code = Math.random().toString(36).slice(-20);
									newUser.mail = email;
									newUser.password = newUser.generateHash(password);
									newUser.name = req.body.username;
									newUser.stripeCustomerId = stripe_customer.id;
									newUser.created_date = day;
									newUser.updated_date = day;
									newUser.status = 'active'; //inactive for email actiavators
									newUser.active_hash = active_code;
									newUser._id = mongoose.Types.ObjectId();

									// save the user
									newUser.save(function (err) {
										if (err) throw err;

										return done(
											null,
											newUser,
											req.flash('success', 'Account created successfully')
										);

										req.session.destroy();
									});
								});
						}
					});
				});
			}
		)
	);

	// =========================================================================
	// LOCAL LOGIN =============================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

	passport.use(
		'local-login',
		new LocalStrategy(
			{
				// by default, local strategy uses username and password, we will override with email
				usernameField: 'email',
				passwordField: 'password',
				passReqToCallback: true, // allows us to pass back the entire request to the callback
			},
			function (req, email, password, done) {
				// callback with email and password from our form
				// find a user whose email is the same as the forms email
				// we are checking to see if the user trying to login already exists
				User.findOne(
					{
						$and: [{ mail: new RegExp(email, 'i') }, { role_id: 2 }],
					},
					function (err, user) {
						// if there are any errors, return the error before anything else

						if (err) return done(null, false, req.flash('error', err)); // req.flash is the way to set flashdata using connect-flash

						// if no user is found, return the message
						if (!user)
							return done(
								null,
								false,
								req.flash(
									'error',
									'Sorry your account not exits, please create account.'
								)
							); // req.flash is the way to set flashdata using connect-flash

						// if the user is found but the password is wrong
						if (!user.validPassword(password))
							return done(
								null,
								false,
								req.flash('error', 'Email and password does not match.')
							); // create the loginMessage and save it to session as flashdata

						if (user.status === 'inactive')
							return done(
								null,
								false,
								req.flash(
									'error',
									'Your account not activated, please check your email'
								)
							); // create the loginMessage and save it to session as flashdata

						// all is well, return successful user
						req.session.user = user;

						return done(null, user);
					}
				);
			}
		)
	);

	/*************** admin signup *************/
	passport.use(
		'admin-local-signup',
		new LocalStrategy(
			{
				usernameField: 'email',
				passwordField: 'password',
				passReqToCallback: true, // allows us to pass back the entire request to the callback
			},
			function (req, email, password, done) {
				process.nextTick(function () {
					User.findOne({ mail: email, role_id: 1 }, function (err, user) {
						if (err) return done(err);
						if (user) {
							return done(
								null,
								false,
								req.flash('error', 'That email is already taken.')
							);
						} else {
							User.find()
								.sort([['_id', 'descending']])
								.limit(1)
								.exec(async function (err, userdata) {
									var newUser = new User();
									var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
									const stripe_customer = await stripe.customers.create({
										email: email,
										name: req.body.username,
										address: {
											line1: '510 Townsend St',
											postal_code: '98140',
											city: 'San Francisco',
											state: 'CA',
											country: 'US',
										},
									});

									// var active_code=bcrypt.hashSync(Math.floor((Math.random() * 99999999) *54), null, null);
									var active_code = Math.random().toString(36).slice(-20);
									newUser.role_id = 1;
									newUser.mail = email;
									newUser.password = newUser.generateHash(password);
									newUser.name = req.body.username;
									newUser.stripeCustomerId = stripe_customer.id;
									newUser.created_date = day;
									newUser.updated_date = day;
									newUser.status = 'active';
									newUser.verify = 1; //inactive for email actiavators
									newUser.active_hash = active_code;
									newUser._id = mongoose.Types.ObjectId();
									newUser.save(function (err) {
										if (err) throw err;
										return done(
											null,
											newUser,
											req.flash('success', 'Account created successfully')
										);
										req.session.destroy();
									});
								});
						}
					});
				});
			}
		)
	);
	//===============================================

	/******Admin Login Function ***********/
	passport.use(
		'admin-local-login',
		new LocalStrategy(
			{
				usernameField: 'email',
				passwordField: 'password',
				passReqToCallback: true, // allows us to pass back the entire request to the callback
			},
			function (req, email, password, done) {
				// callback with email and password from our form
				User.findOne(
					{
						mail: new RegExp(email, 'i'),
						verify: 1,
						status: 'active',
						$or: [{ role_id: '1' }],
					},
					function (err, user) {
						if (err) return done(null, false, req.flash('error', err)); // req.flash is the way to set flashdata using connect-flash

						// if no user is found, return the message
						if (!user)
							return done(
								null,
								false,
								req.flash('error', 'Incorrect Email Address or Password.')
							); // req.flash is the way to set flashdata using connect-flash

						// if the user is found but the password is wrong
						if (!user.validPassword(password))
							return done(
								null,
								false,
								req.flash('error', 'Incorrect Email Address or Password.')
							); // create the loginMessage and save it to session as flashdata

						if (user.status === 'inactive')
							return done(
								null,
								false,
								req.flash(
									'error',
									'Your Account Not Activated ,Please Check Your Email.'
								)
							); // create the loginMessage and save it to session as flashdata

						if (user.verify === 0)
							return done(
								null,
								false,
								req.flash(
									'error',
									'Your account not verified, please check your email'
								)
							); // create the loginMessage and save it to session as flashdata

						// all is well, return successful user
						req.session.userAdminSession = user;

						return done(null, user);
					}
				);
			}
		)
	);
	//===============================================
	/*************** customer signup *************/
	passport.use(
		'customer-local-signup',
		new LocalStrategy(
			{
				usernameField: 'email',
				passwordField: 'password',
				passReqToCallback: true, // allows us to pass back the entire request to the callback
			},
			async function (req, email, password, done) {
				var service_category_id = '';
				console.log('req.body.otherService----', req.body.otherService);
				if (req.body.otherService) {
					var s_cat = [];
					var count = 0;
					var s_data = await ServiceCategories.find({
						name: req.body.otherService,
						status: { $ne: 'delete' },
					}).then(res => {
						console.log('s_data-----', res);
						s_cat = res;
						if (s_cat.length == 0) {
							var day = moment.utc();
							var newService_category = new ServiceCategories();
							newService_category._id = mongoose.Types.ObjectId();
							service_category_id = newService_category._id;
							newService_category.name = req.body.otherService;
							newService_category.typ = 'Other';
							newService_category.count = 1;
							//newService_category.pagecontent = req.body.pagecontent;
							newService_category.status = 'active';
							newService_category.created_date = day;
							newService_category.updated_date = day;
							console.log(
								'newService_category-------------------------->',
								newService_category
							);
							newService_category.save();
						} else {
							if (res[0].count !== undefined) {
								count = res[0].count + 1;
							}
							service_category_id = res[0]._doc._id;
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
												'This service business type is already existed.'
											)
										);
									} else {
										console.log('result ---- >>', updatedresult);
										//return done(null, false, req.flash('error', 'This service category is already existed.'));
									}
								}
							);
						}
					});
					//console.log(s_data)
				}

				if (req.body.account_as != 'customer') {
					var business_category_name;
					// if(req.body.category == "other"){
					//   business_category_name = req.body.otherService;
					// }else{
					business_category_name = await ServiceCategories.find({
						_id: req.body.category,
					});
					business_category_name = JSON.parse(
						JSON.stringify(business_category_name)
					);
					business_category_name = business_category_name[0].name;
					// }

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
				process.nextTick(async function () {
					User.findOne(
						{ mail: email, role_id: role_id },
						async function (err, user) {
							if (err) return done(err);
							if (user) {
								return done(
									null,
									false,
									req.flash('error', 'That email is already taken.')
								);
							} else {
								var newUser = new User();
								User.find()
									.sort([['_id', 'descending']])
									.limit(1)
									.exec(async function (err, userdata) {
										var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
										const stripe_customer = await stripe.customers.create({
											email: email,
											name: req.body.name,
											address: {
												line1: '510 Townsend St',
												postal_code: '98140',
												city: 'San Francisco',
												state: 'CA',
												country: 'US',
											},
										});
										// var active_code=bcrypt.hashSync(Math.floor((Math.random() * 99999999) *54), null, null);

										var active_code = Math.random().toString(36).slice(-20);
										newUser.role_id = role_id;
										newUser.mail = email;
										if (req.device.type == 'phone') {
											newUser.userType = 'MobileUser';
										} else {
											newUser.userType = 'WebUser';
										}
										newUser.password = newUser.generateHash(password);
										newUser.name = req.body.name;
										newUser.stripeCustomerId = stripe_customer.id;
										newUser.address = req.body.address;
										newUser.city = req.body.city;
										newUser.heard_about = req.body.heard_about;
										newUser.website = req.body.website;
										newUser.country = req.body.country;
										newUser.zipcode = req.body.postal_code;
										newUser.state = req.body.state;
										newUser.business_name = req.body.business_name;
										if (req.body.otherService) {
											newUser.business_category = service_category_id;
											newUser.business_category_name = req.body.otherService;
										} else {
											newUser.business_category = req.body.category;
											newUser.business_category_name = business_category_name;
										}

										newUser.mobile = req.body.mobile;
										if (req.body.lat && req.body.lng) {
											newUser.location.coordinates = [
												{ lat: req.body.lat, lng: req.body.lng },
											];
										} else {
											newUser.location.coordinates = [{ lat: ' ', lng: ' ' }];
										}

										newUser.otp = OTP;
										newUser.inviteCode = inviteCode;
										newUser.makePagePublic = true;
										newUser.created_date = day;
										newUser.updated_date = day;
										newUser.status = 'active';
										newUser.verify = 0; //inactive for email actiavators
										newUser.active_hash = active_code;
										newUser._id = mongoose.Types.ObjectId();
										newUser.save(async function (err) {
											if (err) {
												throw err;
											} else {
												var connectUser = [];

												console.log(
													'req.query.isp_id ------------->',
													req.body.isp_id
												);
												if (req.body.isp_id !== undefined) {
													//	var a = await	User.findOne({_id : req.body.isp_id });
													var a = await User.findById({
														_id: mongoose.Types.ObjectId(req.body.isp_id),
													}).then(checkMail => {
														if (checkMail !== null) {
															connectUser.push({
																status: 'pending',
																ispId: req.body.isp_id,
																ispName: checkMail.name,
																ispMail: checkMail.mail,
																IspProfileImage: checkMail.profileImage,
																cusId: newUser._id,
																cusName: newUser.name,
																cusMail: newUser.mail,
																cusAddress: newUser.address,
																cusMobile: newUser.mobile,
																social_provider: newUser.social_provider,
																ispNotes: newUser.ispNotes,
																ispNotesUpdate: '',
																cusProfile: newUser.profileImage,
																ispInvite: 'true',
																createdDate: day,
															});
														}
													});
													var a = await connectedList.create(connectUser);
												}
												//	constant.email = email;
												var content = {};
												var active_hash = Math.random().toString(36).slice(-20);
												var content = {
													name: newUser.name,
													email: newUser.mail,
													otp: OTP,
													subject: 'Email verification code',
													templatefoldername: 'otpGenerate',
													id: newUser._id,
													token: active_hash,
													content: `Congratulations! You are Registered. Please, use the verification code to activate your account. Verification code ${OTP}.`,
												};
												//Sending new data via Email
												Email.send_email(content);
												req.session.webUser = {
													name: newUser.name,
													email: newUser.mail,
												};
												req.session.email = newUser.mail;
												return done(
													null,
													newUser,
													req.flash(
														'success',
														'Congratulations! Your account was successfully created. Please verify your account.'
													)
												);
												req.session.destroy();
											}
										});
									});
							}
						}
					);
				});
			}
		)
	);
	//===============================================

	/******Customer Login Function ***********/
	passport.use(
		'customer-local-login',
		new LocalStrategy(
			{
				usernameField: 'email',
				passwordField: 'password',
				passReqToCallback: true, // allows us to pass back the entire request to the callback
			},
			function (req, email, password, done) {
				// callback with email and password from our form
				var url = req.url;
				console.log('url------- ', url);
				console.log(req.body);
				User.findOne(
					{
						mail: new RegExp(email, 'i'),
						//	$or: [{ 'role_id': '1' }]
					},
					function (err, user) {
						req.session.email = email;
						// console.log("email ----" , req.session.email);

						if (err) return done(null, false, req.flash('error', err)); // req.flash is the way to set flashdata using connect-flash

						// if no user is found, return the message
						// console.log("logged in user ,, " , user);
						if (!user)
							return done(
								null,
								false,
								req.flash('error', 'Incorrect Email Address or Password.')
							); // req.flash is the way to set flashdata using connect-flash

						// if the user is found but the password is wrong
						if (!user.validPassword(password))
							return done(
								null,
								false,
								req.flash('error', 'Incorrect Email Address or Password.')
							); // create the loginMessage and save it to session as flashdata

						if (user.status === 'inactive')
							return done(
								null,
								false,
								req.flash(
									'error',
									'Your Account Not Activated ,Please Check Your Email.'
								)
							); // create the loginMessage and save it to session as flashdata

						if (user.role_id === 1)
							return done(
								null,
								false,
								req.flash('error', 'Incorrect Email Address or Password.')
							); // create the loginMessage and save it to session as flashdata

						if (user.verify === 0)
							return done(
								null,
								false,
								req.flash(
									'error',
									'Your account is not verified. Please verify your account first.$' +
										user._id
								)
							); // create the loginMessage and save it to session as flashdata

						req.session.save(function (err) {
							req.session.userCustomerSession = user;
						});
						// all is well, return successful user
						// req.session.userCustomerSession = user;
						console.log(
							'SESSIN CREATED: ',
							JSON.stringify(req.session.userCustomerSession)
						);
						var date = new Date();
						User.update(
							{ _id: user._id },
							{ login_time: date },
							function (err, result) {
								if (err) {
									throw err;
								} else {
									console.log(
										'SESSIN Active: ',
										JSON.stringify(req.session.userCustomerSession)
									);
									return done(null, user);
								}
							}
						);

						// return done(null, user, req.flash('success', 'Logged in successfully'));
					}
				);
			}
		)
	);
	//===============================================
	/*************** staff signup *************/
	passport.use(
		'staff-signup',
		new LocalStrategy(
			{
				usernameField: 'email',
				passwordField: 'password',
				passReqToCallback: true, // allows us to pass back the entire request to the callback
			},
			function (req, email, password, done) {
				process.nextTick(function () {
					User.findOne({ mail: email }, function (err, user) {
						if (err) return done(err);

						User.find()
							.sort([['_id', 'descending']])
							.limit(1)
							.exec(async function (err, userdata) {
								var newUser = new User();
								var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
								var new_id = mongoose.Types.ObjectId();
								const stripe_customer = await stripe.customers.create({
									email: email,
									name: req.body.username,
									address: {
										line1: '510 Townsend St',
										postal_code: '98140',
										city: 'San Francisco',
										state: 'CA',
										country: 'US',
									},
								});
								//var active_code = bcrypt.hashSync(Math.floor((Math.random() * 99999999) *54), null, null);
								var active_code = Math.random().toString(36).slice(-20);

								newUser.role_id = req.body.role_id;
								newUser.mail = email;
								newUser.password = newUser.generateHash(
									Math.floor(Math.random() * 222 * 999)
								);
								newUser.name = req.body.username;
								newUser.stripeCustomerId = stripe_customer.id;
								newUser.created_date = day;
								newUser.updated_date = day;
								newUser.status = 'active';
								newUser.verify = 0;
								newUser.active_hash = active_code;
								newUser._id = new_id;
								newUser.save(function (err) {
									if (err) throw err;

									//ready content for send email
									var content = {};
									var content = {
										name: req.body.username,
										email: req.body.email,
										subject: 'Create Password',
										templatefoldername: 'createPassword',
										id: new_id,
										token: active_code,
									};

									//Sending new password via Email
									Email.send_email(content);

									return done(
										null,
										newUser,
										req.flash('success', 'Staff created successfully.')
									);
									req.session.destroy();
								});
							});
					});
				});
			}
		)
	);
	//===============================================

	/*************** mobile signup *************/
	passport.use(
		'mobile-signup',
		new LocalStrategy(
			{
				usernameField: 'email',
				passwordField: 'password',
				passReqToCallback: true, // allows us to pass back the entire request to the callback
			},
			async function (req, email, password, done) {
				var service_category_id = '';
				console.log('req.body.otherService----', req.body.otherService);
				if (req.body.otherService) {
					var s_cat = [];
					var s_data = await ServiceCategories.find({
						name: req.body.otherService,
					}).then(res => {
						console.log('s_data-----', res);
						s_cat = res;
						if (s_cat.length == 0) {
							var day = moment.utc();
							var newService_category = new ServiceCategories();
							newService_category._id = mongoose.Types.ObjectId();
							service_category_id = newService_category._id;
							newService_category.name = req.body.otherService;
							//newService_category.pagecontent = req.body.pagecontent;
							newService_category.status = 'active';
							newService_category.created_date = day;
							newService_category.updated_date = day;
							newService_category.save();
						} else {
							return done(
								null,
								false,
								req.flash(
									'error',
									'This service business type is already existed.'
								)
							);
						}
					});
					//console.log(s_data)
				}

				if (req.body.account_as != 'customer') {
					var business_category_name;
					if (req.body.category == 'Other') {
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
				process.nextTick(function () {
					User.findOne({ mail: email, role_id: role_id }, function (err, user) {
						if (err) return done(err);
						if (user) {
							return done(
								null,
								false,
								req.flash('error', 'That email is already taken.')
							);
						} else {
							var newUser = new User();
							User.find()
								.sort([['_id', 'descending']])
								.limit(1)
								.exec(async function (err, userdata) {
									var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
									const stripe_customer = await stripe.customers.create({
										email: email,
										name: req.body.name,
										address: {
											line1: '510 Townsend St',
											postal_code: '98140',
											city: 'San Francisco',
											state: 'CA',
											country: 'US',
										},
									});
									// var active_code=bcrypt.hashSync(Math.floor((Math.random() * 99999999) *54), null, null);

									var active_code = Math.random().toString(36).slice(-20);
									newUser.role_id = role_id;
									newUser.mail = email;
									newUser.userType = req.device.type;
									newUser.password = newUser.generateHash(password);
									newUser.name = req.body.name;
									newUser.stripeCustomerId = stripe_customer.id;
									newUser.address = req.body.address;
									newUser.city = req.body.city;
									newUser.heard_about = req.body.heard_about;
									newUser.website = req.body.website;
									newUser.country = req.body.country;
									newUser.zipcode = req.body.postal_code;
									newUser.state = req.body.state;
									newUser.business_name = req.body.business_name;
									if (req.body.otherService) {
										newUser.business_category = service_category_id;
										newUser.business_category_name = req.body.otherService;
									} else {
										newUser.business_category = req.body.category;
										newUser.business_category_name = business_category_name;
									}

									newUser.mobile = req.body.mobile;
									if (req.body.lat && req.body.lng) {
										newUser.location.coordinates = [
											{ lat: req.body.lat, lng: req.body.lng },
										];
									} else {
										newUser.location.coordinates = [{ lat: ' ', lng: ' ' }];
									}
									newUser.otp = OTP;
									newUser.inviteCode = inviteCode;
									newUser.makePagePublic = true;
									newUser.created_date = day;
									newUser.updated_date = day;
									newUser.status = 'active';
									newUser.verify = 0; //inactive for email actiavators
									newUser.active_hash = active_code;
									newUser._id = mongoose.Types.ObjectId();
									newUser.save(function (err) {
										if (err) {
											throw err;
										} else {
											//	constant.email = email;
											var content = {};
											var active_hash = Math.random().toString(36).slice(-20);
											var content = {
												name: newUser.name,
												email: newUser.mail,
												otp: OTP,
												subject: 'Email verification code',
												templatefoldername: 'otpGenerate',
												id: newUser._id,
												token: active_hash,
												content: `Congratulations! You are Registered. Please, use the verification code to activate your account. Verification code ${OTP}.`,
											};
											//Sending new data via Email
											Email.send_email(content);
											req.session.webUser = {
												name: newUser.name,
												email: newUser.mail,
											};
											return done(
												null,
												newUser,
												req.flash(
													'success',
													'Congratulations! Your account was successfully created. Please verify your account.'
												)
											);
											req.session.destroy();
										}
									});
								});
						}
					});
				});
			}
		)
	);
	//===============================================

	/******Mobile Login Function ***********/
	passport.use(
		'mobile-login',
		new LocalStrategy(
			{
				usernameField: 'email',
				passwordField: 'password',
				passReqToCallback: true, // allows us to pass back the entire request to the callback
			},
			function (req, email, password, done) {
				// callback with email and password from our form
				var url = req.url;
				console.log('url------- ', url);
				console.log(req.body);
				User.findOne(
					{
						mail: new RegExp(email, 'i'),
						status: 'active',
						//	$or: [{ 'role_id': '1' }]
					},
					function (err, user) {
						req.session.email = email;
						console.log('email ----', req.session.email);

						if (err) return done(null, false, req.flash('error', err)); // req.flash is the way to set flashdata using connect-flash

						// if no user is found, return the message
						if (!user)
							return done(
								null,
								false,
								req.flash('error', 'Incorrect Email Address or Password.')
							); // req.flash is the way to set flashdata using connect-flash

						// if the user is found but the password is wrong
						if (!user.validPassword(password))
							return done(
								null,
								false,
								req.flash('error', 'Incorrect Email Address or Password.')
							); // create the loginMessage and save it to session as flashdata

						if (user.status === 'inactive')
							return done(
								null,
								false,
								req.flash(
									'error',
									'Your Account Not Activated ,Please Check Your Email.'
								)
							); // create the loginMessage and save it to session as flashdata

						if (user.verify === 0)
							return done(
								null,
								false,
								req.flash(
									'error',
									'Your account is not verified. Please verify your account first.$' +
										user._id
								)
							); // create the loginMessage and save it to session as flashdata

						// all is well, return successful user
						req.session.userCustomerSession = user;

						// return done(null, user, req.flash('success', 'Logged in successfully'));
						return done(null, user);
					}
				);
			}
		)
	);
	/******Admin Login Function ***********/
	/* passport.use('mobile-login', new LocalStrategy({
        usernameField : 'mail',
        passwordField : 'password',
        passReqToCallback : true 
    },
    function(req, email, password, done) {
	    var data = {};		
		User.findOne(
			  { 
					'mail' : email, 'verify' : 1, 'status' : 'active', 'role_id' : 2
			  }, function(err, user) {
			
              if (err){
				  data.status = 'failure';
				  data.message = 'Something went wrong.';
				  data.response = '';
				  res.send(data);
			  }
             
			  // if no user is found, return the message
			  if (!user){
				  data.status = 'failure';
				  data.message = 'Sorry Your Account Not Exits.';
				  data.response = '';
				  res.send(data);
			  }
              
			  // if the user is found but the password is wrong
              if (!user.validPassword(password)){
				  data.status = 'failure';
				  data.message = 'Invalid username or password.';
				  data.response = '';
				  res.send(data);
			  }
            
		      if(user.status === 'inactive'){
				  data.status = 'failure';
				  data.message = 'Your Account is inactive.';
				  data.response = '';
				  res.send(data);
			  }
           
			  if(user.verify === 0){
				  data.status = 'failure';
				  data.message = 'Your Account Not Verified ,Please Check Your Email.';
				  data.response = '';
				  res.send(data);
			  }
				
			  data.status = 'success';
			  data.message = 'Successfully Logged In.';
			  data.response = user;
			  res.send(data);
             
        });

    })); */

	passport.use(
		new facebookStrategy(
			{
				clientID: '3199387653679851', //"572810564362435",
				clientSecret: '93bc0b10cffb489b5f69f742bb317118', //"0c4ce7f458f77a77ca981982724a1a41",
				callbackURL: baseUrl + 'facebook/callback',
				profileFields: [
					'id',
					'displayName',
					'name',
					'gender',
					'picture.type(large)',
					'email',
				],
				passReqToCallback: true,
			},
			function (req, token, refreshToken, profile, done) {
				process.nextTick(function () {
					User.findOne(
						{ mail: profile._json.email },
						async function (err, user) {
							const connectUser = [];
							var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
							var password = Math.floor(Math.random() * 99999999 * 54);
							const stripe_customer = await stripe.customers.create({
								email: profile.emails[0].value,
								name: profile.displayName,
								address: {
									line1: '510 Townsend St',
									postal_code: '98140',
									city: 'San Francisco',
									state: 'CA',
									country: 'US',
								},
							});

							if (err) return done(err);

							if (user) {
								console.log('User is' + user);
								req.session.userCustomerSession = user;
								var date = new Date();
								await User.update(
									{ _id: user._id },
									{ $set: { login_time: date } }
								);
								return done(
									null,
									user,
									req.flash('success', 'Logged in successfully')
								);
								// done(null, user);
							} else {
								var newUser = new User();

								newUser.password = newUser.generateHash(password);
								newUser.mail = profile.emails[0].value;
								newUser.name = profile.displayName;
								newUser.stripeCustomerId = stripe_customer.id;
								newUser.created_date = day;
								if (req.device.type == 'phone') {
									newUser.userType = 'MobileUser';
								} else {
									newUser.userType = 'WebUser';
								}
								newUser.updated_date = day;
								newUser.social_provider = 'Facebook';
								newUser.status = 'active';
								newUser.verify = '1';

								newUser.save(function (err) {
									if (err) {
										throw err;
									}
									User.findOne(
										{ mail: profile._json.email },
										async function (err, result) {
											if (err) {
												throw err;
											}
											//ready content for send email
											var content = {
												name: newUser.name,
												email: newUser.mail,
												password: password,
												subject: 'Account creation successful',
												templatefoldername: 'socialLogin',
												content: 'Thanks for contacting with us.',
											};
											//Sending new data via Email
											req.session.userCustomerSession = result;
											Email.send_email(content);
											await importContactSuccess
												.findOne({ mail: profile.emails[0].value })
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
												.catch(err => {
													console.log('Import contact social login error', err);
												});
											return done(
												null,
												newUser,
												req.flash('success', 'Account created successfully')
											);
										}
									);
								});
							}
						}
					);
				});
			}
		)
	);

	passport.use(
		new GoogleStrategy(
			{
				clientID:
					'1055295143366-c7q7effup0qgodf0g9q87hus7cmhc23j.apps.googleusercontent.com',
				clientSecret: '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',
				callbackURL: baseUrl + 'google/callback',
				passReqToCallback: true,
			},
			function (req, accesstoken, refreshToken, profile, done) {
				User.findOne(
					{ mail: profile.emails[0].value },
					async function (err, user) {
						const connectUser = [];
						var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
						var password = Math.floor(Math.random() * 99999999 * 54);
						const stripe_customer = await stripe.customers.create({
							email: profile.emails[0].value,
							name: profile.displayName,
							address: {
								line1: '510 Townsend St',
								postal_code: '98140',
								city: 'San Francisco',
								state: 'CA',
								country: 'US',
							},
						});

						if (err) return done(err);

						if (user && user.role_id === 1) {
							return done(
								null,
								false,
								req.flash('error', 'Incorrect Email Address or Password.')
							); // create the loginMessage and save it to session as flashdata
						}
						if (user) {
							req.session.userCustomerSession = user;
							var date = new Date();
							await User.update(
								{ _id: user._id },
								{ $set: { login_time: date } }
							);
							return done(
								null,
								user,
								req.flash('success', 'Logged in successfully')
							);
						}
						if (!user) {
							var newUser = new User();

							newUser.stripeCustomerId = stripe_customer.id;
							newUser.password = newUser.generateHash(password);
							newUser.mail = profile.emails[0].value;
							newUser.name = profile.displayName;
							newUser.created_date = day;
							newUser.updated_date = day;
							if (req.device.type == 'phone') {
								newUser.userType = 'MobileUser';
							} else {
								newUser.userType = 'WebUser';
							}
							newUser.social_provider = 'Google';
							newUser.status = 'active';
							newUser.verify = '1';

							newUser.save(function (err) {
								if (err) {
									throw err;
								}

								User.findOne(
									{ mail: profile.emails[0].value },
									async function (err, result) {
										if (err) {
											throw err;
										}
										//ready content for send email
										var content = {
											name: newUser.name,
											email: newUser.mail,
											password: password,
											subject: 'Account creation successful',
											templatefoldername: 'socialLogin',
											content: 'Thanks for contacting with us.',
										};
										//Sending new data via Email
										req.session.userCustomerSession = result;
										Email.send_email(content);
										await importContactSuccess
											.findOne({ mail: profile.emails[0].value })
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
											.catch(err => {
												console.log('Import contact social login error', err);
											});
										return done(
											null,
											newUser,
											req.flash('success', 'Account created successfully')
										);
									}
								);
							});
						}
					}
				);
			}
		)
	);

	passport.use(
		new LinkedInStrategy(
			{
				clientID: '78k4qg4biiesky',
				clientSecret: 'ejEIrYdLVXFKEm04',
				callbackURL: baseUrl + 'auth/linkedin/callback',
				passReqToCallback: true,
				scope: ['r_emailaddress', 'r_liteprofile'],
			},
			function (req, accesstoken, refreshToken, profile, done) {
				console.log('LINKED :::::', profile);

				if (!profile) {
					// failureRedirect
					req.flash('error', 'Request canceled 2');
					return res.redirect('/');
				}

				User.findOne(
					{ mail: profile.emails[0].value },
					async function (err, user) {
						const connectUser = [];
						var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
						var password = Math.floor(Math.random() * 99999999 * 54);
						const stripe_customer = await stripe.customers.create({
							email: profile.emails[0].value,
							name: profile.displayName,
							address: {
								line1: '510 Townsend St',
								postal_code: '98140',
								city: 'San Francisco',
								state: 'CA',
								country: 'US',
							},
						});

						if (err) return done(err);

						if (user) {
							console.log('User is' + user);
							req.session.userCustomerSession = user;
							var date = new Date();
							await User.update(
								{ _id: user._id },
								{ $set: { login_time: date } }
							);
							return done(
								null,
								user,
								req.flash('success', 'Logged in successfully')
							);
						} else {
							var newUser = new User();

							newUser.stripeCustomerId = stripe_customer.id;
							newUser.password = newUser.generateHash(password);
							newUser.mail = profile.emails[0].value;
							newUser.name = profile.displayName;
							newUser.created_date = day;
							newUser.updated_date = day;
							if (req.device.type == 'phone') {
								newUser.userType = 'MobileUser';
							} else {
								newUser.userType = 'WebUser';
							}
							newUser.social_provider = 'LinkedIn';
							newUser.status = 'active';
							newUser.verify = '1';

							newUser.save(function (err) {
								if (err) {
									throw err;
								}
								User.findOne(
									{ mail: profile.emails[0].value },
									async function (err, result) {
										if (err) {
											throw err;
										}
										//ready content for send email
										var content = {
											name: newUser.name,
											email: newUser.mail,
											password: password,
											subject: 'Account creation successful',
											templatefoldername: 'socialLogin',
											content: 'Thanks for contacting with us.',
										};
										//Sending new data via Email
										req.session.userCustomerSession = result;
										Email.send_email(content);
										await importContactSuccess
											.findOne({ mail: profile.emails[0].value })
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
											.catch(err => {
												console.log('Import contact social login error', err);
											});
										return done(
											null,
											newUser,
											req.flash('success', 'Account created successfully')
										);
									}
								);
							});
						}
					}
				);
			}
		)
	);
};
