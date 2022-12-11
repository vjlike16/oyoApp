const FCM = require('fcm-node');
const serverKey = 'AAAAptzUurg:APA91bEJSlZp-hVIGzacZn5XSCNc2wVgbEQOUoXpjQAM82CknCO2NuYOAjnwrbuUSMl_knlBeRaTJy6OW6PmqempVmbPOSaTtc7oXtuAiXCrezS1GG0K-Rlf4kznal7MIFHgLa0Qc9Qg';
const sk = require ('./privateKey.json');
var fcm = new FCM(serverKey); 

function sendNotification(params, callback) {

    let message = {
       to: params.deviceToken, //it is a device based token
       collapse_key: 'green',
       priority: "high",
       show_in_foreground: true,
       content_available: true,
        notification: {
            title: params.title, 
            body: params.body, 
            //big_text: "Test Message", //content of the notification
            sound: "default",
            icon: baseUrl+'img/logo.png' , //default notification icon
            badge: 1, 
        },
        data: { title: params.title, body: params.body } //payload you want to send with your notification
    };

    fcm.send(message, (err, result) => {
        /* LOGICS IF WANT TO SAVE IN DB */
        if (err) {
            console.log('Error while sending notification: ', err)  
            if (callback) {
                callback({ status: 500, message: 'Error while sending notification' });
            }
        } else {
            console.log('Notification successful: ', result);
            if (callback) {
                callback({ status: 1, message: 'Notification successful' });
            }
        }
    })

}

module.exports = {
    sendNotification: sendNotification
} 