var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var lowerCase = require('lower-case');
var Static_content = require('../../models/admin/static_content');
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
	Static_content.find({'status': { $in: statusByStatus }
		   })
		  .sort({'created_date': -1})
		  .exec(function(err, result) {
				if (err) {
					data.result = '';
					res.render('admin/static_content/listing', data);
				} else {
					data.result = result;  
					res.render('admin/static_content/listing', data);		
				}
		 });
	
}

exports.add = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session; 
	res.render('admin/static_content/add', data);
}


exports.save = function(req, res) {
	var newStatic_content = new Static_content();
	var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
	
	newStatic_content._id = mongoose.Types.ObjectId();
	newStatic_content.name = req.body.name;
	newStatic_content.pagecontent = req.body.pagecontent;
	newStatic_content.status = 'active'; 
	newStatic_content.created_date = day;
	newStatic_content.updated_date = day;
	
	newStatic_content.save(function(err) {
		if (err)
			throw err;
		
		req.flash('success', 'Content saved successfully.');
		res.redirect(baseUrl+'admin/static_content');
	});
}


exports.edit = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	
	Static_content.findOne({ '_id' : req.params.id}, function(err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/static_content/edit', data);
		}
	});
}

exports.view = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session;
	
	Static_content.findOne({ '_id' : req.params.id}, function(err, result) {
		if (err) {
			res.send(err);
		} else {
			data.result = result;
			res.render('admin/static_content/view', data);
		}
	});

}

exports.update = function(req, res) {
	var data = {};
	req.body.updated_date = new Date();

	Static_content.update({ _id: req.body._id}, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl+'admin/static_content');
		}else{
			req.flash('success', 'Record updated successfully.');
			res.redirect(baseUrl+'admin/static_content');
		}
	}); 
}

exports.changeStatus = function(req, res) {
	var data = {};
	req.body.updated_date = new Date();
	req.body.status = req.params.status;
	
	Static_content.update({ _id: req.params.id}, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl+'admin/static_content');
		}else{
			req.flash('success', 'Record updated successfully.');
			res.redirect(baseUrl+'admin/static_content');
		}
	});  
}

exports.delete = function(req, res) {
	var data = {};
	
	Static_content.findOneAndRemove({ _id: req.params.id }, function (err, resultForDelete) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl+'admin/static_content');
		}else{
			req.flash('success', 'Record deleted successfully.');
			res.redirect(baseUrl+'admin/static_content');
		}
	}); 
}

exports.checknameexist = function(req, res) {
	var name = req.body.name;
	Static_content.findOne(
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
	Static_content.findOne(
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

exports.test = function(req, res) {
	var data = {};
	data.error = req.flash("error");
	data.success = req.flash("success");
	data.session = req.session; 
	res.render('admin/static_content/test', data);
}

exports.test_save = function(req, res) {
    console.log("=================="+ req.body.pagecontent);
	console.log("                     ");
	console.log("!!!!!!!!!!**************#################");
}
