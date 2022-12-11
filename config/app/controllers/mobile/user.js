var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var User = require('../../models/home');
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

/* For Image Upload Configration */
const multer = require('multer')
const Storage = multer.diskStorage({
	  destination: function (req, file, cb) {
	       cb(null, 'public/uploads/profile')
	  },
	  filename: function (req, file, cb) {
	  	   var datetimestamp = Date.now();
	       cb(null, datetimestamp+'_'+file.originalname);
	  }
});
const upload = multer({storage: Storage});				   
var multipleFileUpload = upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'registration_card', maxCount: 1 }])
/* end */


/*
	For check token
	Required parameter
	Header :- user_id, active_hash, device_id
	post :- 
    Created Oct 2017
*/
exports.checkDeviceUserActiveToken = function(req, res, next)
{
	var data = {};
	var user_id = req.headers.user_id;
	var active_hash = req.headers.active_hash;
	var device_id = req.headers.device_id;
	var is_login = 1;
	
 	if(!active_hash){
		  data.status = 'failure';
		  data.message = 'Sorry active hash is missing.';
		  data.response = {};
		  return res.send(data);
	}
	
	if(!user_id){
		  data.status = 'failure';
		  data.message = 'Sorry user id is missing.';
		  data.response = {};
		  return res.send(data);
	}
	
	if(!device_id){
		  data.status = 'failure';
		  data.message = 'Sorry device id is missing.';
		  data.response = {};
		  return res.send(data);
	}
	
	User.findOne({'is_login': 1, '_id': user_id, 'device_id': device_id}, function(err, user) {
		if (err) {
			  data.status = 'failure';
			  data.message = 'Token has been expired.';
			  data.response = {};
			  return res.send(data);
		}
		
		if (user){
				if(user.active_hash == active_hash) {
					  if(user.status === 'inactive'){
						  data.status = 'failure';
						  data.message = 'Your account is inactive.';
						  data.response = {};
						  return res.send(data);
					  }
					 
					  next();		
				}else{
					  data.status = 'failure';
					  data.message = 'Sorry token has been expired.';
					  data.response = {};
					  return res.send(data);     
			    } 
		}else{
			  data.status = 'failure';
			  data.message = 'Token has been expired.';
			  data.response = {};
			  return  res.send(data);
		}
	});
}

/*
	For check token
	Required parameter
	Header :- user_id, active_hash, device_id
	post :- 
    Created Oct 2017
*/
exports.checkLanguageParameter = function(req, res, next)
{
	var lang = req.headers.lang;
	if(!lang){
		  data.status = 'failure';
		  data.message = 'Sorry language parameter is missing.';
		  data.response = {};
		  return res.send(data);
	}else{
		next();
	}
}

/*
	LOGIN FUNCTION
	Required parameter
	Header :- device_id
	post :- email, password
    Created Oct 2017
*/
exports.login = function(req, res) {
	var data = {};
	var email = req.body.email;
	var password = req.body.password;
	
 	if(!email){
		  data.status = 'failure';
		  data.message = 'Please enter email.';
		  data.response = {};
		  return res.send(data);
	}
	
 	if(!password){
		  data.status = 'failure';
		  data.message = 'Please enter password.';
		  data.response = {};
		  return res.send(data);
	}
	
	User.findOne(
			    { 
					'mail' : new RegExp(email,'i'), 
					'role_id': 2 
			    }, function(err, user) {
			  
			 
				if (err){
					  data.status = 'failure';
					  data.message = 'Something went wrong.';
					  data.response = {};
					  return res.send(data);
				}
				
				if (user){
						bcrypt.compare(req.body.password, user.password, function(err, isMatch) {
								if (isMatch) {
									 if(user.status === 'inactive'){
										  data.status = 'failure';
										  data.message = 'Your account is inactive.';
										  data.response = {};
										  return res.send(data);
									  }
								   
									  if(user.verify === 0){
										  data.status = 'failure';
										  data.message = 'Your account not verified ,Please check your email.';
										  data.response = {};
										  return res.send(data);
									  }
										
										var login_time = new Date();
										var logout_time = '';
										var device_id = req.headers.device_id;
										var is_login = 1;
										
										var device_id = req.headers.device_id;
										if(!device_id){
											  data.status = 'failure';
											  data.message = 'Sorry device id is missing.';
											  data.response = {};
											  return res.send(data);
										}
										
										User.findOneAndUpdate({ _id: user._id}, 
													   { $set:
														  {
															login_time: login_time,
															logout_time: logout_time,
															device_id: device_id,
															is_login: is_login
														  }
													   },
													   {new: true},
													function (err, updatedUser) {
														if (err) {
															  data.status = 'failure';
															  data.message = 'Something went wrong.';
															  data.response = {};
															  return res.send(data);
														}else{
															  updatedUser.password = '';
															  data.status = 'success';
															  data.message = 'Successfully logged in.';
															  data.response = updatedUser;
															  return res.send(data); 
														}
													}); 
									 
									  
								}else{
									  data.status = 'failure'; 
									  data.message = 'Incorrect login details.';
									  data.response = {};
									  return res.send(data);     
								}      
						});
				}else{
					  data.status = 'failure';
					  data.message = 'Incorrect login details.';
					  data.response = {};
					  res.send(data);
				}		
		});
}

/*
	SIGNUP FUNCTION
	Required parameter
	Header :- 
	post :- email, password
    Created Oct 2017
*/
exports.signUp = function(req, res){
	var data = {};

	var newCustomer = new User();
	var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
	var new_id = mongoose.Types.ObjectId();
	var active_code = Math.random().toString(36).slice(-20);
	
	multipleFileUpload(req, res, function(err) {	
				var name = req.body.name;
				var email = req.body.email;
				//var password = req.body.password;
				var mobile = req.body.mobile;
				var bar_registration = req.body.bar_registration;
				var newPassword = req.body.password;
				req.body.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
	
				/*****************/
				if(req.body.prefered_dates && req.body.prefered_dates != '' && req.body.prefered_times != ''){
							 /**Date Formating**/
							var newDate = req.body.prefered_dates;
							
							var preference_time_array = [];
							preference_time_array = req.body.prefered_times.split('-');
							
							var start_preference_date = dateFormat(newDate +" "+preference_time_array[0], "yyyy-mm-dd HH:MM:ss");
							var end_preference_date = dateFormat(newDate +" "+preference_time_array[1], "yyyy-mm-dd HH:MM:ss");
							
							var new_preference_date = dateFormat(req.body.prefered_dates, "yyyy-mm-dd");
							newCustomer.preference_date = new_preference_date;
							newCustomer.preference_time = req.body.prefered_times;
							newCustomer.preference_start_date = start_preference_date;
							newCustomer.preference_end_time = end_preference_date;
															
															
							var preference_date = req.body.prefered_dates;
							var preference_time = req.body.prefered_times;
							var statusByStatusPreference = ['active', 'inactive'];
							User.count(
									{
										   'preference_date': preference_date, 'preference_time': preference_time, 'status': { $in: statusByStatusPreference }
									}, function(err, count) {
													if (count > 1) {	
															data.status = 'failure';
															data.message = 'This time slot is not free. Please use another slot.';
															data.response = {};
															return res.send(data);
													}else{
														/*****************************************************/
											if(!name){
												  data.status = 'failure';
												  data.message = 'Please enter name.';
												  data.response = {};
												  return res.send(data);
											}
											
											if(!mobile){
												  data.status = 'failure';
												  data.message = 'Please enter mobile.';
												  data.response = {};
												  return res.send(data);
											}
											
											if(!newPassword){
												  data.status = 'failure';
												  data.message = 'Please enter password.';
												  data.response = {};
												  return res.send(data);
											}
											
											if(!email){
												  data.status = 'failure';
												  data.message = 'Please enter email.';
												  data.response = {};
												  return res.send(data);
											}
											
											if(!bar_registration){
												  data.status = 'failure';
												  data.message = 'Please enter bar registration.';
												  data.response = {};
												  return res.send(data);
											}
											
											/**check email unique start**/
											User.findOne(
												{
													'mail': new RegExp(email,'i'),
													$or:[ {'status':'active'},{'status':'inactive'}]
												}, function(err, user) {
													if (user) {
														  data.status = 'failure';
														  data.message = 'This email id already exists.';
														  data.response = {};
														  return res.send(data);
													}else{
															/**check bar_registration unique start**/
															User.findOne({
																		 'bar_registration': new RegExp(bar_registration,'i'),
																		 $or:[ {'status':'active'},{'status':'inactive'}]
															}, function(err, user) {
																if (user) {
																	  data.status = 'failure';
																	  data.message = 'This bar registration already exists.';
																	  data.response = {};
																	  return res.send(data);
																}else{
																	  /***********************************************************/
																	  if(typeof req.files == 'undefined' || typeof req.files['registration_card'] == 'undefined' || req.files['registration_card'] == ''){
																			var registration_cardNewName = 'null';
																		}else{
																			var registration_cardNewName = req.files['registration_card'][0].filename;
																		}
																		
																		if(typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == ''){
																			var profileImageNewName = 'null';
																		}else{
																			var profileImageNewName = req.files['profileImage'][0].filename;
																		}
																		
																		if(req.body.role_id == 'steno_l1'){
																			 newCustomer.role_id  = req.body.steno_l1;
																		}else{
																			 newCustomer.role_id  = req.body.role_id;
																		} 
																		

																		newCustomer.profileImage = profileImageNewName;
																		newCustomer.registration_card = registration_cardNewName;
																		newCustomer.name    = req.body.name;
																		newCustomer.mail = req.body.email;
																		newCustomer.password = req.body.password;
																		newCustomer.mobile = req.body.mobile;
																		newCustomer.dob = req.body.dob;
																		newCustomer.primary_city_operation = req.body.primary_city_operation;
																		newCustomer.bar_name = req.body.bar_name;
																		
																		newCustomer.bar_registration = req.body.bar_registration;
																		newCustomer.district = req.body.district;
																		newCustomer.tehsil = req.body.tehsil;
																		//newCustomer.subscription = req.body.subscription;
																		
																		newCustomer.state = req.body.state;
																		newCustomer.zipcode = req.body.zipcode;
																		newCustomer.address2 = req.body.address2;
																		newCustomer.address = req.body.address;
																		newCustomer.practising = req.body.practising;
																		newCustomer.lawfirmed_associated = req.body.lawfirmed_associated;
																		newCustomer.working_days_start_time = req.body.working_days_start_time;
																		newCustomer.working_days_end_time = req.body.working_days_end_time;
																		newCustomer.weekend_days_start_time = req.body.weekend_days_start_time;
																		newCustomer.weekend_days_end_time = req.body.weekend_days_end_time;
																		newCustomer.frequently_services = req.body.frequently_services;

																		
																		newCustomer._id = new_id;
																		newCustomer.status = 'active'; 
																		newCustomer.verify = 1;
																		newCustomer.role_id = 2;
																		
																		newCustomer.word_limit= 0;
																		newCustomer.total_word= 0;
																		newCustomer.word_used= 0;
																		newCustomer.plan_end_date='';
																		
																		newCustomer.login_time = '';
																		newCustomer.logout_time = '';
																		newCustomer.device_id = '';
																		newCustomer.is_login = 0;
																		
																		newCustomer.active_hash = active_code;
																		newCustomer.created_date = day;
																		newCustomer.updated_date = day;

																				
																		/***save function start***/
																		newCustomer.save(function(err) {
																				if (err){
																						data.status = 'failure';
																						data.message = 'Sorry something went wrong.';
																						data.response = err;
																						res.send(data);
																				}else{
																						//ready content for send email
																						
																						var content = {};
																						var content = {
																						  'name': req.body.name,
																						  'email': req.body.email,
																						  'subject': 'Welcome to Ezsteno',
																						  'templatefoldername': 'accountActivatedCustomer',
																						  'password': newPassword,
																						  'content':  "Welcome to Ezsteno! Thank you so much for joining us. Your account is successfully created and you can use system with below details."
																						};
																					
																						//Sending new password via Email
																						Email.send_email(content);
																						
																						data.status = 'success';
																						data.message = 'Congratulations!! Your account is successfully created. Details have been sent to registered email ID.';
																						data.response = {};
																						return res.send(data);	
																				}	
																		 });/***save function end***/
																		/***********************************************************/
																}	
															});
													}	
											});
									}
							});
				}else{
							/*****************************************************/
							if(!name){
								  data.status = 'failure';
								  data.message = 'Please enter name.';
								  data.response = {};
								  return res.send(data);
							}
							
							if(!mobile){
								  data.status = 'failure';
								  data.message = 'Please enter mobile.';
								  data.response = {};
								  return res.send(data);
							}
							
							if(!newPassword){
								  data.status = 'failure';
								  data.message = 'Please enter password.';
								  data.response = {};
								  return res.send(data);
							}
							
							if(!email){
								  data.status = 'failure';
								  data.message = 'Please enter email.';
								  data.response = {};
								  return res.send(data);
							}
							
							if(!bar_registration){
								  data.status = 'failure';
								  data.message = 'Please enter bar registration.';
								  data.response = {};
								  return res.send(data);
							}
							
							/**check email unique start**/
							User.findOne(
								{
									'mail': new RegExp(email,'i'),
									$or:[ {'status':'active'},{'status':'inactive'}]
								}, function(err, user) {
									if (user) {
										  data.status = 'failure';
										  data.message = 'This email id already exists.';
										  data.response = {};
										  return res.send(data);
									}else{
											/**check bar_registration unique start**/
											User.findOne({
														 'bar_registration': new RegExp(bar_registration,'i'),
														 $or:[ {'status':'active'},{'status':'inactive'}]
											}, function(err, user) {
												if (user) {
													  data.status = 'failure';
													  data.message = 'This bar registration already exists.';
													  data.response = {};
													  return res.send(data);
												}else{
													  /***********************************************************/
													  if(typeof req.files == 'undefined' || typeof req.files['registration_card'] == 'undefined' || req.files['registration_card'] == ''){
															var registration_cardNewName = 'null';
														}else{
															var registration_cardNewName = req.files['registration_card'][0].filename;
														}
														
														if(typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == ''){
															var profileImageNewName = 'null';
														}else{
															var profileImageNewName = req.files['profileImage'][0].filename;
														}
														
														if(req.body.role_id == 'steno_l1'){
															 newCustomer.role_id  = req.body.steno_l1;
														}else{
															 newCustomer.role_id  = req.body.role_id;
														} 
														

														newCustomer.profileImage = profileImageNewName;
														newCustomer.registration_card = registration_cardNewName;
														newCustomer.name    = req.body.name;
														newCustomer.mail = req.body.email;
														newCustomer.password = req.body.password;
														newCustomer.mobile = req.body.mobile;
														newCustomer.dob = req.body.dob;
														newCustomer.primary_city_operation = req.body.primary_city_operation;
														newCustomer.bar_name = req.body.bar_name;
														
														newCustomer.bar_registration = req.body.bar_registration;
														newCustomer.district = req.body.district;
														newCustomer.tehsil = req.body.tehsil;
														//newCustomer.subscription = req.body.subscription;
														
														newCustomer.state = req.body.state;
														newCustomer.zipcode = req.body.zipcode;
														newCustomer.address2 = req.body.address2;
														newCustomer.address = req.body.address;
														newCustomer.practising = req.body.practising;
														newCustomer.lawfirmed_associated = req.body.lawfirmed_associated;
														newCustomer.working_days_start_time = req.body.working_days_start_time;
														newCustomer.working_days_end_time = req.body.working_days_end_time;
														newCustomer.weekend_days_start_time = req.body.weekend_days_start_time;
														newCustomer.weekend_days_end_time = req.body.weekend_days_end_time;
														newCustomer.frequently_services = req.body.frequently_services;

														
														newCustomer._id = new_id;
														newCustomer.status = 'active'; 
														newCustomer.verify = 1;
														newCustomer.role_id = 2;
														newCustomer.total_word = 0;
														newCustomer.word_limit = 0;
														newCustomer.active_hash = active_code;
														newCustomer.created_date = day;
														newCustomer.updated_date = day;

																
														/***save function start***/
														newCustomer.save(function(err) {
																if (err){
																		data.status = 'failure';
																		data.message = 'Sorry something went wrong.';
																		data.response = err;
																		res.send(data);
																}else{
																		//ready content for send email
																		
																		var content = {};
																		var content = {
																		  'name': req.body.name,
																		  'email': req.body.email,
																		  'subject': 'Welcome to Ezsteno',
																		  'templatefoldername': 'accountActivatedCustomer',
																		  'password': newPassword,
																		  'content':  "Welcome to Ezsteno! Thank you so much for joining us. Your account is successfully created and you can use system with below details."
																		};
																	
																		//Sending new password via Email
																		Email.send_email(content);
																		
																		data.status = 'success';
																		data.message = 'Congratulations!! Your account is successfully created. Details have been sent to registered email ID.';
																		data.response = {};
																		return res.send(data);	
																}	
														 });/***save function end***/
														/***********************************************************/
												}	
											});
									}	
							});
				}			
		});/**multiple file upload end**/	
}
/*
	Resend OTP FUNCTION
	Required parameter
	Header :- 
	post :- userid
*/
exports.sendOtpAgain = function(req, res) {
	var data = {}
	data.status = 'failure';
	data.message = 'Please enter name.';
	data.response = {};
	return res.send(data);
}
/*
	FORGOTPASSWORD FUNCTION
	Required parameter
	Header :- 
	post :- email
    Created Oct 2017
*/
exports.forgotPassword = function(req, res) {
	var data = {};
	var active_hash = Math.random().toString(36).slice(-20);
	req.body.active_hash = active_hash;
	//req.body.updated_date = new Date();
	
	var email = req.body.email;
	if(!email){
		  data.status = 'failure';
		  data.message = 'Please enter email.';
		  return res.send(data);
	}

	User.findOne({ 'status' : {$ne: 'delete'}, 'mail' :new RegExp(email,'i'), 'role_id':'2'
			    
		  }, function(err, user) {
		  	
		  	if (err || !user){
					  data.status = 'failure';
					  data.message = 'Sorry account does not exists.';
					  return res.send(data);
			}
		  	
		  	
		    if (user) {
		    	
		    	      if(user.status === 'inactive'){
						   data.status = 'failure';
						   data.message = 'Your account is inactive.';
						   return res.send(data);
					  }
									  
					  User.update({ _id: user._id}, 
									{ $set:
										  {
											active_hash: req.body.active_hash
										  }
									},
									function (err, updatedUser) { 
							if (err) {
								  data.status = 'failure';
								  data.message = 'Something went wrong.';
								  return res.send(data);
							}else{
								  //ready content for send email						
								  var content = {};
								  var content = {
									  'name': user.name,
									  'email': user.mail,
									  'subject': 'Reset Password',
									  'templatefoldername': 'resetPasswordMobile',
									  'id': user._id,
									  'token': active_hash,
									  'content': 'A request was submitted to reset your account password. Please, click the link below to generate a new password. Disregard if the request to reset your password was not from you.'
								  };
							      //Sending new data via Email
								  Email.send_email(content);
								  
								  data.status = 'success';
								  data.message = 'An email has been sent to registered email ID with instructions to reset the password.';
								  return res.send(data);
							}
					  }); 
		     }else{
					  data.status = 'failure';
					  data.message = 'Sorry account does not exits.';
					  return res.send(data);
			 }
		
		
	});
}

/*
	CHECK DATE TIME SLOT FREE
	Required parameter
	Header :- 
	post :- 
    Created Oct 2017
*/
exports.checkDateTimeSlot = function(req, res) {
	var preference_time = req.body.prefered_dates;
	var preference_date = req.body.prefered_times;
	
	var statusByStatus = ['active', 'inactive'];
	Customer.count(
			{
				   'preference_date': preference_date, 'preference_time': preference_time, 'status': { $in: statusByStatus }
			}, function(err, count) {
			
			if (count > 9) {	
				data.status = 'failure';
				data.message = 'This time slot is not free. Please use another slot.';
				data.response = {};
				return res.send(data);
			}else{
				next();
			}
	});
}




/*
	CHECK EMAIL EXCEPT 
	Required parameter
	Header :- 
	post :- email, user_id
    Created Oct 2017
*/
exports.checkemailexistexceptthis = function(req, res, next) {
	var data = {};
	var email = req.body.email;
	var user_id = req.body.user_id;
	
	if(!email){
		  data.status = 'failure';
		  data.message = 'Please enter email.';
		  data.response = {};
		  return res.send(data);
	}
	if(!user_id){
		  data.status = 'failure';
		  data.message = 'Please enter user id.';
		  data.response = {};
		  return res.send(data);
	}
	

	User.findOne(
	   {
				   'mail': new RegExp(email_id,'i'), '_id': {$ne: user_id},
					$or:[ {'status':'active'},{'status':'inactive'}]
	   }, function(err, user) {
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
	});
}



/*
	CHECK REGISTRATION EXCEPT ID FUNCTION
	Required parameter
	Header :- 
	post :- bar_registration, user_id
    Created Oct 2017
*/
exports.checkbarregistrationexistexceptthis = function(req, res, next) {
	var data = {};
	var bar_registration = req.body.bar_registration;
	var user_id = req.body.user_id;
	
	if(!bar_registration){
		  data.status = 'failure';
		  data.message = 'Please enter bar registration.';
		  data.response = {};
		  return res.send(data);
	}
	
	if(!user_id){
		  data.status = 'failure';
		  data.message = 'Please enter user id.';
		  data.response = {};
		  return res.send(data);
	}
	
	User.findOne({
					'bar_registration': new RegExp(bar_registration,'i'), '_id': {$ne: user_id},
					 $or:[ {'status':'active'},{'status':'inactive'}]
				 }, function(err, user) {
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
	});
}



/*
	UPDATE NEW PASSWORD
	Required parameter
	Header :- user_id, active_hash
	post :- password, 
    Created Oct 2017
 
exports.forgotPasswordSaveNewPassword = function(req, res) {
	var data = {};
	var newPassword = req.body.password;
	req.body.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
	req.body.verify = 1;
	req.body.updated_date = new Date();
   
    var active_hash = Math.random().toString(36).slice(-20);
	req.body.active_hash = active_hash;
	
    Customer.findOne({'_id' : req.headers.user_id, 'active_hash': req.headers.active_hash})
    .exec(function(err, userDetails){
       		if (err) {
				  data.status = 'failure';
				  data.message = 'Sorry something went wrong.';
				  data.response = {};
				  return res.send(data);
			} else {
				   if(!userDetails){
					   data.status = 'failure';
					   data.message = 'Sorry didn\'t matched details or this link has been expired.';
				       data.response = {};
				       return res.send(data);
					}else{
					   Customer.findOneAndUpdate({ _id: req.params.id}, req.body, {new: true}, function (err, updatedUser) {
							if (err) {
								  data.status = 'failure';
								  data.message = 'Sorry something went wrong.';
								  data.response = {};
								  return res.send(data);
							}else{
								//ready content for send email						
							    var content = {};
							    var content = {
								  'name': userDetails.name,
								  'email': userDetails.mail,
								  'subject': 'New Credential',
								  'templatefoldername': 'accountActivatedMobile',
								  'password': newPassword,
								  'content':  'We have successfully reset your password.'
							    };
							    //Sending new data via Email
							    Email.send_email(content);
								data.status = 'success';
							    data.message = 'Password set successfully.';
							    data.response = updatedUser;
							    return res.send(data);
							}
						}); 
				   }
			}
    });

}*/

/*
	ALL STATE LISTING 
	Required parameter
	Header :- 
	post :- 
    Created Oct 2017
*/
exports.states = function(req, res) {
	var data = {};
	
	/* var skipValue = parseInt(req.query.skip);
	var limitValue = parseInt(req.query.limit);
	if(!skipValue){
		skipValue = 0;
	}
	if(!limitValue){
		limitValue = globalPerPageLimit;
	} */
	
	var statusByStatus = ['active', 'inactive'];
	State.find({'status' : 'active'})
	         .sort({'state': 1})
			 .exec(function(err, result) {
					if (err) {
						data.status = 'failure';
						data.message = 'Sorry something went wrong.';
						data.response = {};
						res.send(data);
					} else {
						data.status = 'success';
						data.message = 'Successfully.';
						data.response = result;
						return res.send(data);				
					}
			 });
}

/*
	Court Wise STATE LISTING 
	Required parameter
	Header :- 
	post :- 
    Created Feb 2018
*/
exports.courtWiseStates = function(req, res) {
	var data = {};
	var result = {};
	var tasks = [
			function(callback) {
				   Court.distinct('state', {'status' : 'active'})
				  .exec(function(err, statesIds) {
						if (err) {
							result.statesIds = [];
							callback();
						}else{
							result.statesIds = statesIds;
							callback();
						}
				  });		
			},
			function(callback) {
				   	var statusByStatus = ['active', 'inactive'];
					State.find({'status' : 'active', '_id': { $in: result.statesIds }})
							 .sort({'state': 1})
							 .exec(function(err, states) {
									if (err) {
										result.states = [];
										callback();
									} else {
										result.states = states;
										callback();			
									}
							 });		
			}
			
	];
    Async.series(tasks, function(err) {   //series: for step by step and parallel: for suffle 
		 if (err) {
			   data.response = {};
			   data.status = 'failure';
			   data.message = 'Sorry account does not exits.';
			   return res.send(data);
		 } else {
			   data.status = 'success';
			   data.message = 'Successfully.';
			   data.response = result.states;
			   return res.send(data);
		 }
	});
}


/*
	DASHBORAD
	Required parameter
	Header :- 
	post :- 
    Created Nov 2017
*/
/**
exports.dashboard = function(req, res) {
	var data = {};
	var result = {};
	var user_id = req.headers.user_id;
	
	if(!user_id){
		  data.status = 'failure';
		  data.message = 'Sorry user id is missing.';
		  data.response = {};
		  return res.send(data);
	}
	
	User.findOne({'_id': user_id
			    
		  }, function(err, user) {
					if (err || !user){
						    data.status = 'failure';
						    data.message = 'Sorry account does not exits.';
						    return res.send(data);
					}
					if (user) {
						   Draft.count({'user': user_id}) 
									  .select(['_id'])
									  .exec(function(err, drafts) {
										   if (err) {
												result.draftCount = 0;
										   } else {
												/**
												result.draftCount = drafts;
												result.total_word = user.total_word;
											    result.word_used = user.word_used;
											    result.plan_expired_date = user.plan_end_date;
												result.upload_count = 25;
												**/
												/**
												result.total_word = 5000;
												result.word_used = 2600;
												result.upload_count = 25;
												result.draft_count = 14;
												result.plan_expired_date = '30-12-2017';
												
												data.status = 'success';
												data.message = 'Successfully.';
												data.response = result;
												return res.send(data);
										   }
									   });				
									   
					}else{
						    data.status = 'failure';
						    data.message = 'Sorry account does not exits.';
						    return res.send(data);
					}
		
		
	});
} **/

exports.dashboard = function(req, res) {
	var data = {};
	var result = {};
	var commonResult = {};
	var user_id = req.headers.user_id;
	
	if(!user_id){
		  data.status = 'failure';
		  data.message = 'Sorry user id is missing.';
		  data.response = {};
		  return res.send(data);
	}
	
	var tasks = [
			function(callback) {
				   CustomerUpload.count({'user': user_id})
				  .exec(function(err, uploadCount) {
						if (err) {
							result.upload_count = 0;
							callback();
						}else{
							result.upload_count = uploadCount;
							callback();
						}
				  });		
			},
			function(callback) {
				   User.findOne({'_id': user_id})
				   .select(['_id','total_time', 'plan_end_date'])
				  .exec(function(err, users) {
						if (err) {
							result.total_time_in_min = 0;
							result.word_used = 0;
							result.plan_expired_date = 0;
							callback();
						}else{
							result.total_time_in_min = users.total_time;
							result.word_used = users.word_used;
							result.plan_expired_date = users.plan_end_date;
							callback();
						}
				  });		
			},
			function(callback) {
				   Draft.aggregate([ 
					   {
							$match : {user : mongoose.Types.ObjectId(user_id), status: 'active'}
					   }, 
					   { 
							$group: { 
								_id: null,
								totalTimeUsed: { $sum: "$time_used" }, // in seconds
								count: { $sum: 1 }
							} 
					   }
				   ]) 
			      .exec(function(err, usedTime) {
						if (err) {
							result.draft_count = 0;
							result.used_time_in_sec = 0;
							callback();
						}else{
							if(usedTime && usedTime != ""){
								result.draft_count = usedTime[0].count;
								if(usedTime[0].totalTimeUsed && usedTime[0].totalTimeUsed != 0){
									//var totalTimeUsedVar = secToMin(usedTime[0].totalTimeUsed);
									result.used_time_in_sec = usedTime[0].totalTimeUsed;
								}else{
									result.used_time_in_sec = 0;
								}
								callback();
							}else{
								result.draft_count = 0;
								result.used_time_in_sec = 0;
								callback();
							}
						}
				  });
			}
			
	];
    Async.series(tasks, function(err) {   //series: for step by step and parallel: for suffle 
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
}

/*
	LOGOUT FUNCTION
	Required parameter
	Header :- user_id, active_hash, device_id
	post :- 
    Created Oct 2017
*/
exports.logout = function(req, res) {
	var data = {};
	var user_id = req.headers.user_id;
	
	var login_time = '';
	var logout_time = new Date();
	var device_id = '';
	var is_login = 0;
	
	User.findOneAndUpdate({ _id: user_id}, 
			   { $set:
				  {
					login_time: login_time,
					logout_time: logout_time,
					device_id: device_id,
					is_login: is_login
				  }
			   },
			   {new: true},
			   function (err, updatedUser) {
						if (err) {
							  data.status = 'failure';
							  data.message = 'Something went wrong.';
							  data.response = {};
							  return res.send(data);
						}else{
							  //user.login_time = login_time;
							  data.status = 'success';
							  data.message = 'Successfully logged out.';
							  data.response = updatedUser;
							  return res.send(data);
						}
		       }); 
}

exports.edit = function(req, res) {
	var data = {};
	
	User.findOne({ '_id' : req.params.id}, function(err, user) {
		if (err) {
			res.send(err);
		} else {
			data.userDetails = user;
			res.render('admin/users/edit', data);
		}
	});
}

exports.update = function(req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.mail = req.body.mail.toLowerCase(); 
	User.update({ _id: req.body._id}, req.body, function (err, updatedUser) {
		if (err) {
			req.flash('error', 'Sorry something went wrong');
			res.redirect(baseUrl+'admin/users');
		}else{
			req.flash('success', 'Account Updated Successfully');
			res.redirect(baseUrl+'admin/users');
		}
	}); 
}


/*
	Contact FUNCTION
	Required parameter
	Header :- user_id
	post :- name, email, mobile, message
    Created Nov 2017
*/
exports.contact = function(req, res) {
		var data = {};
		var newContact = new Contact();
		var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
		var new_id = mongoose.Types.ObjectId();
		
		var user_id = req.headers.user_id;
		var name = req.body.name;
		var email = req.body.email;
		var mobile = req.body.mobile;
		var message = req.body.message;
		if(!user_id){
			  data.status = 'failure';
			  data.message = 'Sorry user id is missing.';
			  data.response = {};
			  return res.send(data);
		}
		if(!name){
			  data.status = 'failure';
			  data.message = 'Please enter name.';
			  data.response = {};
			  return res.send(data);
		}
		
		if(!email){
			  data.status = 'failure';
			  data.message = 'Please enter email.';
			  data.response = {};
			  return res.send(data);
		}
		if(!mobile){
			  data.status = 'failure';
			  data.message = 'Please enter mobile.';
			  data.response = {};
			  return res.send(data);
		}
		
		if(!message){
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
		newContact.save(function(err) {
			if (err){
				data.status = 'failure';
				data.message = 'Sorry something went wrong.';
				data.response = {};
				return res.send(data);
			}else{
				//ready content for send email						
				  var content = {};
				  var content = {
					  'name': name,
					  'email': email, 
					  //'email': 'gourav.saini@otssolutions.com', //Admin Email
					  'message': message,
					  'subject': 'Contact us',
					  'templatefoldername': 'contact',
					  'content': 'Thanks for contacting with us.'
				  };
				  //Sending new data via Email
				  Email.send_email(content);
				  
				  data.status = 'success';
				  data.message = 'Thanks for contacting with us, we will get back to you later.';
				  data.response = {};
				  return res.send(data);	
			}
		});
}	
	
/*
	For check Current Balance Time
	Required parameter
	Header :- user_id, active_hash, device_id
	post :- 
    Created Oct 2017
*/

exports.checkCurrentBalanceTime = function(req, res) {
	var data = {};
	var result = {};
	var commonResult = {};
	var user_id = req.headers.user_id;
	
	if(!user_id){
		  data.status = 'failure';
		  data.message = 'Sorry user id is missing.';
		  data.response = {};
		  return res.send(data);
	}
	
	var tasks = [
			function(callback) {
				   User.findOne({'_id': user_id})
				   .select(['_id','total_time'])
				  .exec(function(err, users) {
					    console.log("##### First ######");
						console.log(users);
						console.log("###########");
						if (err || !users || users.total_time == 0) {
								data.status = 'failure';
							    data.message = 'Sorry you don\'t have time balance. Please contact to admin.';
							    data.response = {};
							    return res.send(data);
								callback();
						}else{
							    result.total_time_in_min = users.total_time;
							    callback();
						}
				  });		
			},
			function(callback) {
				   Draft.aggregate([ 
					   {
							$match : {user : mongoose.Types.ObjectId(user_id), status: {$ne: 'delete'}},
					   }, 
					   { 
							$group: { 
								_id: null,
								totalTimeUsed: { $sum: "$time_used" }, // in seconds
								count: { $sum: 1 }
							} 
					   }
				   ]) 
			      .exec(function(err, usedTime) {
					    console.log("##### Second ######");
						console.log(usedTime);
						console.log("###########");
						if (err) {
							result.total_balance_time_in_min = result.total_time_in_min;
							result.used_time_in_min = 0;
							result.used_time_in_second = 0;
							//next();
							callback();
						}else{
							if(usedTime && usedTime != ""){
								if(usedTime[0].totalTimeUsed && usedTime[0].totalTimeUsed != 0){
									result.used_time_in_second = usedTime[0].totalTimeUsed;
									result.used_time_in_min = secToMin(usedTime[0].totalTimeUsed);
									var totalTimeUsedInMinVar = secToMin(usedTime[0].totalTimeUsed);
									var total_balance_time_in_min = result.total_time_in_min - totalTimeUsedInMinVar;
									if(total_balance_time_in_min == 0){
										data.status = 'failure';
										data.message = 'Sorry you don\'t have time balance. Please contact to admin.';
										data.response = {};
										return res.send(data);
									}
								}else{
									var total_balance_time_in_min = result.total_time_in_min;
									if(total_balance_time_in_min == 0){
										data.status = 'failure';
										data.message = 'Sorry you don\'t have time balance. Please contact to admin.';
										data.response = {};
										return res.send(data);
									}
								}
								callback();
							}else{
									var total_balance_time_in_min = result.total_time_in_min;
									if(total_balance_time_in_min == 0){
										data.status = 'failure';
										data.message = 'Sorry you don\'t have time balance. Please contact to admin.';
										data.response = {};
										return res.send(data);
									}
							}
						}
				  });
			}
			
	];
    Async.series(tasks, function(err) {   //series: for step by step and parallel: for suffle 
		 if (err) {
			   data.status = 'failure';
			   data.message = 'Sorry you don\'t have time balance. Please contact to admin.';
			   data.response = {};
			   return res.send(data);
		 } else {
			   data.status = 'success';
			   data.message = 'Successfully.';
			   data.response = result;
			   return res.send(data);
		 }
	});
}	
	