var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var constants = require('../config/constants');

var path = require('path');
var EmailTemplate = require('email-templates').EmailTemplate;
var templatesDir = path.resolve(__dirname, '..', 'templates');

/* var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    service: 'gmail',
    auth: {
       user: 'ots.nishant@gmail.com',
	   pass: 'nishant@ots'
        
    }
}); */

var transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, 
    service: 'office365.com',
    auth: {
       user: 'info@otssolutions.com',
       pass: '@Ts#795P5'
        
    }
});

exports.send_email = function(datacontent) {
	   var template = new EmailTemplate(path.join(templatesDir,''+datacontent.templatefoldername+''));
	   template.render(datacontent, function (err, results) {
					  if (err) {
                          //return console.error(err);
						   console.log('Error=================');
                      }
                      var mailOptions = {
                           from: ' '+constants.project_name+' <info@otssolutions.com>', 
                           to: ' '+datacontent.email+'', 
                           subject: ' '+datacontent.subject+'', 
						   html: results.html
                      };
          
                      transporter.sendMail(mailOptions, function(error, info){
                           if(error){
                              console.log('Error================='+error);
                              console.log('Error=================');
                           }
                              //console.log('Message sent:==================== ' + info.response);
                              console.log('Message sent:==================== ');
                      });
        });             
};


