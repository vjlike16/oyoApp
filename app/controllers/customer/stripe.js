const User = require('../../models/home');
const { baseUrl } = require('../../../config/constants');
const SECRET_KEY = "sk_test_51JVSy4CzX7kFjfHZ0WqNOWnQPs4K3Cwv0YyK75zhtqvNYPVL07zwSbWGA24Abgg5sxa8SMcLUBGO0Ip8k8SggXbU00q0DhCFD7";
const stripe = require('stripe')(SECRET_KEY);

var account_id = "";

exports.connect =  async function(req , res){
     var userDetails = await User.findOne({ "_id": req.app.locals.userCustomerSession._id });
     userDetails = JSON.parse(JSON.stringify(userDetails));
     console.log("userDetails.userCustomerSession.bankDetails--");
     console.log("userDetails.userCustomerSession.bankDetails--", userDetails.mail);
      if(!userDetails.bankDetails){  
          const account = await stripe.accounts.create({
              //country: 'US',
              type: 'standard',
			  email: userDetails.mail
              // capabilities: {
                // card_payments: {
                  // requested: true,
                // },
                // transfers: {
                  // requested: true,
                // },
              // },
            });
          
          account_id = account;
          console.log("account----->>" , account_id.id);

          const link = await stripe.accountLinks
            .create({
              type: "account_onboarding",
              account: account_id.id,
              refresh_url: `${baseUrl}stripe`,
              return_url: `${baseUrl}main`,
            });
        // console.log("link data----");
        //     console.log("link data---->" , link);
        var ob = {
          bankDetails: {
            bankAccountId: account_id.id,
            //account_number: req.body.account_number,
            //account_holder_name: resu.account_holder_name,
            //routing_number: resu.routing_number
          }
        }

      User.update({ "_id": req.app.locals.userCustomerSession._id }, ob).exec(function (err, result) {
            if (err) {
              throw err;
            } else {
              res.redirect(link.url);
            }
        })
      }else{
          console.log("isp in else part..")
          const link = await stripe.accountLinks
            .create({
              type: "account_onboarding",
              account: userDetails.bankDetails.bankAccountId,
              refresh_url: `${baseUrl}stripe`,
              return_url: `${baseUrl}main`,
            });
            res.redirect(link.url);
      }

}
exports.checkStripeConnect = async function(req , res){
  console.log("backAccountId  : :" , req.app.locals.userCustomerSession.bankDetails.bankAccountId);
  const checkConnect = await stripe.accounts.retrieve(
    req.app.locals.userCustomerSession.bankDetails.bankAccountId
  ).then(result=>{
    console.log("result :::::: " , result.details_submitted);
  })
}
exports.success = function(req , res){
  var data = {};
  data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

  res.render('../customer/stripe/stripe-success.ejs' , data);
}
exports.error = function(req , res){
  var data = {};
  data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

  res.render('../customer/stripe/stripe-error.ejs' , data);
}