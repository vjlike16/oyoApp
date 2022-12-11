var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var static_contentSchema = mongoose.Schema({
	service_proviver: {
		type: Schema.Types.ObjectId, ref: 'users'
	},
    plan_end_date: { type: Date },
	plan_name: String,
    plan_amount: Number,
	stripeCustomerId:String,
	stripeCardId:String,
});
module.exports = mongoose.model('renewPlan', static_contentSchema);