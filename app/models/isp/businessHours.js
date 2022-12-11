const mongoose = require("mongoose");
const businessHoursSchema = new mongoose.Schema(
    {
        "ispId": {
            "type": mongoose.Schema.Types.ObjectId,
            "trim": true,
            "ref": 'User',
        },
        "mondayStartTime": {
            "type": "string",
            "default": "Closed"
        },
        "mondayEndTime": {
            "type": "string",
            "default": "Closed"
        },
        "tuesdayStartTime": {
            "type": "string",
            "default": "Closed"
        },
        "tuesdayEndTime": {
            "type": "string",
            "default": "Closed"
        },
        "wednesdayStartTime": {
            "type": "string",
            "default": "Closed"
        },
        "wednesdayEndTime": {
            "type": "string",
            "default": "Closed"
        },
        "thrusdayStartTime": {
            "type": "string",
            "default": "Closed"
        },
        "thrusdayEndTime": {
            "type": "string",
            "default": "Closed"
        },
        "fridayStartTime": {
            "type": "string",
            "default": "Closed"
        },
        "fridayEndTime": {
            "type": "string",
            "default": "Closed"
        },
        "saturdayStartTime": {
            "type": "string",
            "default": "Closed"
        },
        "saturdayEndTime": {
            "type": "string",
            "default": "Closed"
        },
        "sundayStartTime": {
            "type": "string",
            "default": "Closed"
        },
        "sundayEndTime": {
            "type": "string",
            "default": "Closed"
        },
        "breakStartTime": {
            "type": "string",
            "default": "None"
        },
        "breakEndTime": {
            "type": "string",
            "default": "None"
        },
        "breakStartTime1": {
            "type": "string",
        },
        "breakEndTime1": {
            "type": "string",
        },
        "breakStartTime2": {
            "type": "string",
        },
        "breakEndTime2": {
            "type": "string",
        },
        "offDate": {
            "type": "string",
            "default": "None"
        },
        "offDate1": {
            "type": "string",
        },
        "days": [
            {
                "day": "string",
                "startTime": "string",
                "endTime": "string",
                "isClosed": "Boolean",
            }
        ],
        "breaks": [
            {
                "startTime": "string",
                "endTime": "string",
            }
        ],
        "timeZone":{
            "type": "string",
            "default": "GMT"
        },
        "offDates": [],
        "offDate2": {
            "type": "string",
        },
        "offDate3": {
            "type": "string",
        },
    }
);

// slotsSchema.plugin(findOrCreate)
const businessHours = mongoose.model("businessHours", businessHoursSchema);

module.exports = businessHours;
