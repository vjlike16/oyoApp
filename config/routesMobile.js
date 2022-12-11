var mobileUsers = require('../app/controllers/mobile/user');

module.exports = function (app, passport) {
	/* app.all('/mobile/user/checkemailexist', mobileUsers.checkemailexist);
	app.all('/mobile/user/checkemailexistexceptthis', mobileUsers.checkemailexistexceptthis);
	app.all('/mobile/user/checkbarregistrationexist', mobileUsers.checkbarregistrationexist);
	app.all('/mobile/user/checkbarregistrationexistexceptthis', mobileUsers.checkbarregistrationexistexceptthis); */

	//checkDateTimeSlot  
	//,mobileUsers.checkemailexist, mobileUsers.checkbarregistrationexist,
	//  mobileUsers.checkDeviceUserActiveToken
	//  mobileUsers.checkLanguageParameter


	// mobileUsers.checkDeviceUserActiveToken
	/**** user *****/
	app.all('/mobile/user/signup', mobileUsers.signUp);
	app.all('/mobile/verifyOtp/:mobiletoken?', mobileUsers.verifyOtp); 
    app.get('/mobile/service_category', mobileUsers.service_categories);
    app.all('/mobile/resendOtp', mobileUsers.sendOtpAgain);
    app.all('/mobile/checkSubscriptionValidity/:id', mobileUsers.checkSubscriptionValidity);
    app.all('/mobile/upgradeToIsp', mobileUsers.upgradeToIsp);
	/**** Socail Media *****/
	app.all('/mobile/user/google', mobileUsers.google);
	app.all('/mobile/user/facebook', mobileUsers.facebook);
	app.all('/mobile/user/apple', mobileUsers.apple);
	app.all('/mobile/user/linkedin', mobileUsers.linkedin);
	
	app.all('/mobile/user/login', mobileUsers.login);
	app.all('/mobile/user/forgotPassword', mobileUsers.forgotPassword);
	app.get('/mobile/user/logout', mobileUsers.logout);
	app.all('/mobile/dashboard', mobileUsers.dashboard);
	app.all('/mobile/contact', mobileUsers.contact);
	app.all('/mobile/user/checkCurrentBalanceTime', mobileUsers.checkCurrentBalanceTime);
}
