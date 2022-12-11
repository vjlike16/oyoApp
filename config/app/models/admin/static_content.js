var mongoose = require('mongoose');
var static_contentSchema = mongoose.Schema({	
		name: String,
		pagecontent:String,
		status: String,
		created_date: Date,
		updated_date: Date
});
module.exports = mongoose.model('static_content', static_contentSchema);