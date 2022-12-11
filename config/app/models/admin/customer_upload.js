var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var User = require('../../models/home');
var customer_uploadSchema = mongoose.Schema({	
        name: String,
        description: String,
        uploadDocs: Array,
		user: {
			type: Schema.Types.ObjectId, ref: 'users',
		},
		status: String,
		created_date: Date,
		updated_date: Date
});
module.exports = mongoose.model('customer_uploads', customer_uploadSchema);