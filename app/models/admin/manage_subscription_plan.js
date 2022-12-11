var mongoose = require('mongoose');
var static_contentSchema = mongoose.Schema({
	plan_name: String,
	trial_duration: Number,
    annual_price: Number,
	monthly_price:Number,
	status: { type: String, default: 'inactive' },
	created_date: Date,
	updated_date: Date
});
module.exports = mongoose.model('manage_subscription_plan', static_contentSchema);