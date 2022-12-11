var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var static_contentSchema = mongoose.Schema({
    firstName:String,
    lastName:String,
    test001: {
		type: Schema.Types.ObjectId, ref: 'test2'
	},
});
module.exports = mongoose.model('test', static_contentSchema);