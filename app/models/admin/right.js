var mongoose = require('mongoose');
var rightSchema = mongoose.Schema({	
		name: String,
		roles: Array,
		status: String,
		created_date: Date,
		updated_date: Date
});
module.exports = mongoose.model('rights', rightSchema);