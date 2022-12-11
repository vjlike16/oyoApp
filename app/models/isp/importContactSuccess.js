var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { baseUrl } = require('../../../config/constants');

var static_contentSchema = mongoose.Schema({
    
    name: { type: String },
    mail: { type: String, set: toLower },
    mobile: Number,
    address: String,
    notes: String,
    businessPhones:String,
    provider: String,
    ispId: {
        type: Schema.Types.ObjectId
    },
    ispEmail: String,
    ispName: String,
    ispProfile: String,
    coverPhotos: { type: String, default: baseUrl+"uploads/profile/avatar.png" },
});

function toLower(v) {
	return v.toLowerCase();
}
module.exports = mongoose.model('importContactSuccess', static_contentSchema);