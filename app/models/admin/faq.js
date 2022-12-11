var mongoose = require('mongoose');
var static_contentSchema = mongoose.Schema({
	question: String,
	answer: String,
	status: { type: String, default: 'inactive' },
	created_date: Date, 
	updated_date: Date
});
module.exports = mongoose.model('faq', static_contentSchema);