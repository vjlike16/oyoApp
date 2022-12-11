var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { baseUrl } = require('../../../config/constants');

var static_contentSchema = mongoose.Schema({
    
    ispId: {
      type: Schema.Types.ObjectId, ref: 'users'
    },
    ispName: String,
    ispMail:{ type: String, set: toLower },
    IspProfileImage: String,
    cusId: {
      type: Schema.Types.ObjectId, ref: 'users'
    },
    cusName: String,
    cusMail: { type: String, set: toLower },
    cusProfile: String,
    cusBirthday:Date,
    cusAddress: String,
    cusMobile: String,
    createdDate: Date,
    customerNotes: String,
    customerNotesUpdate: Date,
    ispNotes: String,
    ispNotesUpdate: Date,
});

function toLower(v) {
	return v.toLowerCase();
}
module.exports = mongoose.model('customerNotes', static_contentSchema);