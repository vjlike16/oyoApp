var mongoose = require('mongoose');
var managepopcontent = mongoose.Schema({
	name:String,
	content_title: String,
	content_image: String,
	status: { type: String, default: 'inactive' },
	content:String,
	expiring_on: {
		type: Date,
		// `Date.now()` returns the current unix timestamp as a number
		default: Date.now
	  }

});
module.exports = mongoose.model('Managepopup', managepopcontent);