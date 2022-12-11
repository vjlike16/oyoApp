var mongoose = require('mongoose');

var stateSchema = mongoose.Schema({	
		status: String,
		stateid: String,
		state: String
});
module.exports = mongoose.model('states', stateSchema);