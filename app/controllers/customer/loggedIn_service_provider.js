var ServiceCategories = require('../../models/admin/service_category');
var Customer = require('../../models/home');
var Async = require('async');
const { select } = require('underscore');
var mongoose = require('mongoose');
const { baseUrl } = require('../../../config/constants');
var Connected_ISPs = [];
var newArray = [];



exports.listing = async function (req, res) {
	Connected_ISPs = [];
	newArray = [];
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	var tasks = [
		function (callback) {
			Customer.findById({ "_id": req.app.locals.userCustomerSession._id }).
				exec(function (err, result) {
					if (err) {
						throw err;
					} else {
						var arr = result.ConnectedISPs;
						arr.forEach(ele => {
							if (ele.userId !== undefined) {
								let str = ele.userId
								Connected_ISPs.push(str.toString());
							}
						})
						callback();
					}
				})
		},
		function (callback) {
			ServiceCategories.find({"status":"active"})
				.sort({ 'created_date': -1 })
				.exec(function (err, service_categories) {
					if (err) {
						data.service_categories = "";
						callback();
					} else {
						data.service_categories = service_categories;
						//console.log("service_categories  :"+JSON.stringify(service_categories));
						callback();
					}
				});
		},
		// function (callback) {
		// 	Customer.aggregate(
		// 		[
		// 			// {
		// 			// 	$match:
		// 			// 	{

		// 			// 		_id: { $in: Connected_ISPs }
		// 			// 	}
		// 			// },

		// 			{
		// 				"$lookup": {
		// 					from: 'service_categories',
		// 					localField: 'business_category',
		// 					foreignField: '_id',
		// 					as: 'services',
		// 				}

		// 			},
		// 			{
		// 				"$unwind": "$services"
		// 			},
		// 			{
		// 				"$match":
		// 				{
		// 					"$and": [
		// 						{ "role_id": 3 },
		// 						{ "verify": 1 },
		// 						{ "status": "active" }
		// 					]
		// 				}
		// 			},
		// 		]
		// 	)
		// 		//.sort()
		// 		.exec(function (err, result) {
		// 			if (err) {
		// 				data.result = "";
		// 				callback()
		// 			} else {
		// 				var connected = [];
		// 				Connected_ISPs.forEach(ele => {
		// 					result.forEach(element => {
		// 						var a = element._id;
		// 						var b = ele
		// 						if (a.toString() == b.toString()) {
		// 							 console.log("connected")
		// 							// console.log(element.name)
		// 							newArray.push({
		// 								"_id": element._id,
		// 								"business_category": element.services.name,
		// 								"business_name": element.business_name,
		// 								"address": element.address,
		// 								"name": element.name,
		// 								"connect": "yes",
		// 								"profileImage": element.profileImage,
		// 							})
		// 						}

		// 					})
		// 				})

		// 				callback();
		// 			}
		// 		});
		// },
		function (callback) {
			Customer.aggregate(
				[
					{
						"$lookup": {
							from: 'service_categories',
							localField: 'business_category',
							foreignField: '_id',
							as: 'services',
						}

					},
					{
						"$unwind": "$services"
					},
					{
						"$match":
						{
							"$and": [
								{ "role_id": 3 },
								{ "verify": 1 },
								{ "status": "active" }
							]
						}
					},
				]
			)
				.sort({ 'created_date': -1 })

				.exec(function (err, result) {
					if (err) {
						data.result = "";
						callback()
					} else {
						newArray = [];
						if (Connected_ISPs.length == 0) {
							result.forEach(element => {
								var lat = "" , lng = "";
									if(element.location.coordinates.length > 0){
										lat = element.location.coordinates[0].lat;
										lng = element.location.coordinates[0].lng;
									}else{
										lat = "no";
										lng = "no";
									}
								newArray.push({
									"_id": element._id,
									"business_category": element.services.name,
									"business_name": element.business_name,
									"address": element.address,
									"name": element.name,
									"connect": "no",
									"profileImage": element.profileImage,
									"lat": lat,
									"lng": lng,
									"latlng": [{"lat":lat,"lng":lng}]
								})
							})
							callback();
						}
						else {
							result.forEach(element => {
								console.log("coordinates -----",element.location.coordinates);
								var lat = "", lng = "";
									if(element.location.coordinates.length > 0){
										lat = element.location.coordinates[0].lat;
										lng = element.location.coordinates[0].lng;
									}else{
										lat = "no";
										lng = "no";
									}
								//	Connected_ISPs.includes(element._id);
								if (Connected_ISPs.indexOf(element._id.toString()) > -1) {
									//if (Connected_ISPs.includes(element._id)) {
									// console.log("yesss")
									newArray.push({
										"_id": element._id,
										"business_category": element.services.name,
										"business_name": element.business_name,
										"address": element.address,
										"name": element.name,
										"connect": "yes",
										"profileImage": element.profileImage,
										"lat": lat,
										"lng": lng,
										"latlng": [{"lat":lat,"lng":lng}]
									})
								}
								else {
									// console.log("nooo");
									newArray.push({
										"_id": element._id,
										"business_category": element.services.name,
										"business_name": element.business_name,
										"address": element.address,
										"name": element.name,
										"connect": "no",
										"profileImage": element.profileImage,
										"lat": lat,
										"lng": lng,
										"latlng": [{"lat":lat,"lng":lng}]
									})
								}
							})
							callback();
						}
					}
				});
		},

	]
	Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
		newArray.sort();//sort({ 'created_date': -1 });
		// unique = newArray
		// 	.map(e => e['_id'])
		// 	.map((e, i, final) => final.indexOf(e) === i && i)
		// 	.filter(obj => newArray[obj])
		// 	.map(e => newArray[e]);
		newArray.sort((a, b) => a.name.localeCompare(b.name));
		console.log("	newArray.sort  :" , newArray);
		data.result = newArray;
		if (err) {
			res.render('customer/loggedIn-service-providers/connected-isp-list', data);
		} else {
			// console.log(newArray);
			res.render('customer/loggedIn-service-providers/connected-isp-list', data);
		}
	});

}
exports.serviceProvider = function (req, res) {
	var data = {}
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	var id = req.params.id;
	var isp = newArray;
	var a = isp.find(res => res._id == id);
	if (isp.length == 0) {
		data.result = "";
		res.render('customer/loggedIn-service-providers/connected-isp-detail', data);
	}
	else {
		data.result = a;
		res.render('customer/loggedIn-service-providers/connected-isp-detail', data);
	}
}
exports.google_map = function (req, res) {
	console.log("route   :" , newArray);
	var data = {}
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.msg = "";

	var tasks = [
		function (callback) {
			var statusByStatus = ['active', 'inactive'];
			Customer.find({
				role_id: '3', 'status': { $in: statusByStatus }
			})
				.populate('business_category', select['name', '_id'])
				.populate('subscription', 'plan_name')
				.exec(function (err, result) {
					if (err) {
						// data.result = "";
						callback();
					} else {
						// data.result = result;
						callback();
					}
				});
		},
		function (callback) {
			ServiceCategories.find({})
				.sort()
				.exec(function (err, service_categories) {
					if (err) {
						data.service_categories = "";
						callback();
					} else {
						data.service_categories = service_categories;
						//console.log("service_categories  :"+JSON.stringify(service_categories));
						callback();
					}
				});
		},

	];
	Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
		if (err) {
			data.service_categories = "";
			//data.result = "";
			res.render('customer/loggedIn-service-providers/connected-isp-map', data);
		} else {
			console.log("newArray  -----" , newArray);
			data.result = newArray;
			res.render('customer/loggedIn-service-providers/connected-isp-map', data);
		}
	});

}
exports.customSearch = async function (req, res) {
	newArray = [];

	data = {}
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.flash("session");
	var name_category = req.body.name_category;
	var address = req.body.location;

	console.log("name", name_category);
	var tasks = [
		function (callback) {
			Customer.aggregate(
				[
					{
						"$match": {
							"$and": [
								{ "role_id": 3 },
								{ "verify": 1 },
								{ "status": "active" }
							]
						}
					},
					{
						"$lookup": {
							from: 'service_categories',
							localField: 'business_category',
							foreignField: '_id',
							as: 'services',
						}

					},
					{
						"$unwind": "$services"
					},
					// {
					// 	$addFields: {
					// 		"service_name": '$services.name'
					// 	}
					// },
					// {
					{
						"$match":
						{
							"$and": [
								{
									"$or": [
										{ 'name': { $regex: name_category, $options: "i" } },
										{ 'services.name': { $regex: name_category, $options: "i" } }
									]
								}
							]
						}
					},
					{
						"$match":
						{
							"$and": [
								{
									"$or": [
										{ 'address': { $regex: address, $options: "i" } },
										{ 'zipcode': { $regex: address, $options: "i" } }
									]
								}
							]
						}
					},
				]
			)
				.sort({ 'created_date': -1 })
				.exec(function (err, result) {
					if (err) {
						data.result = "";
						callback()
					} else {
						// Connected_ISPs.forEach(ele => {
						//console.log("Connected_ISPs");
						console.log(typeof Connected_ISPs[0]);
						result.forEach(element => {
							// console.log('element._id');
							// console.log(typeof element._id);
							if (Connected_ISPs.indexOf(element._id.toString()) > -1) {
								newArray.push({
									"_id": element._id,
									"business_category": element.services.name,
									"business_name": element.business_name,
									"address": element.address,
									"name": element.name,
									"connect": "yes",
									"profileImage": element.profileImage,
								})
							}
							else {
								// console.log("nooo");
								newArray.push({
									"_id": element._id,
									"business_category": element.services.name,
									"business_name": element.business_name,
									"address": element.address,
									"name": element.name,
									"connect": "no",
									"profileImage": element.profileImage,
								})
							}
						})
						// console.log("newArray");
						// console.log(newArray);
						callback();
					}
				});
		},
		function (callback) {
			ServiceCategories.find({"status":"active"})
				.sort({ 'created_date': -1 })
				.exec(function (err, service_categories) {
					if (err) {
						data.service_categories = "";
						callback();
					} else {
						data.service_categories = service_categories;
						//console.log("service_categories  :"+JSON.stringify(service_categories));
						callback();
					}
				});
		},
	]
	Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
		data.result = newArray;
		if (err) {
			res.render('customer/loggedIn-service-providers/connected-isp-list', data);
		} else {
			// console.log(newArray);
			res.render('customer/loggedIn-service-providers/connected-isp-list', data);
		}
	});

}
exports.customSearchformap = async function (req, res) {
	newArray = [];

	data = {}
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.flash("session");
	var name_category = req.body.name_category;
	var address = req.body.location;

	console.log("name", name_category);
	var tasks = [
		function (callback) {
			Customer.aggregate(
				[
					{
						"$match": {
							"$and": [
								{ "role_id": 3 },
								{ "verify": 1 },
								{ "status": "active" }
							]
						}
					},
					{
						"$lookup": {
							from: 'service_categories',
							localField: 'business_category',
							foreignField: '_id',
							as: 'services',
						}

					},
					{
						"$unwind": "$services"
					},
					// {
					// 	$addFields: {
					// 		"service_name": '$services.name'
					// 	}
					// },
					// {
					{
						"$match":
						{
							"$and": [
								{
									"$or": [
										{ 'name': { $regex: name_category, $options: "i" } },
										{ 'services.name': { $regex: name_category, $options: "i" } }
									]
								}
							]
						}
					},
					{
						"$match":
						{
							"$and": [
								{
									"$or": [
										{ 'address': { $regex: address, $options: "i" } },
										{ 'zipcode': { $regex: address, $options: "i" } }
									]
								}
							]
						}
					},
				]
			)
				.sort({ 'created_date': -1 })
				.exec(function (err, result) {
					if (err) {
						data.result = "";
						callback()
					} else {
						// Connected_ISPs.forEach(ele => {
						//console.log("Connected_ISPs");
						console.log(typeof Connected_ISPs[0]);
						result.forEach(element => {
							// console.log('element._id');
							// console.log(typeof element._id);
							if (Connected_ISPs.indexOf(element._id.toString()) > -1) {
								newArray.push({
									"_id": element._id,
									"business_category": element.services.name,
									"business_name": element.business_name,
									"address": element.address,
									"name": element.name,
									"connect": "yes",
									"profileImage": element.profileImage,
								})
							}
							else {
								// console.log("nooo");
								newArray.push({
									"_id": element._id,
									"business_category": element.services.name,
									"business_name": element.business_name,
									"address": element.address,
									"name": element.name,
									"connect": "no",
									"profileImage": element.profileImage,
								})
							}
						})
						// console.log("newArray");
						// console.log(newArray);
						callback();
					}
				});
		},
		function (callback) {
			ServiceCategories.find({"status":"active"})
				.sort({ 'created_date': -1 })
				.exec(function (err, service_categories) {
					if (err) {
						data.service_categories = "";
						callback();
					} else {
						data.service_categories = service_categories;
						//console.log("service_categories  :"+JSON.stringify(service_categories));
						callback();
					}
				});
		},
	]
	Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
		data.result = newArray;
		if (err) {
			res.render('customer/loggedIn-service-providers/connected-isp-list', data);
		} else {
			// console.log(newArray);
			res.render('customer/loggedIn-service-providers/connected-isp-list', data);
		}
	});

}

exports.connect_with_isp = async function (req, res) {
	//console.log("connect_with_isp ::  Route--");
	data = {}
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	var isp_id = req.params.id;

	var Connected_ISPs = await Customer.find({
		_id: req.app.locals.userCustomerSession._id, ConnectedISPs: {
			$elemMatch: { userId: isp_id }
		}
	});

	// console.log('-----Connected_ISPs', Connected_ISPs);
	// console.log('-----user Id', req.app.locals.userCustomerSession._id);
	// console.log('-----isp_id Id', isp_id);



	// Connected_ISPs.forEach(element => {
	// 	if (isp_id == element) {
	// 	     connect = "yes";
	// 		 break;
	// 	}
	// 	else {
	// 		connect = "";
	// 	}
	// })
	if (Connected_ISPs.length > 0) {
		req.flash('error', 'Customer Already connected to isp.');
		res.redirect(baseUrl + `customer/service-providers/${isp_id}`);
	}
	else {

		//console.log('-----isp_id simple', typeof isp_id);
		isp_id = mongoose.Types.ObjectId(isp_id);
	//	console.log('-----isp_id object id', typeof isp_id);
		Customer.findByIdAndUpdate({ _id: req.app.locals.userCustomerSession._id }, { $push: { ConnectedISPs: { "userId": isp_id, request: 'pending' } } })
			.exec(function (err, ress) {
				Customer.aggregate(
					[
						{
							$match:
							{

								_id: isp_id
							}

						},

						{
							"$lookup": {
								from: 'service_categories',
								localField: 'business_category',
								foreignField: '_id',
								as: 'services',
							}

						},
						{
							"$unwind": "$services"
						},
						{
							"$match":
							{
								"$and": [
									{ "role_id": 3 },
									{ "verify": 1 },
									{ "status": "active" }
								]
							}
						},
					]
				)
					.exec(function (err, ress) {
						if (err) {
							data.success = req.flash('error', 'customer  not connected to Business owner.');
							res.render('customer/loggedIn-service-providers/connected-isp-detail', data);
						}
						else {
							ress = JSON.parse(JSON.stringify(ress));
						//	console.log("bdhdbhs  34354354");
						//	console.log('ress ---------------', ress);
							data.result = {
								"_id": ress[0]._id,
								"business_category": ress[0].services.name,
								"business_name": ress[0].business_name,
								"address": ress[0].address,
								"name": ress[0].name,
								"connect": "yes",
								"profileImage": ress[0].profileImage,
							}
							var objIndex = newArray.findIndex((obj => obj._id.toString() == isp_id.toString()));
							// console.log("newArray----" , newArray);
							// console.log("objIndex------",objIndex);
							var a = ress[0].services.name;
							newArray[objIndex].business_category = a;
							newArray[objIndex].business_name = ress[0].business_name;
							newArray[objIndex].address = ress[0].address;
							newArray[objIndex].name = ress[0].name;
							newArray[objIndex].connect = "yes";
							newArray[objIndex].profileImage = ress[0].profileImage;
							req.flash('success', 'Successfully connected to isp.');
							res.redirect(baseUrl + `customer/service-providers/${isp_id}`);
							//res.render('customer/loggedIn-service-providers/connected-isp-detail', data);  
						}
					})
			})
	}
}
exports.remove = function (req, res) {
	data = {}
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.flash("session");
	var isp_id = req.params.id;

	Customer.findByIdAndUpdate({ _id: req.app.locals.userCustomerSession._id }, { $pull: { ConnectedISPs: { userId: isp_id } } })
		.exec(function (err, ress) {
			if (err) {
				throw err;
			}
			else {
				//console.log('-----isp_id simple', typeof isp_id);
				isp_id = mongoose.Types.ObjectId(isp_id);
				//console.log('-----isp_id object id', typeof isp_id);
				Customer.aggregate(
					[
						{
							$match:
							{

								_id: isp_id
							}

						},

						{
							"$lookup": {
								from: 'service_categories',
								localField: 'business_category',
								foreignField: '_id',
								as: 'services',
							}

						},
						{
							"$unwind": "$services"
						},
						{
							"$match":
							{
								"$and": [
									{ "role_id": 3 },
									{ "verify": 1 },
									{ "status": "active" }
								]
							}
						},
					]
				)
					.exec(function (err, ress) {
						if (err) {
							req.flash('error', 'Business owner not removed from the customer.');
							res.render('customer/loggedIn-service-providers/connected-isp-detail', data);
						}
						else {
							//console.log("bdhdbhs  34354354");
							//console.log(ress);
							data.result = {
								"_id": ress[0]._id,
								"business_category": ress[0].services.name,
								"business_name": ress[0].business_name,
								"address": ress[0].address,
								"name": ress[0].name,
								"connect": "no",
								"profileImage": ress[0].profileImage,
							}
							var objIndex = newArray.findIndex((obj => obj._id.toString() == isp_id.toString()));
							// console.log("newArray----" , newArray);
							// console.log("objIndex------",objIndex);
							var a = ress[0].services.name;
							newArray[objIndex].business_category = a;
							newArray[objIndex].business_name = ress[0].business_name;
							newArray[objIndex].address = ress[0].address;
							newArray[objIndex].name = ress[0].name;
							newArray[objIndex].connect = "no";
							newArray[objIndex].profileImage = ress[0].profileImage;
							req.flash("success", "Business owner successfully removed from the customer.");
							res.redirect(baseUrl + `customer/service-providers/${isp_id}`);
							//res.render('customer/loggedIn-service-providers/connected-isp-detail', data);
						}
					})
			}
		})

}