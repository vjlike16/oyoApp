var mongoose = require('mongoose');
var static_contentSchema = mongoose.Schema({
    firstName:String,
    lastName:String,
	email: String,
	contactNumber: String,
    message:String,
	status: { type: String, default: 'inactive' },
	created_date: Date, 
});
module.exports = mongoose.model('support', static_contentSchema);