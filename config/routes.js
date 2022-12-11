const fs = require('fs');
var home = require('../app/controllers/home');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var Email = require('../lib/email.js');
var passport = require('passport');
var faq = require('../app/controllers/customer/faq');
var customer_faq = require('../app/controllers/customer/customer_faq')
var support = require('../app/controllers/customer/support');
var service_provider = require('../app/controllers/customer/service_provider');
var loggedIn_service_providers = require('../app/controllers/customer/loggedIn_service_provider');
var appointmentBook = require('../app/controllers/customer/appointmentBook');
var google_cal = require('../app/controllers/admin/google_cal');
var outlook_cal = require('./outlook/routes/authHelper');
var importContact = require('../app/controllers/isp/importContact');
var stripe = require('../app/controllers/customer/stripe');
var dateFormat = require('dateformat');
var User = require('../app/controllers/customer/user');
var UserModel = require('../app/models/home');

const SECRET_KEY = "sk_test_51JVSy4CzX7kFjfHZ0WqNOWnQPs4K3Cwv0YyK75zhtqvNYPVL07zwSbWGA24Abgg5sxa8SMcLUBGO0Ip8k8SggXbU00q0DhCFD7";
const stripeAccount = require('stripe')(SECRET_KEY);

var performance = require('../app/controllers/customer/performance');
var oyoApptransactions = require('../app/controllers/customer/oyoApptransactions');
var nonOyoApptransaction = require('../app/controllers/customer/nonOyoApptransaction');

var client = require('../app/controllers/customer/client');
var userotp = require('../app/models/home');
var shareLinks = require('../app/controllers/customer/my-profile');

const AppleAuth = require('apple-auth');
const config = {
    "client_id": "com.oyoapp.staging.signin",//"com.oyoapp.stage.signin",
    "team_id": "5Z9V377ZUN",//"3K26P4V35Y",
    "key_id": "8S84GD7BGM",//"QV6MY5W62P",
    "redirect_uri": "https://stage.oyoapp.com/auth/apple/callback",
    "scope": "name email"
} 

const jwt = require('jsonwebtoken');
var path = require('path');
const { baseUrl } = require('./constants');
var applePEMFILE = path.join(__dirname, 'appleSignInAuthKey.pem');
const AppleAuthConfig = new AppleAuth(config, fs.readFileSync(applePEMFILE).toString(), 'text'); 


//you can include all your controllers
module.exports = function (app) {
 
    app.get('/', home.home);
    app.get('/unReadNotification', home.unReadNotification); 
    app.get('/unReadPaymentReminder', home.unReadPaymentReminder); 
    app.post('/customSearch', home.customSearch); 
    app.get('/privacyPolicy', home.privacyPolicy); 
    app.get('/termsConditions', home.termsConditions); 
    app.get('/notifications', User.loggedIn, home.notification);

	app.get('/verify', home.verify);   
    app.post('/verifyOtp', User.verifyOtp);
    app.get('/isp-home-screen-circle', User.isp_home_circle);
    app.get('/customer-home-screen-circle', User.customer_home_circle);

 /// Social share link routes .....   
    app.get('/share' , shareLinks.facebook_shareLink);  
    //app.post('/inviteCode', shareLinks.inviteCodeUrl);
    app.get('/inviteCodeRedirection/:id', shareLinks.inviteCodeRedirectUrl);
    app.get('/loginpopUp', shareLinks.loginpopUp);
    

//// onbording screen routes of isp ........    
    app.get('/complete-profile/:mobiletoken?', User.checkMobileToken, User.complete_profile);
    app.post('/complete-profile/save', User.complete_profile_save);
    app.get('/payment-info', User.payment_info);
    app.post('/account-card-save', User.account_card_save);
    app.get('/subscribe-to-plan', User.subscribe_to_plan);
    app.get('/import-contacts', User.import_contacts);
    app.get('/select-contacts', User.select_contacts);
    app.get('/add-service', User.add_service); 
    app.post('/add-service/save', User.add_service_save);
    app.post('/subscribe-payment', User.subscribe_payment);
    app.post('/subscribe-paymentSaveCard', User.subscribe_paymentSaveCard);
    app.get('/import_google', importContact.import_google);
    app.get('/import-contacts/callback', importContact.import_google_callback);
    app.get('/import_outlook', importContact.import_outlook);
    app.get('/outlook-contacts/callback', importContact.import_outlook_callback);
    app.post('/onboardingImportContacts',User.loggedIn, importContact.onboardingImportContacts);
    app.post('/isp-account-save', User.isp_account_save);

//// onbording screens routes of customer ........ 
    app.get('/cus-complete-profile/:mobiletoken?', User.checkMobileToken, User.cus_complete_profile);
    app.post('/cus-complete-profile/save', User.cus_complete_profile_save);
    app.get('/cus-payment-info', User.cus_payment_info);
    app.post('/cus-account-card-save', User.cus_account_card_save);

    app.post("/resetPassword", User.checkandsendnewpassword);
    app.get("/customer/resetpassword/:id/:token", User.customerResetPassword);
    app.post("/customer/resetpassword/:id/:token", User.reset_password_save);
    app.get('/service_category', home.service_categories);
    app.get('/loggedIn_service_category', User.loggedIn, home.loggedIn_service_categories);
    app.get('/logout', User.logout);

    app.post('/firebase-token', home.token); 
    app.all('/businessHours', User.businessHours);
    app.all('/updatePagePublic', User.updatePagePublic);
    app.all('/setAlert', User.setAlert);
    app.all('/addBreakHours', User.addBreakHours);
    app.post('/findBusinessSlots', User.findBusinessSlots); //serviceId
    app.post('/getTimeZone', User.getTimeZone);

    app.all('/removeBreakTime/:id/:value', User.removeBreakTime);
    app.all('/removeOffDay/:id/:value', User.removeOffDay);
    app.all('/offDay', User.offDay);
    app.all('/cancelSubscription', User.cancelSubscription);
    app.all('/checkemailexist', User.checkemailexist);
    app.all('/checkServiceexist', User.checkServiceexist);
    app.all('/checkCurrentPassword', User.checkCurrentPassword);
    app.all('/checkPastTime', User.checkPastTime);
    app.all('/checkOffDay', User.checkOffDay);
    app.all('/checkToFromTime', User.checkToFromTime);
    app.all('/checkIspAppointmentDate', User.checkIspAppointmentDate);
    app.post('/changePassword', User.changePassword);
    app.all('/checkCustomeremailexist', User.checkCustomeremailexist);
    app.all('/verifycode', User.verifycode);
    app.all('/applyCoupon', User.applyCoupon);
    app.all('/couponCodeApply', User.couponCodeApply);
    app.all('/couponCodeApplied', User.couponCodeApplied);
    app.post('/check_Service_Cetagory', User.check_Service_Cetagory);

    app.get('/upgradeToIsp/:id', User.loggedIn, home.upgradeToIsp);
    app.post('/upgradeToIspPayment', User.loggedIn, home.upgradeToIspPayment);
    // app.get('/upgradeToIspPaymentSaveCard/:userId/:cardId', User.loggedIn, home.upgradeToIspPaymentSaveCard);
    app.post('/upgradeToIspPaymentSaveCard', User.loggedIn, home.upgradeToIspPaymentSaveCard);

    // Stripe Routes ////

    app.get("/stripe" , User.loggedIn, stripe.connect);
    app.get("/checkStripeConnect" , User.loggedIn, stripe.checkStripeConnect);
    app.get("/stripe-success" , User.loggedIn, stripe.success);
    app.get("/stripe-error" , User.loggedIn, stripe.error);

    /// My Profile Module///
    app.get('/my-profile/:id', User.loggedIn, User.edit);
    app.post('/my-profile/update', User.loggedIn, User.update); 
    app.post('/card/save', User.CardSave);
    app.post('/card/settings/save', User.CardSave_setting_page);
    app.post('/card/home/save', User.CardSave_main_page);
    app.get('/my-profile/remove/:id', User.CardRemove);
    app.get('/header-profile', User.userHeaderProfile);
    app.post('/past-work-images' , User.loggedIn , User.past_work_images);
    app.get('/image-delete/:id/:imgId' , User.loggedIn , User.delete_past_work_images);

    // Main Page routes ////
    
    app.all('/userClosedPopup', User.loggedIn, home.userClosedPopup);
    app.all('/userClosedWelcomeMsg', User.loggedIn, home.userClosedWelcomeMsg);
    // Customers routes
    app.get('/main/newServices', User.loggedIn, home.newServices);
    app.get('/main/customerNewConnections', User.loggedIn, home.customerNewConnections);
    app.get('/main/customerPayment', User.loggedIn, home.customerPayment);
    app.get('/main/appointments', User.loggedIn, home.newAppointments);

    // ISP routes
    app.get('/main/upcomingAppointments', User.loggedIn, home.upcomingAppointments);
    app.get('/main/newConnections', User.loggedIn, home.newConnections);
    app.get('/main/newPaymentsTips', User.loggedIn, home.newPaymentsTips);
    app.get('/main/newBookedAppointments', User.loggedIn, home.newBookedAppointments);
    app.get('/main/ratings', User.loggedIn, home.ratings);
    app.get('/accept/connection/:id', User.loggedIn, home.acceptConnection);
    app.get('/deny/connection/:id', User.loggedIn, home.denyConnection);
    app.post('/sendReminder', User.loggedIn, home.sendReminder);

    // FAQ Module//////////////	
    app.get('/faq', faq.listing);
    app.post('/faq_request', faq.save);

    // FAQ Customer Module//////////////	
    app.get('/customer/faq', User.loggedIn, customer_faq.listing);
    app.post('/customer/faq_request',User.loggedIn, customer_faq.save);

    // SUPPORT module///////	
    app.get('/support', home.support);
    app.post('/support_request', support.save);

   // Service-providers routes for public users//////  
    app.get('/service-providers', service_provider.listing);
    app.get('/service-provider/:id', service_provider.serviceProvider);
    app.get('/google-map', service_provider.google_map);
    app.post('/customSearchformap', service_provider.customSearch)

    // Calendar and payment routes for customers//////
    app.get('/authorize', User.loggedIn, home.authorize);
    app.get('/sync', User.loggedIn, home.sync);
    app.post('/connectedIspDetail/payment', User.loggedIn, home.payment);
    app.post('/connectedIspDetail/paymentSaveCard', User.loggedIn, home.paymentSaveCard);

    // Appointment Book routes for Customers//////
    app.get('/appointments', User.loggedIn, home.appointments);
    app.post('/completePaymentSaveCard', User.loggedIn, appointmentBook.completePaymentSaveCard);
    app.post('/completePayment', User.loggedIn, appointmentBook.completePayment);
    app.post('/editAppointment', User.loggedIn, appointmentBook.editAppointment);
    app.post('/IspEditAppointment', User.loggedIn, appointmentBook.IspEditAppointment);
    app.post('/cancelAppointment', User.loggedIn, appointmentBook.cancelAppointment);
    app.post('/ispCancelAppointment', User.loggedIn, appointmentBook.ispCancelAppointment);
    app.get('/connectedIspList', User.loggedIn, appointmentBook.connectedIspList);
    app.post('/customerNotes', User.loggedIn, appointmentBook.customerNewNotes);
    app.get('/allIspList', User.loggedIn, appointmentBook.allIspList);
    app.get('/connectedIspMap', User.loggedIn, appointmentBook.google_map);
    app.get('/connectedIspDetail/:id', User.loggedIn, appointmentBook.connectedIspDetail);
    app.post('/customer/customSearch', User.loggedIn, appointmentBook.customSearch);
    app.post('/customer/customSearchForMap', User.loggedIn, appointmentBook.customSearchForMap);
    app.post('/customer/inviteCode', User.loggedIn, appointmentBook.inviteCode);
    app.get('/connect-to-isp/:id', User.loggedIn, appointmentBook.connect_with_isp);
    app.get('/remove/:id', User.loggedIn, appointmentBook.remove);
    app.post('/sendReview', User.loggedIn, appointmentBook.sendReview);
    app.post('/cusOngoingForm', User.loggedIn, appointmentBook.cusOngoingForm);
    app.post('/customerNotes', User.loggedIn, appointmentBook.customerNotes);
    app.get('/customerNotes/:id/:ispId', User.loggedIn, appointmentBook.deleteCustomerNotes);
    app.get('/noShow/:id', User.loggedIn, appointmentBook.noShow);

    // Payment routes
    app.get('/paymentHistory', User.loggedIn, home.paymentHistory);
    app.get('/settings', User.loggedIn, home.settings);
    app.get('/accountSettings', User.loggedIn, home.accountSettings);


    // Performance Graphs routes
    app.get('/performance' ,User.loggedIn, performance.day_sales);
    app.get('/performance/weekly-sales' ,User.loggedIn, performance.weekly_sales);
    app.get('/performance/yearly-sales' ,User.loggedIn, performance.yearly_sales);
    app.get('/performance/monthly-sales' ,User.loggedIn, performance.monthly_sales);

    app.get('/performance/tips' ,User.loggedIn, performance.day_tips);
    app.get('/performance/weekly-tips' ,User.loggedIn, performance.weekly_tips);
    app.get('/performance/yearly-tips' ,User.loggedIn, performance.yearly_tips);
    app.get('/performance/monthly-tips' ,User.loggedIn, performance.monthly_tips);

    app.get('/performance/customer-satisfaction' , User.loggedIn ,performance.day_customer_satisfaction);
    app.get('/performance/customer-satisfaction/weekly' , User.loggedIn ,performance.weekly_customer_satisfaction);
    app.get('/performance/customer-satisfaction/monthly' , User.loggedIn ,performance.monthly_customer_satisfaction);
    app.get('/performance/customer-satisfaction/yearly' , User.loggedIn ,performance.yearly_customer_satisfaction);

    app.get('/performance/visit-overview' , User.loggedIn ,performance.day_visit_overview);
    app.get('/performance/visit-overview/weekly' , User.loggedIn ,performance.weekly_visit_overview);
    app.get('/performance/visit-overview/monthly' , User.loggedIn ,performance.monthly_visit_overview);
    app.get('/performance/visit-overview/yearly' , User.loggedIn ,performance.yearly_visit_overview);

    /// customer filters routes

    app.post('/sales-filter/daily' , User.loggedIn, performance.sales_day_filter);
    app.post('/sales-filter/monthly' , User.loggedIn, performance.sales_monthly_filter);
    app.post('/sales-filter/yearly' , User.loggedIn, performance.sales_yearly_filter);
    app.post('/sales-filter/weekly' , User.loggedIn, performance.sales_weekly_filter);

    app.post('/tips-filter/daily' , User.loggedIn, performance.tips_day_filter);
    app.post('/tips-filter/monthly' , User.loggedIn, performance.tips_monthly_filter);  
    app.post('/tips-filter/yearly' , User.loggedIn, performance.tips_yearly_filter);
    app.post('/tips-filter/weekly' , User.loggedIn, performance.tips_weekly_filter);

    app.post('/customer-satisfaction-filter/daily' , User.loggedIn, performance.customer_satisfaction_day_filter);
    app.post('/customer-satisfaction-filter/monthly' , User.loggedIn, performance.customer_satisfaction_monthly_filter);
    app.post('/customer-satisfaction-filter/yearly' , User.loggedIn, performance.customer_satisfaction_yearly_filter);
    app.post('/customer-satisfaction-filter/weekly' , User.loggedIn, performance.customer_satisfaction_weekly_filter);

    app.post('/visit-filter/daily' , User.loggedIn, performance.visit_day_filter);
    app.post('/visit-filter/monthly' , User.loggedIn, performance.visit_monthly_filter);
    app.post('/visit-filter/yearly' , User.loggedIn, performance.visit_yearly_filter);
    app.post('/visit-filter/weekly' , User.loggedIn, performance.visit_weekly_filter);

    app.post('/enter-transaction' , User.loggedIn , performance.enter_transaction);

    //Non oyoApptransactions////////////
    app.get('/oyo/performance' ,User.loggedIn, oyoApptransactions.day_sales);
    app.get('/oyo/performance/weekly-sales' ,User.loggedIn, oyoApptransactions.weekly_sales);
    app.get('/oyo/performance/yearly-sales' ,User.loggedIn, oyoApptransactions.yearly_sales);
    app.get('/oyo/performance/monthly-sales' ,User.loggedIn, oyoApptransactions.monthly_sales);

    app.get('/oyo/performance/tips' ,User.loggedIn, oyoApptransactions.day_tips);
    app.get('/oyo/performance/weekly-tips' ,User.loggedIn, oyoApptransactions.weekly_tips);
    app.get('/oyo/performance/yearly-tips' ,User.loggedIn, oyoApptransactions.yearly_tips);
    app.get('/oyo/performance/monthly-tips' ,User.loggedIn, oyoApptransactions.monthly_tips);

    app.get('/oyo/performance/customer-satisfaction' , User.loggedIn ,oyoApptransactions.day_customer_satisfaction);
    app.get('/oyo/performance/customer-satisfaction/weekly' , User.loggedIn ,oyoApptransactions.weekly_customer_satisfaction);
    app.get('/oyo/performance/customer-satisfaction/monthly' , User.loggedIn ,oyoApptransactions.monthly_customer_satisfaction);
    app.get('/oyo/performance/customer-satisfaction/yearly' , User.loggedIn ,oyoApptransactions.yearly_customer_satisfaction);

    app.get('/oyo/performance/visit-overview' , User.loggedIn ,oyoApptransactions.day_visit_overview);
    app.get('/oyo/performance/visit-overview/weekly' , User.loggedIn ,oyoApptransactions.weekly_visit_overview);
    app.get('/oyo/performance/visit-overview/monthly' , User.loggedIn ,oyoApptransactions.monthly_visit_overview);
    app.get('/oyo/performance/visit-overview/yearly' , User.loggedIn ,oyoApptransactions.yearly_visit_overview);


    // Non oyoApptransactions filter ////////////
    app.post('/oyo/sales-filter/daily' , User.loggedIn, oyoApptransactions.sales_day_filter);
    app.post('/oyo/sales-filter/monthly' , User.loggedIn, oyoApptransactions.sales_monthly_filter);
    app.post('/oyo/sales-filter/yearly' , User.loggedIn, oyoApptransactions.sales_yearly_filter);
    app.post('/oyo/sales-filter/weekly' , User.loggedIn, oyoApptransactions.sales_weekly_filter);

    app.post('/oyo/tips-filter/daily' , User.loggedIn, oyoApptransactions.tips_day_filter);
    app.post('/oyo/tips-filter/monthly' , User.loggedIn, oyoApptransactions.tips_monthly_filter);  
    app.post('/oyo/tips-filter/yearly' , User.loggedIn, oyoApptransactions.tips_yearly_filter);
    app.post('/oyo/tips-filter/weekly' , User.loggedIn, oyoApptransactions.tips_weekly_filter);

    app.post('/oyo/customer-satisfaction-filter/daily' , User.loggedIn, oyoApptransactions.customer_satisfaction_day_filter);
    app.post('/oyo/customer-satisfaction-filter/monthly' , User.loggedIn, oyoApptransactions.customer_satisfaction_monthly_filter);
    app.post('/oyo/customer-satisfaction-filter/yearly' , User.loggedIn, oyoApptransactions.customer_satisfaction_yearly_filter);
    app.post('/oyo/customer-satisfaction-filter/weekly' , User.loggedIn, oyoApptransactions.customer_satisfaction_weekly_filter);

    app.post('/oyo/visit-filter/daily' , User.loggedIn, oyoApptransactions.visit_day_filter);
    app.post('/oyo/visit-filter/monthly' , User.loggedIn, oyoApptransactions.visit_monthly_filter);
    app.post('/oyo/visit-filter/yearly' , User.loggedIn, oyoApptransactions.visit_yearly_filter);
    app.post('/oyo/visit-filter/weekly' , User.loggedIn, oyoApptransactions.visit_weekly_filter);


     // oyoApptransactions////////////
     app.get('/oyyo/performance' ,User.loggedIn, nonOyoApptransaction.day_sales);
     app.get('/oyyo/performance/weekly-sales' ,User.loggedIn, nonOyoApptransaction.weekly_sales);
     app.get('/oyyo/performance/yearly-sales' ,User.loggedIn, nonOyoApptransaction.yearly_sales);
     app.get('/oyyo/performance/monthly-sales' ,User.loggedIn, nonOyoApptransaction.monthly_sales);
 
     app.get('/oyyo/performance/tips' ,User.loggedIn, nonOyoApptransaction.day_tips);
     app.get('/oyyo/performance/weekly-tips' ,User.loggedIn, nonOyoApptransaction.weekly_tips);
     app.get('/oyyo/performance/yearly-tips' ,User.loggedIn, nonOyoApptransaction.yearly_tips);
     app.get('/oyyo/performance/monthly-tips' ,User.loggedIn, nonOyoApptransaction.monthly_tips);
 
     app.get('/oyyo/performance/customer-satisfaction' , User.loggedIn ,nonOyoApptransaction.day_customer_satisfaction);
     app.get('/oyyo/performance/customer-satisfaction/weekly' , User.loggedIn ,nonOyoApptransaction.weekly_customer_satisfaction);
     app.get('/oyyo/performance/customer-satisfaction/monthly' , User.loggedIn ,nonOyoApptransaction.monthly_customer_satisfaction);
     app.get('/oyyo/performance/customer-satisfaction/yearly' , User.loggedIn ,nonOyoApptransaction.yearly_customer_satisfaction);
 
     app.get('/oyyo/performance/visit-overview' , User.loggedIn ,nonOyoApptransaction.day_visit_overview);
     app.get('/oyyo/performance/visit-overview/weekly' , User.loggedIn ,nonOyoApptransaction.weekly_visit_overview);
     app.get('/oyyo/performance/visit-overview/monthly' , User.loggedIn ,nonOyoApptransaction.monthly_visit_overview);
     app.get('/oyyo/performance/visit-overview/yearly' , User.loggedIn ,nonOyoApptransaction.yearly_visit_overview);
 
 
     // oyoApptransactions filter ////////////
     app.post('/oyyo/sales-filter/daily' , User.loggedIn, nonOyoApptransaction.sales_day_filter);
     app.post('/oyyo/sales-filter/monthly' , User.loggedIn, nonOyoApptransaction.sales_monthly_filter);
     app.post('/oyyo/sales-filter/yearly' , User.loggedIn, nonOyoApptransaction.sales_yearly_filter);
     app.post('/oyyo/sales-filter/weekly' , User.loggedIn, nonOyoApptransaction.sales_weekly_filter);
 
     app.post('/oyyo/tips-filter/daily' , User.loggedIn, nonOyoApptransaction.tips_day_filter);
     app.post('/oyyo/tips-filter/monthly' , User.loggedIn, nonOyoApptransaction.tips_monthly_filter);  
     app.post('/oyyo/tips-filter/yearly' , User.loggedIn, nonOyoApptransaction.tips_yearly_filter);
     app.post('/oyyo/tips-filter/weekly' , User.loggedIn, nonOyoApptransaction.tips_weekly_filter);
 
     app.post('/oyyo/customer-satisfaction-filter/daily' , User.loggedIn, nonOyoApptransaction.customer_satisfaction_day_filter);
     app.post('/oyyo/customer-satisfaction-filter/monthly' , User.loggedIn, nonOyoApptransaction.customer_satisfaction_monthly_filter);
     app.post('/oyyo/customer-satisfaction-filter/yearly' , User.loggedIn, nonOyoApptransaction.customer_satisfaction_yearly_filter);
     app.post('/oyyo/customer-satisfaction-filter/weekly' , User.loggedIn, nonOyoApptransaction.customer_satisfaction_weekly_filter);
 
     app.post('/oyyo/visit-filter/daily' , User.loggedIn, nonOyoApptransaction.visit_day_filter);
     app.post('/oyyo/visit-filter/monthly' , User.loggedIn, nonOyoApptransaction.visit_monthly_filter);
     app.post('/oyyo/visit-filter/yearly' , User.loggedIn, nonOyoApptransaction.visit_yearly_filter);
     app.post('/oyyo/visit-filter/weekly' , User.loggedIn, nonOyoApptransaction.visit_weekly_filter);

    // Client List routes..
    app.get('/clients' , User.loggedIn , client.listing);
    app.get('/client/:id' , User.loggedIn , client.client_details);
    app.get('/client/remove/:id' , User.loggedIn , client.remove);
    app.get('/clients/exportTocsv', User.loggedIn , client.exportToCsv);
    app.post('/clients/save', User.loggedIn , client.importContacts_save);
    app.post('/save-csv-file-contacts', User.loggedIn , client.ImportFromCsv);
    app.get('/download/xlsx', User.loggedIn , client.downloadFile);
    app.get('/google-imported' , User.loggedIn , client.google_imported);
    app.get('/other-imported' , User.loggedIn , client.other_imported);
    app.get('/outlook-imported' , User.loggedIn , client.outlook_imported);
    app.post('/ispNotes', User.loggedIn, client.ispNotes);
    app.get('/ispNotes/:id', User.loggedIn, client.deleteIspNotes);
    app.post('/newContact/save', User.loggedIn, client.newContact);
    app.all('/checkCustomernameexist', client.checkCustomerNameexist);
    app.all('/getCustomerId', client.getCustomerId);
    app.get('/all-clients' , User.loggedIn , client.allClients);

    // My Services List routes..
    app.get('/myServices', User.loggedIn, service_provider.myServices);
    app.get('/myService/delete/:id', User.loggedIn, service_provider.deleteService);
    app.post('/editService', User.loggedIn, service_provider.editService);
    app.post('/myServices/add-service', User.loggedIn, service_provider.add_service);
    
    // Servive-providers routes//////////
    app.get('/import_google_profile',User.loggedIn, importContact.import_google_profile);
    app.get('/import-contacts-profile/callback',User.loggedIn, importContact.import_google_profile_callback);
    app.get('/import_outlook_profile',User.loggedIn, importContact.import_outlook_profile);
    app.get('/outlook-contacts-profile/callback',User.loggedIn, importContact.import_outlook_profile_callback);
    app.get('/select-contacts-profile',User.loggedIn, User.select_contacts_profile);
    app.post('/importContacts',User.loggedIn, importContact.importContact);

    // LoggedIn Servive-providers routes for customers//////////
    app.get('/customer/service-providers',User.loggedIn, loggedIn_service_providers.listing);
    app.get('/customer/service-providers/:id',User.loggedIn, loggedIn_service_providers.serviceProvider);
    app.get('/customer/google-map',User.loggedIn, loggedIn_service_providers.google_map);
    //app.post('/customer/customSearch', User.loggedIn, loggedIn_service_providers.customSearch);
    app.get('/customer/connect-to-isp/:id', User.loggedIn, loggedIn_service_providers.connect_with_isp);
    app.get('/customer/remove/:id', User.loggedIn, loggedIn_service_providers.remove);

    app.get('/main/:mobiletoken?', User.checkMobileToken, User.loggedIn, home.main);

    app.get('/loginFailed', User.loggedIn, User.loginFailed);
    // app.get('/login', home.login);
    // app.get('/signup', home.signup);
    // app.get('/logout', home.logout);
  
    //app.get('/', home.loggedIn, home.home);//home
    // app.get('/home', home.loggedIn, home.home);//home


    //app.get('/verifyOtp',home.home);

    // Google calendar routes   ////////////
    app.get('/auth/access-token', google_cal.accesstoken);
    app.get('/auth/access-token-called', google_cal.google_Cal_Request);
    app.post('/remove/google_calendar', google_cal.google_Cal_Remove);
    // End of google calendar routes   ////////////

    // Outlook calendar routes   ////////////
    // app.get('/auth/accessToken',outlook_cal.accessToken);
    app.get('/outlook_Cal_Request',outlook_cal.outlook_Cal_Request);
    app.post('/remove/outlook_calendar', outlook_cal.outlook_Cal_Remove);
    // End of outlook calendar routes   ////////////
	
	app.post('/signup',passport.authenticate('customer-local-signup', {
        successRedirect: '/verify', // redirect to the secure profile section
        failureRedirect: '/', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));
    // process the login form
    app.post('/login', passport.authenticate('customer-local-login', {
        successRedirect: '/main', // redirect to the secure profile section
        failureRedirect: '/', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // Mobile Login
    app.post('/mobile-signup',passport.authenticate('mobile-signup', {
        successRedirect: '/verify', // redirect to the secure profile section
        failureRedirect: '/', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));
    // process the login form
    app.post('/mobile-login', passport.authenticate('mobile-login', {
        successRedirect: '/main', // redirect to the secure profile section
        failureRedirect: '/', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // app.post('/login', passport.authenticate('customer-local-login', { 
    //     successRedirect: '/main', // redirect to the secure profile section
    //     failureRedirect: '/', // redirect back to the signup page if there is an error
    //     failureFlash: true // allow flash messages
    // })
    // // function (req, res) {
    // //  // var redirectTo = '/verify'; // Set default redirect value
    // //  console.log("in verify route  :");
    // //   if (req.session.reqUrl == 'verify') {
    // //   //  redirectTo = req.session.reqUrl; // If our redirect value exists in the session, use that.
    // //     req.session.reqUrl = null; // Once we've used it, dump the value to null before the redirect.
    // //     res.redirect("/verify");
    // //   };
    // //   res.redirect('/main');
    // // })

    app.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    app.get('/google/callback', passport.authenticate('google', { failureRedirect: '/loginFailed' }),
    function(req, res) {
        res.redirect(baseUrl+'main');
    });
 
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
    app.get('/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/main', // redirect to the secure profile section
        failureRedirect: '/', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.get('/auth/linkedin', passport.authenticate('linkedin', { scope: [ 'r_emailaddress', 'r_liteprofile' ] }));
    app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
        successRedirect: '/main', // redirect to the secure profile section
        failureRedirect: '/', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }),(error, req, res, next) => {
        // Handle the error when the user cancelled the authorization
        res.redirect(baseUrl);
    });
	
    // @commented by gourav
	// app.get('/auth/apple', passport.authenticate('apple'));
	// app.get('/apple/callback', passport.authenticate('apple', {
        // successRedirect: '/main',  
        // failureRedirect: '/', 
        // failureFlash: true  
    // }));  
	
	// app.get('/auth/apple/callback', passport.authenticate('apple', {
        // successRedirect: '/main', 
        // failureRedirect: '/', 
        // failureFlash: true
    // }));
	
	app.get("/apple/loginUrl", (req, res) => {
		console.log("------------/apple/loginUrl");
		console.log(AppleAuthConfig.loginURL());
	});

	app.get('/apple/token', (req, res) => {
		console.log('-------------auth._tokenGenerator.generate()');
		console.log(AppleAuthConfig._tokenGenerator.generate());
		res.send(AppleAuthConfig._tokenGenerator.generate());
	});
	
	app.get('/auth/apple/callback', async (req, res) => {
		console.log('-------GET------/auth/apple/callback');
	});	
 
	app.post('/auth/apple/callback', async (req, res) => {
		console.log("------POST------/auth/apple/callback routes 374");
		try {
			console.log("GET /auth");
			const response = await AppleAuthConfig.accessToken(req.body.code);
			const idToken = jwt.decode(response.id_token);

			const appleUser = {};
			appleUser.id = idToken.sub;

			if (idToken.email) appleUser.email = idToken.email;
			if (req.body.appleUser) {
				const { name } = JSON.parse(req.body.appleUser);
				appleUser.name = name;
			}
            if(appleUser.email){
			    console.log('______389 appleUserrrrrrrrrrr', appleUser.email);
                UserModel.findOne({mail : appleUser.email },async function(err, user) {

                    var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
                    var password = Math.floor((Math.random() * 99999999) *54);
                    const stripe_customer = await stripeAccount.customers.create({
                        email:appleUser.email,
                        name:appleUser.email,
                        address: {
                            line1: '510 Townsend St',
                            postal_code: '98140',
                            city: 'San Francisco',
                            state: 'CA',
                            country: 'US',
                        },
                    });
    
                    if (err)
                        return done(err);
    
                    if (user) {
                        console.log('User is' + user);
                        req.session.userCustomerSession = user;
                        // return done(null, user,req.flash('success', 'Logged in successfully'));
                        req.flash('success', 'Logged in successfully');
						res.redirect(baseUrl + 'main');
                    } else {
                        var newUser= new UserModel();
                        
                        newUser.password = newUser.generateHash(password);
                        newUser.mail = appleUser.email;
                        newUser.name = appleUser.email.split('@')[0];
                        newUser.stripeCustomerId = stripe_customer.id;
                        if( req.device.type == 'phone'){
                            newUser.userType = 'MobileUser';
                        }else{
                            newUser.userType = 'WebUser';
                        }
                        newUser.social_provider = 'Apple';
                        newUser.created_date = day;
                        newUser.updated_date = day;
                        newUser.status = 'active';
                        newUser.verify = '1';
    
                        newUser.save(function(err) {
                            if (err){
                                throw err;
                            }
                            UserModel.findOne({mail : appleUser.email },async function(err, result) {
                                if (err){
                                    throw err;
                                }
                            //ready content for send email
                            var content = {
                                'name': newUser.name,
                                'email': newUser.mail, 
                                'password': password,
                                'subject': 'Account creation successful',
                                'templatefoldername': 'socialLogin',
                                'content': 'Thanks for contacting with us.'
                            };
                            //Sending new data via Email
                            req.session.userCustomerSession = result;
                            Email.send_email(content);
                            // return done(null, newUser, req.flash('success', 'Account created successfully'));
                            req.flash('success', 'Account created successfully');
						    res.redirect(baseUrl + 'main');
                            })
                        })
                    }
                });
            }
		} catch (ex) {
			console.log('______391 Error', ex); 
			res.send("An error occurred!");
		}
	});
	
 


    app.get('/resendOtp', async (req, res) => {
        var check = req.session.webUser;
        // console.log("webuser  :");
        // console.log(req.session.webUser.email);
        var email
        if (check == undefined) {
            email = req.session.email;
        } else {
            email = req.session.webUser.email;
        }
        // const email  = req.session.webUser.email;
        try {
            const userExist = await userotp.findOne({ mail: email });
            if (userExist) {
                var OTP = userExist.otp;
                const uddateOtp = await userotp.update(function (err) {
                    if (err) {
                        throw err;
                    }
                    else {
                        var content = {};
                        var content = {
                            'name': userExist.name,
                            'email': userExist.mail,
                            'otp': OTP,
                            'subject': 'Email verification code',
                            'templatefoldername': 'otpGenerate',
                            'id': userExist._id,
                            'token': userExist.active_hash,
                            'content': `Congratulations! You are Registered. Please, use the verification code to activate your account. Verification code ${OTP}.`
                        };
                        //Sending new data via Email
                        Email.send_email(content);
                        req.flash('success', 'A verification code was sent to your registered email address.');
                        data = {}
                        data.error = req.flash("error");
                        data.success = req.flash("success");
                        data.session = req.flash("session");
                        data.msg = " ";
                        res.render('verifyCustomer.ejs', data);
                    }
                });
            } else {
                res.status(201).json({ error: "Verification Failed" });
            }
        } catch (err) {
            res.status(500).json({ error: "Failed to registered" });
        }
    });
}
