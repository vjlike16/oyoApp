var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var subscriptionsSchema = new Schema({
    ispId: {
        type: Schema.Types.ObjectId, ref: 'users'
    },
	name: { type: String },
	mail: { type: String, set: toLower },
	plan_name: { type: String, default: 'Free Trial' },
	plan_end_date: { type: Date }, //Subscription End Date
	last_paid_amount: { type: Number, default: 0 },
	coupon_code: String,
	created_date: Date,
});

// For conver string to lower
function toLower(v) {
	return v.toLowerCase();
}

module.exports = mongoose.model('subscriptionsData', subscriptionsSchema);