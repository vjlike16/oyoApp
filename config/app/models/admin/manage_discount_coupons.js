var mongoose = require('mongoose');
var static_contentSchema = mongoose.Schema({
	code_name: String,
	max_allowed: Number,
    type: String,
	expiring_on:Date,
	used_so_far:String,
	status: { type: String, default: 'inactive' },
	created_date: Date,
	updated_date: Date
});
module.exports = mongoose.model('manage_discount_coupons', static_contentSchema);