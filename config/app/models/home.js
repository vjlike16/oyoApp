var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;


var userSchema = new Schema({
	name: { type: String }, //{type: String, set: toLower},
	mail: { type: String, set: toLower },
	password: String,
	profileImage: { type: String, default: 'avatar.png' },
	mobile: Number,
	gender: String,

	address: String,
	city: String,
	state: String,
	country: String,
	zipcode: Number,
	location: {
		type: { type: String },
		coordinates: { type: Array },
	},

	business_name: String,
	business_category: String,


	subscription: String, // Payment Plan
	plan_end_date: { type: Date }, //Subscription End Date
	last_paid_amount: { type: Number, default: 0 },


	status: String,
	verify: Number,

	created_date: Date, //Signed Up On
	updated_date: Date,
	active_hash: String,

	login_time: Date, // Last login Time
	logout_time: Date,
	device_id: String,
	is_login: Number,

	role_id: { type: Number, default: 2 } // 1: admin, 2: customer, 3: Business Owner


});


//generating a hash
userSchema.methods.generateHash = function (password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//checking if password is valid
userSchema.methods.validPassword = function (password) {
	return bcrypt.compareSync(password, this.password);
};

// For conver string to lower
function toLower(v) {
	return v.toLowerCase();
}


module.exports = mongoose.model('users', userSchema);

