var mongoose = require('mongoose');
var static_contentSchema = mongoose.Schema({
    name:String,
    cardNumber:String,
    cvv:Number,
    expires:String
});
module.exports = mongoose.model('userCard', static_contentSchema);