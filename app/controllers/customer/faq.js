var faq = require('../../models/admin/faq');
var mongoose = require('mongoose');
var moment = require('moment');
var faq_request = require('../../models/customers/faq_request');
const request = require('request');
var Email = require('../../../lib/email');

exports.listing = function (req, res) {
	// console.log("token   : faq");
	// console.log(req.session.userCustomerSession);
	var data = {};
	data.error = req.flash("error"); 
	data.success = req.flash("success");
	data.session = req.session;
	data.msg = "";

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
				res.render('customer/faq', data);
			} else {
				data.result = result;
				res.render('customer/faq', data);
			}
		});
}
exports.save = function (req, res) {
	console.log(req.body);
	var ob = req.body;
	var captcha = Object.values(ob);
	
	// console.log(a[4]);
    var data = {};

	if(
		captcha[4] == undefined ||
		captcha[4] == '' ||
		captcha[4] == null
	){
		return res.json({"success":false,"msg":"please enter captcha."});
	}
	var secretKey = "6Lck4v0aAAAAAEGXJfUynprOwpqfa2BxzxGgcCXv";
	var verifyUrl =`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req.connection.remoteAddress}`;
  	const url =    `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha[4]}&remoteip=${req.connection.remoteAddress}`;
	 
	request(url,(err,respone,body)=>{
	//console.log(body);
	  body = JSON.parse(body);
      if(body.success == undefined || body.success == false){
        return res.json({"success":false,"msg":"Captcha verification failed."});
	  }

	var newfaq = new faq_request();
	var day = moment.utc();
		newfaq._id = mongoose.Types.ObjectId(); 
		newfaq.email = req.body.email; 
		newfaq.user_type = req.body.user_type; 
        newfaq.subject = req.body.subject;  
        newfaq.description = req.body.description;  
		newfaq.status = 'active';
		newfaq.created_date = day; 

		var content = {};
		var active_hash = Math.random().toString(36).slice(-20);
		var content = {
			'user_type': req.body.user_type,
			'_subject': req.body.subject,
			'email': req.body.email,
			'description': req.body.description,
			'templatefoldername': 'faq',

			'subject': ' OYOapp- FAQ Inquiry',
			'id': '60df0c442c29ce4940ae85a0',
			'token': active_hash, 
			//'content': `Congratulations! you are successfully registered in the OYO App. Please use this verification code to activate your account. ${OTP}`
		};
		// console.log(req.body.email);
		// console.log(content);
		//Sending new data via Email 
		Email.send_email(content);

		newfaq.save(function (err) { 
			if (err){
				data.error = req.flash("error");
				res.setHeader('Content-Type', 'text/plain');
				res.json({"success":false,"msg":"Captcha verification failed."});
				throw err;
            }else{
				data.success = req.flash("success");
				res.json({"success":true,"msg":"Captcha passed."}); 
				// res.redirect(baseUrl + 'faq');
            }
		});

	});
}
