var mongoose = require('mongoose');
var static_contentSchema = mongoose.Schema({
	coupon_based_on: String,
	code_name: String,
	content_for:String,
	discount: Number,
	max_allowded_customers: Number,
    type: { type: String, default: 'One time' },
	used_so_far:{ type: Number, default: 0 },
	status: { type: String, default: 'inactive' },
	expiring_on:Date,
	created_date: Date,
	updated_date: Date
});
module.exports = mongoose.model('manage_discount_coupons', static_contentSchema);