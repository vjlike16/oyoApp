const mongoose = require("mongoose");
var Schema = mongoose.Schema;
const paymentReminderSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: Schema.Types.ObjectId, ref: 'appointment'
        },
        cusMail: String,
        name: String,
        profile: String,
        ispId: {
            type: Schema.Types.ObjectId, ref: 'users'
        },
        ispName: String,
        title: String,
        start_date: String,
        utc_start: Date,
        utc_end: Date,
        full_payment: Boolean,
        amount: String,
        remaining_payment: String,
        stripeError: String,
        type: String,
        is_seen:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
    }
);

const paymentReminder = mongoose.model("paymentReminder", paymentReminderSchema);

module.exports = paymentReminder;
