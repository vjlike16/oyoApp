var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Draft = require('../../models/admin/draft');
var draftDetails = require('../../models/admin/draft_details');
var User = require('../../models/home');
var lowerCase = require('lower-case');
var trim = require('trim');
var Email = require('../../../lib/email.js');
var Async = require('async');

var State = require('../../models/admin/state');
var Court = require('../../models/admin/court');
var Format = require('../../models/admin/format');
var multiparty = require('multiparty');
var fs = require('fs');

//var office2html = require('office2html'),
  //generateHtml = office2html.generateHtml;
  
/* For Image Upload Configration */
const multer = require('multer')
const Storage = multer.diskStorage({
	  destination: function (req, file, cb) {
		  cb(null, 'public/uploads/draft')
	  },
	  filename: function (req, file, cb) {
		   //var draftName = req.session.draftName;
		   //var datetimestamp = Date.now();
		   //cb(null, draftName+'_'+datetimestamp+'.odp');
		   var fileOriginalname = file.originalname;
		   //fileOriginalname = fileOriginalname.replace(/[^a-zA-Z0-9.]/g, '');
		   cb(null, fileOriginalname);
	  }
});
const upload = multer({storage: Storage});				   
var singleUpload = upload.fields([{name: 'word_file', maxCount: 1}, {name: 'draftFileName', maxCount: 1}]);

/*  exports.add = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session; 
	
	State.find({'status' : 'active'})
	  .select(['_id', 'state'])
	  .sort({'state': 1})
	  .exec(function(err, states) {
			if (err) {
				data.states = '';
			} else {
				data.states = states;
				Format.find({'status' : 'active'})
				    .select(['_id', 'name'])
					.exec(function(err, formats) {
						if (err) {
							data.formats = '';
						} else {
							data.formats = formats;
							res.render('admin/draft/add', data);
						}
				 });
				
			}
	 });

}

exports.save = function(req, res) {
	var newDraft = new Draft();
	var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
	
	newDraft._id = mongoose.Types.ObjectId();
	newDraft.name = req.body.name;
	
	newDraft.tehsil = req.body.tehsil;
	newDraft.district = req.body.district;
	newDraft.format = req.body.format;
	newDraft.state = req.body.state;
	newDraft.court = req.body.court;
	
	
	
	newDraft.status = 'active'; 
	newDraft.created_date = day;
	newDraft.updated_date = day;
	newDraft.save(function(err) {
		if (err)
			throw err;
		
		req.flash('success', 'Record saved successfully.');
		res.redirect(baseUrl+'admin/draft');
	});
}  */

exports.listing = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session; 
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;
	
	var statusByStatus = ['active', 'inactive'];
	
    //It is for steno level1 this time ith is commented	
	if(req.session.userAdminSession.role_id == 4){
					Draft.find({'draft_status_mobile': 1, 'status': { $in: ['active'] }, 'steno1_approver._id': { $eq: req.session.userAdminSession._id}})
					.populate('user', 'name')
					.sort({'created_date': -1})
					.exec(function(err, result) {
							if (err) {
								data.result = '';
								res.render('admin/draft/listing', data);
							} else {
								data.result = result;  
								console.log(req.session.userAdminSession._id);
								res.render('admin/draft/listing', data);		
							}
					 });
	 //It is for steno level2 				 
	 }else if(req.session.userAdminSession.role_id == 5){
		    Draft.find({'draft_status_mobile': 1, 'status': { $in: ['active'] }, 'steno2_approver._id': { $eq: req.session.userAdminSession._id}})
					.populate('user', 'name')
					.sort({'created_date': -1})
					.exec(function(err, result) {
							if (err) {
								data.result = '';
								res.render('admin/draft/listing', data);
							} else {
								data.result = result;  
								res.render('admin/draft/listing', data);		
							}
					 });
	 }else{
		 //It is for admin users
			Draft.find({'draft_status_mobile': 1, 'status': { $in: statusByStatus }})
					.populate('user', 'name')
					.sort({'created_date': -1})
					.exec(function(err, result) {
							if (err) {
								data.result = '';
								res.render('admin/draft/listing', data);
							} else {
								data.result = result;  
								res.render('admin/draft/listing', data);		
							}
					 });
	 }			 
} 

exports.edit = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	
	State.find({'status' : 'active'})
	  .select(['_id', 'state'])
	  .sort({'state': 1})
	  .exec(function(err, states) {
			if (err) {
				   data.states = '';
			} else {
					data.states = states;
					Format.find({})
						.select(['_id', 'name'])
						.exec(function(err, formats) {
							if (err) {
									data.formats = '';
							} else {
									data.formats = formats;
									User.find({'status' : 'active', role_id: { $in: [4, 5, 6, 7, 8] }})
									  .select(['_id', 'name', 'role_id', 'mail'])
									  .exec(function(err, stenos) {
											if (err) {
												   data.stenos = '';
											} else {
												    data.stenos = stenos;
													Draft.aggregate(
																[
																		{ $match: 
																				{'_id': mongoose.Types.ObjectId(req.params.id)}
																		},
																		{$lookup: {
																						from: "draft_details",
																						localField: "_id", // main table id
																						foreignField: "draft_id", //draft_details table foreignField
																						as: "draft_details"
																					}
																		}
																]
																
														 )
														.exec(function(err, result) {
																Draft.populate( result, [{path: "court"}, {path:"format"}, {path:"user"}], function(err,result) {
																	if (err) {
																		 req.flash('error', 'Sorry something went wrong.');
																		 res.redirect(baseUrl+'admin/draft');
																	} else {
																		//console.log( JSON.stringify( stenos, undefined, 4 ) );
																		if(result[0].name){
																			req.session.draftName = result[0].name;
																		}else{
																			req.session.draftName = 'Draft';
																		}
																		
																		data.result = result;
																		res.render('admin/draft/edit', data);
																	}
																});
														});
											  }
									});		  
							}
					 });
			}
	 });

}

exports.view = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	data.dateFormat = dateFormat;
	State.find({'status' : 'active'})
	  .select(['_id', 'state'])
	  .sort({'state': 1})
	  .exec(function(err, states) {
			if (err) {
				   data.states = '';
			} else {
					data.states = states;
					Format.find({})
						.select(['_id', 'name'])
						.exec(function(err, formats) {
							if (err) {
									data.formats = '';
							} else {
									data.formats = formats;
									User.find({'status' : 'active', role_id: { $in: [4, 5, 6, 7, 8] }})
									  .select(['_id', 'name', 'role_id', 'mail'])
									  .exec(function(err, stenos) {
											if (err) {
												   data.stenos = '';
											} else {
												    data.stenos = stenos;
													Draft.aggregate(
																[
																		{ $match: 
																				{'_id': mongoose.Types.ObjectId(req.params.id)}
																		},
																		{$lookup: {
																						from: "draft_details",
																						localField: "_id", // main table id
																						foreignField: "draft_id", //draft_details table foreignField
																						as: "draft_details"
																					}
																		}
																]
																
														 )
														.exec(function(err, result) {
																Draft.populate( result, [{path: "court"}, {path:"format"}, {path:"user"}], function(err,result) {
																	if (err) {
																		 req.flash('error', 'Sorry something went wrong.');
																		 res.redirect(baseUrl+'admin/draft');
																	} else {
																		//console.log( JSON.stringify( stenos, undefined, 4 ) );
																		data.result = result;
																		res.render('admin/draft/view', data);
																	}
																});
														});
											  }
									});		  
							}
					 });
			}
	 });
}


exports.update = function(req, res) {
		var data = {};
		var today = new Date();
		
		
		singleUpload(req, res, function(err){	

				if(typeof req.files == 'undefined' || typeof req.files['word_file'] == 'undefined' || req.files['word_file'] == ''){
						req.body.word_file = req.body.uploaded_word_file;
				}else{
						req.body.word_file = req.files['word_file'][0].filename;
						/* if(req.body.uploaded_word_file != '' || req.body.uploaded_word_file != 'null' || req.body.uploaded_word_file != 'Null'){
								var filePath = 'public/uploads/draft/'+req.body.uploaded_word_file; 
								fs.unlink(filePath, function(err){
									console.log('Successfully deleted word uploaded file.');
								});
						} */
						
						/* var wordFilePath = 'public/uploads/draft/'+req.files['word_file'][0].filename;
						var wordFilePath = 'public/uploads/draft/1516780188675_1515397549646sample.docx';
						var pdfFolderPath = 'public/uploads/draft/';
						
						generateHtml(wordFilePath, function(err, result) {
							console.log("###################");
							console.log(result);
							console.log("###################");
						}); */
	            }
				
				var draftId = req.body._id;
				var draftName= req.body.draftName;
				
				var word_file_var = req.body.word_file;
				var notesBody = req.body.notes;
				//var formatData = req.body.formatData;
				var approver = req.body.approver;  
				var reason = req.body.reason;
				var sessionRoleID = req.session.userAdminSession.role_id;
				var userId = req.body.user_id;
				var current_user_word_used = req.body.current_user_word_used;
				var assignLevel1 = req.body.assignLevel1;
				var assignLevel1Array = [];
				var assignLevel2 = req.body.assignLevel2;
				var assignLevel2Array = [];
				
				if(notesBody != ''){
					  req.body.notes = notesBody;
				}
				if(reason != ''){
					  req.body.reason = reason;
				}
				
				//if user logged in as admin role_id :1
				if(req.session.userAdminSession.role_id == 1){
					 if(assignLevel1 && assignLevel1 != ""){
						  assignLevel1Array.push({_id: assignLevel1, approver: 0, email: 1});
						  req.body.steno1_approver = assignLevel1Array;
						  module.exports.sendEmailToStenos(assignLevel1, draftName);
					 }
					 
					 if(assignLevel2 && assignLevel2 != ""){
						 assignLevel2Array.push({_id: assignLevel2, approver: 0, email: 1});
						req.body.steno2_approver = assignLevel2Array;
						 module.exports.sendEmailToStenos(assignLevel2, draftName);
					 }
				}
				
				req.body.updated_date = today;
				Draft.update({ _id: req.body._id}, req.body, function (err, updatedresult) {
						if (err) {
							 req.flash('error', 'Sorry something went wrong.');
							 res.redirect(baseUrl+'admin/draft/edit/'+draftId);
						}else{
							var whole_content_array = [];
							var whole_content_array_for_update = [];
							
							whole_content_array = JSON.parse(req.body.whole_content_ids);
							for(var j=0; j < whole_content_array.length; j++) {
								var currentID = whole_content_array[j].id;
								var currentContent = req.body[currentID+"_whole_content"];
								//whole_content_array_for_update.push({_id: currentID},{whole_content: currentContent});
								draftDetails.update({_id: currentID},{$set: {'whole_content': currentContent}}, function (err, updatedDocuments) { 
										console.log("Draft Details Updated successfully.");
								});
							}	
							req.flash('success', 'Draft updated successfully.');
							res.redirect(baseUrl+'admin/draft/edit/'+draftId);
						}
				});
	}); 	
}

exports.approved = function(req, res) {
		var data = {};
		var today = new Date();
		var paramsId = req.params.id;
		console.log('paramsId'+paramsId);
		var tasks = [
			function(callback) {
					Draft.findOne({ '_id' : paramsId}) 
					    .populate('user')
						.exec(function(err, result) {
							if (err) {
								data.result = '';
								callback();
							} else {
								data.result = result;
								callback();
							}
					    });
			},
			function(callback) {
					var assignLevel1Array = [];
					var assignLevel2Array = [];
						
					//if user logged in as steno level1 role_id :4
					if(req.session.userAdminSession.role_id == 4){
						 assignLevel1Array.push({_id:req.session.userAdminSession._id, approver: 1, email: 1});
						 req.body.steno1_approver = assignLevel1Array;
					}	
					//if user logged in as steno level2 role_id :5
					 if(req.session.userAdminSession.role_id == 5){
						 assignLevel2Array.push({_id:req.session.userAdminSession._id, approver: 1, email: 1});
						 req.body.steno2_approver = assignLevel2Array;
						 req.body.draft_status = 'completed';
					} 
					//if user logged in as admin role_id :1
					if(req.session.userAdminSession.role_id == 1){
						 req.body.draft_status = 'completed';
					}		
	
					req.body.updated_date = today;
					Draft.update({ _id: paramsId}, req.body, function (err, updatedresult) {
						   if (err) {
								 callback();
							}else{
								callback();
							}
					});
			}
			
	];
    Async.series(tasks, function(err) {   //series: for step by step and parallel: for suffle 
		 if (err) {
			 req.flash('error', 'Sorry something went wrong.');
			 res.redirect(baseUrl+'admin/draft');
		 } else {
			 //if user logged in as admin role_id :1 and steno level 2
			 if(req.session.userAdminSession.role_id == 1 || req.session.userAdminSession.role_id == 5){ 
				 //ready content for send email
				 var content = {};
				 var content = {
					  'name': data.result.user.name,
					  'email': data.result.user.mail,
					  'allData': data.result, 
					  'baseUrl': baseUrl,
					  'subject': 'Draft Approved',
					  'templatefoldername': 'draftApprover',
				 };
				 //Sending new password via Email
				 Email.send_email(content); 
			 }
			 req.flash('success', 'Draft approved successfully.');
			 res.redirect(baseUrl+'admin/draft');
		 }
	});
}	

exports.sendEmailToStenos = function(stenoId, draftName) {
	   console.log("======draftName=====");
	   console.log(draftName);
	   User.findOne({ '_id' : stenoId}) 
	                .select(['_id', 'name', 'mail'])
					.exec(function(err, result) {
						if (err) {
							data.result = '';
						} else {
							 //ready content for send email
							 result.draftName = draftName;
							 var content = {};
							 var content = {
								  'name': result.name,
								  'email': result.mail,
								  'allData': result, 
								  'subject': 'OYO || New draft is assigned',
								  'templatefoldername': 'draftAssign',
							 };
							 console.log(content);
							
							 //Sending new password via Email
							 Email.send_email(content); 
						}
					});
	
}	

exports.delete = function(req, res) {
	var data = {};
	
	Draft.findOneAndRemove({ _id: req.params.id }, function (err, resultForDelete) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl+'admin/draft');
		}else{
			req.flash('success', 'Draft deleted successfully.');
			res.redirect(baseUrl+'admin/draft');
		}
	}); 
}

exports.changeStatus = function(req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = req.params.status;
	
	Draft.update({ _id: req.params.id}, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl+'admin/draft');
		}else{
			req.flash('success', 'Draft updated successfully.');
			res.redirect(baseUrl+'admin/draft');
		}
	});  
}

exports.statesWiseCourts = function(req, res) {
	var data = {};
	var stateId = req.query.stateId;
	
	Court.find({'status': 'active', 'state': stateId})
			 .select(['_id', 'name'])
			 .exec(function(err, result) {
					if (err) {
						return res.send('Sorry no court found.');
					} else {
						return res.send(result);				
					}
			 });
}