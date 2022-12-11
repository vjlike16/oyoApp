var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	name: { type: String }, //{type: String, set: toLower},
	last_name: { type: String },
	mail: { type: String, set: toLower },
	password: String,
	profileImage: { type: String, default: 'avatar.png' },
	mobile: Number,
	otp: String,
	gender: { type: String, default: ' ' },
	birthdate: Date,
	website: { type: String },
	heard_about: { type: String },
	experience: { type: Number },
	tokens: [{ token: { type: String } }],
	social_provider: { type: String, default: 'Other' },
	address: String,
	city: String,
	state: String,
	country: String,
	zipcode: String,
	location: {
		type: { type: String },
		coordinates: { type: Array, default: [{ lat: ' ', lng: ' ' }] },
	},
	bio: { type: String },
	business_name: String,
	business_category_name: String,
	business_category: {
		type: Schema.Types.ObjectId,
		ref: 'service_category',
	},

	subscription: {
		type: Schema.Types.ObjectId,
		ref: 'manage_subscription_plan',
	},
	subscriptionValidity: Boolean,
	plan_end_date: { type: Date }, //Subscription End Date
	last_paid_amount: { type: Number, default: 0 },
	last_transaction: Date,
	plan_name: String,
	auto_renew: String,
	free_trial: String,
	makePagePublic: Boolean,
	cancelSubscription: Boolean,
	coupon_code: String,
	coupon_based_on: String,
	coupon_type: String,
	discount: String,

	status: String,
	verify: Number,
	profileCompleted: Boolean,

	is_customer_to_isp: Boolean, // is customer isp //
	customer_to_isp: Date,
	stripeCustomerId: String,
	bankDetails: {
		bankAccountId: String,
		account_number: String,
		account_holder_name: String,
		routing_number: String,
	},

	created_date: Date, //Signed Up On
	updated_date: Date,
	active_hash: String,
	active_code: String,
	inviteCode: String,
	userType: String,

	welcomeMsg: { type: Boolean, default: false },
	login_time: Date, // Last login Time
	logout_time: Date,
	device_id: String,
	is_login: Number,
	avgRating: Number,
	ConnectedISPs: [
		{
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
			request: {
				type: String,
				default: 'pending',
				comments: 'pending/accept/deny/block/unblock',
			},
		},
	],

	role_id: { type: Number, default: 2 }, // 1: admin, 2: customer, 3: Business Owner
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
