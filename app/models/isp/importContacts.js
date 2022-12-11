var mongoose = require('mongoose');
const { baseUrl } = require('../../../config/constants');

var static_contentSchema = mongoose.Schema({
    
    name: { type: String },
    mail: { type: String, set: toLower },
    businessPhones:String,
    provider: String,
    ispEmail: String,
    ispName: String,
    coverPhotos: { type: String, default: baseUrl+"uploads/profile/avatar.png" },
});

function toLower(v) {
	return v.toLowerCase();
}
module.exports = mongoose.model('importContact', static_contentSchema);