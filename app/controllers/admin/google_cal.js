const { baseUrl } = require('../../../config/constants');
var moment = require('moment');
///// Developer account credentialls ///
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];
var google_cal = baseUrl + 'auth/access-token';
var url = require('url');
var google01 = require('googleapis')
var OAuth2 = google01.Auth.OAuth2Client;
var clientSecrets = require('./token.json');
const Appointment = require('../../models/customers/appointments');
// console.log(clientSecrets);
// var oauth2Client = new OAuth2(clientSecrets.web.client_id, clientSecrets.web.client_secret, clientSecrets.web.redirect_uris[0]);
var oauth2Client = new OAuth2("1055295143366-c7q7effup0qgodf0g9q87hus7cmhc23j.apps.googleusercontent.com",
  "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",
  google_cal);
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

exports.accesstoken = function (req, res) {
  var url_parts = url.parse(req.url, true);  
  var query = url_parts.query.code;
  var details = req.app.locals.userCustomerSession;
  var deviceTimeZone = req.session.deviceTimeZone;
  console.log("deviceTimeZone",deviceTimeZone);

  oauth2Client.getToken(query, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);
    // console.log(token); 
    oauth2Client.setCredentials(token);
    req.session.googleLogin = "True";
    req.session.googleToken = token;

    const {google} = require('googleapis'); 
    const calendar = google.calendar({version: 'v3', oauth2Client});
    // console.log("calendar listing -----01254");
    // calendar.events.list({
    //   auth: oauth2Client, 
    //   calendarId: 'primary',
    //   //timeMin: (new Date()).toISOString(),
    //   //maxResults: 10,
    //   //singleEvents: true,
    //  // orderBy: 'startTime',
    // }, (err, ress) => {
    //   if (err) return console.log('The API returned an error: ' + err);
    //   const events = ress.data.items;
    //   if (events.length) {
    //     console.log('Upcoming 10 events:');
    //     events.map((event, i) => {
    //       const start = event.start.dateTime || event.start.date;
    //       console.log(`${start} - ${event.summary}`);   
    //     });  
    //     res.redirect(baseUrl +'appointments');
    //   } else {
    //     console.log('No upcoming events found.');  
    //   }
    // });
    Appointment.find({
			$or: [
				{ispEmail: details.mail},
				{mail: details.mail}
			]
		})
    .exec(function(err , result){
      if(err){
        throw err;
      }else{
        result.forEach((appointments) => {
					if(details.role_id == "2"){
            if(!appointments._doc.googleEvent){
              let title = appointments._doc.title;
              let date = appointments._doc.start_date;
              let time = appointments._doc.start_time;
              let end_time = appointments._doc.end_time;
              let calendar_start_date = moment.utc(time, 'hh:mm A').format('HH:mm:ss');
              calendar_start_date = date +"T"+calendar_start_date;
              let calendar_end_date = moment.utc(end_time, 'hh:mm A').format('HH:mm:ss');
              calendar_end_date = date +"T"+calendar_end_date;
              console.log("appointments._doc.utc_start",appointments._doc.utc_start);
              let event = {
                'summary': `${title}`,
                'start': {
                  'dateTime': `${calendar_start_date}`,
                  'timeZone': `${deviceTimeZone}`,
                },
                'end': {
                  'dateTime': `${calendar_end_date}`,
                  'timeZone': `${deviceTimeZone}`,
                },
                'reminders': {
                  'useDefault': false,
                  'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},
                    {'method': 'popup', 'minutes': 10},
                  ],
                },
              };
              calendar.events.insert({
                auth: oauth2Client,
                calendarId: 'primary',
                resource: event,
              },async function(err, eventData) {
                if (err) {
                  console.log('There was an error contacting the Calendar service: ' + err);
                  return;
                }
                console.log("eventData status",eventData.status);
                await Appointment.update({ _id : appointments._doc._id },
                  { $set : {
                    googleEvent: true,
                    googleEventId: eventData.data.id,
                  }},
                async function(err, updatedUser) {
                  if(err){
                    return done(err);
                  }
                });
              });
            }
          }
          if(details.role_id == "3"){
            if(!appointments._doc.ispGoogleEvent){
              let title = appointments._doc.title;
              let start_time = appointments._doc.utc_date;
              let end_time = appointments._doc.end_date;
              console.log("appointments._doc.utc_start",appointments._doc.utc_start);
              let event = {
                'summary': `${title}`,
                'start': {
                  'dateTime': `${start_time}:00`,
                  'timeZone': `${deviceTimeZone}`,
                },
                'end': {
                  'dateTime': `${end_time}:00`,
                  'timeZone': `${deviceTimeZone}`,
                },
                'reminders': {
                  'useDefault': false,
                  'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},
                    {'method': 'popup', 'minutes': 10},
                  ],
                },
              };
              calendar.events.insert({
                auth: oauth2Client,
                calendarId: 'primary',
                resource: event,
              },async function(err, eventData) {
                if (err) {
                  console.log('There was an error contacting the Calendar service: ' + err);
                  return;
                }
                console.log("eventData status",eventData.status);
                await Appointment.update({ _id : appointments._doc._id },
                  { $set : {
                    ispGoogleEvent: true,
                    ispGoogleEventId: eventData.data.id,
                    ispGoogleToken: req.session.googleToken,
                  }},
                async function(err, updatedUser) {
                  if(err){
                    return done(err);
                  }
                });
              });
            }
          }
        });
      }
    });
    req.flash('success', 'Your events are exported to google successfully');
    res.redirect(baseUrl + 'appointments');
  });
}

exports.google_Cal_Request = function(req,res){
  if(req.session.googleLogin == 'True'){
    req.flash('success', 'You are already synced with google calendar');
    res.redirect(baseUrl + 'appointments');
  } else {
    res.redirect(authUrl); 
  }
}
exports.google_Cal_Remove = function(req,res){
  console.log("req.session.googleLogin",req.session.googleLogin);
  if(req.session.googleLogin == 'True'){
    // const auth2 = oauth2Client.getAuthInstance();
    // auth2.signOut().then(function () {
      req.session.googleLogin = 'False';
      req.flash('success', 'You are unsynced with google calendar');
      res.redirect(baseUrl + 'appointments');
    // });
  } else {
    req.flash('error', 'You are not synced with google calendar');
    res.redirect(baseUrl + 'appointments');
  }
}
