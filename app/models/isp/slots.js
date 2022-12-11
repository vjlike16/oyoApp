const mongoose = require("mongoose");
const slotsSchema = new mongoose.Schema(
    {
        "ispId": {
            "type": mongoose.Schema.Types.ObjectId,
            "trim": true,
            "ref": 'User',
            "default": null
        },
        "cusId": {
            "type": mongoose.Schema.Types.ObjectId,
            "trim": true,
            "ref": 'User',
            "default": null
        },
        "isRecurring": {
            "type": "boolean",
            "default": true
        },
        "day": {
            "type": "string",
            "default": null
        },
        "date": {
            "type": "string",
            "default": null
        },
        "dateInIso": {
            "type": "Date",
            "default": "1947-12-12"
        },
        "isBreak": {
            "type": "boolean",
            "default": false
        },
        "isAvailable": {
            "type": "boolean",
            "default": true
        },
        "startTime": {
            "type": "string",
            "default": null
        },
        "endTime": {
            "type": "string",
            "default": null
        }
    }
);

// slotsSchema.plugin(findOrCreate)
const Slots = mongoose.model("slots", slotsSchema);

module.exports = Slots;
