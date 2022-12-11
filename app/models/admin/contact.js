var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var User = require('../../models/home');


var contactSchema = mongoose.Schema({	
		name: {type: String}, 
	    mail: {type: String, set: toLower},
		mobile: Number,
		user: {
			type: Schema.Types.ObjectId, ref: 'users'
		},
		message:String,
		status: String,
		created_date: Date,
		updated_date: Date
});

// For conver string to lower
function toLower (v) {
  return v.toLowerCase();
} 


module.exports = mongoose.model('contacts', contactSchema);