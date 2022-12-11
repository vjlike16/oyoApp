var mongoose = require('mongoose');
var settingSchema = mongoose.Schema({
	key_name: String,
	value: String,
	status: { type: String, default: 'active' },
	created_date: Date,
	updated_date: Date
});
module.exports = mongoose.model('setting', settingSchema);