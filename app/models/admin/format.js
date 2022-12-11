var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var formatSchema = mongoose.Schema({	
		name: String,
		description: String,
		state: {
			type: Schema.Types.ObjectId, ref: 'states'
		},
		court: {
			type: Schema.Types.ObjectId, ref: 'courts'
		},
		format: String,
		petitionRespondentMasterKeys: Object,
		commonMasterKeys: Object,
		favourite: Array,
		docs: Array,
		status: String,
		created_date: Date,
		updated_date: Date
});
module.exports = mongoose.model('formats', formatSchema);