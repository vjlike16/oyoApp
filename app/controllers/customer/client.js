var clients = require('../../models/home');
var connectedList = require('../../models/customers/connectedList');
const connected = require('../../models/customers/connectedList');
var importContactSuccess = require('../../models/isp/importContactSuccess');
var services = require('../../models/customers/service');
var importContacts = require('../../models/isp/importContacts');
var appointment = require('../../models/customers/appointments');
const businessHours = require('../../models/isp/businessHours');
var sendReminder = require('../../models/isp/sendReminder');
var Email = require('../../../lib/email.js');
var Async = require('async');
var dateFormat = require('dateformat');
var moment = require('moment');
const momentTZ = require('moment-timezone');
var lowerCase = require('lower-case');
var fs = require('fs');
const { baseUrl } = require('../../../config/constants');
var google01 = require('googleapis')
var OAuth2 = google01.Auth.OAuth2Client;
var clientSecrets = require('../../controllers/admin/token.json');
var oauth2Client = new OAuth2(clientSecrets.web.client_id, clientSecrets.web.client_secret, clientSecrets.web.redirect_uris[0]);
var Connected_ISPs = [];
var newArray = [];
var importedContacts = [];

exports.listing = async function (req, res) {
	var mail = req.app.locals.userCustomerSession.mail;
	var userId = req.app.locals.userCustomerSession._id;
	var business_category_id = req.app.locals.userCustomerSession.business_category;
	var data = {};
	Connected_ISPs = [];
	newArray = [];
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.name_category = "";
	data.address = "";
	data.type =  req.query.all ? "all" : "no-filter";
	data.businessHours = await businessHours.find({ispId : userId});
	data.importContact = await importContactSuccess.find({ ispEmail: mail }).sort({'name':1});
	console.log(JSON.stringify(data.importContact))
	if(data.importContact ){
		data.importContact.sort((a, b) => a.name.localeCompare(b.name))
	}
	var connectedUser = await connectedList.find({ispMail : mail, status: "success"}).populate({
		path: 'cusId',
		select:'name mail status',
		// match: { status: 'active' }
	}).sort({ "cusName": 1 });
	connectedUser = JSON.parse(JSON.stringify(connectedUser));
	
	data.connectedList = connectedUser.filter((element) => {
													return element.cusId != null && element.cusId.status == 'active'
											});
	data.connectedList.sort((a, b) => a.cusName.localeCompare(b.cusName))
	var checkData = JSON.parse(JSON.stringify(data.connectedList));
	
	data.service = await services.find({service_proviver : userId, business_category : business_category_id});


	// var tasks = [
	// 	function (callback) {
	// 		importContactSuccess.find({ ispEmail: req.app.locals.userCustomerSession.mail }).exec((err, result) => {
	// 			if (err) {
	// 				throw err;
	// 			} else {
	// 				data.importContact = result;
	// 				importedContacts = result;
	// 			}
	// 		})
	// 	//	console.log("data.importContact------->>>", data.importContact);
	// 		callback();
	// 	},
	// 	function (callback) {
	// 		connectedList.find({ ispId: req.app.locals.userCustomerSession._id, status: "success" }).
	// 			exec(function (err, result) {
	// 				if (err) {
	// 					throw err;
	// 				} else {
	// 					console.log("result",result);
	// 					var arr = result.ConnectedISPs;
	// 					arr.forEach(ele => {
	// 						if (ele.userId !== undefined) {
	// 							let str = ele.userId
	// 							Connected_ISPs.push(str.toString());
	// 						}
	// 					})
	// 					callback();
	// 				}
	// 			})
	// 	},
	// 	function (callback) {
	// 		clients.aggregate(
	// 			[
	// 				{
	// 					"$match":
	// 					{
	// 						"$and": [
	// 							{ "verify": 1 },
	// 							{ "status": "active" }
	// 						]
	// 					}
	// 				},
	// 			]
	// 		)
	// 			.sort({ 'created_date': -1 })

	// 			.exec(function (err, result) {
	// 				if (err) {
	// 					data.result = "";
	// 					callback()
	// 				} else {
	// 					newArray = [];
	// 					result.forEach(element=>{
	// 					if (Connected_ISPs.length > 0) {
	// 					//	console.log("isplist---",Connected_ISPs[1] , "element.id----" , element._id.toString());
	// 						if(Connected_ISPs[0] == element._id.toString()){
	// 						//	console.log("data is present ")
	// 						}
	// 						//console.log("Connected_ISPs.length----" , Connected_ISPs.length);
	// 						if (Connected_ISPs.indexOf(element._id.toString()) > -1) {
	// 						//	console.log("yes indsie  ");
	// 							newArray.push({
	// 								"_id": element._id,
	// 								"business_name": element.business_name,
	// 								"birthdate": element.birthdate,
	// 								"address": element.address,
	// 								"name": element.name,
	// 								"connect": "yes",
	// 								"status": "success",
	// 								"profileImage": element.profileImage,
	// 							})
	// 						}
	// 					}
	// 				})
	// 					callback();
	// 				}

	// 			});
	// 	},

	// ]
	// Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
	// 	newArray.sort();//sort({ 'created_date': -1 });
	// 	newArray.sort((a, b) => a.name.localeCompare(b.name));
	// 	data.result = newArray;
	// 	res.render('customer/client/list', data);
	// });
	//For aplaphabetic pagination
	if(req.query.filterby != undefined){

		data.connectedList = await data.connectedList.filter( element => element.cusName.toLowerCase().charAt(0)==req.query.filterby)

		await data.connectedList.sort( function( a, b ) {
			a = a.cusName.toLowerCase();
			b = b.cusName.toLowerCase();
			return  a < b ? -1 : a > b ? 1 : 0;
		});

		data.connectedList.reverse()
	}
	data.urlQuery = req.query.filterby == undefined ? 'all' : req.query.filterby;
	res.render('customer/client/list', data);
}
exports.client_details = async function(req , res){

	
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	var id = req.params.id;
	// data.name_category = "";
	// data.address = "";
	// data.importContact = await importContactSuccess.find({ ispEmail: mail });
	let details = await connectedList.findOne({_id:id}).sort({ "cusName": 1 });
	if(details){
	data.connectedList = details._doc;
	res.render('customer/client/client-details', data);
	}else{
		res.redirect(baseUrl +'clients');
	}

}

exports.exportToCsv = function (req, res) {
	var data = {};

	const Json2csvParser = require('json2csv').Parser;
	
				// Making Array for export
				// var dataArray = [];
				// for (var i = 0; i < result.length; i++) {
				// 	let business_category =  (result[i].business_category == null) ? '' : result[i].business_category.name;
				// 	let subscription =  (result[i].subscription == null) ? '' : result[i].subscription.plan_name;
				// //	console.log('result------------------',result[i]);
				// 	dataArray.push({ "S. No.": i+1, "Name": result[i].name, "Email": result[i].mail, "Gender": result[i].gender, "Address": result[i].address, "City ": result[i].city, "State": result[i].state, "Zipcode": result[i].zipcode, "Business Name": result[i].business_name, "Business Category": business_category, "Subscription Plan": subscription, "Plan End Date": result[i].plan_end_date, "Last Paid Date": result[i].last_paid_amount, "CreatedDate": dateFormat(result[i].created_date, "dd-mm-yyyy h:MM TT"), "Status": result[i].status });
				// }

				//Exporting
				const json2csvParser = new Json2csvParser();
				const csv = json2csvParser.parse(newArray);

				var CurrentTimeStamp = moment.utc();
				var datetimestamp = dateFormat(CurrentTimeStamp, "yyyy_mm_dd'T'HH_MM_ss");
				var fileName = "clients_" + datetimestamp + ".csv";
				var filePath = 'public/uploads/csv/' + fileName;
 
				console.log('filePath------------------', filePath);

				fs.writeFileSync('public/uploads/csv/' + fileName + '', csv);
				res.download(filePath, function (err) {
					fs.unlinkSync(filePath);
					// req.flash('success', 'Successfully exported the data.');
					///// res.redirect(baseUrl + 'clients');
		}); 
} 
exports.importContacts_save = async (req , res)=>{
	// console.log("global data ---" , newArray);
	let day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
	let details = req.app.locals.userCustomerSession;
	let connectUser = [];
	let reminderData = [];
	console.log("data----0>" , req.body.contactMail);
	if(req.body.contactMail == undefined){
		req.flash('error' , 'Please select a user first');					
		res.redirect(baseUrl+"clients");
	} else {
		if(req.body.contactMail){
			var clientEmails = req.body.contactMail;
			var clientNames = req.body.contactName;
			var newArray0 = [];

			clientNames.forEach((ele , index)=>{
				newArray0.push({
					name:clientNames[index],
					mail:clientEmails[index]
				})
			})
			// newArray0.forEach(ele=>{ 
			for(let ele of newArray0){
				let content = {
					'name': ele.name,
					'email': ele.mail,
					'subject': 'Connection request',
					'templatefoldername': 'import',   
					'password': "newPassword",
					'content': `${details.name} (${details.inviteCode}) would like to connect with you. If you are new to OYOapp then please, click the link below to either connect with the business owner by name or invitation code.`
				};
				Email.send_email(content);

				await connectedList.findOne({cusMail: ele.mail, ispMail: details.mail})
				.then(async (checkConnected) => {
					checkConnected = JSON.parse(JSON.stringify(checkConnected));
					let cusData = await clients.findOne({mail: ele.mail});
					cusData = JSON.parse(JSON.stringify(cusData));
					console.log("cusData",cusData);
					connectUser = [];
					reminderData = [];
					if(cusData){
						if(!checkConnected){
							connectUser.push({
								status: "pending",
								ispId: details._id,
								ispName: details.name,
								ispMail: details.mail,
								IspProfileImage: details.profileImage,
								cusId: cusData._id,
								cusName: cusData.name,
								cusMail: cusData.mail,
								cusAddress: cusData.address,
								cusMobile: cusData.mobile,
								social_provider: cusData.social_provider,
								cusProfile: cusData.profileImage,
								ispInvite: "true",
								createdDate: day,
							});
							reminderData.push({
								ispId: details._id,
								notificationType: "Connection",
								status: "pending",
								name : cusData.name,
								mail : cusData.mail,
								profile : cusData.profileImage,
								phone : cusData.mobile,
								ispName: details.name,
								ispEmail: details.mail,
								ispProfile: details.profileImage,
								ispPhone: details.mobile,
								created_date: day
							});
							console.log("connectUser",connectUser);
							console.log("reminderData",reminderData);
							await connectedList.create(connectUser);
							await sendReminder.create(reminderData);
							await importContactSuccess.findOneAndRemove({ mail: ele.mail, ispEmail: details.mail });
						}
					}
				})
				.catch((err) => {
					res.send(err)
				})
			}
			// });
		}
		req.flash('success' , 'Connection request sent')					
		res.redirect(baseUrl+"clients");
	}
}
exports.ImportFromCsv = async function(req , res){
	var contacts =   req.body.data;
	var details = req.app.locals.userCustomerSession;
    var alreadyAdded = 0;
	var counter = 0;
	// console.log("contacts----" , contacts);
	for(let i=0; i<contacts.length; i++){
		if(contacts[i].Email != undefined || typeof contacts[i].Email != 'undefined'){
			var importContact = await importContactSuccess.findOne({ 
				$and: [
					{ispEmail: details.mail},
					{mail: contacts[i].Email}
				]
			}).then(async (res)=>{
			console.log("resss----" , res);
			if(res == null){
				var contact = await importContactSuccess.create({
											"name":contacts[i].Fname,
											"mail":contacts[i].Email,
											"ispEmail":details.mail,
											"ispName":details.name,
											"ispProfile":details.profileImage,
											"ispId":details._id,
											"provider" : "Other",
											"coverPhotos" : "https://lh3.googleusercontent.com/c5dqxl-2uHZ82ah9p7yxrVF1ZssrJNSV_15Nu0TUZwzCWqmtoLxCUJgEzLGtxsrJ6-v6R6rKU_-FYm881TTiMCJ_=s1600",
				});
				counter +=1;
			}
			if(res != null){
				alreadyAdded +=1;
			}
		});
	}
	if(contacts.length-1 == i){
		res.json({count:counter,alreadyAdded:alreadyAdded});
	}
   }

	// req.flash('success' ,`${counter} data have been added .`)
	// res.redirect(baseUrl+"clients");

}

exports.downloadFile = function(req , res){
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
 // console.log("in paakjfgsgvdh----------kdfjvbdhk,")
	var fileName = "format";
	var filePath = 'public/customer_format.xlsx'; 

	console.log('filePath------------------', filePath);

	// fs.writeFileSync('public/uploads/csv/' + fileName);
//	res.download(filePath , "ihef");
	res.download(filePath, function (err) {
		// fs.unlinkSync(filePath);
		// req.flash('success', 'Successfully exported the data.');
	// res.redirect(baseUrl + 'clients');
}); 
}

exports.google_imported = async function(req , res){
//	res.send("svjbkf");
	var data = {};
	var mail = req.app.locals.userCustomerSession.mail;
	var userId = req.app.locals.userCustomerSession._id;
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.name_category = "";
	data.address = "";
	data.type = "google"

	var a = await importContactSuccess.find({ ispEmail: mail ,  "provider" : "Google" }).then(ress=>{
		console.log("ress---------" , ress);
		data.importContact = ress;
	})
	data.importContact.sort((a, b) => a.name.localeCompare(b.name))
	data.businessHours = await businessHours.find({ispId : userId});
	data.connectedList = await connectedList.find({ispMail : mail, status: "success"}).sort({ "cusName": 1 });
	data.service = await services.find({service_proviver : userId});
	data.urlQuery = req.query.filterby == undefined ? 'all' : req.query.filterby;
	res.render('customer/client/list', data);
}
exports.other_imported = async function(req , res){
		var data = {};
		var mail = req.app.locals.userCustomerSession.mail;
		var userId = req.app.locals.userCustomerSession._id;
		data.error = req.flash("error");
		data.success = req.flash("success");
		data.session = req.session;
		data.dateFormat = dateFormat;
		data.name_category = "";
		data.address = "";
		data.type = "other"
	
	var a = await importContactSuccess.find({ ispEmail: mail ,  "provider" : "Other" }).then(ress=>{
		console.log("ress---------" , ress);
		data.importContact = ress;
	})
	data.importContact.sort((a, b) => a.name.localeCompare(b.name))
		data.businessHours = await businessHours.find({ispId : userId});
		data.connectedList = await connectedList.find({ispMail : mail, status: "success"}).sort({ "cusName": 1 });
		data.service = await services.find({service_proviver : userId});
		data.urlQuery = req.query.filterby == undefined ? 'all' : req.query.filterby;
		res.render('customer/client/list', data);
	}
	
exports.outlook_imported = async function(req , res){
	var data = {};
	var mail = req.app.locals.userCustomerSession.mail;
	var userId = req.app.locals.userCustomerSession._id;
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.name_category = "";
	data.address = "";
	data.type = "outlook"
	
	var a = await importContactSuccess.find({ ispEmail: mail ,  "provider" : "Outlook" }).then(ress=>{
		console.log("ress---------" , ress);
		data.importContact = ress;
	})
	data.importContact.sort((a, b) => a.name.localeCompare(b.name))
	data.businessHours = await businessHours.find({ispId : userId});
	data.connectedList = await connectedList.find({ispMail : mail, status: "success"}).sort({ "cusName": 1 });
	data.service = await services.find({service_proviver : userId});
	data.urlQuery = req.query.filterby == undefined ? 'all' : req.query.filterby;
	res.render('customer/client/list', data);
}

exports.remove = function (req, res) {
	var details = req.app.locals.userCustomerSession;
	var isp_id = details._id;
	var cus_id = req.params.id; 
	data = {}
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.flash("session");
	connected.findOneAndRemove({  ispId: isp_id  , cusId: cus_id}, function (err, removeConnection) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'main');
		} else {
			req.flash("success", "Customer Successfully removed.");
			res.redirect(baseUrl + `clients`);
		}
	});
}
exports.ispNotes = function (req, res) {
	console.log("req.body",req.body);
	let connectedId = req.body.connectedId;
	let myNotes = req.body.myNotes;
	var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");

	connected.update({ _id : connectedId },
	{ $set : {
		ispNotes: myNotes,
		ispNotesUpdate: day,
	}},
	function(err, updatedUser) {
		if(err){
			return done(err);
		} else{
			req.flash('success', 'Notes saved');
			res.redirect(`/client/${connectedId}`);
		}
	});
}
exports.deleteIspNotes = function (req, res) {
	connected.update({ _id : req.params.id },
	{ $unset: { ispNotes: "" } },
	function(err, updatedUser) {
		if(err){
			return done(err);
		} else{
			req.flash('success', 'You notes deleted successfully');
			res.redirect(`/client/${req.params.id}`);
		}
	});
}
exports.getCustomerId = async function (req, res) {
	var ispDetails = req.app.locals.userCustomerSession
	var userId = req.body.userId;
	console.log('------------ispDetails._id',ispDetails._id);
	let connectedListData = await connectedList.findOne({_id: userId });
	let importContactSuccess = await importContactSuccess.findOne({_id: userId });
	
		connectedList.findOne({cusId: userId, ispId: ispDetails._id }, function (err, user) {
			if (err) {
				res.send('true');
			}
			if (user) {
				res.json({data: user});
			}
			if (!user) {
				res.json({data: null});
			}
		});
}
exports.checkCustomerNameexist = function (req, res) {
	var name = req.body.name;
	var details = req.app.locals.userCustomerSession
	console.log(name);
	importContactSuccess.findOne(
		{
			'name': new RegExp(name, 'i'),
			$and: [{'ispEmail': details.mail}]
		}, function (err, user) {
			if (err) {
				res.send('true');
			}
			if (user) {
				res.json({data: user});
			}
			if (!user) {
				res.json({data: null});
			}
		});
}
exports.newContact = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	data = {}
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.flash("session");
	data.lowerCase = lowerCase;
	var email = req.body.mail;
	var phone = req.body.mobile;
	var finalTimeZone = req.body.timezone;
	var cusDetails = await clients.find({mail: email});
	cusDetails = JSON.parse(JSON.stringify(cusDetails));
	var profileUrl;
	if(cusDetails.length == 0){
		profileUrl = "avatar.png";
	} else {
		profileUrl = cusDetails[0].profileImage;
	}
	var ispProfileUrl = details.profileImage;
	var serviceProvider = details._id;
	var ispAccId = details.bankDetails.bankAccountId;
	var date, time, title, price;

	var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
	if(details.mail == email){
		req.flash('error' ,`You cannot add youself.`);
		res.redirect(baseUrl+"clients");
		return false
	}
	if(req.body.appointment == 'on'){
		for( let i=1; i<=req.body.rowCount; i++){
			time = req.body[`time${i}`];
			date = req.body[`date${i}`];
			title = req.body[`category${i}`];
			date = moment.utc(date, 'MM-DD-YYYY').format('YYYY-MM-DD');
			console.log("date----------->",date);
			var services_data = await services.find({service_proviver: serviceProvider, name: title});
			if(services_data.length > 0){
				var duration_minutes = parseInt(services_data[0]._doc.minutes);
				var duration = duration_minutes;
				duration = duration.toString();
				price = services_data[0]._doc.price;
				var serviceId = services_data[0]._doc._id;

				var cancellation = services_data[0]._doc.cancellation;
				// Logic for cancellation time according to createed date
				var createdDate = day.split(' ')[0];
				var createdTime = day.split(' ')[1];
				createdTime = createdDate+'T'+createdTime;
					// Logic for cancellation time according to appointment date
					let cancelTime = moment(time, 'hh:mm A').format('HH:mm:ss');
					cancelTime = date+"T"+cancelTime;
					var cancellationTime = moment(cancelTime).subtract(cancellation, 'm').format('YYYY-MM-DD[T]HH:mm:ss');
					// Logic End
				// Logic end
			}
			var date_time = date+'/'+time;
			let utc_time = moment.utc(time, 'hh:mm A').format('HH:mm');
			let end_time = moment.utc(time, 'hh:mm A').add(duration, 'm').format('HH:mm');
			let utc_date = date +"T"+utc_time;
			let end_date = date +"T"+end_time;
			// IST Time Convert start
			var dateWithTime = moment(date + ' ' + utc_time, "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm")
			var dateTz = moment.tz(dateWithTime, finalTimeZone);
			var utc_start = dateTz.clone().tz('GMT').format();

			var endDateWithTime = moment(date + ' ' + end_time, "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm")
			var dateTzz = moment.tz(endDateWithTime, finalTimeZone);
			var utc_end = dateTzz.clone().tz('GMT').format();
			console.log("utc_start",utc_start);
			console.log("utc_end",utc_end);
			// IST Time Convet finish

			var arr = [];
			arr.push(
				{
					updated_date : day,
					created_date : day,
					ispAccId : ispAccId,
					service_proviver : serviceProvider,
					serviceId : serviceId,
					full_payment : false,
					remaining_payment: price,	
					amount: 0,
					tip: 0,
					end_time : end_time,
					end_date : end_date,
					start_time : time,
					start_date : date,
					utc_date : utc_date,
					utc_start : utc_start,
					utc_end: utc_end,
					createdTime : createdTime,
					cancellationTime : cancellationTime,
					cancellation: true,
					finalTimeZone: finalTimeZone,
					status : "Upcoming",
					title : title,
					name : req.body.name,
					mail : req.body.mail,
					profile : profileUrl,
					phone : phone,
					ispName: details.name,
					ispEmail: details.mail,
					ispProfile: ispProfileUrl,
					ispPhone: details.mobile,
					ispId : serviceProvider,
					notificationType: "Appointment",
				}
			);
			var appointmentReminder = await sendReminder.create(arr);
			var success = await appointment.create(arr);
			var content = {
				'name': req.body.name,
				'email': email,
				'subject': 'OYO App-Appointment Details',
				'templatefoldername': 'appointment',
				'id': details._id,
				'token': details.active_hash,
				'date': date_time,
				'title': title,
				'ispName' : details.name,
				'ispEmail': details.mail,
				'ispPhone': details.mobile,
			};
			Email.send_email(content);
		}
	}
	var importContact = await importContactSuccess.findOne({ mail: email, 'ispEmail': details.mail }).then(async (ress)=>{
		var client = await connectedList.findOne({ispMail: details.mail, cusMail: email }).then(async (ressult)=>{
		if(ressult == null){
			if(ress == null){
				var contact = await importContactSuccess.create({
					"name":req.body.name,  
					"mail":email,
					"businessPhones":req.body.mobile,
					"address": req.body.address,
					"notes":req.body.notes,
					"ispId":details._id,
					"provider":"Other",
					"ispEmail":details.mail,
					"ispName":details.name,
					"ispProfile":details.profileImage,
					"coverPhotos" : "https://lh3.googleusercontent.com/c5dqxl-2uHZ82ah9p7yxrVF1ZssrJNSV_15Nu0TUZwzCWqmtoLxCUJgEzLGtxsrJ6-v6R6rKU_-FYm881TTiMCJ_=s1600",
				});
			}
			var content = {};
			content = {
				'name': req.body.name,
				'email': email,
				'subject': 'Connection request',
				'templatefoldername': 'import',   
				'password': "newPassword",
				'content': `${details.name} (${details.inviteCode}) would like to connect with you. If you are new to OYOapp then please, click the link below to either connect with the business owner by name or code.`
			};
			Email.send_email(content);
			// send connection request if client exits
			let cusData = await clients.findOne({mail: email});
			cusData = JSON.parse(JSON.stringify(cusData));
			console.log("cusData",cusData);
			connectUser = [];
			reminderData = [];
			if(cusData){
				connectUser.push({
					status: "pending",
					ispId: details._id,
					ispName: details.name,
					ispMail: details.mail,
					IspProfileImage: details.profileImage,
					cusId: cusData._id,
					cusName: cusData.name,
					cusMail: cusData.mail,
					cusAddress: cusData.address,
					cusMobile: cusData.mobile,
					social_provider: cusData.social_provider,
					cusProfile: cusData.profileImage,
					ispInvite: "true",
					createdDate: day,
				});
				reminderData.push({
					ispId: details._id,
					notificationType: "Connection",
					status: "pending",
					name : cusData.name,
					mail : cusData.mail,
					profile : cusData.profileImage,
					phone : cusData.mobile,
					ispName: details.name,
					ispEmail: details.mail,
					ispProfile: details.profileImage,
					ispPhone: details.mobile,
					created_date: day
				});
				console.log("connectUser",connectUser);
				console.log("reminderData",reminderData);
				await connectedList.create(connectUser);
				await sendReminder.create(reminderData);
				await importContactSuccess.findOneAndRemove({ mail: email, ispEmail: details.mail });
			}

			if(req.body.appointment == 'on'){
				req.flash('success' ,`This contact has been added and the appointment has been booked.`);
				res.redirect(baseUrl+"clients");
			} else {
				req.flash('success' ,`Contact added`);
				res.redirect(baseUrl+"clients");
			}
		} else {
			if(req.body.appointment == 'on'){
				req.flash('success' ,`Client Updated Sucessfully.`);
				res.redirect(baseUrl+"clients");
			} else {
				req.flash('error' ,`This contact is already added.`);
				res.redirect(baseUrl+"clients");
			}
		}
	});
})
}



exports.allClients = async function(req , res){
	var details = req.app.locals.userCustomerSession;
	var arr1 =[];
	var arr2 = [];
	var importContact = await importContactSuccess.find({'ispEmail': details.mail }).then(res=>{
		res.forEach(ele=>{
         arr1.push({
			_id:ele._id ,fullName:ele.name , mail:ele.mail , notes: ele.notes, businessPhones: ele.businessPhones, address:ele.address
		 })
		})
		
	})
	var client = await connectedList.find({ispMail: details.mail}).then(res=>{  
		res.forEach(ele=>{
			arr1.push({
				_id:ele._id ,fullName:ele.cusName , mail:ele.cusMail , notes: '', businessPhones: ele.cusMobile, address:ele.cusAddress
			 })
		})
	})
	
	// console.log("importContact--------" , importContact._doc[0]);
	// console.log("client--------" , client._doc[0]);

	// console.log("Final array-->" , arr1.concat(arr2));
	
	// console.log("Final array-->" , arr1);
	console.log(JSON.stringify(arr1))
	var clean = arr1.filter((arr, index, self) => index === self.findIndex((t) => (t.mail === arr.mail)))
	arr1 = clean;
	res.send(arr1);
}