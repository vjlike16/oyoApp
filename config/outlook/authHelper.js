const { baseUrl } = require('../../config/constants');

var clientId = '6a3f1e77-0177-40e4-ab35-41effc934b27';
var clientSecret = 'v3cM1_sS_u-._44Wpyud-c~Av3YS5Qqu5l';
var redirectUri = baseUrl + 'authorize';
var outlook_contact = baseUrl + 'outlook-contacts/callback';
var outlook_contact_profile = baseUrl + 'outlook-contacts-profile/callback';

var scopes = [
  'openid',
  'profile',
  'offline_access',
  'https://outlook.office.com/calendars.readwrite',
  'user.read',
  'people.read',
  'calendars.readwrite',
  'contacts.readwrite'
];

var credentials = {
  clientID: clientId,
  clientSecret: clientSecret,
  site:'https://login.microsoftonline.com/common/',
  authorizationPath: '/oauth2/v2.0/authorize',
  tokenPath: '/oauth2/v2.0/token'
}
var oauth2 = require('simple-oauth2')(credentials)

var authVal = oauth2.authCode.authorizeURL({
  redirect_uri: redirectUri,
  scope: scopes.join(' ')
});
exports.outlook_Cal_Request = function(req,res){
  console.log('');
  console.log('Generated auth url: ' + authVal);
  res.redirect(authVal);
}

module.exports = {
  getAuthUrl: function() {
    var returnVal = oauth2.authCode.authorizeURL({
      redirect_uri: redirectUri,
      scope: scopes.join(' ')
    });
    console.log('');
    console.log('Generated auth url: ' + returnVal);
    return returnVal;
  },

  getTokenFromCode: function(auth_code, callback, request, response) {
    oauth2.authCode.getToken({
      code: auth_code,
      redirect_uri: redirectUri,
      scope: 'calendars.readwrite'
      }, function (error, result) {
        if (error) {
          console.log('Access token error: ', error.message);
          callback(request ,response, error, null);
        }
        else {
          var token = oauth2.accessToken.create(result);
          // console.log('Outlook******************Token created: ', token.token.access_token);
          callback(request, response, null, token);
        }
      });
  },
  getTokenForContacts: function(auth_code, callback, request, response) {
    oauth2.authCode.getToken({
      code: auth_code,
      redirect_uri: outlook_contact,
      scope: 'contacts.readwrite'
      }, function (error, result) {
        if (error) {
          console.log('Access token error: ', error.message);
          callback(request ,response, error, null);
        }
        else {
          var token = oauth2.accessToken.create(result);
          console.log('');
          // console.log('Token created: ', token.token);
          callback(request, response, null, token);
        }
      });
  },
  getTokenForContactsProfile: function(auth_code, callback, request, response) {
    oauth2.authCode.getToken({
      code: auth_code,
      redirect_uri: outlook_contact_profile,
      scope: 'contacts.readwrite'
      }, function (error, result) {
        if (error) {
          console.log('Access token error: ', error.message);
          callback(request ,response, error, null);
        }
        else {
          var token = oauth2.accessToken.create(result);
          console.log('');
          // console.log('Token created: ', token.token);
          callback(request, response, null, token);
        }
      });
  },

  getEmailFromIdToken: function(id_token) {
    // JWT is in three parts, separated by a '.'
    var token_parts = id_token.split('.');

    // Token content is in the second part, in urlsafe base64
    var encoded_token = new Buffer(token_parts[1].replace('-', '+').replace('_', '/'), 'base64');

    var decoded_token = encoded_token.toString();

    var jwt = JSON.parse(decoded_token);

    // Email is in the preferred_username field
    return jwt.preferred_username
  },

  getTokenFromRefreshToken: function(refresh_token, callback, request, response) {
    var token = oauth2.accessToken.create({ refresh_token: refresh_token, expires_in: 0});
    token.refresh(function(error, result) {
      if (error) {
        console.log('Refresh token error: ', error.message);
        callback(request, response, error, null);
      }
      else {
        console.log('New token: ', result.token);
        callback(request, response, null, result);
      }
    });
  }
};
