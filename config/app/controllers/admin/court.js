var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var State = require('../../models/admin/state');
var Court = require('../../models/admin/court');
var lowerCase = require('lower-case');
var trim = require('trim');

exports.listing = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session; 
	data.dateFormat = dateFormat;
	data.lowerCase = lowerCase;
	data.trim = trim;
	
	var statusByStatus = ['active', 'inactive'];
	Court.find({'status': { $in: statusByStatus }
			   })
			 .populate('state')
			 .sort({'created_date': -1})
			 .exec(function(err, result) {
					if (err) {
						data.result = '';
						res.render('admin/court/listing', data);
					} else {
						data.result = result;  
						res.render('admin/court/listing', data);						
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
	    Court.find({'status': { $in: statusByStatus },
					'$or':[
					          {name:new RegExp(req.body.search.value,'i')},
						      {status:new RegExp(req.body.search.value,'i')},
						      //{state:new RegExp(req.body.search.value,'i')},
						      {district:new RegExp(req.body.search.value,'i')},
						      {tehsil:new RegExp(req.body.search.value,'i')}
						  ]
				 })
				.populate('state')
				.limit(lengthLocal)
				.skip(skipLocal)
				//.sort({'name': -1})
				.sort({[extra_sort_field_name]: extra_sort_field_value}) //working code
				.exec(function(err, result) {
						if (err) {
							console.log(err);
						} else {
							    /**For get count **/
								Court.count({'status': { $in: statusByStatus }, 
								   '$or':[
											  {name:new RegExp(req.body.search.value,'i')},
											  {status:new RegExp(req.body.search.value,'i')},
											 // {state:new RegExp(req.body.search.value,'i')},
											  {district:new RegExp(req.body.search.value,'i')},
											  {tehsil:new RegExp(req.body.search.value,'i')}
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

exports.add = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session; 
	State.find({'status' : 'active'})
			  .sort({'state': 1})
			  .exec(function(err, states) {
					if (err) {
						return done(err);
					} else {
						data.states = states;
						data.dateFormat = dateFormat;
						res.render('admin/court/add', data);
					}
			 });
}


exports.save = function(req, res) {
	var newCourt = new Court();
	var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
	
	newCourt._id = mongoose.Types.ObjectId();
	newCourt.name = req.body.name;
	newCourt.district = req.body.district;
	newCourt.tehsil = req.body.tehsil;
	newCourt.state = req.body.state;
	newCourt.status = 'inactive'; 
	newCourt.created_date = day;
	newCourt.updated_date = day;
	
	newCourt.save(function(err) {
		if (err)
			throw err;
		
		req.flash('success', 'Court saved successfully.');
		res.redirect(baseUrl+'admin/court');
	});
}


exports.edit = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	
	State.find({'status' : 'active'})
		  .sort({'state': 1})
		  .exec(function(err, states) {
				if (err) {
					return done(err);
				} else {
					data.states = states;
					Court.findOne({ '_id' : req.params.id}, function(err, result) {
						if (err) {
							res.send(err);
						} else {
							data.result = result;
							res.render('admin/court/edit', data);
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
	
	State.find({'status' : 'active'}, function(err, states) {
		if (err) {
			return done(err);
		} else {
			data.states = states;
			Court.findOne({ '_id' : req.params.id}, function(err, result) {
				if (err) {
					res.send(err);
				} else {
					data.result = result;
					res.render('admin/court/view', data);
				}
			});
		}
	});

}

exports.update = function(req, res) {
	var data = {};
	if(req.body.password == ''){
		req.body.password = req.body.old_password;
	}else{
		req.body.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null);
	}
	
	req.body.updated_date = new Date();
	Court.update({ _id: req.body._id}, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl+'admin/court');
		}else{
			req.flash('success', 'Court updated successfully.');
			res.redirect(baseUrl+'admin/court');
		}
	}); 
}

exports.changeStatus = function(req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = req.params.status;
	
	Court.update({ _id: req.params.id}, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect('back');
		}else{
			req.flash('success', 'Court updated successfully.');
			res.redirect('back');
		}
	});  
}

exports.delete = function(req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = 'delete';
	
	Court.update({ _id: req.params.id}, req.body, function (err, deletedResult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect('back');
		}else{
			req.flash('success', 'Court deleted successfully.');
			res.redirect('back');
		}
	}); 
}
