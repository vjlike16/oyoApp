var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var mongoose = require('mongoose');
var Subscription = require('../../models/admin/subscription');


exports.add = function(req, res) {
	Subscription.findOne({ '_id' : '59ca1db79a0a980160fa630d'}, function(err, result) {
		if (err) {
			res.send(err);
		} else {
			
			res.render('admin/subscription/add', {
				error : req.flash("error"),
				success: req.flash("success"),
				session:req.session,
				result: result
			});
		}
	});
	
}


exports.save = function(req, res) {
	
	/*********************** Dedicated Login ID **************************/
	if(req.body.dloginidfree=='on'){
		var dloginidfreeval='1';
	}else{
		var dloginidfreeval='0';
	}
	
	if(req.body.dloginidbronze=='on'){
		var dloginidbronzeval='1';
	}else{
		var dloginidbronzeval='0';
	}
	
	if(req.body.dloginidsilver=='on'){
		var dloginidsilverval='1';
	}else{
		var dloginidsilverval='0';
	}
	
	if(req.body.dloginidgold=='on'){
		var dloginidgoldval='1';
	}else{
		var dloginidgoldval='0';
	}
	
	
	/*********************** Save Favourite formats **************************/
	
	if(req.body.favfformatfree=='on'){
		var favfformatfreeval='1';
	}else{
		var favfformatfreeval='0';
	}
	
	if(req.body.favfformatbronze=='on'){
		var favfformatbronzeval='1';
	}else{
		var favfformatbronzeval='0';
	}
	
	if(req.body.favfformatsilver=='on'){
		var favfformatsilverval='1';
	}else{
		var favfformatsilverval='0';
	}
	
	if(req.body.favfformatgold=='on'){
		var favfformatgoldval='1';
	}else{
		var favfformatgoldval='0';
	}
	/*********************** Continue dictation from last saved **************************/
	if(req.body.contdictationfree=='on'){
		var contdictationfreeval='1';
	}else{
		var contdictationfreeval='0';
	}
	
	if(req.body.contdictationbronze=='on'){
		var contdictationbronzeval='1';
	}else{
		var contdictationbronzeval='0';
	}
	
	if(req.body.contdictationsilver=='on'){
		var contdictationsilverval='1';
	}else{
		var contdictationsilverval='0';
	}
	
	if(req.body.contdictationgold=='on'){
		var contdictationgoldval='1';
	}else{
		var contdictationgoldval='0';
	}
	/***********************Get draft of PDF and word file on Email**************************/
	if(req.body.getdraftfree=='on'){
		var getdraftfreeval='1';
	}else{
		var getdraftfreeval='0';
	}
	
	if(req.body.getdraftbronze=='on'){
		var getdraftbronzeval='1';
	}else{
		var getdraftbronzeval='0';
	}
	
	if(req.body.getdraftsilver=='on'){
		var getdraftsilverval='1';
	}else{
		var getdraftsilverval='0';
	}
	
	if(req.body.getdraftgold=='on'){
		var getdraftgoldval='1';
	}else{
		var getdraftgoldval='0';
	}
	
	/**********************No. of Revisions for each drafts***********************/
	
	
	var norevisiondraftfreeval = req.body.norevisiondraftfree;
	var norevisiondraftbronzeval = req.body.norevisiondraftbronze;
	var norevisiondraftsilverval = req.body.norevisiondraftsilver;
	var norevisiondraftgoldval = req.body.norevisiondraftgold;
	
	
	/*******************************Word limits **********************************************/
	
	if(req.body.wordlimitfree!=''){
		var wordlimitfreeval=req.body.wordlimitfree;
	}else{
		var wordlimitfreeval='0';
	}
	
	if(req.body.wordlimitbronze!=''){
		var wordlimitbronzeval=req.body.wordlimitbronze;
	}else{
		var wordlimitbronzeval='0';
	}
	
	if(req.body.wordlimitsilver!=''){
		var wordlimitsilverval=req.body.wordlimitsilver;
	}else{
		var wordlimitsilverval='0';
	}
	
	if(req.body.wordlimitgold!=''){
		var wordlimitgoldval=req.body.wordlimitgold;
	}else{
		var wordlimitgoldval='0';
	}
	
	/****************** From App ***************/
	if(req.body.fromappfree=='on'){
		var fromappfreeval='1';
	}else{
		var fromappfreeval='0';
	}
	
	if(req.body.fromappbronze=='on'){
		var fromappbronzeval='1';
	}else{
		var fromappbronzeval='0';
	}

	if(req.body.fromappsilver=='on'){
		var fromappsilverval='1';
	}else{
		var fromappsilverval='0';
	}
	
	if(req.body.fromappgold=='on'){
		var fromappgoldval='1';
	}else{
		var fromappgoldval='0';
	}
	
	
	/********************* From Website*****************************/
	if(req.body.fromwebsitefree=='on'){
		var fromwebsitefreeval='1';
	}else{
		var fromwebsitefreeval='0';
	}
	
	if(req.body.fromwebsitebronze=='on'){
		var fromwebsitebronzeval='1';
	}else{
		var fromwebsitebronzeval='0';
	}
	
	if(req.body.fromwebsitesilver=='on'){
		var fromwebsitesilverval='1';
	}else{
		var fromwebsitesilverval='0';
	}
	
	if(req.body.fromwebsitegold=='on'){
		var fromwebsitegoldval='1';
	}else{
		var fromwebsitegoldval='0';
	}
	
	/*******************Get live transcription **********************/
	if(req.body.livetransactionfree=='on'){
		var livetransactionfreeval='1';
	}else{
		var livetransactionfreeval='0';
	}
	
	if(req.body.livetransactionbronze=='on'){
		var livetransactionbronzeval='1';
	}else{
		var livetransactionbronzeval='0';
	}
	
	if(req.body.livetransactionsilver=='on'){
		var livetransactionsilverval='1';
	}else{
		var livetransactionsilverval='0';
	}
	
	if(req.body.livetransactiongold=='on'){
		var livetransactiongoldval='1';
	}else{
		var livetransactiongoldval='0';
	}
	
	
	/*************************Payment or recharge option ***********/
	if(req.body.paymentrechargefree=='on'){
		var paymentrechargefreeval='1';
	}else{
		var paymentrechargefreeval='0';
	}
	
	if(req.body.paymentrechargebronze=='on'){
		var paymentrechargebronzeval='1';
	}else{
		var paymentrechargebronzeval='0';
	}
	
	if(req.body.paymentrechargesilver=='on'){
		var paymentrechargesilverval='1';
	}else{
		var paymentrechargesilvervalval='0';
	}
	
	if(req.body.paymentrechargegold=='on'){
		var paymentrechargegoldval='1';
	}else{
		var paymentrechargegoldval='0';
	}
	
	/********************Get Customised formats as per your office need**************************/
	if(req.body.customizdformatofficefree=='on'){
		var customizdformatofficefreeval='1';
	}else{
		var customizdformatofficefreeval='0';
	}
	
	if(req.body.customizdformatofficebronze=='on'){
		var customizdformatofficebronzeval='1';
	}else{
		var customizdformatofficebronzeval='0';
	}
	
	if(req.body.customizdformatofficesilver=='on'){
		var customizdformatofficesilverval='1';
	}else{
		var customizdformatofficesilverval='0';
	}
	
	if(req.body.customizdformatofficegold=='on'){
		var customizdformatofficegolddval='1';
	}else{
		var customizdformatofficegolddval='0';
	}
	
	/**************************Dedicated server space - limited*****************/
	if(req.body.serverspacefree=='on'){
		var serverspacefreeval='1';
	}else{
		var serverspacefreeval='0';
	}
	
	if(req.body.serverspacebronze=='on'){
		var serverspacebronzeval='1';
	}else{
		var serverspacebronzeval='0';
	}
	
	if(req.body.serverspacesilver=='on'){
		var serverspacesilverval='1';
	}else{
		var serverspacesilverval='0';
	}
	
	if(req.body.serverspacegold=='on'){
		var serverspacegolddval='1';
	}else{
		var serverspacegolddval='0';
	}
	
	/*********************Can give dictation in parts *************/
	if(req.body.dictinpartfree=='on'){
		var dictinpartfreeval='1';
	}else{
		var dictinpartfreeval='0';
	}
	
	if(req.body.dictinpartbronze=='on'){
		var dictinpartbronzeval='1';
	}else{
		var dictinpartbronzeval='0';
	}
	
	if(req.body.dictinpartsilver=='on'){
		var dictinpartsilverval='1';
	}else{
		var dictinpartsilverval='0';
	}
	
	if(req.body.dictinpartgold=='on'){
		var dictinpartgolddval='1';
	}else{
		var dictinpartgolddval='0';
	}
	
	/****************Offline mode**********/
	if(req.body.offmodefree=='on'){
		var offmodefreeval='1';
	}else{
		var offmodefreeval='0';
	}
	
	if(req.body.offmodebronze=='on'){
		var offmodebronzeval='1';
	}else{
		var offmodebronzeval='0';
	}
	
	if(req.body.offmodesilver=='on'){
		var offmodesilverval='1';
	}else{
		var offmodesilverval='0';
	}
	
	if(req.body.offmodegold=='on'){
		var offmodetgoldval='1';
	}else{
		var offmodetgoldval='0';
	}
	/****************online mode**********/
	if(req.body.onmodefree=='on'){
		var onmodefreeval='1';
	}else{
		var onmodefreeval='0';
	}
	
	if(req.body.onmodebronze=='on'){
		var onmodebronzeval='1';
	}else{
		var onmodebronzeval='0';
	}
	
	if(req.body.onmodesilver=='on'){
		var onmodesilverval='1';
	}else{
		var onmodesilverval='0';
	}
	
	if(req.body.onmodegold=='on'){
		var onmodegoldval='1';
	}else{
		var onmodegoldval='0';
	}
	
	
	/**********************Transcription Eroor If any***********************/
	var transactionerrorfreeval = req.body.transactionerrorfree;
	var transactionerrorbronzeval = req.body.transactionerrorbronze;
	var transactionerrorsilverval = req.body.transactionerrorsilver;
	var transactionerrorgoldval = req.body.transactionerrorgold;
	
	
	/****************Upload of formats**********/
	if(req.body.uploadformatfree=='on'){
		var uploadformatfreeval='1';
	}else{
		var uploadformatfreeval='0';
	}
	
	if(req.body.uploadformatbronze=='on'){
		var uploadformatbronzeval='1';
	}else{
		var uploadformatbronzeval='0';
	}
	
	if(req.body.uploadformatsilver=='on'){
		var uploadformatsilverval='1';
	}else{
		var uploadformatsilverval='0';
	}
	
	if(req.body.uploadformatgold=='on'){
		var uploadformatgoldval='1';
	}else{
		var uploadformatgoldval='0';
	}
	
	/***************************Add image*****************************/
	
	
	if(req.body.addimagefree=='on'){
		var addimagefreeval='1';
	}else{
		var addimagefreeval='0';
	}
	
	if(req.body.addimagebronze=='on'){
		var addimagebronzeval='1';
	}else{
		var addimagebronzeval='0';
	}
	
	if(req.body.addimagesilver=='on'){
		var addimagesilverval='1';
	}else{
		var addimagesilverval='0';
	}
	
	if(req.body.addimagegold=='on'){
		var addimagegoldval='1';
	}else{
		var addimagegoldval='0';
	}
	
	
	/*******************Add Annexures**********************************/
	
	if(req.body.addannexuresfree=='on'){
		var addannexuresfreeval='1';
	}else{
		var addannexuresfreeval='0';
	}
	
	if(req.body.addannexuresbronze=='on'){
		var addannexuresbronzeval='1';
	}else{
		var addannexuresbronzeval='0';
	}
	
	if(req.body.addannexuressilver=='on'){
		var addannexuressilverval='1';
	}else{
		var addannexuressilverval='0';
	}
	
	if(req.body.addannexuresgold=='on'){
		var addannexuresgoldval='1';
	}else{
		var addannexuresgoldval='0';
	}
	/***************************Can listen your own dictation****************/
	if(req.body.listenurdictationfree=='on'){
		var listenurdictationfreeval='1';
	}else{
		var listenurdictationfreeval='0';
	}
	
	if(req.body.listenurdictationbronze=='on'){
		var listenurdictationbronzeval='1';
	}else{
		var listenurdictationbronzeval='0';
	}
	
	if(req.body.listenurdictationsilver=='on'){
		var listenurdictationsilverval='1';
	}else{
		var listenurdictationsilverval='0';
	}
	
	if(req.body.listenurdictationgold=='on'){
		var listenurdictationgoldval='1';
	}else{
		var listenurdictationgoldval='0';
	}
	/***************************************Welcome kit with yearly subscriptions *************/
	if(req.body.welcomekitsubscriptionfree=='on'){
		var welcomekitsubscriptionfreeval='1';
	}else{
		var welcomekitsubscriptionfreeval='0';
	}
	
	if(req.body.welcomekitsubscriptionbronze=='on'){
		var welcomekitsubscriptionbronzeval='1';
	}else{
		var welcomekitsubscriptionbronzeval='0';
	}
	
	if(req.body.welcomekitsubscriptionsilver=='on'){
		var welcomekitsubscriptionsilverval='1';
	}else{
		var welcomekitsubscriptionsilverval='0';
	}
	
	if(req.body.welcomekitsubscriptiongold=='on'){
		var welcomekitsubscriptiongoldval='1';
	}else{
		var welcomekitsubscriptiongoldval='0';
	}
	
	/**********************Transcription Eroor If any***********************/
	var freewordsfreeval = req.body.freewordsfree;
	var freewordsbronzeval = req.body.freewordsbronze;
	var freewordssilverval = req.body.freewordssilver;
	var freewordsgoldval = req.body.freewordsgold;
	
	
	/**************************Expiry of words purchased *********************/
	var expirywordspurchasedfreeval = req.body.expirywordspurchasedfree;
	
	if(req.body.expirywordspurchasedbronze=='on'){
		var expirywordspurchasedbronzeval='1';
	}else{
		var expirywordspurchasedbronzeval='0';
	}
	
	if(req.body.expirywordspurchasedsilver=='on'){
		var expirywordspurchasedsilverval='1';
	}else{
		var expirywordspurchasedsilverval='0';
	}
	
	if(req.body.expirywordspurchasedgold=='on'){
		var expirywordspurchasedgoldval='1';
	}else{
		var expirywordspurchasedgoldval='0';
	}
	
	/**************************Priority in transcription *******************/
	var priorityintransactionfreeval = req.body.priorityintransactionfree;
	var priorityintransactionbronzeval = req.body.priorityintransactionbronze;
	var priorityintransactionsilverval = req.body.priorityintransactionsilver;
	var priorityintransactiongoldval = req.body.priorityintransactiongold;
	
	/********************************Yearly Packages benefits**************/
	var yearlypackagebenifitfreeval = req.body.yearlypackagebenifitfree;
	var yearlypackagebenifitbronzeval = req.body.yearlypackagebenifitbronze;
	var yearlypackagebenifitsilverval = req.body.yearlypackagebenifitsilver;
	var yearlypackagebenifitgoldval = req.body.yearlypackagebenifitgold;
	
	/***************************Rates per month ****************************/
	var ratepermonthfreeval = req.body.ratepermonthfree;
	var ratepermonthbronzeval = req.body.ratepermonthbronze;
	var ratepermonthsilverval = req.body.ratepermonthsilver;
	var ratepermonthgoldval = req.body.ratepermonthgold;
	/***************************Extra Words rate****************************/
	var extrawordsratefreeval = req.body.extrawordsratefree;
	var extrawordsratebronzeval = req.body.extrawordsratebronze;
	var extrawordsratesilverval = req.body.extrawordsratesilver;
	var extrawordsrategoldval = req.body.extrawordsrategold;
	
	
	/*********************************************************************/
	//free
	var freeobj = {
		dloginidfree: dloginidfreeval,
		contdictationfree: contdictationfreeval,
		favfformatfree: favfformatfreeval,
		getdraftfree: getdraftfreeval,
		wordlimitfree: wordlimitfreeval,
		from_appfree : fromappfreeval,
		fromwebsitefree: fromwebsitefreeval,
		norevisiondraftfree: norevisiondraftfreeval,
		livetransactionfree: livetransactionfreeval,
		paymentrechargefree: paymentrechargefreeval,
		customizdformatofficefree: customizdformatofficefreeval,
		serverspacefree: serverspacefreeval,
		dictinpartfree: dictinpartfreeval,
		offmodetfree: offmodefreeval,
		onmodefree: onmodefreeval,
		transactionerrorfree: transactionerrorfreeval,
		uploadformatfree: uploadformatfreeval,
		addimagefree: addimagefreeval,
		addannexuresfree: addannexuresfreeval,
		listenurdictationfree: listenurdictationfreeval,
		welcomekitsubscriptionfree: welcomekitsubscriptionfreeval,
		freewordsfree: freewordsfreeval,
		expirywordspurchasedfree: expirywordspurchasedfreeval,
		priorityintransactionfree: priorityintransactionfreeval,
		yearlypackagebenifitfree: yearlypackagebenifitfreeval,
		ratepermonthfree: ratepermonthfreeval,
		extrawordsratefree: extrawordsratefreeval
	};
	//bronze
	var bronzeobj = {
		dloginidbronze: dloginidbronzeval,
		contdictationbronze: contdictationbronzeval,
		favfformatbronze: favfformatbronzeval,
		getdraftbronze: getdraftbronzeval,
		wordlimitbronze: wordlimitbronzeval,
		from_appbronze: fromappbronzeval,
		fromwebsitebronze: fromwebsitebronzeval,
		norevisiondraftbronze: norevisiondraftbronzeval,
		livetransactionbronze: livetransactionbronzeval,
		paymentrechargebronze: paymentrechargebronzeval,
		customizdformatofficebronze: customizdformatofficefreeval,
		serverspacebronze: serverspacebronzeval,
		dictinpartbronze: dictinpartbronzeval,
		offmodetbronze: offmodebronzeval,
		onmodebronze: onmodebronzeval,
		transactionerrorbronze: transactionerrorbronzeval,
		uploadformatbronze: uploadformatbronzeval,
		addimagebronze: addimagebronzeval,
		addannexuresbronze: addannexuresbronzeval,
		listenurdictationbronze: listenurdictationbronzeval,
		welcomekitsubscriptionbronze: welcomekitsubscriptionbronzeval,
		freewordsbronze: freewordsbronzeval,
		expirywordspurchasedbronze: expirywordspurchasedbronzeval,
		priorityintransactionbronze: priorityintransactionbronzeval,
		yearlypackagebenifitbronze: yearlypackagebenifitbronzeval,
		ratepermonthbronze: ratepermonthbronzeval, 
		extrawordsratebronze: extrawordsratebronzeval
	};
	//silver
	var silverobj = {
		dloginidsilver: dloginidsilverval,
		contdictationsilver: contdictationsilverval,
		getdraftsilver: getdraftsilverval,
		favfformatsilver: favfformatsilverval,
		wordlimitsilver: wordlimitsilverval,
		fromappsilver: fromappsilverval,
		fromwebsitesilver: fromwebsitesilverval,
		norevisiondraftsilverval: norevisiondraftsilverval,
		livetransactionsilver: livetransactionsilverval,
		paymentrechargesilver: paymentrechargesilverval,
		customizdformatofficesilver: customizdformatofficesilverval,
		serverspacesilver: serverspacesilverval,
		dictinpartsilver: dictinpartsilverval,
		offmodetsilver: offmodesilverval,
		onmodesilver: onmodesilverval,
		transactionerrorsilver: transactionerrorsilverval,
		uploadformatsilver: uploadformatsilverval,
		addimagesilver: addimagesilverval,
		addannexuressilver: addannexuressilverval,
		listenurdictationsilver: listenurdictationsilverval,
		welcomekitsubscriptionsilver: welcomekitsubscriptionsilverval,
		freewordssilver: freewordssilverval,
		expirywordspurchasedsilver: expirywordspurchasedsilverval,
		priorityintransactionsilver: priorityintransactionsilverval,
		yearlypackagebenifitsilver: yearlypackagebenifitsilverval,
		ratepermonthsilver: ratepermonthsilverval, 
		extrawordsratesilver: extrawordsratesilverval
	
	};
	
	//gold
	var goldobj = {
		favfformatgold: favfformatgoldval,
		dloginidgold: dloginidgoldval,
		contdictationgold: contdictationgoldval,
		getdraftgold: getdraftgoldval,
		wordlimitgold: wordlimitgoldval,
		fromappgold:fromappgoldval,
		fromwebsitegold: fromwebsitegoldval,
		norevisiondraftgold: norevisiondraftgoldval,
		livetransactiongold: livetransactiongoldval,
		paymentrechargegold: paymentrechargegoldval,
		customizdformatofficegold: customizdformatofficegolddval,
		serverspacegold: serverspacegolddval,
		dictinpartgold: dictinpartgolddval,
		offmodetgold: offmodetgoldval,
		onmodegold: onmodegoldval,
		transactionerrorgold: transactionerrorgoldval,
		uploadformatgold: uploadformatgoldval,
		addimagegold: addimagegoldval,
		addannexuresgold: addannexuresgoldval,
		listenurdictationgold: listenurdictationgoldval,
		welcomekitsubscriptiongold: welcomekitsubscriptiongoldval,
		freewordsgold: freewordsgoldval,
		expirywordspurchasedgold: expirywordspurchasedgoldval,
		priorityintransactiongold: priorityintransactiongoldval,
		yearlypackagebenifitgold: yearlypackagebenifitgoldval,
		ratepermonthgold: ratepermonthgoldval, 
		extrawordsrategold: extrawordsrategoldval
	};
	
	
	
	//req.body._id = '59ca1db79a0a980160fa630d';
	var day = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
	req.body.updated_date = day;
	
	req.body.free = freeobj;
	req.body.bronze = bronzeobj;
	req.body.silver = silverobj;
	req.body.gold = goldobj;
	req.body.package = req.body.package;
	
	Subscription.update({ _id: '59ca1db79a0a980160fa630d'}, req.body, function (err, updatedresult) {
		if (err) {
			req.flash('error', 'Sorry something went wrong.');
			res.redirect(baseUrl+'admin/subscription/add');
		}else{
			req.flash('success', 'Subscription updated successfully.');
			res.redirect(baseUrl+'admin/subscription/add');
			
		}
	});
	

}