var express = require('express');
var User = require('./app/models/home');
var app = express();
var multer = require('multer');
var constants = require('constants');
var constant = require('./config/constants');
var commonHelper = require('./config/common_helper');
var cookieSession = require('cookie-session');
require('dotenv').config();
var Cron = require('./app/views/customer/appointments/cronJob');

var port = process.env.PORT || 5503;

//var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var path = require('path');
var jwt = require('jsonwebtoken');

var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var dateFormat = require('dateformat');
var fs = require('fs');
var device = require('express-device');
app.use(device.capture());

console.log('===================');
console.log(new Date());
process.env.TZ = 'Asia/Kolkata';
console.log(new Date());
console.log('===================');
var now = new Date();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/** global variable **/
global.baseUrl = constant.baseUrl;
global.currentYear = dateFormat(Date.now(), 'yyyy'); //yyyy-mm-dd HH:MM:ss
global.currentTimeStamp = Math.floor(Date.now() / 1000); //time stamp
global.appRoot = path.resolve(__dirname);

global.globalDefaultValue = 'N.A';
global.globalPerPageLimit = 10;
global.adminEmailId = 'test@yopmail.com';

global.AWS_AccessKeyId = 'AKIAJQQ6362OJKLIQWCA';
global.AWS_SecretAccessKey = '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';
global.AWS_DraftBucket = 'OYOdrafts';
global.baseUrlAWSDraftBucket = 'https://OYOdrafts.s3.amazonaws.com/';

/** global variable end **/

/***************Mongodb configuratrion********************/
var mongoose = require('mongoose');
var configDB = require('./config/database.js');
mongoose.Promise = require('bluebird');
mongoose.connect(configDB.url, { server: { poolSize: 5 } });
var conn = mongoose.connection;

conn.once('open', function () {
	console.log('Mongoose connection opened on process ' + process.pid);
});

/** End Mongodb configuratrion**/

/** DataTable Configration **/
/* var dataTable = require('mongoose-datatable');
dataTable.configure({ verbose: false, debug : false });
mongoose.plugin(dataTable.init); */
/** End DataTable Configration **/

require('./config/passport')(passport); // pass passport for configuration

//set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
//app.use(bodyParser()); // get information from html forms

//view engine setup
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'ejs');
//app.set('view engine', 'ejs'); // set up ejs for templating

app.use(
	session({
		secret: 'OASESS',
		resave: true,
		saveUninitialized: true,
	})
);

// app.use(cookieSession({
//     maxAge: 24*60*60*1000,
//     keys: ['sessionkeysecret'],
// }));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

/* get and set user session for globally */
app.use(function (req, res, next) {
	// if(req.session.passport && req.session.passport.user && (req.session.passport.user.role_id == 2 || req.session.passport.user.role_id == 3)){
	//     req.session.userCustomerSession = req.session.passport.user
	// }
	// if(req.session.passport && req.session.passport.user && req.session.passport.user.role_id == 1){
	//     req.session.userAdminSession = req.session.passport.user
	// }
	app.locals.user_session = req.session.user;
	app.locals.user_admin_session = req.session.userAdminSession;
	app.locals.userCustomerSession = req.session.userCustomerSession;
	next();
});
// end session ==========================================

/** commented at 2nd Nov 2021
const appleSignin = require("apple-signin-auth");
app.get("/auth/apple", async (req, res) => {

    const options = {
        clientID: 'com.oyoapp.stage.signin', // Apple Client ID
        redirectUri: "https://stage.oyoapp.com/auth/apple/callback",
        // OPTIONAL
        state: 'state', // optional, An unguessable random string. It is primarily used to protect against CSRF attacks.
        responseMode: 'query' | 'fragment' | 'form_post', // Force set to form_post if scope includes 'email'
        scope: 'email' // optional
    };
    // You get privateKey, apiKeyId and issuerId from your Apple App Store Connect account
    const privateKey = fs.readFileSync("./AuthKey_J88F9X684J.p8") // this is the file you can only download once and should treat like a real, very precious key.
    const apiKeyId = "J88F9X684J"
    const issuerId = "3K26P4V35Y.com.oyoapp.stage"
    let exnow = Math.round((new Date()).getTime() / 1000); // Notice the /1000 
    let nowPlus20 = exnow + 1199 // 1200 === 20 minutes

    let payload = {
        "iss": issuerId,
        "exp": nowPlus20,
        "aud": "appstoreconnect-v1",
        "sub": "com.oyoapp.stage.signin"
    }

    let signOptions = {
        "algorithm": "RS256", // you must use this algorythm, not jsonwebtoken's default
        header : {
            "alg": "RS256",
            "kid": apiKeyId,
            "typ": "JWT"
        }
    }; 

    let token = jwt.sign(payload, privateKey, signOptions, options);
    console.log('@token: ', token);
    
    const authorizationUrl = appleSignin.getAuthorizationUrl(options);
    console.log(authorizationUrl);
    res.redirect(authorizationUrl);
});

app.post("/auth/apple/callback", async (req, res) => {
    console.log("***********************res",res)
    res.redirect(baseUrl+'/main');
});
**/

// ##################################### //
// this code is to show server in maintenance mode page
// comment and uncomment as per need
// app.use((req, res) => {
// 	res.status(503).render('serverDown');
// });
// ##################################### //

//require('./config/routes.js')(app, passport);
require('./config/routesAdmin.js')(app, passport);
require('./config/routesMobile.js')(app, passport);
require('./config/routes.js')(app, passport);
//launch ======================================================================
app.listen(port);
console.log('enter this url:- ' + baseUrl);

//catch 404 and forward to error handler
app.use(function (req, res, next) {
	res
		.status(404)
		.render('404', { title: 'Sorry, page not found', session: req.sessionbo });
});

app.use(function (req, res, next) {
	res.status(500).render('404', { title: 'Sorry, page not found' });
});

// google calendar integration/////
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const oAuth2Client = new OAuth2(
	'42631587666-4g46equsu744iciqv42brdn14h7vdcme.apps.googleusercontent.com',
	'XMgdpCNIHKdDxS81qmOWIxj4'
);

oAuth2Client.setCredentials({
	refresh_token:
		'1//04ssCnS0N_niNCgYIARAAGAQSNwF-L9IrDYL_wkM08vSd02fIpiqzm8emf6-W-eiDGLaua1-hLdwmdZivtNc1Pz7ekC-UNmvHKw8',
	access_token:
		'ya29.a0ARrdaM-uXbBXiXhHv4J2SPy8k8B2xtV6Oq8bnDEKxg-EeBIjFiYBZ70YqJ0gws6bnbCPDhXOAh-QXW6D2Xeww6FinR2cz0MnSkq26bLmWoemZ1tg-VG81EySKuRYwkdNopYvD4KF9qU_zAwLA8dC_Bi3pv_hkA',
});

var calendar = google.calendar({ version: 'v3', oAuth2Client });
//     calendar.events.insert({
//         auth: oAuth2Client,
//         calendarId: 'primary',
//         resource: {
//             'summary': 'Sample event title',
//             'description': 'Sample event description',
//             'start': {
//                 'dateTime': '2019-01-01T06:00:00.000Z',
//                 'timeZone':'utc'
//             },
//             'end': {
//                 'dateTime': '2019-01-01T07:00:00.000Z',
//                 'timeZone':'utc'
//             },
//             'attendees': [],
//             'reminders': {
//                 'useDefault': false,
//                 'overrides': [
//                     {'method': 'email', 'minutes': 24 * 60},
//                     {'method': 'popup', 'minutes': 10},
//                 ],
//             },
//             'colorId' : 4 ,
//             'sendUpdates':'all',
//             'status' : 'confirmed'
//         },
//     }, (err, res) => {
//         if (err) {
//             console.log(err);
//         } else {
//             console.log(res.data);
//         }
//     });
//   //var calendar = google.calendar({version: 'v3', oAuth2Client});
//   console.log("calendar listing -----");
//   calendar.events.list({
//     auth: oAuth2Client,
//     calendarId: 'primary',
//     //timeMin: (new Date()).toISOString(),
//     //maxResults: 10,
//     //singleEvents: true,
//    // orderBy: 'startTime',
//   }, (err, res) => {
//     if (err) return console.log('The API returned an error: ' + err);
//     const events = res.data.items;
//     if (events.length) {
//       console.log('Upcoming 10 events:');
//       events.map((event, i) => {
//         const start = event.start.dateTime || event.start.date;
//         console.log(`${start} - ${event.summary}`);
//       });
//     } else {
//       console.log('No upcoming events found.');
//     }
//   });

// Create a new calender instance.
// const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })

// // Create a new event start date instance for temp uses in our calendar.
// const eventStartTime = new Date()
// eventStartTime.setDate(eventStartTime.getDay() + 2)

// // Create a new event end date instance for temp uses in our calendar.
// const eventEndTime = new Date()
// eventEndTime.setDate(eventEndTime.getDay() + 4)
// eventEndTime.setMinutes(eventEndTime.getMinutes() + 45)

// // Create a dummy event for temp uses in our calendar
// const event = {
//   summary: `Meeting with jaisurya`,
//   location: `3595 California St, San Francisco, CA 94118`,
//   description: `Meet with David to talk about the new client project and how to integrate the calendar for booking.`,
//   colorId: 1,
//   start: {
//     dateTime: eventStartTime,
//     timeZone: 'Asia/kolkata',
//   },
//   end: {
//     dateTime: eventEndTime,
//     timeZone: 'Asia/kolkata',
//   },
// }

// // Check if we a busy and have an event on our calendar for the same time.
// calendar.freebusy.query(
//   {
//     resource: {
//       timeMin: eventStartTime,
//       timeMax: eventEndTime,
//       timeZone: 'Asia/kolkata',
//       items: [{ id: 'n4023v0vfov2gq39508ta04suc@group.calendar.google.com' }],
//     },
//   },
//   (err, res) => {
//     // Check for errors in our query and log them if they exist.
//     if (err) return console.error('Free Busy Query Error: ', err)

//     // Create an array of all events on our calendar during that time.
//     const eventArr = res.data.calendars.primary.busy

//     // Check if event array is empty which means we are not busy
//     if (eventArr.length === 0)
//       // If we are not busy create a new calendar event.
//       return calendar.events.insert(
//         { calendarId: 'primary', resource: event },
//         err => {
//           // Check for errors and log them if they exist.
//           if (err) return console.error('Error Creating Calender Event:', err)
//           // Else log that the event was created.
//           return console.log('Calendar event successfully created.')
//         }
//       )

//     // If event array is not empty log that we are busy.
//     console.log(res);
//     return console.log(`Sorry I'm busy...`)
//   }
// )

// <MsalInitSnippet>
// In-memory storage of logged-in users
// For demo purposes only, production apps should store
// this in a reliable storage

exports = module.exports = app;
