var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var usersSubscriptionSchema = mongoose.Schema({	
		users_id: {
				type: Schema.Types.ObjectId, ref: 'users'
		},
		plan: String,
		amount: Number,
		start: String,
		end: String,
		status: String,
		created_date: Date,
		updated_date: Date
});
module.exports = mongoose.model('users_subscription', usersSubscriptionSchema);