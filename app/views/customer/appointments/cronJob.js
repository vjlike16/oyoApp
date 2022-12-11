'use strict';
var Cron = require('node-cron');
var dateFormat = require('dateformat');
var Appointment = require('../../../models/customers/appointments');
var freeTrial = require('../../../models/customers/freeTrial');
var setAlert = require('../../../models/isp/setAlert');
var sendReminder = require('../../../models/isp/sendReminder');
var subscriptions = require('../../../models/isp/subscriptionsData');
var home = require('../../../models/home');
var Email = require('../../../../lib/email');
var moment = require('moment');
const renewPlan = require('../../../models/customers/renewPlan');
const SECRET_KEY =
	'sk_test_51JVSy4CzX7kFjfHZ0WqNOWnQPs4K3Cwv0YyK75zhtqvNYPVL07zwSbWGA24Abgg5sxa8SMcLUBGO0Ip8k8SggXbU00q0DhCFD7';
const stripe = require('stripe')(SECRET_KEY);
console.log('CronJob is executing');
Cron.schedule('* * * * *', async function () {
	Appointment.find({ status: 'Upcoming' }).exec(async function (err, result) {
		if (err) {
			throw err;
		} else {
			result.forEach(appointments => {
				var currentUtcTime = new Date().toISOString();
				currentUtcTime = currentUtcTime.split('.')[0];
				let start_time = appointments._doc.utc_date;
				let appointmentId = appointments._doc._id;
				let cancellation = appointments._doc.cancellation;
				// IST Time Convert start
				let finalTimeZone = appointments._doc.finalTimeZone;
				var dateTz = moment.tz(currentUtcTime, 'GMT');
				var newDate = dateTz.clone().tz(finalTimeZone).format('YYYY-MM-DD');
				var newTime = dateTz.clone().tz(finalTimeZone).format('HH:mm:ss');
				var newCurrentTime = newDate + 'T' + newTime;
				// IST Time Convet finish

				if (cancellation) {
					// var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
					// var currentDate = day.split(' ')[0];
					// var currentTime = day.split(' ')[1];
					// currentTime = currentDate+'T'+currentTime;
					let cancellationTime = appointments._doc.cancellationTime;

					// if(currentTime >= cancellationTime){
					if (newCurrentTime >= cancellationTime) {
						Appointment.update(
							{ _id: appointmentId },
							{
								$set: {
									cancellation: 'false',
								},
							},
							async function (err, updatedUser) {
								if (err) {
									return done(err);
								} else {
									console.log('Cancellation time is Over');
								}
							}
						);
					}
				}
				// if( currentUtcTime >= start_time ){
				if (newCurrentTime >= start_time) {
					Appointment.update(
						{ _id: appointmentId },
						{
							$set: {
								status: 'Ongoing',
							},
						},
						async function (err, updatedUser) {
							if (err) {
								return done(err);
							} else {
								console.log('Appointment started');
							}
						}
					);
				}
			});
		}
	});

	home
		.find({ subscriptionValidity: 'true' })
		.exec(async function (err, result) {
			if (err) {
				throw err;
			} else {
				result.forEach(checkValidity => {
					let appointmentId = checkValidity._doc._id;

					var currentUtcTime = new Date().toISOString();
					currentUtcTime = currentUtcTime.split('.')[0];
					let plan_end_date = checkValidity._doc.plan_end_date;
					plan_end_date = plan_end_date.toISOString();
					plan_end_date = plan_end_date.split('.')[0];

					if (currentUtcTime >= plan_end_date) {
						home.update(
							{ _id: appointmentId },
							{
								$set: {
									subscriptionValidity: 'false',
								},
							},
							async function (err, updatedUser) {
								if (err) {
									return done(err);
								} else {
									console.log('Subscription is over');
								}
							}
						);
					}
				});
			}
		});

	freeTrial
		.aggregate([
			{
				$project: {
					service_proviver: 1,
					plan_end_date: 1,
					plan_name: 1,
					stripeCustomerId: 1,
					stripeCardId: 1,
					plan_amount: 1,
					value: { $trunc: ['$plan_amount'] },
				},
			},
		])
		.exec(async function (err, result) {
			if (err) {
				throw err;
			} else {
				result = JSON.parse(JSON.stringify(result));
				result.forEach(async checkPlanExpiry => {
					var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
					var currentUtcTime = new Date().toISOString();
					currentUtcTime = currentUtcTime.split('.')[0];
					// IST Time Convert start
					var finalTimeZone = moment.tz.guess();
					var dateTz = moment.tz(currentUtcTime, 'GMT');
					var newDate = dateTz.clone().tz(finalTimeZone).format('YYYY-MM-DD');
					var newTime = dateTz.clone().tz(finalTimeZone).format('HH:mm:ss');
					currentUtcTime = newDate + 'T' + newTime;
					// IST Time Convet finish
					let plan_end_date = checkPlanExpiry.plan_end_date;
					plan_end_date = plan_end_date.split('.')[0];
					// IST Time Convert start
					var finalTime = moment.tz.guess();
					var dateEz = moment.tz(plan_end_date, 'GMT');
					var date = dateEz.clone().tz(finalTime).format('YYYY-MM-DD');
					var time = dateEz.clone().tz(finalTime).format('HH:mm:ss');
					plan_end_date = date + 'T' + time;
					// IST Time Convet finish
					if (currentUtcTime >= plan_end_date) {
						var subscriptionsInfo = [];
						var id = checkPlanExpiry._id;
						var userId = checkPlanExpiry.service_proviver;
						var userDetails = await home.findOne({ _id: userId });
						userDetails = JSON.parse(JSON.stringify(userDetails));
						if (!userDetails) {
							console.log('🚀 ~ file: cronJob.js ~ line 166 ~ !userDetails');
						} else {
							var email = userDetails.mail;
							var name = userDetails.name;
							var coupon_code = userDetails.coupon_code;
							var plan_name = checkPlanExpiry.plan_name;
							var plan_amount = checkPlanExpiry.value;
							var stripeCustomerId = checkPlanExpiry.stripeCustomerId;
							var stripeCardId = checkPlanExpiry.stripeCardId;
							var new_plan_end_date = new Date(
								Date.now() - 1 * 24 * 60 * 60 * 1000
							);
							var updated_plan_end_date = new Date(
								Date.now() + 2 * 24 * 60 * 60 * 1000
							);
							subscriptionsInfo.push({
								ispId: userId,
								name: name,
								mail: email,
								plan_name: plan_name,
								coupon_code: coupon_code,
								plan_end_date: updated_plan_end_date,
								last_paid_amount: plan_amount / 100,
								created_date: new Date(Date.now()),
							});
							await stripe.charges
								.create({
									amount: plan_amount,
									currency: 'usd',
									description: 'Free Trial Subscription',
									customer: stripeCustomerId,
									source: stripeCardId,
								})
								.then(async charge => {
									await home.update(
										{ _id: userId },
										{
											$set: {
												last_paid_amount: plan_amount / 100,
												last_transaction: day,
												subscriptionValidity: true,
												plan_name: plan_name,
												plan_end_date: updated_plan_end_date,
											},
										},
										async function (error, updatedUser) {
											if (error) {
												return done(error);
											} else {
												await subscriptions.create(subscriptionsInfo);
												console.log('updatedUser', updatedUser);
												console.log('Free Trial over and Payment is done.');
											}
										}
									);
									await freeTrial.remove({ _id: id });
								})
								.catch(async stripeError => {
									await home.update(
										{ _id: userId },
										{
											$set: {
												subscriptionValidity: false,
												plan_end_date: new_plan_end_date,
											},
										},
										function (error, updatedUser) {
											if (error) {
												return done(error);
											} else {
												console.log('updatedUser', updatedUser);
												console.log(
													'Free Trial over and Payment is unsuccessfull.'
												);
											}
										}
									);
									console.log('stripeError', stripeError.raw.message);
									await freeTrial.remove({ _id: id });
								});
						}
					}
				});
			}
		});
	Appointment.find({ status: 'Upcoming' }).exec(async function (err, result) {
		if (err) {
			throw err;
		} else {
			result = JSON.parse(JSON.stringify(result));
			for (const element of result) {
				// for( let i=0; i<result.length; i++){
				var ispId = element.service_proviver;
				let appointmentId = element._id;
				var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
				var msg = `${element.name} has booked ${element.title} service with you on ${element.start_date}, ${element.start_time},`;
				var currentUtcTime = new Date().toISOString();
				currentUtcTime = currentUtcTime.split('.')[0];
				let start_time = element.utc_date;
				// IST Time Convert start
				let finalTimeZone = element.finalTimeZone;
				var dateTz = moment.tz(currentUtcTime, 'GMT');
				var newDate = dateTz.clone().tz(finalTimeZone).format('YYYY-MM-DD');
				var newTime = dateTz.clone().tz(finalTimeZone).format('HH:mm:ss');
				var newCurrentTime = newDate + 'T' + newTime;
				// IST Time Convet finish
				let alertData = await setAlert.find({ ispId: ispId });
				alertData = JSON.parse(JSON.stringify(alertData));
				if (alertData[0] != undefined) {
					let duration_hours = alertData[0].hours;
					let duration_minutes = alertData[0].min;
					let duration = duration_hours * 60 + duration_minutes;
					let sendReminderTime = moment(start_time)
						.subtract(duration, 'm')
						.format('YYYY-MM-DD[T]HH:mm:ss');
					let reminderData = [];
					if (newCurrentTime >= sendReminderTime) {
						if (!element.reminderSend) {
							if (alertData[0].notifications) {
								reminderData.push({
									ispId: element.service_proviver,
									notificationType: 'Reminder',
									full_payment: element.full_payment,
									remaining_payment: element.remaining_payment,
									amount: element.amount,
									tip: element.tip,
									start_date: element.start_date,
									start_time: element.start_time,
									end_date: element.end_date,
									utc_date: element.utc_date,
									utc_start: element.utc_start,
									utc_end: element.utc_end,
									title: element.title,
									name: element.name,
									mail: element.mail,
									profile: element.profile,
									phone: element.phone,
									ispName: element.ispName,
									ispEmail: element.ispEmail,
									ispProfile: element.ispProfile,
									ispPhone: element.ispPhone,
									message: msg,
									created_date: day,
								});
								await sendReminder.create(reminderData);
								Appointment.update(
									{ _id: appointmentId },
									{
										$set: {
											reminderSend: 'true',
										},
									},
									async function (err, updatedUser) {
										if (err) {
											return done(err);
										} else {
											console.log('Notification Send to BO and Customer');
										}
									}
								);
							}
						}
						if (!element.emailSend) {
							if (alertData[0].email) {
								var content = {
									name: element.ispName,
									email: element.ispEmail,
									subject: 'OYOapp- Appointment Reminder',
									templatefoldername: 'appointmentReminder',
									id: appointmentId,
									token: element.active_hash,
									date:
										moment
											.utc(element.start_date, 'YYYY-MM-DD')
											.format('MM-DD-YYYY') +
										'/' +
										element.start_time,
									title: element.title,
									cusName: element.name,
									cusEmail: element.mail,
									cusPhone: element.phone,
								};
								Email.send_email(content);
								console.log('Email Send to BO');
								Appointment.update(
									{ _id: appointmentId },
									{
										$set: {
											emailSend: 'true',
										},
									},
									async function (err, updatedUser) {
										if (err) {
											return done(err);
										} else {
											var cusContent = {
												name: element.name,
												email: element.mail,
												subject: 'OYOapp- Appointment Reminder',
												templatefoldername: 'customerAppointmentReminder',
												id: appointmentId,
												token: element.active_hash,
												date:
													moment
														.utc(element.start_date, 'YYYY-MM-DD')
														.format('MM-DD-YYYY') +
													'/' +
													element.start_time,
												title: element.title,
												ispName: element.ispName,
												ispEmail: element.ispEmail,
												ispPhone: element.ispPhone,
											};
											Email.send_email(cusContent);
											console.log('Email Send to Customer');
										}
									}
								);
							}
						}
					}
				}
			}
		}
	});
	renewPlan
		.aggregate([
			{
				$project: {
					service_proviver: 1,
					plan_end_date: 1,
					plan_name: 1,
					stripeCustomerId: 1,
					stripeCardId: 1,
					plan_amount: 1,
					value: { $trunc: ['$plan_amount'] },
				},
			},
		])
		.exec(async function (err, result) {
			if (err) {
				throw err;
			} else {
				result = JSON.parse(JSON.stringify(result));
				result.forEach(async checkPlanExpiry => {
					var subscriptionsInfo = [];
					var day = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
					var currentUtcTime = new Date().toISOString();
					currentUtcTime = currentUtcTime.split('.')[0];
					// IST Time Convert start
					var finalTimeZone = moment.tz.guess();
					var dateTz = moment.tz(currentUtcTime, 'GMT');
					var newDate = dateTz.clone().tz(finalTimeZone).format('YYYY-MM-DD');
					var newTime = dateTz.clone().tz(finalTimeZone).format('HH:mm:ss');
					currentUtcTime = newDate + 'T' + newTime;
					// IST Time Convet finish
					let plan_end_date = checkPlanExpiry.plan_end_date;
					plan_end_date = plan_end_date.split('.')[0];
					// IST Time Convert start
					var finalTime = moment.tz.guess();
					var dateEz = moment.tz(plan_end_date, 'GMT');
					var date = dateEz.clone().tz(finalTime).format('YYYY-MM-DD');
					var time = dateEz.clone().tz(finalTime).format('HH:mm:ss');
					plan_end_date = date + 'T' + time;
					// IST Time Convet finish
					if (currentUtcTime >= plan_end_date) {
						var id = checkPlanExpiry._id;
						var userId = checkPlanExpiry.service_proviver;
						var userDetails = await home.findOne({ _id: userId });
						userDetails = JSON.parse(JSON.stringify(userDetails));
						if (!userDetails) {
							console.log('🚀 ~ file: cronJob.js ~ line 435 ~ userId', userId);
							console.log('🚀 ~ file: cronJob.js ~ line 437 ~ !userDetails');
						} else {
							var email = userDetails.mail;
							var name = userDetails.name;
							var coupon_code = userDetails.coupon_code;
							var plan_name = checkPlanExpiry.plan_name;
							var plan_amount = checkPlanExpiry.value;
							var stripeCustomerId = checkPlanExpiry.stripeCustomerId;
							var stripeCardId = checkPlanExpiry.stripeCardId;
							var new_plan_end_date = new Date(
								Date.now() - 1 * 24 * 60 * 60 * 1000
							);
							var renew_plan_end_date = new Date(
								Date.now() + 2 * 24 * 60 * 60 * 1000
							);
							await stripe.charges
								.create({
									amount: plan_amount,
									currency: 'usd',
									description: 'Renew Subscription',
									customer: stripeCustomerId,
									source: stripeCardId,
								})
								.then(async charge => {
									await home.update(
										{ _id: userId },
										{
											$set: {
												last_paid_amount: plan_amount / 100,
												last_transaction: day,
												subscriptionValidity: true,
												plan_end_date: renew_plan_end_date,
											},
										},
										function (error, updatedUser) {
											if (error) {
												return done(error);
											} else {
												subscriptionsInfo.push({
													ispId: userId,
													name: name,
													mail: email,
													plan_name: plan_name,
													coupon_code: coupon_code,
													plan_end_date: renew_plan_end_date,
													last_paid_amount: plan_amount / 100,
													created_date: new Date(Date.now()),
												});
												renewPlan.update(
													{ _id: id },
													{
														$set: {
															plan_end_date: renew_plan_end_date,
														},
													},
													async function (error, updatedUser) {
														if (error) {
															return done(error);
														} else {
															await subscriptions.create(subscriptionsInfo);
															console.log('updatedUser', updatedUser);
															console.log('Renew Payment is done.');
														}
													}
												);
											}
										}
									);
								})
								.catch(async stripeError => {
									await home.update(
										{ _id: userId },
										{
											$set: {
												subscriptionValidity: false,
												plan_end_date: new_plan_end_date,
											},
										},
										function (error, updatedUser) {
											if (error) {
												return done(error);
											} else {
												console.log('updatedUser', updatedUser);
												console.log('Renew Payment is unsuccessfull.');
											}
										}
									);
									console.log('stripeError', stripeError.raw.message);
								});
						}
					}
				});
			}
		});
});
