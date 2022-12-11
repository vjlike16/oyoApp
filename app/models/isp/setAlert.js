const mongoose = require("mongoose");
const setAlertSchema = new mongoose.Schema(
    {
        "ispId": {
            "type": mongoose.Schema.Types.ObjectId,
            "trim": true,
            "ref": 'User',
            "default": null
        },
        "email": {
            "type": "boolean",
            "default": false
        },
        "notifications": {
            "type": "boolean",
            "default": false
        },
        "hours": {
            "type": "number",
            "default": "1"
        },
        "min": {
            "type": "number",
            "default": "0"
        }
    }
);

const setAlert = mongoose.model("setAlert", setAlertSchema);

module.exports = setAlert;
