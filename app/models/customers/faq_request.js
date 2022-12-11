var mongoose = require('mongoose');
var static_contentSchema = mongoose.Schema({
	email: String,
	user_type: String,
    subject:String,
    description:String,
	status: { type: String, default: 'inactive' },
	created_date: Date, 
});
module.exports = mongoose.model('faq_request', static_contentSchema);