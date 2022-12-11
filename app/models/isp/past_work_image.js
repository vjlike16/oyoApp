var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var static_contentSchema = mongoose.Schema({
    
    userId: {
        "type": mongoose.Schema.Types.ObjectId,
        "ref": 'User',
    },
    image: { type: String  },
    
});

module.exports = mongoose.model('past_work_image', static_contentSchema);