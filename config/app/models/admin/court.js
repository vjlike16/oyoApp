var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var State = require('../../models/admin/state');


var courtSchema = mongoose.Schema({	
		name: {type: String}, //{type: String, set: toLower},
		district: {type: String},
		tehsil: {type: String},
		state: {
			type: Schema.Types.ObjectId, ref: 'states'
		},
		status: String,
		created_date: Date,
		updated_date: Date
});

// For conver string to lower
function toLower (v) {
  return v.toLowerCase();
} 


module.exports = mongoose.model('courts', courtSchema);