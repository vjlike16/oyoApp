var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Format = require('../../models/admin/format');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var Customer = require('../../models/home');
var lowerCase = require('lower-case');
var multiparty = require('multiparty');
var fs = require('fs');

var AWS = require('aws-sdk');
AWS.config.update({
					accessKeyId: AWS_AccessKeyId, 
					secretAccessKey: AWS_SecretAccessKey
				});
//AWS.config.update({region: 'Asia Pacific (Mumbai)'});
var s3 = new AWS.S3(); 
var myBucket = AWS_DraftBucket;

// https://s3.ap-south-1.amazonaws.com/OYOdrafts/1510232144840_images(2).jpg
//https://OYOdrafts.s3.ap-south-1.amazonaws.com/1510727922893_mpthreetest.mp3
// https://OYOdrafts.s3.amazonaws.com/1510232144840_images(2).jpg
//https://github.com/pillarjs/multiparty for s3 also
exports.add = function(req, res) {
	res.render('admin/test/add', {
			error : req.flash("error"),
			success: req.flash("success"),
			session:req.session
	});
}


exports.save = function(req, res) {
    var form = new multiparty.Form();
	form.parse(req, function(err, fields, files) {
			req.body = fields;
			req.files = files;
			console.log(req.body);
			console.log(req.files);
	});
};


exports.saveOnS3Bucket = function(req, res) {
	   var form = new multiparty.Form();
	   form.parse(req, function (err, fields, files) {
				var img = files.uploadDocs[0]; 
				var value = fields.value;

				fs.readFile(img.path, function (err, data) {
						 var path = img.path;
						 var size = img.size;
						 var stream = fs.createReadStream(img.path);
						 var filename = img.originalFilename;
						 filename = filename.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
						 var newFileName = Date.now() + '_' + filename;
						 var params = {
											Bucket: myBucket, 
											Body: stream,
											Key: newFileName,
											ACL: 'public-read',
											ContentLength: stream.byteCount,
											maxTries: 10
										};
						
						 s3.upload(params, function (err, data) {
								if (err) {
									 console.log(err, err.stack);
								} else {
									 console.log("Successfully uploaded data to Bucket"+data);
									 res.redirect('/admin/test/add');
								}
						});
			   });
		});
};

exports.saveOnS3BucketMultiple = function(req, res) {
   var form = new multiparty.Form();
   form.parse(req, function (err, fields, files) {
            var allFiles = files.uploadDocs; 
		    var value = fields.value;
			
			var params = [];
/* 			allFiles.forEach(function(File) {
					  console.log(File);
					  var path = File.path;
					  var stream = fs.createReadStream(File.path);
					  
					  var filename = File.originalFilename;
					  filename = filename.replace(/\s+/g, '').toLowerCase();
					  var newFileName = Date.now() + '_' + filename;
					  
					  var params = {
										Bucket: myBucket, 
										Body: stream,
										Key: newFileName,
										ACL: 'public-read'
									};
			}); */
			
			  var params =[
								  {
									    Bucket: myBucket, 
										Body: 'test',
										Key: 'abc.jpg',
										ACL: 'public-read'
								  }, 
								  {
										Bucket: myBucket, 
										Body: 'test',
										Key: 'def.jpg',
										ACL: 'public-read'
								  }
						];
			 s3.upload(params, function (err, data) {
					if (err) {
						 console.log(err, err.stack);
					} else {
						 console.log("Successfully uploaded data to Bucket"+data);
					}
			});
			//res.redirect('/admin/test/add');
			
	});
}; 

/* exports.saveOnS3BucketMultiple = function(req, res) {
   var form = new multiparty.Form();
   form.parse(req, function (err, fields, files) {
            var allFiles = files.uploadDocs; 
		    var value = fields.value;
			
			allFiles.forEach(function(File) {
					  console.log(File);
					  var path = File.path;
					  var stream = fs.createReadStream(File.path);
					  
					  var filename = File.originalFilename;
					  filename = filename.replace(/\s+/g, '').toLowerCase();
					  var newFileName = Date.now() + '_' + filename;
					  
					  var params = {
										Bucket: myBucket, 
										Body: stream,
										Key: newFileName,
										ACL: 'public-read',
										ContentLength: stream.byteCount,
										maxTries: 10
									};
					  fs.readFile(File.path, function (err, data) {
							   s3.upload(params, function (err, data) {
										if (err) {
											 console.log(err, err.stack);
										} else {
											 console.log("Successfully uploaded data to Bucket"+data);
										}
								});
					   });	  
			});
	});
};  */

exports.delete = function(req, res) {
    /** for single file delete 
		var fileForDelete = '1510229754118_download(5).jpg';
		var params = {Bucket: myBucket, Key: fileForDelete};
		s3.deleteObject(params, function (err, data) {
			if (err) {
				 console.log(err, err.stack);
			} else {
				  console.log("Successfully deleted file from Bucket"+data);
			}
		});
	**/
	
	/**for delete multiple files **/
	  var params = {
		  Bucket: myBucket, 
		  Delete: {
			   Objects: [
				  {
						Key: "1510231830464_download(3).jpg"
				  }, 
				  {
						Key: "1510231830469_download(4).jpg"
				  }
			   ], 
			   Quiet: false
		  }
	 };
	 s3.deleteObjects(params, function (err, data) {
			if (err) {
				 console.log(err, err.stack);
			} else {
				  console.log("Successfully deleted file from Bucket"+data);
			}
	 });
	
};


