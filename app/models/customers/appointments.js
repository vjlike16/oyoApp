var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var static_contentSchema = mongoose.Schema({
    name: { type: String },
    mail: { type: String, set: toLower },
    profile: String,
    phone: String,
    title:String,
    start_date:String,
    start_time:String,
    utc_start: Date,
    utc_end: Date,
    utc_date:String,
    end_date:String,
    end_time:String,
    amount:Number,
    tip:Number,
    icon: String,
    service_id: {
		type: Schema.Types.ObjectId, ref: 'service'
	},
    customer: {
		type: Schema.Types.ObjectId, ref: 'users'
	},
	service_proviver: {
		type: Schema.Types.ObjectId, ref: 'users'
	},
    serviceId: {
		type: Schema.Types.ObjectId, ref: 'service'
	},
    ispAccId: String,
    full_payment: Boolean,
    remaining_payment: String,
    charge:String,
    status:String,
    cancel_reason:String,
	createdTime: String,
	cancellationTime: String,
	cancellation: Boolean,
    finalTimeZone: String,
    ispCancel: Boolean,
    event_link:String,
    created_date: Date, //Signed Up On
	updated_date: Date,
    rated_date: Date,
	active_hash: String,
	rate: Number,
	review: String,
    ispProfile: String,
    ispEmail: String,
    ispPhone: String,
    ispName: String,
    ispAppointment: Boolean,
    outlookEvent: Boolean,
    outlookEventId: String,
    googleEvent: Boolean,
    googleEventId: String,
    ispOutlookEvent: Boolean,
    ispOutlookEventId: String,
    ispOutlookToken: { 
        token_type:{ type: String },
        scope:{ type: String },
        expires_in:{ type: Number },
        ext_expires_in:{ type: Number },
        access_token:{ type: String },
        refresh_token:{ type: String },
        id_token:{ type: String },
        expires_at:{ type: Date },
    },
    ispGoogleEventId: String,
    ispGoogleToken: { 
        access_token:{ type: String },
        refresh_token:{ type: String },
        scope:{ type: String },
        token_type:{ type: String },
        expiry_date:{ type: Number }
    },
    ispGoogleEvent: Boolean,
    coupon_code: String,
    coupon_based_on: String,
    coupon_type: String,
    discount: String,
    reminderSend:Boolean,
    emailSend:Boolean,
    walk_in:{type: Boolean, default:false},
    is_seen:{type: Number, default: 0}
});

function toLower(v) {
	return v.toLowerCase();
}
module.exports = mongoose.model('appointment', static_contentSchema);