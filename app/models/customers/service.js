var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var static_contentSchema = mongoose.Schema({
	name: String,
	icon: String,
	service_proviver_name: String,
	service_proviver: {
		type: Schema.Types.ObjectId, ref: 'users'
	},
    business_category: {
		type: Schema.Types.ObjectId, ref: 'service_category'
	},
	hours: String,
	minutes: String,
	advance: String,
	cancellation: String,
	price: Number,
	description: String,
	allowded_customers: String,
	status: { type: String, default: 'inactive' },
	created_date: Date,
	updated_date: Date
});
module.exports = mongoose.model('service', static_contentSchema);