var mongoose = require('mongoose');
var static_contentSchema = mongoose.Schema({
	name: String,
	icon: String,
	typ: String,
	count: { type: Number, default: 1 },
	status: { type: String, default: 'inactive' },
	created_date: Date,
	updated_date: Date
});
module.exports = mongoose.model('service_category', static_contentSchema);