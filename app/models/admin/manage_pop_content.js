var mongoose = require('mongoose');
var managepopcontent = mongoose.Schema({
	content_for:String,
	name:String,
	content_title: String,
	content_image: String,
	status: { type: String, default: 'inactive' },
	content:String,
	expiring_on: {
		type: Date
	},
	userClosedPopup: [
		{
			// userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			// },
		}
	],
});
module.exports = mongoose.model('Managepopup', managepopcontent);