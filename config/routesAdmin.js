var user = require('../app/controllers/admin/user');
var staff = require('../app/controllers/admin/staff');
var customer = require('../app/controllers/admin/customer');
var isps = require('../app/controllers/admin/isps');
var subscription = require('../app/controllers/admin/subscription');
var static_content = require('../app/controllers/admin/static_content');
var service_category = require('../app/controllers/admin/service_category');
var manage_discount_coupons = require('../app/controllers/admin/manage_discount_coupons');
var faq = require('../app/controllers/admin/faq');
var tutorial = require('../app/controllers/admin/tutorial');
var payments = require('../app/controllers/admin/payments');
var manage_subscription_plan = require('../app/controllers/admin/manage_subscription_plan');
var dashboard = require('../app/controllers/admin/dashboard');
var setting = require('../app/controllers/admin/setting');
var manage_pop_content = require('../app/controllers/admin/manage_pop_content');
//var test = require('../app/controllers/admin/test');

module.exports = function (app, passport) {
	app.all('/user/checkemailexist', user.checkemailexist);
	app.all('/user/checkemailexistexceptthis', user.checkemailexistexceptthis);

	app.all('/user/checkbarregistrationexist', user.checkbarregistrationexist);
	app.all('/user/checkbarregistrationexistexceptthis', user.checkbarregistrationexistexceptthis);

	//app.get('/', user.login);
	app.get('/admin', user.login);
	app.get('/admin/signup', user.signup);
	app.get('/admin/forgotpassword', user.forgotpassword);
	app.post('/admin/checkandsendnewpassword', user.checkandsendnewpassword);
	/*
		For create new admin user 
		app.get('/admin/signup', user.signup);
	*/
	app.post('/admin/signup', passport.authenticate('admin-local-signup', {
		successRedirect: '/admin', // redirect to the secure profile section
		failureRedirect: '/admin/signup', // redirect back to the signup page if there is an error
		failureFlash: true // allow flash messages
	}));
	// process the login form
	app.post('/admin/login', passport.authenticate('admin-local-login', {
		successRedirect: '/admin/dashboard', // redirect to the secure profile section
		failureRedirect: '/admin', // redirect back to the signup page if there is an error
		failureFlash: true // allow flash messages
	}));
	app.get('/admin/logout', user.loggedIn, user.logout);

	/**Dashboard**/
	app.get('/admin/dashboard', user.loggedIn, user.checkUserType, dashboard.dashboard);
	app.post('/admin/dashboard/paymentfilter', user.loggedIn, dashboard.paymentfilter);
	app.post('/admin/dashboard/ispfilter', user.loggedIn, dashboard.ispfilter);


	/**Staff**/
	app.get('/admin/staff/add', user.loggedIn, user.checkUserType, staff.add);
	app.get('/admin/staff', user.loggedIn, user.checkUserType, staff.allusers);
	app.post('/admin/staff/listingWithDatatable', staff.listingWithDatatable);
	app.get('/admin/staff/edit/:id', user.loggedIn, user.checkUserType, staff.edit);
	app.get('/admin/staff/view/:id', user.loggedIn, user.checkUserType, staff.view);
	app.get('/admin/staff/editprofile/:id', user.loggedIn, staff.editprofile);
	app.post('/admin/staff/update', user.loggedIn, user.checkUserType, staff.update);
	app.post('/admin/staff/updatebystaff', user.loggedIn, staff.updatebystaff);
	app.get('/admin/staff/delete/:id', user.loggedIn, user.checkUserType, staff.delete);
	app.get('/admin/staff/changepassword', staff.changepassword);
	app.get('/admin/staff/changeStatus/:status/:id', user.loggedIn, user.checkUserType, staff.changeStatus);

	app.post('/admin/staff/changepasswordsave', staff.changepasswordsave);
	app.post('/admin/staff/save', user.loggedIn, staff.save);
	app.get('/admin/staff/resetpassword/:id/:token', staff.resetpassword);
	app.post('/admin/staff/resetpassword/:id/:token', staff.reset_password_save);
	app.get('/admin/staff/reset_password_by_admin/:id', staff.reset_password_by_admin);

	app.get('/admin/staff/createpassword/:id/:token', staff.createpassword);
	app.post('/admin/staff/createpassword/:id/:token', staff.create_password_save);


	/**Customer**/
	app.get('/admin/customer/add', user.loggedIn, user.checkUserType, customer.add);
	app.post('/admin/customer/save', user.loggedIn, user.checkUserType, customer.save);
	app.post('/admin/customer/datefilter', user.loggedIn, customer.datefilter);
	app.post('/admin/customer/save_subscription', user.loggedIn, user.checkUserType, customer.save_subscription);
	app.get('/admin/customer', user.loggedIn, user.checkUserType, customer.listing);
	app.post('/admin/customer/listingWithDatatable', customer.listingWithDatatable);
	app.get('/admin/customer/edit/:id', user.loggedIn, user.checkUserType, customer.edit);
	app.get('/admin/customer/view/:id', user.loggedIn, user.checkUserType, customer.view);
	app.post('/admin/customer/update', user.loggedIn, user.checkUserType, customer.update);
	app.get('/admin/customer/delete/:id/:email', user.loggedIn, user.checkUserType, customer.delete);
	app.get('/admin/customer/changeStatus/:status/:id', user.loggedIn, user.checkUserType, customer.changeStatus);
	app.post('/admin/customer/exportToCsv', user.loggedIn, customer.exportToCsv);
	app.get('/admin/logs', user.loggedIn, user.checkUserType, customer.customer_time_logs);

	app.get('/admin/customer/resetpassword/:id/:token', customer.resetpassword);
	app.post('/admin/customer/resetpassword/:id/:token', customer.reset_password_save);


	/**ISPS**/
	app.get('/admin/isps/add', user.loggedIn, user.checkUserType, isps.add);
	app.post('/admin/isps/save', user.loggedIn, user.checkUserType, isps.save);
	app.get('/admin/isps', user.loggedIn, user.checkUserType, isps.listing);
	app.post('/admin/isps/listingWithDatatable', isps.listingWithDatatable);
	app.get('/admin/isps/edit/:id', user.loggedIn, isps.edit);
	app.post('/admin/isps/update', user.loggedIn, isps.update);
	app.get('/admin/isps/delete/:id/:mail', user.loggedIn, isps.delete);
	app.get('/admin/isps/changeStatus/:status/:id', user.loggedIn, isps.changeStatus);
	app.post('/admin/isps/exportToCsv', user.loggedIn, isps.exportToCsv);
	app.post('/admin/isps/datefilter', user.loggedIn, isps.datefilter);


	app.get('/admin/mobile/resetpassword/:id/:token', customer.resetpassword);
	app.post('/admin/mobile/resetpassword/:id/:token', customer.reset_password_mobile_save);

	app.get('/admin/mobile/successPage', customer.successPage);

	app.get('/admin/customer/reset_password_by_admin/:id', customer.reset_password_by_admin);

	app.get('/admin/customer/createpassword/:id/:token', customer.createpassword);
	app.post('/admin/customer/createpassword/:id/:token', customer.create_password_save);

	app.all('/customer/checkDateTimeSlot', customer.checkDateTimeSlot);

	/** Subscriptions **/
	app.get('/admin/subscription/add', user.loggedIn, user.checkUserType, subscription.add);
	app.post('/admin/subscription/save', user.loggedIn, subscription.save);

	/**Setting**/
	app.get('/admin/setting', user.loggedIn, user.checkUserType, setting.edit);
	app.post('/admin/setting/update', user.loggedIn, user.checkUserType, setting.update);


	/***** Static Content*****/
	app.get('/admin/static_content/add', user.loggedIn, static_content.add);
	app.post('/admin/static_content/save', user.loggedIn, static_content.save);
	app.get('/admin/static_content', user.loggedIn, user.checkUserType, static_content.listing);
	app.get('/admin/static_content/edit/:id', user.loggedIn, user.checkUserType, static_content.edit);
	app.get('/admin/static_content/view/:id', user.loggedIn, user.checkUserType, static_content.view);
	app.get('/admin/static_content/changeStatus/:status/:id', user.loggedIn, static_content.changeStatus);
	app.post('/admin/static_content/update', user.loggedIn, static_content.update);
	app.get('/admin/static_content/delete/:id', user.loggedIn, static_content.delete);
	app.post('/admin/static_content/checknameexist', static_content.checknameexist);
	app.post('/admin/static_content/checknameexistexceptthis', static_content.checknameexistexceptthis);

	/***** 	Manage Discount Coupons *****/
	app.get('/admin/manage_discount_coupons/add', user.loggedIn, manage_discount_coupons.add);
	app.post('/admin/manage_discount_coupons/save', user.loggedIn, manage_discount_coupons.save);
	app.get('/admin/manage_discount_coupons', user.loggedIn, user.checkUserType, manage_discount_coupons.listing);
	app.get('/admin/manage_discount_coupons/edit/:id', user.loggedIn, user.checkUserType, manage_discount_coupons.edit);
	app.get('/admin/manage_discount_coupons/view/:id', user.loggedIn, user.checkUserType, manage_discount_coupons.view);
	app.get('/admin/manage_discount_coupons/changeStatus/:status/:id', user.loggedIn, manage_discount_coupons.changeStatus);
	app.post('/admin/manage_discount_coupons/update', user.loggedIn, manage_discount_coupons.update);
	app.get('/admin/manage_discount_coupons/delete/:id', user.loggedIn, manage_discount_coupons.delete);
	app.post('/admin/manage_discount_coupons/checknameexist', manage_discount_coupons.checknameexist);
	app.post('/admin/manage_discount_coupons/checknameexistexceptthis', manage_discount_coupons.checknameexistexceptthis);

	/***** 	 Faq's *****/
	app.get('/admin/faq/add', user.loggedIn, faq.add);
	app.post('/admin/faq/save', user.loggedIn, faq.save);
	app.get('/admin/faq', user.loggedIn, user.checkUserType, faq.listing);
	app.get('/admin/faq/edit/:id', user.loggedIn, user.checkUserType, faq.edit);
	app.get('/admin/faq/view/:id', user.loggedIn, user.checkUserType, faq.view);
	app.get('/admin/faq/changeStatus/:status/:id', user.loggedIn, faq.changeStatus);
	app.post('/admin/faq/update', user.loggedIn, faq.update);
	app.get('/admin/faq/delete/:id', user.loggedIn, faq.delete);
	app.post('/admin/faq/checknameexist', faq.checknameexist);
	app.post('/admin/faq/checknameexistexceptthis', faq.checknameexistexceptthis);

	/***** 	 Tutorial's *****/
	app.get('/admin/tutorial/add', user.loggedIn, tutorial.add);
	app.post('/admin/tutorial/save', user.loggedIn, tutorial.save);
	app.get('/admin/tutorial', user.loggedIn, user.checkUserType, tutorial.listing);
	app.get('/admin/tutorial/edit/:id', user.loggedIn, user.checkUserType, tutorial.edit);
	app.get('/admin/tutorial/view/:id', user.loggedIn, user.checkUserType, tutorial.view);
	app.get('/admin/tutorial/changeStatus/:status/:id', user.loggedIn, tutorial.changeStatus);
	app.post('/admin/tutorial/update', user.loggedIn, tutorial.update);
	app.get('/admin/tutorial/delete/:id', user.loggedIn, tutorial.delete);

	/***** 	 Manage Subscription Plans *****/
	app.get('/admin/manage_subscription_plan/add', user.loggedIn, manage_subscription_plan.add);
	app.post('/admin/manage_subscription_plan/save', user.loggedIn, manage_subscription_plan.save);
	app.get('/admin/manage_subscription_plan', user.loggedIn, user.checkUserType, manage_subscription_plan.listing);
	app.get('/admin/manage_subscription_plan/edit/:id', user.loggedIn, user.checkUserType, manage_subscription_plan.edit);
	app.get('/admin/manage_subscription_plan/view/:id', user.loggedIn, user.checkUserType, manage_subscription_plan.view);
	app.get('/admin/manage_subscription_plan/changeStatus/:status/:id', user.loggedIn, manage_subscription_plan.changeStatus);
	app.post('/admin/manage_subscription_plan/update', user.loggedIn, manage_subscription_plan.update);
	app.get('/admin/manage_subscription_plan/delete/:id', user.loggedIn, manage_subscription_plan.delete);
	app.post('/admin/manage_subscription_plan/checknameexist', manage_subscription_plan.checknameexist);
	app.post('/admin/manage_subscription_plan/checknameexistexceptthis', manage_subscription_plan.checknameexistexceptthis);

	/***** Service Category *****/
	app.get('/admin/service_category/add', user.loggedIn, service_category.add);
	app.post('/admin/service_category/save', user.loggedIn, service_category.save);
	app.get('/admin/service_category', user.loggedIn, user.checkUserType, service_category.listing);
	app.get('/admin/service_category/edit/:id', user.loggedIn, user.checkUserType, service_category.edit);
	app.get('/admin/service_category/view/:id', user.loggedIn, user.checkUserType, service_category.view);
	app.get('/admin/service_category/changeStatus/:status/:id', user.loggedIn, service_category.changeStatus);
	app.post('/admin/service_category/update', user.loggedIn, service_category.update);
	app.get('/admin/service_category/delete/:id', user.loggedIn, service_category.delete);
	app.post('/admin/service_category/checknameexist', service_category.checknameexist);
	app.post('/admin/service_category/checknameexistexceptthis', service_category.checknameexistexceptthis);

	/***** 	 Manage Payments *****/
	// app.get('/admin/payments/add', user.loggedIn, payments.add);
	// app.post('/admin/payments/save', user.loggedIn, payments.save);
	app.get('/admin/payments', user.loggedIn, user.checkUserType, payments.listing);
	app.post('/admin/payments/datefilter', user.loggedIn, payments.datefilter);
	app.post('/admin/payments/exportToCsv', user.loggedIn, payments.exportToCsv);


	app.get('/admin/appointments', user.loggedIn, user.checkUserType, payments.appointments_listing);
	app.post('/admin/appointments/datefilter', user.loggedIn, payments.appointment_datefilter);
	app.post('/admin/appointments/exportToCsv', user.loggedIn, payments.appointment_exportToCsv);
	

	/***** 	 Manage PopUp Content *****/

   app.get('/admin/manage_pop_content/add', user.loggedIn, manage_pop_content.add);
   app.post('/admin/manage_pop_content/save', user.loggedIn, manage_pop_content.save);
   app.get('/admin/manage_pop_content', user.loggedIn, user.checkUserType, manage_pop_content.listing);
   app.get('/admin/manage_pop_content/edit/:id', user.loggedIn, user.checkUserType, manage_pop_content.edit);
   app.get('/admin/manage_pop_content/view/:id', user.loggedIn, user.checkUserType, manage_pop_content.view);
   app.get('/admin/manage_pop_content/changeStatus/:status/:id', user.loggedIn, manage_pop_content.changeStatus);
   app.post('/admin/manage_pop_content/update', user.loggedIn, manage_pop_content.update);
   app.get('/admin/manage_pop_content/delete/:id', user.loggedIn, manage_pop_content.delete);
   app.post('/admin/manage_pop_content/checknameexist', manage_pop_content.checknameexist);
   app.post('/admin/manage_pop_content/checknameexistexceptthis', manage_pop_content.checknameexistexceptthis);

}
