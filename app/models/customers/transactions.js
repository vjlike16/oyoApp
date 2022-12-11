var mongoose = require('mongoose');
var static_contentSchema = mongoose.Schema({
    service:String,
    amount:String,
    date_time:Date,
    status:String
});
module.exports = mongoose.model('transaction', static_contentSchema);