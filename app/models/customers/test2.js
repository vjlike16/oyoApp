var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var static_contentSchema = mongoose.Schema({
    firstName:String,
    lastName:String,
   
});
module.exports = mongoose.model('test2', static_contentSchema);