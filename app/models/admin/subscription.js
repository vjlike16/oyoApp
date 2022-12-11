var mongoose = require('mongoose');

var subscriptionSchema = mongoose.Schema({	
		free: Array,
		bronze: Array,
		silver: Array,
		gold: Array,
		package: String,
		status: String,
		created_date: Date,
		updated_date: Date
});
module.exports = mongoose.model('subscriptions', subscriptionSchema);