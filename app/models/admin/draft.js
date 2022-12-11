var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var User = require('../../models/home');
var State = require('../../models/admin/state');
var Court = require('../../models/admin/court');
var Format = require('../../models/admin/format');


var draftSchema = mongoose.Schema({	
		name: String,
		tehsil: String,
		district: String,
		user: {
			type: Schema.Types.ObjectId, ref: 'users'
		},
		state: {
			type: Schema.Types.ObjectId, ref: 'states'
		},
		court: {
			type: Schema.Types.ObjectId, ref: 'courts'
		},
		format: {
			type: Schema.Types.ObjectId, ref: 'formats' 
		},
		steno1_approver: Array,  // role_id: 4 
		steno2_approver: Array,  // role_id: 5
		word_file: {type: String, default: 'Null'},	 
		reason: String,
		notes: String,
		//reject: {type: Number, default: 0},
		//reject_reason: String,
		seen: {type: Number, default: 0},
		//formatData: String,
		status: String,
		draft_status: String, //pending/in process/completed/rejected
		time_used: {type: Number, default: 0},
		last_save_position: {type: Number, default: 0},
		draft_status_mobile: {type: Number, default: 0},  // 0: Incomplete, 1 :complete
		created_date: Date,
		updated_date: Date
});
module.exports = mongoose.model('drafts', draftSchema);