var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Draft = require('../../models/admin/draft');
var draftDetails = require('../../models/admin/draft_details');
var Format = require('../../models/admin/format');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var Customer = require('../../models/home');
var lowerCase = require('lower-case');
var trim = require('trim');

var State = require('../../models/admin/state');
var Court = require('../../models/admin/court');
var Async = require('async');


/* For Image Upload Configration */
const multer = require('multer')
const Storage = multer.diskStorage({
	  destination: function (req, file, cb) {
	       cb(null, 'public/uploads/format')
	  },
	  filename: function (req, file, cb) {
	  	   var datetimestamp = Date.now();
	       cb(null, datetimestamp+'_'+file.originalname);
	  }
});
const upload = multer({storage: Storage});
var multipleFileUpload = upload.fields([{ name: 'uploadDocs', maxCount: 20 }])
/* end */

exports.add = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session; 
	var tasks = [
				function(callback) {
					   State.find({'status' : 'active'})
					   .select(['state'])
					  .sort({'state': 1})
					  .exec(function(err, states) {
							if (err) {
								data.states = "";
								callback();
							}else{
								data.states = states;
								callback();
							}
					  });		
				},
				function(callback) {
					  Court.find({'status' : 'active'}) 
					  .exec(function(err, courts) {
							if (err) {
								data.courts = "";
								callback();
							}else{
								data.courts = courts;
								callback();
							}
					  });
				}
				
		];
		Async.series(tasks, function(err) {   //series: for step by step and parallel: for suffle 
			 if (err) {
				 data.states = "";
				 data.courts = "";
				 res.render('admin/format/add', data);
			 } else {
				 res.render('admin/format/add', data);
			 }
		});
}

exports.save = function(req, res) {
	var newFormat = new Format();
	var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
	var uploadDocs = [];
	
	multipleFileUpload(req, res, function(err) {	
		if(typeof req.files == 'undefined' || typeof req.files['uploadDocs'] == 'undefined' || req.files['uploadDocs'] == ''){
			//var uploadDocs = '';
		}else{
			for(var i=0; i< req.files['uploadDocs'].length; i++) { 
				var type = [];
			    type = req.files['uploadDocs'][i].mimetype.split('/');
				uploadDocs.push({'name': req.files['uploadDocs'][i].filename, 'type': type[1]});
			} 
			newFormat.docs = uploadDocs;
		}
		
		
		
		console.log(req.body.formatMasterKeys);
		
		newFormat._id = mongoose.Types.ObjectId();
		newFormat.name = req.body.name;
		newFormat.state = req.body.state;
		newFormat.court = req.body.court;
		newFormat.description = req.body.description;
		newFormat.format = req.body.format;
		newFormat.petitionRespondentMasterKeys = req.body.petitionRespondentMasterKeys;
		newFormat.commonMasterKeys = req.body.commonMasterKeys;
		newFormat.favourite = [];
		newFormat.status = 'active'; 
		newFormat.created_date = day;
		newFormat.updated_date = day;
		
		newFormat.save(function(err) {
			if (err){
				req.flash('error', 'Sorry something went wrong.');
				res.redirect(baseUrl+'admin/format');
			}else{
				req.flash('success', 'Format saved successfully.');
				res.redirect(baseUrl+'admin/format');
			}
		});
	});	

}

exports.listing = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session; 
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;
	
	var statusByStatus = ['active', 'inactive'];
		   Format.find({'status': { $in: statusByStatus }})
		   .select(['name', 'state', 'court', 'created_date', 'status'])
		   .populate('state', 'state')
		   .populate('court', 'name')
		  .sort({'created_date': -1})
		  .exec(function(err, result) {
			  console.log(result);
				if (err) {
					data.result = '';
					res.render('admin/format/listing', data);
				} else {
					data.result = result;  
					res.render('admin/format/listing', data);			
				}
		 });
	
} 

exports.listingWithDatatable = function(req, res) {
	    var lengthLocal = parseInt(req.body);
		var lengthLocal = parseInt(req.body.length);
	    var skipLocal = parseInt(req.body.start);
		
		
		var statusByStatus = req.body.sort_by_status;
		if(statusByStatus == ''){
			statusByStatus = ['active', 'inactive'];
		}	
	    
		 var extra_sort_field_name = req.body.extra_sort_field_name; 
		 var extra_sort_field_value = req.body.extra_sort_field_value;
		 
		 if(!extra_sort_field_value){
			  extra_sort_field_name = 'created_date';
		 } 
	     
		 
		 if(extra_sort_field_value == 'ascending'){
			  extra_sort_field_value = 1;
		 }else if(extra_sort_field_value == 'descending'){
			  extra_sort_field_value = -1;
		 }else{
			  extra_sort_field_value = -1;
		 }
		 
	    
	    /**For get data  **/
	    Format.find({'status': { $in: statusByStatus }, 
					'$or':[
					          {name:new RegExp(req.body.search.value,'i')},
						      {status:new RegExp(req.body.search.value,'i')}
						  ]
				 })
				.limit(lengthLocal)
				.skip(skipLocal)
				//.sort({'name': -1})
				.sort({[extra_sort_field_name]: extra_sort_field_value}) //working code
				.exec(function(err, result) {
						if (err) {
							console.log(err);
						} else {
							    /**For get count **/
								Format.count({
								   '$or':[
											  {name:new RegExp(req.body.search.value,'i')},
											  {status:new RegExp(req.body.search.value,'i')}
										  ]
								}, function(err, count) {
										if (err) {
											res.send(err);
										} else {
											res.json({
													data: result,
													recordsFiltered: count,
													recordsTotal: count
											});		
										}
								}); 		
						}
				});
} 

exports.edit = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	
		var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session; 
	var tasks = [
				function(callback) {
					   State.find({'status' : 'active'})
					   .select(['state'])
					  .sort({'state': 1})
					  .exec(function(err, states) {
							if (err) {
								data.states = "";
								callback();
							}else{
								data.states = states;
								callback();
							}
					  });		
				},
				function(callback) {
					  Format.findOne({ '_id' : req.params.id})
					  .exec(function(err, result) {
							if (err) {
								data.result = "";
								callback();
							} else {
								data.result = result;
								callback();
							}
					  });
				},
				function(callback) {
					   Court.find({'state': data.result.state, 'status':'active'})
					   .select(['name'])
					   .exec(function(err, courts) {
							if (err) {
								data.courts = "";
								callback();
							}else{
								data.courts = courts;
								callback();
							}
					  });		
				}
		];
		Async.series(tasks, function(err) {   //series: for step by step and parallel: for suffle 
			 if (err) {
				 data.states = "";
				 data.courts = "";
				 data.result = result;
				 res.render('admin/format/edit', data);
			 } else {
				 console.log(data);
				 res.render('admin/format/edit', data);
			 }
		});
	
}


exports.view = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	
		var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session; 
	var tasks = [
				function(callback) {
					   State.find({'status' : 'active'})
					   .select(['state'])
					  .sort({'state': 1})
					  .exec(function(err, states) {
							if (err) {
								data.states = "";
								callback();
							}else{
								data.states = states;
								callback();
							}
					  });		
				},
				function(callback) {
					  Format.findOne({ '_id' : req.params.id})
					  .exec(function(err, result) {
							if (err) {
								data.result = "";
								callback();
							} else {
								data.result = result;
								callback();
							}
					  });
				},
				function(callback) {
					   Court.find({'state': data.result.state, 'status':'active'})
					   .select(['name'])
					   .exec(function(err, courts) {
							if (err) {
								data.courts = "";
								callback();
							}else{
								data.courts = courts;
								callback();
							}
					  });		
				}
		];
		Async.series(tasks, function(err) {   //series: for step by step and parallel: for suffle 
			 if (err) {
				 data.states = "";
				 data.courts = "";
				 data.result = result;
				 res.render('admin/format/view', data);
			 } else {
				 console.log(data);
				 res.render('admin/format/view', data);
			 }
		});
}

exports.update = function(req, res) {
	var data = {};
	req.body.updated_date = new Date();
	
	
	
	multipleFileUpload(req, res, function(err) {	
				var favouriteCount = req.body.favourite;
				if( favouriteCount.indexOf(',') != -1 ){
					req.body.favourite = favouriteCount.split(',');
				}
				var uploadDocs = [];
				var preuploadedFiles = [];
				preuploadedFiles = req.body.preuploadedFiles;
				
				if(preuploadedFiles){
					for(var i=0; i< preuploadedFiles.length; i++) { 
							var type = [];
							file = preuploadedFiles[i].split(',');;
							uploadDocs.push({'name': file[0], 'type': file[1]});
					} 
				}	
				
				if(typeof req.files == 'undefined' || typeof req.files['uploadDocs'] == 'undefined' || req.files['uploadDocs'] == ''){
					  uploadDocs = uploadDocs;
				}else{
					for(var i=0; i< req.files['uploadDocs'].length; i++) { 
						var type = [];
						type = req.files['uploadDocs'][i].mimetype.split('/');;
						uploadDocs.push({'name': req.files['uploadDocs'][i].filename, 'type': type[1]});
					} 
				}
				
				req.body.docs = uploadDocs;
				Customer.find({"_id": { $in: req.body.favourite }, 
						}, function(err, result) {
								if (err) {
										req.body.favourite = '';
										Format.update({ _id: req.body._id}, req.body, function (err, updatedresult) {
											if (err) {
												req.flash('error', 'Sorry something went wrong.');
												res.redirect(baseUrl+'admin/format');
											}else{
												req.flash('success', 'Format updated successfully.');
												res.redirect(baseUrl+'admin/format');
											}
										});
										
								} else {
										var result_data = [];
										for(var i=0; i<result.length; i++) {
											//result_data.push({id:result[i]._id,name:result[i].mail});
											result_data.push({id:result[i]._id,name:result[i].name+' ('+result[i].mail+')'});
										}	
										
										
										req.body.favourite = result_data;
										Format.update({ _id: req.body._id}, req.body, function (err, updatedresult) {
											if (err) {
												req.flash('error', 'Sorry something went wrong.');
												res.redirect(baseUrl+'admin/format');
											}else{
												req.flash('success', 'Format updated successfully.');
												res.redirect(baseUrl+'admin/format');
											}
										}); 									
								}
						}); 
			}); 

}

exports.delete = function(req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = 'delete';
	
	Format.update({ _id: req.params.id}, req.body, function (err, deletedResult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl+'admin/format');
		}else{
			req.flash('success', 'Format deleted successfully.');
			res.redirect(baseUrl+'admin/format');
		}
	});  
}


exports.changeStatus = function(req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = req.params.status;
	
	Format.update({ _id: req.params.id}, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl+'admin/format');
		}else{
			req.flash('success', 'Format updated successfully.');
			res.redirect(baseUrl+'admin/format');
		}
	});  
}

exports.customerFavouriteList = function(req, res) {
	 Customer.find({'role_id': '2', 'status': 'active', $or: [ {'name': new RegExp(req.query.q,'i')}, { 'mail': new RegExp(req.query.q,'i')}]
					}, function(err, result) {
							if (err) {
								res.json([]);
							} else {
								//res.json([{"value":"147","text":"Arun kumar"},{"value":"161","text":"Arun kumar"},{"value":"162","text":"Arun test"}]);	
								var result_data = [];
								for(var i=0; i<result.length; i++) {
									//result_data.push({id: result[i]._id, name: result[i].mail});
									result_data.push({id: result[i]._id, name: result[i].name+' ('+result[i].mail+')'});
								}	
								
								res.json(result_data);									
							}
					}); 
					
}	

exports.viewById = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	draftId = mongoose.Types.ObjectId(req.params.draftId);
	data.datetimestamp = Date.now();
	data.draftName = req.params.draftName;
	
	Format.findOne({ '_id' : req.params.id}, function(err, formatResult) {
		if (err) {
			    data.result = '';
		} else {
				data.result = formatResult;
				draftDetails.find({'draft_id' : draftId}, function(err, draftResult) {
					console.log(draftResult);
					if (err) {
						data.result = formatResult;
						data.draftResult = '';
						res.render('admin/format/viewById', data);
					} else {
						data.result = formatResult;
						data.draftResult = draftResult;
						console.log("@@@@@@@@@@@@@");
						console.log(draftResult);
						res.render('admin/format/viewById', data);
					}
				});
			
		}
	});
}

exports.checknameexist = function(req, res) {
	var name = req.body.name;
	Format.findOne(
		{
			'name': new RegExp(name,'i'),
			$or:[ {'status':'active'},{'status':'inactive'}]
	    }, function(err, user) {
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

exports.checknameexistexceptthis = function(req, res) {
	var name = req.body.name;
	var user_id = req.body.user_id;
	Format.findOne(
	   {
				   'name': new RegExp(name,'i'), '_id': {$ne: user_id},
					$or:[ {'status':'active'},{'status':'inactive'}]
	   }, function(err, user) {
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


exports.stateWiseCourt = function(req, res) {
	var stateId = req.params.id;
	Court.find({
			       'state': stateId, 'status':'active'
	          })
			  .select(['name'])
			  .exec(function(err, courts) {   
					if (courts) {
						res.send(courts);
					}
			  });
}	