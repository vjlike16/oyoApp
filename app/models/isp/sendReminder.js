const mongoose = require("mongoose");
var Schema = mongoose.Schema;
var dateFormat = require('dateformat');
var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
const sendReminderSchema = new mongoose.Schema(
    {
        ispId: {
            type: Schema.Types.ObjectId, ref: 'users'
        },
        cusId: {
            type: Schema.Types.ObjectId, ref: 'users'
        },
        notificationType: String,
        status: { type: String, default: 'active' }, 
        ispAccId: String,
        full_payment: Boolean,
        remaining_payment: String,
        amount:Number,
        tip:Number,
        start_date:String,
        start_time:String,
        utc_date:String,
        end_date:String,
        utc_start: Date,
        utc_end: Date,
        title:String,
        name: String,
        mail: String,
        profile: String,
        phone: String,
        ispName: String,
        ispEmail: String,
        ispProfile: String,
        ispPhone: String,
        ispServiceName: String,
        message: String,
        created_date: Date,
        content_for:String,
        content_title: String,
        content_image: String,
        content:String,
        expiring_on: Date,
        is_seen:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        createdDate:{
            type: Date,
            default: day,
        },
    }
);

const sendReminder = mongoose.model("sendReminder", sendReminderSchema);

module.exports = sendReminder;
