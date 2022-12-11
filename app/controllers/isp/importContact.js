const { google } = require('googleapis');
var url = require('url');
const axios = require('axios');
var importContact = require('../../models/isp/importContacts');
var connectedList = require('../../models/customers/connectedList');
var importContactSuccess = require('../../models/isp/importContactSuccess');
var clients = require('../../models/home');
var mongoose = require('mongoose');
const { baseUrl } = require('../../../config/constants');
var authHelper = require('../../../config/outlook/authHelper');
var notification = require('../../../lib/notificationLib');
var dateFormat = require('dateformat');
var google_contact = baseUrl + 'import-contacts/callback';
var outlook_contact = baseUrl + 'outlook-contacts/callback';
var google_contact_profile = baseUrl + 'import-contacts-profile/callback';
var outlook_contact_profile = baseUrl + 'outlook-contacts-profile/callback';

var Email = require('../../../lib/email.js');
var sendReminder = require('../../models/isp/sendReminder');

// Import Google contacts
exports.import_google = function (req, res) {
	const oauth2Client = new google.auth.OAuth2(
		'1055295143366-c7q7effup0qgodf0g9q87hus7cmhc23j.apps.googleusercontent.com',
		'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',
		google_contact
	);
	const scopes = [
		'https://www.googleapis.com/auth/contacts',
		'https://www.googleapis.com/auth/contacts.readonly',
		'https://www.googleapis.com/auth/contacts.other.readonly',
	];
	const authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',

		scope: scopes,
	});
	res.redirect(authUrl);
};

exports.import_google_callback = function (req, res) {
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query.code;

	const oauth2Client = new google.auth.OAuth2(
		'1055295143366-c7q7effup0qgodf0g9q87hus7cmhc23j.apps.googleusercontent.com',
		'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',
		google_contact
	);
	try {
		oauth2Client.getToken(query, (err, token) => {
			if (err) {
				return console.error('Error retrieving access token', err);
			}
			oauth2Client.setCredentials(token);

			const service = google.people({ version: 'v1', oauth2Client });
			// res.redirect(baseUrl +'select-contacts');
			var insertContacts = [];
			const ispEmail = req.app.locals.userCustomerSession.mail;
			const ispName = req.app.locals.userCustomerSession.name;
			service.people.connections.list(
				{
					auth: oauth2Client,
					resourceName: 'people/me',
					pageSize: 1000,
					personFields: 'names,emailAddresses,phoneNumbers,coverPhotos',
				},
				async (err, resp) => {
					if (err) return console.error('The API returned an error: ' + err);
					const connections = resp.data.connections;
					if (connections && connections != null) {
						connections.forEach(person => {
							if (person.names && person.names.length > 0) {
								var name = person.names[0].displayName;
								var email = person.emailAddresses;
								var phoneNumber = 0;
								var emailId = 0;
								var businessPhones = person.phoneNumbers;
								var coverPhotos = person.coverPhotos;
								if (
									typeof businessPhones == undefined ||
									typeof businessPhones == 'undefined'
								) {
									// console.log("*****************businessPhones","businessPhones not found");
									phoneNumber = ' ';
								} else {
									phoneNumber = businessPhones[0].value;
								}
								if (typeof email == undefined || typeof email == 'undefined') {
									// console.log("*****************email","not found");
									emailId = ' ';
								} else {
									emailId = email[0].value;
								}
								if (
									typeof coverPhotos == undefined ||
									typeof coverPhotos == 'undefined'
								) {
									// console.log("*****************email","not found");
									coverPhotos = baseUrl + 'uploads/profile/avatar.png';
								} else {
									coverPhotos = coverPhotos[0].url;
								}
								if (emailId != 0) {
									insertContacts.push({
										name: name,
										mail: emailId || null,
										businessPhones: phoneNumber || null,
										provider: 'Google',
										ispEmail: ispEmail,
										ispName: ispName,
										coverPhotos: coverPhotos,
									});
								}
							}
						});
					}
					await importContact.create(insertContacts).then(async insertData => {
						await importContact
							.find({ ispEmail: req.app.locals.userCustomerSession.mail })
							.then(data => {
								data = JSON.parse(JSON.stringify(data));
								if (data.length == 0) {
									req.flash('error', 'No connections found.');
									res.redirect(baseUrl + 'select-contacts');
								} else {
									req.flash('success', 'Connections found successfully.');
									res.redirect(baseUrl + 'select-contacts');
								}
							});
					});
				}
			);
		});
	} catch (err) {
		console.log('🚀 ~ file: importContact.js ~ line 137 ~ err', err);
		req.flash('error', err);
		res.redirect(baseUrl + 'select-contacts');
	}
};

// Import Outlook contacts
exports.import_outlook = function (req, res) {
	var clientId = '6a3f1e77-0177-40e4-ab35-41effc934b27';
	var clientSecret = 'v3cM1_sS_u-._44Wpyud-c~Av3YS5Qqu5l';
	var redirectUri = outlook_contact;

	var scopes = [
		'openid',
		'profile',
		'offline_access',
		'https://outlook.office.com/calendars.readwrite',
		'user.read',
		'people.read',
		'calendars.readwrite',
		'contacts.readwrite',
	];
	var credentials = {
		clientID: clientId,
		clientSecret: clientSecret,
		site: 'https://login.microsoftonline.com/common/',
		authorizationPath: '/oauth2/v2.0/authorize',
		tokenPath: '/oauth2/v2.0/token',
	};
	var oauth2 = require('simple-oauth2')(credentials);
	var authVal = oauth2.authCode.authorizeURL({
		redirect_uri: redirectUri,
		scope: scopes.join(' '),
	});
	// console.log('Generated auth url: ' + authVal);
	res.redirect(authVal);
};

exports.import_outlook_callback = function (req, res) {
	var authCode = req.query.code;
	// console.log("*******************refresh_token",authCode);
	if (authCode) {
		authHelper.getTokenForContacts(authCode, tokenReceived, req, res);
	} else {
		console.log(
			'/authorize called without a code parameter, redirecting to login'
		);
		res.redirect('/');
	}
	async function tokenReceived(req, res, error, token) {
		if (error) {
			console.log('ERROR getting token:' + error);
			res.send('ERROR getting token: ' + error);
		} else {
			const accessToken = token.token.access_token;
			const apiUrl = 'https://graph.microsoft.com/v1.0/me';
			const authAxios = axios.create({
				apiUrl: apiUrl,
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});
			const contacts = await authAxios.get(`${apiUrl}/contacts`);
			const value = contacts.data.value;
			var insertContacts = [];
			if (value) {
				value.forEach(person => {
					if (
						person.displayName &&
						person.displayName.length > 0 &&
						person.emailAddresses[0] != undefined
					) {
						console.log('person.emailAddresses[0]', person.emailAddresses[0]);
						var name = person.displayName;
						var email = person.emailAddresses[0].address;
						var businessPhones = person.businessPhones[0];
						const ispEmail = req.app.locals.userCustomerSession.mail;
						const ispName = req.app.locals.userCustomerSession.name;
						insertContacts.push({
							name: name,
							mail: email,
							businessPhones: businessPhones,
							provider: 'Outlook',
							ispEmail: ispEmail,
							ispName: ispName,
						});
					} else {
						console.log('No display name found for connection.');
						req.flash('error', 'No connections found.');
						res.redirect(baseUrl + 'select-contacts');
					}
				});
			} else {
				console.log('No connections found.');
				res.redirect(baseUrl + 'select-contacts');
			}
			importContact
				.create(insertContacts)
				.then(done => {
					// req.flash('success', 'Your import contact done successfully.');
					res.redirect(baseUrl + 'select-contacts');
				})
				.catch(err => {
					req.flash('error', 'Import contact complete.');
					res.redirect(baseUrl + 'select-contacts');
				});
			// if(success){
			//     req.flash('success', 'Your import contact done successfully.');
			//     res.redirect(baseUrl + 'select-contacts');
			// } else{
			//     req.flash('error', 'Your import contact done successfully.');
			//     res.redirect(baseUrl + 'select-contacts');
			// }
		}
	}
};
exports.onboardingImportContacts = async function (req, res) {
	var details = req.app.locals.userCustomerSession;
	var email = details.mail;
	var contacts = req.body.contactId;
	if (contacts == undefined) {
		await importContact.remove({ ispEmail: email });
		req.flash('error', 'No connections imported.');
		res.redirect(baseUrl + 'select-contacts');
		return false;
	}
	var insertContacts = [];
	for (let i = 0; i < contacts.length; i++) {
		let data = await importContact.findOne({ _id: contacts[i] });
		let user = JSON.parse(JSON.stringify(data));
		var name = user.name;
		var mail = user.mail;
		var businessPhones = user.businessPhones;
		var provider = user.provider;
		var ispEmail = user.ispEmail;
		var ispName = user.ispName;
		var coverPhotos = user.coverPhotos;
		var ispId = details._id;
		insertContacts.push({
			name: name,
			mail: mail,
			businessPhones: businessPhones,
			provider: provider,
			ispId: ispId,
			ispEmail: ispEmail,
			ispName: ispName,
			ispProfile: details.profileImage,
			coverPhotos: coverPhotos,
		});
	}
	await importContactSuccess.create(insertContacts);
	await importContact.remove({ ispEmail: email });
	req.flash('success', 'Import contacts completed!');
	res.redirect(baseUrl + 'add-service');
	// if (contacts) {
	//     contacts.forEach(async (contactId) => {
	//         var insertContacts = [];
	//         await importContact.find({_id: contactId})
	//         .then((data) => {
	// 	        var user = data[0]._doc;
	//             var name = user.name;
	//             var mail = user.mail;
	//             var businessPhones = user.businessPhones;
	//             var provider = user.provider;
	//             var ispEmail = user.ispEmail;
	//             var ispName = user.ispName;
	//             var coverPhotos = user.coverPhotos;
	//             var ispId = details._id;
	//             insertContacts.push({
	//                 name: name,
	//                 mail: mail,
	//                 businessPhones: businessPhones,
	//                 provider: provider,
	//                 ispId: ispId,
	//                 ispEmail: ispEmail,
	//                 ispName: ispName,
	//                 coverPhotos: coverPhotos,
	//             });
	//         })
	//         .then(() => {
	//             importContactSuccess.create(insertContacts);
	//         })
	//         .catch((err) => {
	//             req.flash('error', 'No connections found.');
	//             res.redirect(baseUrl + 'add-service');
	// 		})
	//     });
	//     await importContact.remove({ ispEmail: email });
	//     req.flash('success', 'Your import contact done successfully.');
	//     res.redirect(baseUrl + 'add-service');
	// }
};

// Import Contacts After login in profile part

// Import Google contacts
exports.import_google_profile = function (req, res) {
	const oauth2Client = new google.auth.OAuth2(
		'1055295143366-c7q7effup0qgodf0g9q87hus7cmhc23j.apps.googleusercontent.com',
		'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',
		google_contact_profile
	);
	const scopes = [
		'https://www.googleapis.com/auth/contacts',
		'https://www.googleapis.com/auth/contacts.readonly',
		'https://www.googleapis.com/auth/contacts.other.readonly',
	];
	const authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',

		scope: scopes,
	});
	res.redirect(authUrl);
};

exports.import_google_profile_callback = function (req, res) {
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query.code;

	const oauth2Client = new google.auth.OAuth2(
		'1055295143366-c7q7effup0qgodf0g9q87hus7cmhc23j.apps.googleusercontent.com',
		'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',
		google_contact_profile
	);
	oauth2Client.getToken(query, async (err, token) => {
		if (err) {
			return console.error('Error retrieving access token', err);
		}
		oauth2Client.setCredentials(token);

		const service = google.people({ version: 'v1', oauth2Client });
		// res.redirect(baseUrl +'select-contacts');
		var insertContacts = [];
		const ispEmail = req.app.locals.userCustomerSession.mail;
		const ispName = req.app.locals.userCustomerSession.name;
		service.people.connections.list(
			{
				auth: oauth2Client,
				resourceName: 'people/me',
				pageSize: 1000,
				personFields: 'names,emailAddresses,phoneNumbers,coverPhotos',
			},
			async (err, resp) => {
				if (err) return console.error('The API returned an error: ' + err);
				const connections = resp.data.connections;
				if (connections && connections != null) {
					connections.forEach(person => {
						if (person.names && person.names.length > 0) {
							var name = person.names[0].displayName;
							var email = person.emailAddresses;
							var phoneNumber = 0;
							var emailId = 0;
							var businessPhones = person.phoneNumbers;
							var coverPhotos = person.coverPhotos;
							if (
								typeof businessPhones == undefined ||
								typeof businessPhones == 'undefined'
							) {
								// console.log("*****************businessPhones","businessPhones not found");
								phoneNumber = ' ';
							} else {
								phoneNumber = businessPhones[0].value;
							}
							if (typeof email == undefined || typeof email == 'undefined') {
								// console.log("*****************email","not found");
								emailId = ' ';
							} else {
								emailId = email[0].value;
							}
							if (
								typeof coverPhotos == undefined ||
								typeof coverPhotos == 'undefined'
							) {
								// console.log("*****************email","not found");
								coverPhotos = baseUrl + 'uploads/profile/avatar.png';
							} else {
								coverPhotos = coverPhotos[0].url;
							}
							if (emailId != 0) {
								insertContacts.push({
									name: name,
									mail: emailId || null,
									businessPhones: phoneNumber || null,
									provider: 'Google',
									ispEmail: ispEmail,
									ispName: ispName,
									coverPhotos: coverPhotos,
								});
							}
						}
					});
				}
				await importContact
					.remove({
						ispEmail: req.app.locals.userCustomerSession.mail,
					})
					.then(async delData => {
						await importContact
							.create(insertContacts)
							.then(async insertData => {
								await importContact
									.find({ ispEmail: req.app.locals.userCustomerSession.mail })
									.then(data => {
										data = JSON.parse(JSON.stringify(data));
										if (data.length == 0) {
											req.flash('error', 'No connections found.');
											res.redirect(baseUrl + 'select-contacts-profile');
										} else {
											req.flash('success', 'Connections found successfully.');
											res.redirect(baseUrl + 'select-contacts-profile');
										}
									});
							});
					});
			}
		);
	});
};

// Import Outlook contacts
exports.import_outlook_profile = function (req, res) {
	var clientId = '6a3f1e77-0177-40e4-ab35-41effc934b27';
	var clientSecret = 'v3cM1_sS_u-._44Wpyud-c~Av3YS5Qqu5l';
	var redirectUri = outlook_contact_profile;

	var scopes = [
		'openid',
		'profile',
		'offline_access',
		'https://outlook.office.com/calendars.readwrite',
		'user.read',
		'people.read',
		'calendars.readwrite',
		'contacts.readwrite',
	];
	var credentials = {
		clientID: clientId,
		clientSecret: clientSecret,
		site: 'https://login.microsoftonline.com/common/',
		authorizationPath: '/oauth2/v2.0/authorize',
		tokenPath: '/oauth2/v2.0/token',
	};
	var oauth2 = require('simple-oauth2')(credentials);
	var authVal = oauth2.authCode.authorizeURL({
		redirect_uri: redirectUri,
		scope: scopes.join(' '),
	});
	// console.log('Generated auth url: ' + authVal);
	res.redirect(authVal);
};

exports.import_outlook_profile_callback = function (req, res) {
	var authCode = req.query.code;
	// console.log("*******************refresh_token",authCode);
	if (authCode) {
		authHelper.getTokenForContactsProfile(authCode, tokenReceived, req, res);
	} else {
		console.log(
			'/authorize called without a code parameter, redirecting to login'
		);
		res.redirect('/');
	}
	async function tokenReceived(req, res, error, token) {
		if (error) {
			console.log('ERROR getting token:' + error);
			res.send('ERROR getting token: ' + error);
		} else {
			const accessToken = token.token.access_token;
			const apiUrl = 'https://graph.microsoft.com/v1.0/me';
			const authAxios = axios.create({
				apiUrl: apiUrl,
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});
			const contacts = await authAxios.get(`${apiUrl}/contacts`);
			const value = contacts.data.value;
			var insertContacts = [];
			if (value) {
				value.forEach(person => {
					if (
						person.displayName &&
						person.displayName.length > 0 &&
						person.emailAddresses[0] != undefined
					) {
						console.log('person.emailAddresses[0]', person.emailAddresses[0]);
						var name = person.displayName;
						var email = person.emailAddresses[0].address;
						var businessPhones = person.businessPhones[0];
						const ispEmail = req.app.locals.userCustomerSession.mail;
						const ispName = req.app.locals.userCustomerSession.name;

						insertContacts.push({
							name: name,
							mail: email,
							businessPhones: businessPhones,
							provider: 'Outlook',
							ispEmail: ispEmail,
							ispName: ispName,
						});
					} else {
						console.log('No display name found for connection.');
						res.redirect(baseUrl + 'select-contacts-profile');
					}
				});
			} else {
				console.log('No connections found.');
				req.flash('error', 'No connections found.');
				res.redirect(baseUrl + 'select-contacts-profile');
			}
			importContact
				.create(insertContacts)
				.then(done => {
					res.redirect(baseUrl + 'select-contacts-profile');
				})
				.catch(err => {
					req.flash('error', 'Import contacts completed!');
					res.redirect(baseUrl + 'select-contacts-profile');
				});
			// if(success){
			//     req.flash('success', 'Your import contact done successfully.');
			//     res.redirect(baseUrl + 'select-contacts');
			// } else{
			//     req.flash('error', 'Your import contact done successfully.');
			//     res.redirect(baseUrl + 'select-contacts');
			// }
		}
	}
};
exports.importContact = async function (req, res) {
	try {
		var details = req.app.locals.userCustomerSession;
		var email = details.mail;
		var contacts = req.body.contactId;
		var importedUserEmails = [];
		if (contacts == undefined) {
			req.flash('error', 'Please select a user first.');
			res.redirect(baseUrl + 'select-contacts-profile');
			return false;
		}
		var importedUser = await importContactSuccess.find({ ispEmail: email });
		importedUser = JSON.parse(JSON.stringify(importedUser));
		if (importedUser.length > 0) {
			importedUser.forEach(importedEmail => {
				var emails = importedEmail.mail;
				importedUserEmails.push(emails);
			});
		}
		var insertContacts = [];
		// if (contacts) {
		console.log('FOR START TIME: ', new Date());
		for (let i = 0; i < contacts.length; i++) {
			console.log('::::::: I ', contacts[i]);
			let data = await importContact.findOne({ _id: contacts[i] });
			let user = JSON.parse(JSON.stringify(data));
			var name = user.name;
			var mail = user.mail;
			var businessPhones = user.businessPhones;
			var provider = user.provider;
			var ispEmail = user.ispEmail;
			var ispName = user.ispName;
			var coverPhotos = user.coverPhotos;
			var ispId = details._id;
			let checkEmail = importedUserEmails.includes(mail);
			if (!checkEmail) {
				insertContacts.push({
					name: name,
					mail: mail,
					businessPhones: businessPhones,
					provider: provider,
					ispId: ispId,
					ispEmail: ispEmail,
					ispName: ispName,
					ispProfile: details.profileImage,
					coverPhotos: coverPhotos,
				});
				await sendConnectionRequest(
					{
						name: name,
						mail: mail,
						ispId: ispId,
						ispEmail: ispEmail,
						ispName,
						ispName,
					},
					details
				);
				console.log('FOR Loop TIME: ', new Date());
			}
		}
		console.log('FOR End TIME: ', new Date());
		await importContactSuccess.create(insertContacts);
		await importContact.remove({ ispEmail: email });
		req.flash('success', 'Import contact complete.');
		res.redirect(baseUrl + 'clients');
	} catch (err) {
		req.flash('error', 'Something went wrong, Please try again.');
		res.redirect(baseUrl + 'clients');
	}
};

async function sendConnectionRequest(requestData, details) {
	let day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
	let content = {
		name: requestData.name,
		email: requestData.mail,
		subject: 'Connection request',
		templatefoldername: 'import',
		password: 'newPassword',
		content: `${details.name} (${details.inviteCode}) would like to connect with you. If you are new to OYOapp then please, click the link below to either connect with the business owner by name or code.`,
	};
	Email.send_email(content);

	await connectedList
		.findOne({ cusMail: requestData.mail, ispMail: details.mail })
		.then(async checkConnected => {
			console.log('Connection : ', checkConnected, requestData.mail);
			checkConnected = JSON.parse(JSON.stringify(checkConnected));
			let cusData = await clients.findOne({ mail: requestData.mail });
			cusData = JSON.parse(JSON.stringify(cusData));
			console.log('cusData', cusData);
			connectUser = [];
			reminderData = [];
			if (cusData) {
				if (!checkConnected) {
					connectUser.push({
						status: 'pending',
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
						ispInvite: 'true',
						createdDate: day,
					});
					reminderData.push({
						ispId: details._id,
						notificationType: 'Connection',
						status: 'pending',
						name: cusData.name,
						mail: cusData.mail,
						profile: cusData.profileImage,
						phone: cusData.mobile,
						ispName: details.name,
						ispEmail: details.mail,
						ispProfile: details.profileImage,
						ispPhone: details.mobile,
						created_date: day,
					});
					console.log('connectUser', connectUser);
					console.log('reminderData', reminderData);
					await connectedList.create(connectUser);
					await sendReminder.create(reminderData);
					await importContactSuccess.findOneAndRemove({
						mail: requestData.mail,
						ispEmail: details.mail,
					});
				}
			}
		})
		.catch(err => {
			console.log(err);
		});
}
