var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var usersUsedTimeLogsSchema = mongoose.Schema({	
		users_id: {
				type: Schema.Types.ObjectId, ref: 'users'
		},
		draft_id: {
				type: Schema.Types.ObjectId, ref: 'drafts'
		},
		time_used: {type: Number, default: 0},
		date: Date,
		
});
module.exports = mongoose.model('users_used_time_logs', usersUsedTimeLogsSchema);