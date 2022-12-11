var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var lowerCase = require('lower-case');
var Service_category = require('../../models/admin/service_category');
var Customer = require('../../models/home');
var trim = require('trim');
var moment = require('moment');
var fs = require('fs');

/* For Image Upload Configration */
const multer = require('multer')
const Storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads/profile')
	},
	filename: function (req, file, cb) {
		//cb(null, datetimestamp+'_'+file.originalname);
		var datetimestamp = Date.now();
		var fileOriginalname = ""
		fileOriginalname = file.originalname;
		fileOriginalname = fileOriginalname.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
		cb(null, datetimestamp + '_' + fileOriginalname);
		//cb(null, datetimestamp+'_');

	}
});
const upload = multer({ storage: Storage });
var profileImageUpload = upload.fields([{ name: 'profileImage', maxCount: 1 }]);
/* end */


exports.listing = async function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;
    var allBO = [];
	var allServices = [];
	var results = [];

	allBO =  await Customer.find({role_id : 3 });
	allServices = await Service_category.find({}); 

	// allBO.forEach(element=>{
	// 	console.log("service name-- " , element.business_category_name);
	// });
	allServices.forEach(ele=>{
		var totalIsp = 0;
		var males = 0;
		var females = 0;
		console.log(ele.name,' ',moment.tz(ele.created_date, "America/Chicago").format())
		allBO.forEach(element=>{
           if(ele.name == element.business_category_name){
			   totalIsp+=1;
			 if(element.gender){
			   if(element.gender == "male"){
				   males+=1;
			   }
			   if(element.gender == "female"){
                   females+=1;
			   }
			 }
		   }   
		})
		results.push({
			_id: ele._id,
			created_date: ele.created_date,
			name: ele.name,
			icon: ele.icon,
			status: ele.status,
			male: males,
			female: females,
			total: totalIsp,
			typ: ele.typ,
		})
		//console.log("busness  name-- " , ele.name);

	});

	//console.log("results------------" , results);
	var statusByStatus = ['active', 'inactive'];
	Service_category.find({
		'status': { $in: statusByStatus }
	})
		.sort({ 'created_date': -1 })
		.exec(function (err, result) {
			if (err) {
				data.result = '';
				res.render('admin/service_category/listing', data);
			} else {
				results.reverse();
				// console.log("CAT:::::::::::::: ---- ",JSON.stringify(result))
				console.log("CAT:::::::::::::: ---- ",JSON.stringify(results))
				data.result = results;
				res.render('admin/service_category/listing', data);
			}
		});

}

exports.add = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	res.render('admin/service_category/add', data);
}


exports.save = function (req, res) {
	var newService_category = new Service_category();
	var day = moment.utc();

	profileImageUpload(req, res, function (err) {
		if(req.body.name == "other"){
			req.flash('error', 'Other Service Category Name Should not be alloweded.');
			res.redirect(baseUrl + 'admin/service_category');
		}else{

		if (typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == '') {
			var profileImageNewName = 'avatar.png';
		} else {
			var profileImageNewName = req.files['profileImage'][0].filename;
			console.log(req.files['profileImage'][0]);
		}

		newService_category.icon = profileImageNewName;
		newService_category._id = mongoose.Types.ObjectId();
		newService_category.name = req.body.name;
		newService_category.pagecontent = req.body.pagecontent;
		newService_category.status = 'active';
		newService_category.created_date = day;
		newService_category.updated_date = day;

		newService_category.save(function (err) {
			if (err)
				throw err;

			req.flash('success', 'Category added!');
			res.redirect(baseUrl + 'admin/service_category');
		});
	}
	});

}


exports.edit = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	Service_category.findOne({ '_id': req.params.id }, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/service_category/edit', data);
		}
	});
}

exports.view = function (req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;

	Service_category.findOne({ '_id': req.params.id }, function (err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/service_category/view', data);
		}
	});

}

exports.update = function (req, res) {
	var data = {};

	profileImageUpload(req, res, async function (err) {
		if(req.body.name == "other"){
			req.flash('error', 'Other Service Category Name Should not be alloweded.');
			res.redirect(baseUrl + 'admin/service_category');
		}else{
		if (typeof req.files == 'undefined' || typeof req.files['profileImage'] == 'undefined' || req.files['profileImage'] == '') {
			req.body.icon = req.body.uploaded_profileImage;
		} else {
			req.body.icon = req.files['profileImage'][0].filename;
			// to remove old uploaded certificate image
			if (req.body.uploaded_profileImage != '' || req.body.uploaded_profileImage != 'null' || req.body.uploaded_profileImage != 'Null') {
				var filePath = 'public/uploads/profile/' + req.body.uploaded_profileImage;
				fs.unlink(filePath, function (err) {
					console.log('successfully deleted profile uploaded file');
				});
			}
		}

		req.body.updated_date = moment.utc();
		var s_count = await Customer.count({business_category: req.body._id});
		console.log("count ,,,,,,..." , s_count);
		console.log("req.params.status." , req.body.status);
		console.log("req.params----id." , req.body._id);

		if(s_count > 0){
			req.body.status = "active";
			Service_category.update({ _id: req.body._id }, req.body, function (err, updatedresult) {
				if (err) {
					req.flash('error', 'Sorry something went wrong.');
					res.redirect(baseUrl + 'admin/service_category');
				} else {
					req.flash('error', 'Service Category is associated with business owners.');
					res.redirect(baseUrl + 'admin/service_category');
				}
			});
			// req.flash('error', 'Service Category is associated with business owners.');
			// res.redirect(baseUrl + 'admin/service_category');
		}else{
		Service_category.update({ _id: req.body._id }, req.body, function (err, updatedresult) {
			if (err) {
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl + 'admin/service_category');
			} else {
				req.flash('success', 'Service Category updated!');
				res.redirect(baseUrl + 'admin/service_category');
			}
		});
	}
}
	});
}

exports.changeStatus = async function (req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = req.params.status;
	var statusMessage = "";
	if(req.params.status == "active"){
        statusMessage = "Activated";
	}else{
		statusMessage = "Inactivated";
	}

		var s_count = await Customer.count({business_category: req.params.id});
		console.log("count ,,,,,,..." , s_count);
		console.log("req.params.status." , req.params.status);
		console.log("req.params----id." , req.params.id);

		if(s_count > 0 ){
			if(req.params.status == "active"){
				Service_category.update({ _id: req.params.id }, req.body, function (err, updatedresult) {  
					if (err) {
						req.flash('error', 'Sorry something went wrong.');
						res.redirect(baseUrl + 'admin/service_category');
					} else {
						req.flash('success', `Category ${statusMessage}!`);
						res.redirect(baseUrl + 'admin/service_category');
					}
				});
			}else{
			req.flash('error', 'Service Category is associated with business owners.');
			res.redirect(baseUrl + 'admin/service_category');
			}
		}else{

		// Make inactive all ISPS who is related to this category
		// Customer.update({business_category: req.params.id}, { status: 'inactive' },{multi: true}, function (err, updatedresult) {
		// 	if (err) {
		// 		console.log('-----------err-------',err);
		// 	} else {
		// 		console.log('-----------updatedresult-------',updatedresult);
		// 	}
		// });	

	Service_category.update({ _id: req.params.id }, req.body, function (err, updatedresult) {  
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/service_category');
		} else {
			req.flash('success', `Category ${statusMessage}!`);
			res.redirect(baseUrl + 'admin/service_category');
		}
	});
}
}

exports.delete = async function (req, res) {
	var data = {};

    var s_count = await Customer.count({business_category: req.params.id});
	console.log("count ,,,,,,..." , s_count);
	if(s_count > 0){
		req.flash('error', 'Service Category is associated with business owners.');
		res.redirect(baseUrl + 'admin/service_category');
	}else{
	Service_category.findOneAndRemove({ _id: req.params.id }, function (err, resultForDelete) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl + 'admin/service_category');
		} else {

			// Make inactive all ISPS who is related to this category
			Customer.update({business_category: req.params.id}, { status: 'inactive' },{multi: true}, function (err, updatedresult) {
				if (err) {
					console.log('-----------err-------',err);
					req.flash('success', 'Category deleted!');
					res.redirect(baseUrl + 'admin/service_category');
				} else {
					console.log('-----------updatedresult-------',updatedresult);
					req.flash('success', 'Category deleted!');
					res.redirect(baseUrl + 'admin/service_category');
				}
			});	

			
		}
	});
	}
}

exports.checknameexist = function (req, res) {
	var name = req.body.name;
	Service_category.findOne(
		{
			'name': new RegExp(name, 'i'),
			$or: [{ 'status': 'active' }, { 'status': 'inactive' }]
		}, function (err, user) {
			if (err) {
				res.send('true');
			}
			if (user) {
				res.send('false');
			}

			if (!user) {
				res.send('true');
			}
		});
}

exports.checknameexistexceptthis = function (req, res) {
	var name = req.body.name;
	var user_id = req.body.user_id;
	Service_category.findOne(
		{
			'name': new RegExp(name, 'i'), '_id': { $ne: user_id },
			$or: [{ 'status': 'active' }, { 'status': 'inactive' }]
		}, function (err, user) {
			if (err) {
				res.send('true');
			}
			if (user) {
				res.send('false');
			}

			if (!user) {
				res.send('true');
			}
		});
}
