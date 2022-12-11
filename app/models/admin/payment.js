var mongoose = require('mongoose');
var static_contentSchema = mongoose.Schema({
	name: String,
    subscription: {
		type: mongoose.Schema.Types.ObjectId, ref: 'manage_subscription_plan'
	},

    discount_code: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "manage_discount_coupons"
     },
     status: { type: String, default: 'pending' },      //payment_cancel/pending/failed/confirm
	last_paid_amount: Number, 
	created_date: Date
});
module.exports = mongoose.model('payment', static_contentSchema);