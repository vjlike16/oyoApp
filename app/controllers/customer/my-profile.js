const { now } = require("moment");
const { baseUrl } = require("../../../config/constants");
var businessOwner = require('../../models/home');
const connected = require('../../models/customers/connectedList');

exports.facebook_shareLink = async function(req, res) {
    var data = {};
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    
    let isp_id = req.query.verifyCode;
	let businessOwnerDetails = await businessOwner.findOne({_id: isp_id});
	businessOwnerDetails = JSON.parse(JSON.stringify(businessOwnerDetails));

    if (businessOwnerDetails) {
        code = businessOwnerDetails.inviteCode;
        name = businessOwnerDetails.name;
		image = baseUrl+'uploads/profile/'+businessOwnerDetails.profileImage;

        data.title = `${name} - ${code}`;
        data.description = "Use my code to connect with me and my business on OYOapp!";
        var date = new Date();
        data.dateTime = date;
        data.image = image;

        res.render('customer/shareLinks/facebookShare', data);
	}else{
		req.flash('error', 'Opps Business owner not found. Please try again after some time.');
		res.redirect(baseUrl + 'main');
	}

}

exports.twitter = async function(req, res) {
    var data = {};
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
     
    let isp_id = req.query.verifyCode;
	let businessOwnerDetails = await businessOwner.findOne({_id: isp_id});
	businessOwnerDetails = JSON.parse(JSON.stringify(businessOwnerDetails));
 
    if (businessOwnerDetails) {
        code = businessOwnerDetails.inviteCode;
        name = businessOwnerDetails.name;
		image = baseUrl+'uploads/profile/'+businessOwnerDetails.profileImage;

        data.title = `${name} - ${code}`;
        data.description = "Use my code to connect with me and my business on OYOapp!";
        var date = new Date();
        data.dateTime = date;
        data.image = image;

        res.render('customer/shareLinks/twitter', data);
	}else{
		req.flash('error', 'Opps Business owner not found. Please try again after some time.');
		res.redirect(baseUrl + 'main');
	}
 
}

var isp_id;
exports.inviteCodeRedirectUrl = async function(req , res){
    var data = {};
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
	isp_id = req.params.id;
    if(req.app.locals.userCustomerSession){
    var details = req.app.locals.userCustomerSession;
	var cusId = details._id;
	var cusName = details.name;
	var cusMail = details.mail;
	var cusProfile = details.profileImage;
	var cusBirthday = details.birthdate;
	//var lastTrasaction = details.last_transaction;
	console.log("//var lastTrasaction = details.last_transaction;  --- " , isp_id);

	var checkConnectedIsp = await connected.find({cusId : cusId, ispId: isp_id});
	checkConnectedIsp = JSON.parse(JSON.stringify(checkConnectedIsp));
	let status;
	if (checkConnectedIsp.length != 1){
		status = "Not sent";
	} else {
		status = checkConnectedIsp[0].status;
	}
	if (status == 'success' || status == 'pending') {
		req.flash('error', 'You have already send the connection request.');
		res.redirect(baseUrl + `connectedIspDetail/${isp_id}`);
	// } else if (status == 'pending') {
	// 	req.flash('error', 'You have already send the connection request.');
	// 	res.redirect(baseUrl + `connectedIspDetail/${isp_id}`);
	} else {
		var connectedList = [];
		await businessOwner.findOne({ _id: isp_id })
		.then((ispData) => {
			ispData = JSON.parse(JSON.stringify(ispData));
			var ispId = ispData._id;
			var ispName = ispData.name;
			var ispMail = ispData.mail;
			var ispProfile = ispData.profileImage;
			connectedList.push({
				status: "success",
				ispId: ispId,
				ispName: ispName,
				ispMail: ispMail,
				IspProfileImage: ispProfile,
				cusId: cusId,
				cusName: cusName,
				cusMail: cusMail,
				cusProfile: cusProfile,
				cusBirthday: cusBirthday,
				cusAddress: details.address,
				cusMobile: details.mobile,
			});
		})
		.catch((err) => {
			res.send(err)
		})
		await connected.create(connectedList);
		req.flash('success', 'Successfully Connected to this  business owner.');
		res.redirect(baseUrl + `connectedIspDetail/${isp_id}`);
	}
        res.redirect(baseUrl + 'main');
    }else{
	//	res.redirect(baseUrl + 'faq');
		var a = "inviteCode_here";
        res.redirect(baseUrl + `loginpopUp?isp_id=${isp_id}`); 
    }
}

exports.loginpopUp = async function(req , res){
	console.log("loginpopUp ------ ,,, route .... :");
    var data = {};
	data.msg = "";
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.flash("session");
				//console.log("service_categories  :"+JSON.stringify(service_categories));
	res.render('home.ejs', data);
}