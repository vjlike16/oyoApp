var express = require('express');
var app = express();
var State = require('../app/models/admin/state');

global.statesListing = function(req, res){ 
 	State.find({'status' : 'active'})
		  .sort({'state': 1})
		  .exec(function(err, states) {
			    console.log(states);
				if (!err && states) {
					return states;
				} 
	      });
}; 

global.removeSpace = function(str){ 
    if(!str){return 'Parameter is missing';}
	return str.replace(/ /g,''); 
};

global.strToLower = function(str){ 
	return str.toLowerCase(); 
};

global.trimRemoveSpecial = function(str){ 
	str.trim(); 
	return str.replace(/[^a-zA-Z0-9 ]/g, "");
};

global.trimRemoveSpecialLowerCase = function(str){ 
	if(!str){return 'Parameter is missing';}
	str.toLowerCase(); 
	str.replace(/ /g,''); 
	return str.replace(/[^a-zA-Z ]/g, "");
};

global.strToArray = function(string, chara){ 
	if(!string || !chara){return 'Need 2 parameter, first string and second character ex: (',')';}
};

global.nl2br = function(str, isXhtml){ 
	if (typeof str === 'undefined' || str === null) {
		return ''
	}
    var breakTag = (isXhtml || typeof isXhtml === 'undefined') ? '<br ' + '/>' : '<br>'
    return (str + '').replace(/(\r\n|\n\r|\r|\n)/g, breakTag + '$1');
};