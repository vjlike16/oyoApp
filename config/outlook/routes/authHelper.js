var clientId = '6a3f1e77-0177-40e4-ab35-41effc934b27';
var clientSecret = 'v3cM1_sS_u-._44Wpyud-c~Av3YS5Qqu5l';
var redirectUri = baseUrl+'authorize';

var scopes = [
  'openid',
  'profile',
  'offline_access',
  'https://outlook.office.com/calendars.readwrite',
  'user.read',
  'people.read',
  'calendars.readwrite'
];

var credentials = {
  clientID: clientId,
  clientSecret: clientSecret,
  site:'https://login.microsoftonline.com/common/',
  authorizationPath: '/oauth2/v2.0/authorize',
  tokenPath: '/oauth2/v2.0/token'
}
var oauth2 = require('simple-oauth2')(credentials)

// const getAuthUrl = function() {
//     var returnVal = oauth2.authCode.authorizeURL({
//       redirect_uri: redirectUri,
//       scope: scopes.join(' ')
//     });
//     console.log('');
//     console.log('Generated auth url: ' + returnVal);
//     return returnVal;
//   }
var authUrl = oauth2.authCode.authorizeURL({
  redirect_uri: redirectUri,
  scope: scopes.join(' ')
});

const getEmailFromIdToken = function(id_token) {
    // JWT is in three parts, separated by a '.'
    var token_parts = id_token.split('.');

    // Token content is in the second part, in urlsafe base64
    var encoded_token = new Buffer(token_parts[1].replace('-', '+').replace('_', '/'), 'base64');

    var decoded_token = encoded_token.toString();

    var jwt = JSON.parse(decoded_token);

    // Email is in the preferred_username field
    return jwt.preferred_username
  }

const getTokenFromRefreshToken = function(refresh_token, callback, request, response) {
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

exports.accessToken = function(req,res){

    const getTokenFromCode = function(auth_code, callback, request, response) {
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
        console.log('');
        console.log('Routes******************Token created: ', token.token.access_token);
        callback(request, response, null, token);
      }
    });
  };

  var authCode = req.query.code;
  if (authCode) {
    console.log('');
    console.log('Retrieved auth code in /authorize: ' + authCode);
    getTokenFromCode(authCode, tokenReceived, req, res);
  }
  else {
    // redirect to home
    console.log('/authorize called without a code parameter, redirecting to login');
    res.redirect('/');
  }
  function tokenReceived(req, res, error, token) {
    if (error) {
      console.log('ERROR getting token:'  + error);
      res.send('ERROR getting token: ' + error);
    }
    else {
      // save tokens in session
      req.session.access_token = token.token.access_token;
      req.session.refresh_token = token.token.refresh_token;
      req.session.email = getEmailFromIdToken(token.token.id_token);
      res.redirect(baseUrl +'appointments');
    }
  }
}

exports.outlook_Cal_Request = function(req,res){

  if(req.session.outlookLogin == 'True'){
    req.flash('error', 'You are already synced with outlook calendar');
    res.redirect(baseUrl + 'appointments');
  } else {
    res.redirect(authUrl);
  }
}

exports.outlook_Cal_Remove = function(req,res){

  if(req.session.outlookLogin == 'True'){
    req.session.outlookLogin = 'False';
    req.flash('success', 'You are unsynced with outlook calendar');
    res.redirect(baseUrl + 'appointments');
  } else {
    req.flash('error', 'You are not synced with outlook calendar');
    res.redirect(baseUrl + 'appointments');
  }
}