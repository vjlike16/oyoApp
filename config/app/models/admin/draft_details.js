var mongoose = require('mongoose');
var draftDetailsSchema = mongoose.Schema({	
		draft_id: Object,
		user_id: Object,
		round: Number,
		type: String, 
		name: String,
		value: String,
		text: String,
		images: Array,
		audios: Array,
		whole_content: String,
		created_date: Date,
		updated_date: Date
});
module.exports = mongoose.model('draft_details', draftDetailsSchema);