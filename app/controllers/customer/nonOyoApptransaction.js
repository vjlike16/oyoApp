var appointments = require('../../models/customers/appointments');
var Async = require('async');
const moment = require('moment');
const { baseUrl } = require('../../../config/constants');
var dateFormat = require('dateformat');


exports.monthly_sales = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.type = "sales";
    data.tipType = "Month";
    data.sideDropDown = "non-oyyo";
    data.filterUrl = "oyyo/sales-filter/monthly"
    data.day_url = 'oyyo/performance';
    data.week_url = 'oyyo/performance/weekly-sales';
    data.month_url = 'oyyo/performance/monthly-sales';
    data.year_url = 'oyyo/performance/yearly-sales';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail, walk_in: false,
                    amount: { $gt: 0 },
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {
                        "month": { "$month": "$created_date" },
                        "year": { "$year": "$created_date" },
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            {
                $addFields: {
                    "_id.month": {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id.month", 1] }, then: "January" },
                                { case: { $eq: ["$_id.month", 2] }, then: "February" },
                                { case: { $eq: ["$_id.month", 3] }, then: "March" },
                                { case: { $eq: ["$_id.month", 4] }, then: "April" },
                                { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                { case: { $eq: ["$_id.month", 6] }, then: "June" },
                                { case: { $eq: ["$_id.month", 7] }, then: "July" },
                                { case: { $eq: ["$_id.month", 8] }, then: "August" },
                                { case: { $eq: ["$_id.month", 9] }, then: "September" },
                                { case: { $eq: ["$_id.month", 10] }, then: "October" },
                                { case: { $eq: ["$_id.month", 11] }, then: "November" },
                                { case: { $eq: ["$_id.month", 12] }, then: "December" },
                                // ...
                            ],
                            default: "December"
                        }
                    }
                }
            }]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                console.log(result)
                var month_data_list = []
                result.forEach(element => {

                    var objAr = element.data
                    //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = []
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(d[propName]);
                            }
                        });

                        var uniqueList = [...new Set(data)];

                        for (var i = 0; i < uniqueList.length; i++) {
                            var countt = 0.0;
                            for (var j = 0; j < objArr.length; j++) {
                                if (uniqueList[i] == objArr[j].title) {
                                    countt += parseFloat(objArr[j].amount);
                                }
                            }
                            send.push({
                                "count": data.filter(x => x == uniqueList[i]).length,
                                "title": uniqueList[i],
                                "amount": countt
                            });
                        }
                        return send;
                    }
                    month_data_list.push({ "monthName": `${element._id.month}-${element._id.year}`, data: getUniqueDataCount(objAr, "title") });
                });
                month_data_list.sort( function ( a, b ) {
                    return moment(b.monthName, 'MMMM-YYYY').format('MM') - moment(a.monthName, 'MMMM-YYYY').format('MM');
                    } );
                data.result = month_data_list;
                callback();
            })
        },
        function (callback) {
            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail, walk_in: false,
                amount: { $gt: 0 },
                status: { $ne: "Cancelled" },
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    const salesReports = [
                        { key: 'Jan', value1: 0.0, value2: 0 },
                        { key: 'Feb', value1: 0.0, value2: 0 },
                        { key: 'Mar', value1: 0.0, value2: 0 },
                        { key: 'Apr', value1: 0.0, value2: 0 },
                        { key: 'May', value1: 0.0, value2: 0 },
                        { key: 'Jun', value1: 0.0, value2: 0 },
                        { key: 'Jul', value1: 0.0, value2: 0 },
                        { key: 'Aug', value1: 0.0, value2: 0 },
                        { key: 'Sep', value1: 0.0, value2: 0 },
                        { key: 'Oct', value1: 0.0, value2: 0 },
                        { key: 'Nov', value1: 0.0, value2: 0 },
                        { key: 'Dec', value1: 0.0, value2: 0 }
                    ];
                    salesReports.reverse();
                    result.forEach(function (user, key, value) {
                        let monthName = moment(user.created_date).format("MMM");
                        let amount = parseFloat(user.amount);
                        salesReports.map(index => index.key == monthName ? index.value1 += amount : index.value);
                        salesReports.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                    });
                    // console.log("salesReports----------", salesReports);
                    salesReports.reverse();
                    data.salesReports = salesReports;
                    callback();
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.yearly_sales = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.type = "sales"
    data.filterUrl = "oyyo/sales-filter/yearly"
    data.day_url = 'oyyo/performance';
    data.week_url = 'oyyo/performance/weekly-sales';
    data.month_url = 'oyyo/performance/monthly-sales';
    data.year_url = 'oyyo/performance/yearly-sales';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    data.tipType = "Year";
    data.sideDropDown = "non-oyyo";

    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    amount: { $gt: 0 },
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        "year": { "$year": "$created_date" },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },

            ]).exec(function (err, result) {
                if (err)
                    throw err;
                console.log(result)
                var month_data_list = []
                result.forEach(element => {

                    var objAr = element.data
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = []
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(d[propName]);
                            }
                        });

                        var uniqueList = [...new Set(data)];

                        for (var i = 0; i < uniqueList.length; i++) {
                            var countt = 0.0;
                            for (var j = 0; j < objArr.length; j++) {
                                if (uniqueList[i] == objArr[j].title) {
                                    countt += parseFloat(objArr[j].amount);
                                }
                            }
                            send.push({
                                "count": data.filter(x => x == uniqueList[i]).length,
                                "title": uniqueList[i],
                                "amount": countt
                            });
                        }
                        return send;
                    }
                    /// console.log("getUniqueDataCount(objAr , 'title')", getUniqueDataCount(objAr , "title"));
                    month_data_list.push({ "yearName": element._id.year, data: getUniqueDataCount(objAr, "title") });
                });
                data.result = month_data_list;
                callback();
            })
        },
        function (callback) {
            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                amount: { $gt: 0 },
                status: { $ne: "Cancelled" },
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    var today = new Date();
                    var year = today.getFullYear();
                    const salesReports = [
                        { key: `${year}`, value1: 0.0, value2: 0 },
                        { key: `${year - 1}`, value1: 0.0, value2: 0 },
                        { key: `${year - 2}`, value1: 0.0, value2: 0 },
                    ];

                    result.forEach(function (user, key, value) {
                        //let monthName = moment(user.created_date).format("yyyy");
                        let monthName = new Date(user.created_date).getFullYear()
                        let amount = parseFloat(user.amount);
                        salesReports.map(index => index.key == monthName ? index.value1 += amount : index.value);
                        salesReports.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                    });
                    console.log("salesReports----------", salesReports);
                    salesReports.reverse();
                    data.salesReports = salesReports;
                    callback();
                }
            })
        }
    ]

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.day_sales = async function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.type = "sales";
    data.tipType = "Day";
    data.sideDropDown = "non-oyyo"
    data.filterUrl = "oyyo/sales-filter/daily";
    data.day_url = 'oyyo/performance';
    data.week_url = 'oyyo/performance/weekly-sales';
    data.month_url = 'oyyo/performance/monthly-sales';
    data.year_url = 'oyyo/performance/yearly-sales';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
   // console.log("req.app.locals.userCustomerSession.mail", req.app.locals.userCustomerSession.mail);
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail, walk_in: false,
                    amount: { $gt: 0 },
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        yearMonthDay: { $dateToString: { format: "%Y-%m-%d", date: "$created_date" } },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                console.log("result----->>");
                console.log(result)
                var month_data_list = []
                result.forEach(element => {

                    var objAr = element.data
                    //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = []
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(d[propName]);
                            }
                        });

                        var uniqueList = [...new Set(data)];

                        for (var i = 0; i < uniqueList.length; i++) {
                            var countt = 0.0;
                            for (var j = 0; j < objArr.length; j++) {
                                if (uniqueList[i] == objArr[j].title) {
                                    countt += parseFloat(objArr[j].amount);
                                }
                            }
                            send.push({
                                "count": data.filter(x => x == uniqueList[i]).length,
                                "title": uniqueList[i],
                                "amount": countt
                            });
                        }
                        return send;
                    }
                    month_data_list.push({ "yearMonthDay": element._id.yearMonthDay, data: getUniqueDataCount(objAr, "title") });
                });
                month_data_list.sort( function ( a, b ) {
                    return new Date(b.yearMonthDay) - new Date(a.yearMonthDay);
                    } );
                data.result = month_data_list;
                callback();
            })
        },
        function (callback) {
            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail, walk_in: false,
                amount: { $gt: 0 },
                status: { $ne: "Cancelled" }
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("result------,,", result);
                    var todayDate = new Date();
                    var from_date = moment(todayDate).startOf('month').format("yyyy-MM-DD");
                    var to_date = moment(todayDate).endOf('month').format("yyyy-MM-DD");                
                    var Moment = require('moment');
                    const MomentRange = require('moment-range');
                    const moment1 = MomentRange.extendMoment(Moment);
                
                    const weeksRange = moment1.range(from_date, to_date);
                    const weeksRangeData = Array.from(weeksRange.by('days')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'
                
                    var userReports = weeksRangeData.map(function (currentIndex) {
                        var year = Moment(currentIndex).format("MM-DD-YYYY");
                        return { key: year, value1: 0.0, value2: 0 };
                    });

                    result.forEach(function (user, key, value) {
                        let monthName = moment(user.created_date).format("MM-DD-YYYY");
                        let amount = parseFloat(user.amount);
                        userReports.map(index => index.key == monthName ? index.value1 += amount : index.value);
                        userReports.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                    });
                    console.log("salesReports----------", userReports);
                  //  userReports.reverse();
                    data.salesReports = userReports;
                    callback();
                }
            })
        }
    ]


    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.weekly_sales = function (req, res) {

    data = {}; 
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.type = "sales";
    data.tipType = "Week";
    data.sideDropDown = "non-oyyo"
    data.filterUrl = "oyyo/sales-filter/weekly";
    data.day_url = 'oyyo/performance';
    data.week_url = 'oyyo/performance/weekly-sales';
    data.month_url = 'oyyo/performance/monthly-sales';
    data.year_url = 'oyyo/performance/yearly-sales';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';

    var todayDate = new Date();
    var from_date = moment(todayDate).startOf('month').format("yyyy-MM-DD");
    var to_date = moment(todayDate).endOf('month').format("yyyy-MM-DD");    

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);


    const weeksRange = moment1.range(from_date, to_date);
    const weeksRangeData = Array.from(weeksRange.by('weeks')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = Moment(currentIndex).format("MM-DD-YYYY");
        return { key: year, value1: 0.0, value2: 0 };
    });
    var userReport1 = weeksRangeData.map(function (currentIndex) {
        var year = Moment(currentIndex).format("MM-DD-YYYY");
        return { weekName: year, title: '', amount: 0, count: 0 };
    });

    console.log("user weeks reports...", userReports);
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    amount: { $gt: 0 },
                    status: { $ne: "Cancelled" },
                }
            },
            {
                $group: {
                    _id: {
                        'created_date':"$created_date",
                        'title':"$title"
                    },
                     count:{$sum: 1},
                     amount:{$sum: "$amount"},
                     created_date:{$first:"$created_date"}
                    // data: { $push: "$$ROOT" },
                }    
            },{
            $project:{
                title:"$_id.title",
                amount: "$amount",
                count: "$count",
                created_date:"$_id.created_date", 
                _id:0
                }
            }
            , { "$sort": { "created_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                var weekData = []
             //   console.log("result----->>",result);
             userReport1.map(index => index.data = []);
             result.forEach(element=>{
                console.log( "index.key------created date" , element);
                userReport1.map(index => {
                 //  console.log("index.key=============>" ,index.key , "index.key------created date" , element.created_date);
                    if(moment(index.weekName, "MMDDYYYY").isoWeek() == moment(element.created_date, "MMDDYYYY").isoWeek()){
                       // console.log("index.data---",index.data)
                    var array = index.data;    
                    //var array = (typeof index.data == undefined || typeof index.data == "undefined") ? [] : index.data;

                     array.push({title: element.title, amount: element.amount, count: element.count});
                     index.data = [...array];
                    return index;
                    }
                    });
            })
            console.log("userReportData=== ---" , userReport1);
            userReport1.reverse();
            userReport1.map(function (currentIndex) {
                console.log("userReport1  title--     --------",userReport1.weekName)
                var startDate = moment(currentIndex.weekName).startOf('week').format("MM-DD-YYYY");
                var endDate = moment(currentIndex.weekName).endOf('week').format("MM-DD-YYYY");
                currentIndex.weekName = startDate+' to '+endDate;
                return currentIndex;
            });
            data.result = userReport1
            callback();

            })
        },
        function (callback) {
            appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            amount: { $gt: 0 },
                            status: { $ne: "Cancelled" },
                        }
                    },
                    {
                        $group: {
                            _id: {
                                //  week: { $week:  "$created_date"}
                                week: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                            },
                            totalAmount: { $sum: "$amount" },
                            count: { $sum: 1 }
                        },

                    }
                ]
            ).exec(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("result-- jhjhg --jhvjh--- inside", result);
                    if (result.length > 0) {
                        result.forEach(ele => {

                            //  userReports.map(index => index.key == monthName ? index.value1 += ele.totalAmount : index.value );
                            userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value1 += ele.totalAmount : index.value);
                            userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value2 += ele.count : index.value);
                        })
                        userReports.map(function (currentIndex) {
                            var startDate = moment(currentIndex.key).startOf('week').format("MM-DD-YYYY");
                            var endDate = moment(currentIndex.key).endOf('week').format("MM-DD-YYYY");
                            currentIndex.key = startDate+' to '+endDate;
                            return currentIndex;
                            });
                        data.salesReports = userReports
                        console.log("reports data of weeks--90", userReports);
                        callback();
                    } else {
                        userReports.map(function (currentIndex) {
                            var startDate = moment(currentIndex.key).startOf('week').format("MM-DD-YYYY");
                            var endDate = moment(currentIndex.key).endOf('week').format("MM-DD-YYYY");
                            currentIndex.key = startDate+' to '+endDate;
                            return currentIndex;
                        });
                        data.salesReports = userReports
                        callback();
                    }

                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    })
}
exports.day_tips = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.dateFormat = dateFormat;
    data.session = req.session;
    data.type = "tips"
    data.tipType = "Day";
    data.filterUrl = "oyyo/tips-filter/daily";
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/tips';
    data.week_url = 'oyyo/performance/weekly-tips';
    data.month_url = 'oyyo/performance/monthly-tips';
    data.year_url = 'oyyo/performance/yearly-tips';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    tip: { $gt: 0 },
                    //  full_payment:true,
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        yearMonthDay: { $dateToString: { format: "%Y-%m-%d", date: "$created_date" } },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },

            ]).exec(function (err, result) {
                if (err)
                    throw err;
                var month_data_list = []
                result.forEach(element => {
                    var objAr = element.data
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = {}
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(moment(d[propName]).format("MM-DD-yyyy"));
                            }
                        });

                        var uniqueList = [...new Set(data)];

                        for (var i = 0; i < uniqueList.length; i++) {
                            var countt = 0;
                            var amountCount = 0.0;
                            for (var j = 0; j < objArr.length; j++) {
                                // console.log("uniq---", uniqueList[i]);
                                // console.log("created_date---", moment(objArr[j].created_date).format("MM-DD-yyyy"));
                                if (uniqueList[i] == moment(objArr[j].created_date).format("MM-DD-yyyy")) {
                                    countt += 1;
                                    if (objArr[j].tip !== undefined) {
                                        amountCount += parseFloat(objArr[j].tip)
                                    }
                                }
                            }
                            send.recieved = amountCount,
                                send.title = uniqueList[i],
                                send.tips = countt
                        }
                        return send;
                    }
                    month_data_list.push(getUniqueDataCount(objAr, "created_date"));
                });
                month_data_list.sort( function ( a, b ) {
                    return new Date(b.title) - new Date(a.title);
                    } );
                data.result = month_data_list
                console.log("final data----", month_data_list);
                callback();
            })
        },
        function (callback) {
            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                tip: { $gt: 0 },
                //  full_payment:"true",
                status: { $ne: "Cancelled" },
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    var todayDate = new Date();
                    var from_date = moment(todayDate).startOf('month').format("yyyy-MM-DD");
                    var to_date = moment(todayDate).endOf('month').format("yyyy-MM-DD");                
                    var Moment = require('moment');
                    const MomentRange = require('moment-range');
                    const moment1 = MomentRange.extendMoment(Moment);
                
                    const weeksRange = moment1.range(from_date, to_date);
                    const weeksRangeData = Array.from(weeksRange.by('days')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'
                
                    var userReports = weeksRangeData.map(function (currentIndex) {
                        var year = Moment(currentIndex).format("MM-DD-YYYY");
                        return { key: year, value1: 0.0, value2: 0 };
                    });
                    result.forEach(function (user, key, value) {
                        let monthName = moment(user.created_date).format("MM-DD-YYYY");
                        let amount = 0;
                        if(user.tip !== undefined){
                            amount = parseFloat(user.tip);
                        }
                        userReports.map(index => index.key == monthName ? index.value1 += amount : index.value);
                        userReports.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                    });
                 //   userReports.reverse();
                    data.salesReports = userReports;
                    callback();
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.weekly_tips = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.type = "tips"
    data.tipType = "Week"
    data.filterUrl = "oyyo/tips-filter/weekly";
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/tips';
    data.week_url = 'oyyo/performance/weekly-tips';
    data.month_url = 'oyyo/performance/monthly-tips';
    data.year_url = 'oyyo/performance/yearly-tips';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';

    var todayDate = new Date();
    var from_date = moment(todayDate).startOf('month').format("yyyy-MM-DD");
    var to_date = moment(todayDate).endOf('month').format("yyyy-MM-DD");    

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);


    const weeksRange = moment1.range(from_date, to_date);
    const weeksRangeData = Array.from(weeksRange.by('weeks')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = Moment(currentIndex).format("MM-DD-YYYY");
        return { key: year, value1: 0.0, value2: 0 };
    });


    console.log("user weeks reports...", userReports);
    //data.userReports = userReports;
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    tip: { $gt: 0 },
                    //   full_payment:true,
                    status: { $ne: "Cancelled" },
                }
            }, {
                $group: {
                    _id: {
                        week: { $week: "$created_date" }
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                console.log("weeks", result)
                var month_data_list = []
                if (result.length > 0) {
                    result.forEach(element => {

                        var objAr = element.data
                        //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                        function getUniqueDataCount(objArr, propName) {
                            var data = [];
                            var send = {}
                            objArr.forEach(function (d, index) {
                                if (d[propName]) {
                                    data.push(moment(d[propName]).format("MM-DD-yyyy"));
                                }
                            });

                            var uniqueList = [...new Set(data)];

                            for (var i = 0; i < uniqueList.length; i++) {
                                var countt = 0;
                                var amountCount = 0.0;
                                for (var j = 0; j < objArr.length; j++) {
                                    if (uniqueList[i] == moment(objArr[j].created_date).format("MM-DD-yyyy")) {
                                        countt += 1;
                                        if (objArr[j].tip !== undefined) {
                                            amountCount += parseFloat(objArr[j].tip)
                                        }
                                    }
                                }
                                send.recieved = amountCount,
                                    send.title = moment(getDateOfWeek((element._id.week) + 1, 2021)).format("MM-DD-yyyy"),
                                    send.tips = countt
                            }
                            return send;
                        }
                        month_data_list.push(getUniqueDataCount(objAr, "created_date"));

                    });
                    // console.log("weeks table data--" ,month_data_list );
                    data.result = month_data_list;
                    callback();
                } else {
                    data.result = [];
                    callback();
                }
            })
            function getDateOfWeek(w, y) {
                var d = (1 + (w - 1) * 7); // 1st of January + 7 days for each week
                return new Date(y, 0, d);
            }
        },
        function (callback) {
            appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            tip: { $gt: 0 },
                            //  full_payment:true,
                            status: { $ne: "Cancelled" },
                        }
                    },
                    {
                        $group: {
                            _id: {
                                //  week: { $week:  "$created_date"}
                                week: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },

                            },
                            totalAmount: { $sum: "$tip" },
                            count: { $sum: 1 }
                        },

                    }
                ]
            ).exec(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("result-- jhjhg --jhvjh---", result);
                    if (result.length > 0) {
                        result.forEach(ele => {
                            userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value1 += ele.totalAmount : index.value);
                            userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value2 += ele.count : index.value);
                        })
                        userReports.map(function (currentIndex) {
                            var startDate = moment(currentIndex.key).startOf('week').format("MM-DD-YYYY");
                            var endDate = moment(currentIndex.key).endOf('week').format("MM-DD-YYYY");
                            currentIndex.key = startDate+' to '+endDate;
                            return currentIndex;
                            });
                        data.salesReports = userReports
                        var arr = [];
                        userReports.forEach(ele=>{
                        if(ele.value1>0){
                         arr.push({title:ele.key , tips:ele.value2, recieved:ele.value1});
                         }
                        });
                        arr.reverse();
                        data.result = arr;
                        console.log("reports data of weeks--", userReports);
                        callback();
                    } else {
                        userReports.map(function (currentIndex) {
                            var startDate = moment(currentIndex.key).startOf('week').format("MM-DD-YYYY");
                            var endDate = moment(currentIndex.key).endOf('week').format("MM-DD-YYYY");
                            currentIndex.key = startDate+' to '+endDate;
                            return currentIndex;
                            });
                        data.salesReports = userReports;
                        callback();
                    }
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    })
}

exports.monthly_tips = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.type = "tips"
    data.tipType = "Month"
    data.filterUrl = "oyyo/tips-filter/monthly"
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/tips';
    data.week_url = 'oyyo/performance/weekly-tips';
    data.month_url = 'oyyo/performance/monthly-tips';
    data.year_url = 'oyyo/performance/yearly-tips';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    tip: { $gt: 0 },
                    //  full_payment:true,
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        "month": { "$month": "$created_date" },
                        "year": { "$year": "$created_date" },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            {
                $addFields: {
                    "_id.month": {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id.month", 1] }, then: "January" },
                                { case: { $eq: ["$_id.month", 2] }, then: "February" },
                                { case: { $eq: ["$_id.month", 3] }, then: "March" },
                                { case: { $eq: ["$_id.month", 4] }, then: "April" },
                                { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                { case: { $eq: ["$_id.month", 6] }, then: "June" },
                                { case: { $eq: ["$_id.month", 7] }, then: "July" },
                                { case: { $eq: ["$_id.month", 8] }, then: "August" },
                                { case: { $eq: ["$_id.month", 9] }, then: "September" },
                                { case: { $eq: ["$_id.month", 10] }, then: "October" },
                                { case: { $eq: ["$_id.month", 11] }, then: "November" },
                                { case: { $eq: ["$_id.month", 12] }, then: "December" },
                                // ...
                            ],
                            default: "December"
                        }
                    }
                }
            }]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                console.dir(result)
                var month_data_list = []
                result.forEach(element => {

                    var objAr = element.data
                    //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = {}
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(moment(d[propName]).format("DD-MMM"));
                            }
                        });

                        var uniqueList = [...new Set(data)];

                        for (var i = 0; i < uniqueList.length; i++) {
                            var countt = 0;
                            var amountCount = 0.0;
                            for (var j = 0; j < objArr.length; j++) {
                                if (uniqueList[i] == moment(objArr[j].created_date).format("DD-MMM")) {
                                    console.log("-----counts-----");
                                    countt += 1;
                                    if (objArr[j].tip !== undefined) {
                                        amountCount += parseFloat(objArr[j].tip)
                                    }
                                }
                            }
                            send.recieved = amountCount,
                                send.title = `${element._id.month}-${element._id.year}`,
                                send.tips = countt
                            console.log("count--", send);
                        }
                        return send;
                    }
                    console.log("getUniqueDataCount(objAr", getUniqueDataCount(objAr, "created_date"));
                    month_data_list.push(getUniqueDataCount(objAr, "created_date"));
                });
                month_data_list.sort( function ( a, b ) {
                    return moment(b.title, 'MMMM-YYYY').format('MM') - moment(a.title, 'MMMM-YYYY').format('MM');
                    } );
                data.result = month_data_list;
                console.log("Final list ---- ", month_data_list);
                callback();
            })
        },
        function (callback) {
            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                tip: { $gt: 0 },
                //  full_payment:true,
                status: { $ne: "Cancelled" },
                created_date: {
                    $gte: new Date("2016-01-01")
                }
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    const salesReports = [
                        { key: 'Jan', value1: 0.0, value2: 0 },
                        { key: 'Feb', value1: 0.0, value2: 0 },
                        { key: 'Mar', value1: 0.0, value2: 0 },
                        { key: 'Apr', value1: 0.0, value2: 0 },
                        { key: 'May', value1: 0.0, value2: 0 },
                        { key: 'Jun', value1: 0.0, value2: 0 },
                        { key: 'Jul', value1: 0.0, value2: 0 },
                        { key: 'Aug', value1: 0.0, value2: 0 },
                        { key: 'Sep', value1: 0.0, value2: 0 },
                        { key: 'Oct', value1: 0.0, value2: 0 },
                        { key: 'Nov', value1: 0.0, value2: 0 },
                        { key: 'Dec', value1: 0.0, value2: 0 }
                    ];
                    salesReports.reverse();
                    result.forEach(function (user, key, value) {
                        let monthName = moment(user.created_date).format("MMM");
                        let amount = 0;
                        if(user.tip !== undefined){
                            amount = parseFloat(user.tip);
                        }
                        salesReports.map(index => index.key == monthName ? index.value1 += amount : index.value);
                        salesReports.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                    });
                    // console.log("salesReports----------", salesReports);
                    salesReports.reverse();
                    data.salesReports = salesReports;
                    callback();
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.yearly_tips = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.type = "tips"
    data.tipType = "Year"
    data.filterUrl = "oyyo/tips-filter/yearly";
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/tips';
    data.week_url = 'oyyo/performance/weekly-tips';
    data.month_url = 'oyyo/performance/monthly-tips';
    data.year_url = 'oyyo/performance/yearly-tips';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    tip: { $gt: 0 },
                    //  full_payment:true,
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        "year": { "$year": "$created_date" },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },

            ]).exec(function (err, result) {
                if (err)
                    throw err;
                console.log(result)
                var month_data_list = []
                result.forEach(element => {

                    var objAr = element.data
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = {}
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(moment(d[propName]).format("yyyy"));
                            }
                        });

                        var uniqueList = [...new Set(data)];

                        for (var i = 0; i < uniqueList.length; i++) {
                            var countt = 0;
                            var amountCount = 0.0;
                            for (var j = 0; j < objArr.length; j++) {
                                if (uniqueList[i] == moment(objArr[j].created_date).format("yyyy")) {
                                    countt += 1;
                                    if (objArr[j].tip !== undefined) {
                                        amountCount += parseFloat(objArr[j].tip)
                                    }
                                }
                            }
                            send.recieved = amountCount,
                                send.title = element._id.year,
                                send.tips = countt
                        }
                        return send;
                    }
                    /// console.log("getUniqueDataCount(objAr , 'title')", getUniqueDataCount(objAr , "title"));
                    month_data_list.push(getUniqueDataCount(objAr, "created_date"));
                });
                data.result = month_data_list;
                callback();
            })
        },
        function (callback) {
            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                tip: { $gt: 0 },
                //     full_payment:"true",
                status: { $ne: "Cancelled" },
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    var today = new Date();
                    var year = today.getFullYear();
                    const salesReports = [
                        { key: `${year}`, value1: 0.0, value2: 0 },
                        { key: `${year - 1}`, value1: 0.0, value2: 0 },
                        { key: `${year - 2}`, value1: 0.0, value2: 0 },
                    ];

                    result.forEach(function (user, key, value) {
                        //let monthName = moment(user.created_date).format("yyyy");
                        let monthName = new Date(user.created_date).getFullYear()
                        let amount = 0;
                        if(user.tip !== undefined){
                            amount = parseFloat(user.tip);
                        }
                        salesReports.map(index => index.key == monthName ? index.value1 += amount : index.value);
                        salesReports.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                    });
                    console.log("salesReports----------", salesReports);
                    salesReports.reverse();
                    data.salesReports = salesReports;
                    callback();
                }
            })
        }
    ]

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}

exports.day_customer_satisfaction = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.filterUrl = "oyyo/customer-satisfaction-filter/daily"
    data.type = "customer_satisfaction"
    data.tipType = "Day"
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/customer-satisfaction';
    data.week_url = 'oyyo/performance/customer-satisfaction/weekly';
    data.month_url = 'oyyo/performance/customer-satisfaction/monthly';
    data.year_url = 'oyyo/performance/customer-satisfaction/yearly';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    status: "Completed",
                    rate: { $gt: 0 },
                    rated_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        yearMonthDay: { $dateToString: { format: "%Y-%m-%d", date: "$rated_date" } },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "rated_date": 1 } },

            ]).exec(function (err, result) {
                if (err)
                    throw err;
                var month_data_list = []

                result.forEach(element => {
                    var objAr = element.data
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = {}
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(moment(d[propName]).format("MM-DD-yyyy"));
                            }
                        });

                        var uniqueList = [...new Set(data)];

                        for (var i = 0; i < uniqueList.length; i++) {
                            var countt = 0;
                            var amountCount = 0;
                            for (var j = 0; j < objArr.length; j++) {
                                // console.log("uniq---", uniqueList[i]);
                                // console.log("created_date---", moment(objArr[j].created_date).format("MM-DD-yyyy"));
                                if (uniqueList[i] == moment(objArr[j].rated_date).format("MM-DD-yyyy")) {
                                    countt += 1;
                                    if (objArr[j].rate !== undefined) {
                                        amountCount += parseInt(objArr[j].rate)
                                    }
                                }
                            }
                            send.transactions = countt,
                            send.title = uniqueList[i],
                            send.total = amountCount/countt
                        }
                        return send;
                    }
                    month_data_list.push(getUniqueDataCount(objAr, "rated_date"));
                });
                month_data_list.sort( function ( a, b ) {
                    return new Date(b.title) - new Date(a.title);
                    } );
                data.result = month_data_list
                console.log("final data----", month_data_list);
                callback();
            })
        },
        function (callback) {
            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                status: "Completed",
                rated_date: {
                    $gte: new Date("2016-01-01")
                },
                rate: { $gt: 0 },
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    var todayDate = new Date();
                    var from_date = moment(todayDate).startOf('month').format("yyyy-MM-DD");
                    var to_date = moment(todayDate).endOf('month').format("yyyy-MM-DD");                
                    var Moment = require('moment');
                    const MomentRange = require('moment-range');
                    const moment1 = MomentRange.extendMoment(Moment);
                
                    const weeksRange = moment1.range(from_date, to_date);
                    const weeksRangeData = Array.from(weeksRange.by('days')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'
                
                    var userReports = weeksRangeData.map(function (currentIndex) {
                        var year = Moment(currentIndex).format("MM-DD-YYYY");
                        return { key: year, value1: 0.0, value2: 0 };
                    });
                    result.forEach(function (user, key, value) {
                        let monthName = moment(user.rated_date).format("MM-DD-YYYY");
                        let amount = 0;
                        if(user.rate !== undefined){
                         amount = parseInt(user.rate);
                        }
                        userReports.map(index => index.key == monthName ? index.value1 += amount : index.value);
                        userReports.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                    });
                   // userReports.reverse();
                    data.salesReports = userReports;
                    callback();
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.weekly_customer_satisfaction = function (req, res) {

    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.filterUrl = "oyyo/customer-satisfaction-filter/weekly"
    data.type = "customer_satisfaction"
    data.tipType = "Week"
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/customer-satisfaction';
    data.week_url = 'oyyo/performance/customer-satisfaction/weekly';
    data.month_url = 'oyyo/performance/customer-satisfaction/monthly';
    data.year_url = 'oyyo/performance/customer-satisfaction/yearly';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';

    var todayDate = new Date();
    var from_date = moment(todayDate).startOf('month').format("yyyy-MM-DD");
    var to_date = moment(todayDate).endOf('month').format("yyyy-MM-DD");    

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);


    const weeksRange = moment1.range(from_date, to_date);
    const weeksRangeData = Array.from(weeksRange.by('weeks')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = Moment(currentIndex).format("MM-DD-YYYY");
        return { key: year, value1: 0, value2: 0 };
    });
    //console.log("user weeks reports..." , userReports);
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    status: "Completed",
                    rate: { $gt: 0 },
                    rated_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {
                        week: { $week: "$rated_date" }
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "rated_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                console.log("weeks", result)
                var month_data_list = []
                if (result.length > 0) {
                    result.forEach(element => {
                        var objAr = element.data
                        function getUniqueDataCount(objArr, propName) {
                            var data = [];
                            var send = {}
                            objArr.forEach(function (d, index) {
                                if (d[propName]) {
                                    data.push(moment(d[propName]).format("yyyy"));
                                }
                            });
    
                            var uniqueList = [...new Set(data)];
    
                            for (var i = 0; i < uniqueList.length; i++) {
                                var countt = 0;
                                var amountCount = 0;
                                for (var j = 0; j < objArr.length; j++) {
                                    if (uniqueList[i] == moment(objArr[j].rated_date).format("yyyy")) {
                                        countt += 1;
                                        if (objArr[j].rate == undefined) {
                                            amountCount = 0
                                        } else {
                                            amountCount += parseInt(objArr[j].rate)
                                        }
                                    }
                                }
                                send.transactions = countt,
                                    send.title = uniqueList[i],
                                    send.total = amountCount
                            }
                            return send;
                        }
                        /// console.log("getUniqueDataCount(objAr , 'title')", getUniqueDataCount(objAr , "title"));
                        month_data_list.push(getUniqueDataCount(objAr, "rated_date"));
                        
                     });
                    console.log("weeks table data--", month_data_list);
                    data.result = month_data_list;
                    callback();
                } else {
                    data.result = [];
                    callback();
                }
            })
        },
        function (callback) {
            appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            status: "Completed",
                            rate: { $gt: 0 },
                            rated_date: {
                                $gte: new Date("2016-01-01")
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                //  week: { $week:  "$created_date"}
                                week: { $dateToString: { format: "%m-%d-%Y", date: "$rated_date" } },

                            },
                            totalAmount: { $sum: "$rate" },
                            count: { $sum: 1 }
                        },

                    }
                ]
            ).exec(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("result-- jhjhg --jhvjh---", result);
                    if (result.length > 0) {
                        result.forEach(ele => {
                            userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value1 += ele.totalAmount : index.value);
                            userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value2 += ele.count : index.value);
                        })
                        userReports.map(function (currentIndex) {
                            var startDate = moment(currentIndex.key).startOf('week').format("MM-DD-YYYY");
                            var endDate = moment(currentIndex.key).endOf('week').format("MM-DD-YYYY");
                            currentIndex.key = startDate+' to '+endDate;
                            return currentIndex;
                        });
                        data.salesReports = userReports
                        var arr = [];
                        userReports.forEach(ele=>{
                            if(ele.value1>0){
                            arr.push({"title":ele.key , "total":ele.value1/ele.value2, "transactions":ele.value2});
                            }
                        });
                        arr.reverse();
                        data.result = arr
                        callback();
                    } else {
                        userReports.map(function (currentIndex) {
                            var startDate = moment(currentIndex.key).startOf('week').format("MM-DD-YYYY");
                            var endDate = moment(currentIndex.key).endOf('week').format("MM-DD-YYYY");
                            currentIndex.key = startDate+' to '+endDate;
                            return currentIndex;
                        });
                        data.salesReports = userReports
                        callback();
                    }
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    })
}
exports.monthly_customer_satisfaction = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.filterUrl = "oyyo/customer-satisfaction-filter/monthly"
    data.type = "customer_satisfaction"
    data.tipType = "Month"
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/customer-satisfaction';
    data.week_url = 'oyyo/performance/customer-satisfaction/weekly';
    data.month_url = 'oyyo/performance/customer-satisfaction/monthly';
    data.year_url = 'oyyo/performance/customer-satisfaction/yearly';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    status: "Completed",
                    rate: { $gt: 0 },
                    rated_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        "month": { "$month": "$rated_date" },
                        "year": { "$year": "$rated_date" },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            {
                $addFields: {
                    "_id.month": {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id.month", 1] }, then: "January" },
                                { case: { $eq: ["$_id.month", 2] }, then: "February" },
                                { case: { $eq: ["$_id.month", 3] }, then: "March" },
                                { case: { $eq: ["$_id.month", 4] }, then: "April" },
                                { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                { case: { $eq: ["$_id.month", 6] }, then: "June" },
                                { case: { $eq: ["$_id.month", 7] }, then: "July" },
                                { case: { $eq: ["$_id.month", 8] }, then: "August" },
                                { case: { $eq: ["$_id.month", 9] }, then: "September" },
                                { case: { $eq: ["$_id.month", 10] }, then: "October" },
                                { case: { $eq: ["$_id.month", 11] }, then: "November" },
                                { case: { $eq: ["$_id.month", 12] }, then: "December" },
                                // ...
                            ],
                            default: "December"
                        }
                    }
                }
            }]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                console.dir(result)
                var month_data_list = []
                result.forEach(element => {
                    var objAr = element.data
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = {}
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(moment(d[propName]).format("MMM"));
                            }
                        });

                        var uniqueList = [...new Set(data)];

                        for (var i = 0; i < uniqueList.length; i++) {
                            var countt = 0;
                            var amountCount = 0;
                            for (var j = 0; j < objArr.length; j++) {
                                if (uniqueList[i] == moment(objArr[j].rated_date).format("MMM")) {
                                    countt += 1;
                                    if (objArr[j].rate !== undefined) {
                                        amountCount += parseInt(objArr[j].rate)
                                    }
                                }
                            }
                            send.transactions = countt,
                            send.title =`${element._id.month}-${element._id.year}`,
                            send.total = amountCount/countt
                        }
                        return send;
                    }
                    month_data_list.push(getUniqueDataCount(objAr, "rated_date"));
                });
                month_data_list.sort( function ( a, b ) {
                    return moment(b.title, 'MMMM-YYYY').format('MM') - moment(a.title, 'MMMM-YYYY').format('MM');
                    } );
                data.result = month_data_list;
                console.log("Final list ---- ", month_data_list);
                callback();
            })
        },
        function (callback) {
            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                status: "Completed",
                rate: { $gt: 0 },
                rated_date: {
                    $gte: new Date("2016-01-01")
                }
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    const salesReports = [
                        { key: 'Jan', value1: 0, value2: 0 },
                        { key: 'Feb', value1: 0, value2: 0 },
                        { key: 'Mar', value1: 0, value2: 0 },
                        { key: 'Apr', value1: 0, value2: 0 },
                        { key: 'May', value1: 0, value2: 0 },
                        { key: 'Jun', value1: 0, value2: 0 },
                        { key: 'Jul', value1: 0, value2: 0 },
                        { key: 'Aug', value1: 0, value2: 0 },
                        { key: 'Sep', value1: 0, value2: 0 },
                        { key: 'Oct', value1: 0, value2: 0 },
                        { key: 'Nov', value1: 0, value2: 0 },
                        { key: 'Dec', value1: 0, value2: 0 }
                    ];
                    salesReports.reverse();
                    result.forEach(function (user, key, value) {
                        let monthName = moment(user.rated_date).format("MMM");
                        let amount = 0;
                        if(user.rate !== undefined){
                         amount = parseInt(user.rate);
                        }
                        salesReports.map(index => index.key == monthName ? index.value1 += amount : index.value);
                        salesReports.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                    });
                    // console.log("salesReports----------", salesReports);
                    salesReports.reverse();
                    data.salesReports = salesReports;
                    callback();
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.yearly_customer_satisfaction = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.filterUrl = "oyyo/customer-satisfaction-filter/yearly"
    data.type = "customer_satisfaction"
    data.tipType = "Year"
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/customer-satisfaction';
    data.week_url = 'oyyo/performance/customer-satisfaction/weekly';
    data.month_url = 'oyyo/performance/customer-satisfaction/monthly';
    data.year_url = 'oyyo/performance/customer-satisfaction/yearly';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    status: "Completed",
                    rate: { $gt: 0 },
                    rated_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        "year": { "$year": "$rated_date" },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "rated_date": 1 } },

            ]).exec(function (err, result) {
                if (err)
                    throw err;
                console.log(result)
                var month_data_list = []
                result.forEach(element => {

                    var objAr = element.data
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = {}
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(moment(d[propName]).format("yyyy"));
                            }
                        });

                        var uniqueList = [...new Set(data)];

                        for (var i = 0; i < uniqueList.length; i++) {
                            var countt = 0;
                            var amountCount = 0;
                            for (var j = 0; j < objArr.length; j++) {
                                if (uniqueList[i] == moment(objArr[j].rated_date).format("yyyy")) {
                                    countt += 1;
                                    if (objArr[j].rate !== undefined) {
                                        amountCount += parseInt(objArr[j].rate)
                                    }
                                }
                            }
                            send.transactions = countt,
                            send.title = element._id.year,
                            send.total = amountCount/countt
                        }
                        return send;
                    }
                    /// console.log("getUniqueDataCount(objAr , 'title')", getUniqueDataCount(objAr , "title"));
                    month_data_list.push(getUniqueDataCount(objAr, "rated_date"));
                });
                data.result = month_data_list;
                callback();
            })
        },
        function (callback) {
            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                status: "Completed",
                rate: { $gt: 0 },
                rated_date: {
                    $gte: new Date("2016-01-01")
                }
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    var today = new Date();
                    var year = today.getFullYear();
                    const salesReports = [
                        { key: `${year}`, value1: 0, value2: 0 },
                        { key: `${year - 1}`, value1: 0, value2: 0 },
                        { key: `${year - 2}`, value1: 0, value2: 0 },
                    ];
                    result.forEach(function (user, key, value) {
                        let monthName = new Date(user.rated_date).getFullYear()
                        let amount = 0;
                        if(user.rate !== undefined){
                            amount = parseInt(user.rate);
                        }
                        salesReports.map(index => index.key == monthName ? index.value1 += amount : index.value);
                        salesReports.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                    });
                    console.log("salesReports----------", salesReports);
                    salesReports.reverse();
                    data.salesReports = salesReports;
                    callback();
                }
            })
        }
    ]

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.day_visit_overview = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.type = "visit"
    data.tipType = "Day"
    data.filterUrl = "oyyo/visit-filter/daily"
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/visit-overview';
    data.week_url = 'oyyo/performance/visit-overview/weekly';
    data.month_url = 'oyyo/performance/visit-overview/monthly';
    data.year_url = 'oyyo/performance/visit-overview/yearly';

    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    //  full_payment:true,
                    // status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        yearMonthDay: { $dateToString: { format: "%Y-%m-%d", date: "$created_date" } },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },

            ]).exec(function (err, result) {
                if (err)
                    throw err;
                var month_data_list = []
                result.forEach(element => {
                    var objAr = element.data
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = {}
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(d[propName]);
                            }
                        });

                        var uniqueList = [...new Set(data)];
                        var totalAppoints = 0;
                            var cancelled = 0;
                            var noShows = 0;
                           // console.log("uniq,,, list " , uniqueList);
                            uniqueList.forEach(uniq=>{
                                var title ;
                                objAr.forEach(ob=>{
                                    title =  moment(ob.created_date).format("MM-DD-yyyy");
                                    if(uniq == ob.status){
                                        if (uniq) {
                                            //console.log("all Appointments,,,");
                                            totalAppoints += 1;
                                        }
                                        if (uniq == "No Show") {
                                            noShows += 1;
                                        }
                                        if (uniq == "Cancelled") {
                                            cancelled += 1;
                                        }
                                    }
                                })
                                send.total = totalAppoints;
                                send.title = title;
                                send.cancelled = cancelled;
                                send.noShows = noShows
                            })
                        //     }
                             return send;
                           
                        }
                    month_data_list.push(getUniqueDataCount(objAr, "status"));
                });
                month_data_list.sort( function ( a, b ) {
                    return new Date(b.title) - new Date(a.title);
                    } );
                data.result = month_data_list
              //  console.log("final data----", month_data_list);
                callback();
            })
        },
        function (callback) {
            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                //  full_payment:"true",
                // status: { $ne: "Cancelled" },
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    var todayDate = new Date();
                    var from_date = moment(todayDate).startOf('month').format("yyyy-MM-DD");
                    var to_date = moment(todayDate).endOf('month').format("yyyy-MM-DD");                
                    var Moment = require('moment');
                    const MomentRange = require('moment-range');
                    const moment1 = MomentRange.extendMoment(Moment);
                
                    const weeksRange = moment1.range(from_date, to_date);
                    const weeksRangeData = Array.from(weeksRange.by('days')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'
                
                    var userReports = weeksRangeData.map(function (currentIndex) {
                        var year = Moment(currentIndex).format("MM-DD-YYYY");
                        return { key: year, value1: 0, value2: 0,value3: 0 };
                    });
                    result.forEach(function (user, key, value) {
                        let monthName = moment(user.created_date).format("MM-DD-YYYY");
                        let amount = parseFloat(user.tip);
                        // total appointments start
                        userReports.map(index => index.key == monthName ? index.value1 += 1 : index.value);
                        // dates.map(index => index.key == monthName && user.status == "Cancelled" ? index.value1 += 1 : index.value);
                        // dates.map(index => index.key == monthName && user.status == "Pending" ? index.value1 += 1 : index.value);
                        // dates.map(index => index.key == monthName && user.status == "Ongoing" ? index.value1 += 1 : index.value);
                        // end
                        userReports.map(index => index.key == monthName && user.status == "Cancelled" ? index.value2 += 1 : index.value);
                        userReports.map(index => index.key == monthName && user.status == "No Show" ? index.value3 += 1 : index.value);
                      //  dates.map(index => index.key == monthName && user.status == "Ongoing" ? index.value3 += 1 : index.value);
                        // dates.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                    });
                    //userReports.reverse();
                    //console.log("visit overview----" , dates);
                    data.salesReports = userReports;
                    callback();
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.weekly_visit_overview = function (req, res) {

    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.type = "visit";
    data.tipType = "Week";
    data.filterUrl = "oyyo/visit-filter/weekly";
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/visit-overview';
    data.week_url = 'oyyo/performance/visit-overview/weekly';
    data.month_url = 'oyyo/performance/visit-overview/monthly';
    data.year_url = 'oyyo/performance/visit-overview/yearly';

    var todayDate = new Date();
    var from_date = moment(todayDate).startOf('month').format("yyyy-MM-DD");
    var to_date = moment(todayDate).endOf('month').format("yyyy-MM-DD");    

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);


    const weeksRange = moment1.range(from_date, to_date);
    const weeksRangeData = Array.from(weeksRange.by('weeks')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = Moment(currentIndex).format("MM-DD-YYYY");
        return { key: year, value1: 0.0, value2: 0, value3: 0 };
    });


    console.log("user weeks reports...", userReports);
    //data.userReports = userReports;
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    //   full_payment:true,
                    // status: { $ne: "Cancelled" },
                }
            }, {
                $group: {
                    _id: {
                        week: { $week: "$created_date" }
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                console.log("weeks", result)
                var month_data_list = []
                if (result.length > 0) {
                    result.forEach(element => {

                        var objAr = element.data
                        //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                        function getUniqueDataCount(objArr, propName) {
                            var data = [];
                            var send = {}
                            objArr.forEach(function (d, index) {
                                if (d[propName]) {
                                    data.push(d[propName]);
                                }
                            });

                            var uniqueList = [...new Set(data)];

                            var totalAppoints = 0;
                            var cancelled = 0;
                            var noShows = 0;
                           // console.log("uniq,,, list " , uniqueList);
                            uniqueList.forEach(uniq=>{
                                var title ;
                                objAr.forEach(ob=>{
                                    title =   moment(getDateOfWeek((element._id.week) + 1, 2021)).format("MM-DD-yyyy");
                                    if(uniq == ob.status){
                                        if (uniq) {
                                            //console.log("all Appointments,,,");
                                            totalAppoints += 1;
                                        }
                                        if (uniq == "No Show") {
                                            noShows += 1;
                                        }
                                        if (uniq == "Cancelled") {
                                            cancelled += 1;
                                        }
                                    }
                                })
                                send.total = totalAppoints;
                                         send.title = title;
                                         send.cancelled = cancelled;
                                         send.noShows = noShows
                            })
                        //     }
                             return send;
                        }
                        month_data_list.push(getUniqueDataCount(objAr, "status"));

                    });
                    // console.log("weeks table data--" ,month_data_list );
                    data.result = month_data_list;
                    callback();
                } else {
                    data.result = [];
                    callback();
                }
            })
            function getDateOfWeek(w, y) {
                var d = (1 + (w - 1) * 7); // 1st of January + 7 days for each week
                return new Date(y, 0, d);
            }
        },
        async function (callback) {
            var cancelled = await appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            //  full_payment:true,
                            // status: { $ne: "Cancelled" },
                            status: "Cancelled",
                        }
                    },
                    {
                        $group: {
                            _id: {
                                //  week: { $week:  "$created_date"}
                                week: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },

                            },
                            totalAmount: { $sum: "$amount" },
                            count: { $sum: 1 }
                        },

                    }
                ]
            );

            cancelled.forEach(ele => {
                var week = moment(ele._id.week, "MMDDYYYY").isoWeek();
                userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == week ? index.value2 += ele.count : index.value);
            })
            var allAppointments = await appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            //  full_payment:true,
                            status: { $ne: "Cancelled" },
                        }
                    },
                    {
                        $group: {
                            _id: {
                                //  week: { $week:  "$created_date"}
                                week: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },

                            },
                            totalAmount: { $sum: "$amount" },
                            count: { $sum: 1 }
                        },

                    }
                ]
            );
            allAppointments.forEach(ele => {
                var week = moment(ele._id.week, "MMDDYYYY").isoWeek();
                userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == week ? index.value1 += ele.count : index.value);
            })
            var noShows = await appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            //  full_payment:true,
                            status: "No Show",
                        }
                    },
                    {
                        $group: {
                            _id: {
                                //  week: { $week:  "$created_date"}
                                week: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },

                            },
                            totalAmount: { $sum: "$amount" },
                            count: { $sum: 1 }
                        },

                    }
                ]
            );
            noShows.forEach(ele => {
                var week = moment(ele._id.week, "MMDDYYYY").isoWeek();
                userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == week ? index.value3 += ele.count : index.value);
            })
            userReports.map(function (currentIndex) {
                var startDate = moment(currentIndex.key).startOf('week').format("MM-DD-YYYY");
                var endDate = moment(currentIndex.key).endOf('week').format("MM-DD-YYYY");
                currentIndex.key = startDate+' to '+endDate;
                return currentIndex;
                });
            data.salesReports = userReports;
            var arr = [];
            userReports.forEach(ele=>{
                if(ele.value1>0){
                arr.push({title:ele.key , total:ele.value1 , cancelled:ele.value2 , noShows:ele.value3});
                }
            });
            arr.reverse();
            data.result = arr;
            callback();
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    })
}
exports.monthly_visit_overview = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.type = "visit"
    data.tipType = "Month"
    data.filterUrl = "oyyo/visit-filter/monthly"
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/visit-overview';
    data.week_url = 'oyyo/performance/visit-overview/weekly';
    data.month_url = 'oyyo/performance/visit-overview/monthly';
    data.year_url = 'oyyo/performance/visit-overview/yearly';

    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    //  full_payment:true,
                   // status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        "month": { "$month": "$created_date" },
                        "year": { "$year": "$created_date" },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            {
                $addFields: {
                    "_id.month": {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id.month", 1] }, then: "January" },
                                { case: { $eq: ["$_id.month", 2] }, then: "February" },
                                { case: { $eq: ["$_id.month", 3] }, then: "March" },
                                { case: { $eq: ["$_id.month", 4] }, then: "April" },
                                { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                { case: { $eq: ["$_id.month", 6] }, then: "June" },
                                { case: { $eq: ["$_id.month", 7] }, then: "July" },
                                { case: { $eq: ["$_id.month", 8] }, then: "August" },
                                { case: { $eq: ["$_id.month", 9] }, then: "September" },
                                { case: { $eq: ["$_id.month", 10] }, then: "October" },
                                { case: { $eq: ["$_id.month", 11] }, then: "November" },
                                { case: { $eq: ["$_id.month", 12] }, then: "December" },
                                // ...
                            ],
                            default: "December"
                        }
                    }
                }
            }]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
              //  console.dir(result)
                var month_data_list = []
                result.forEach(element => {

                    var objAr = element.data
                    //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = {}
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(d[propName]);
                            }
                        });

                        var uniqueList = [...new Set(data)];
                        var totalAppoints = 0;
                        var cancelled = 0;
                        var noShows = 0;
                       // console.log("uniq,,, list " , uniqueList);
                        uniqueList.forEach(uniq=>{
                            objAr.forEach(ob=>{
                                if(uniq == ob.status){
                                    if (uniq) {
                                        //console.log("all Appointments,,,");
                                        totalAppoints += 1;
                                    }
                                    if (uniq == "No Show") {
                                        noShows += 1;
                                    }
                                    if (uniq == "Cancelled") {
                                        cancelled += 1;
                                    }
                                }
                            })
                            send.total = totalAppoints;
                                     send.title = `${element._id.month}-${element._id.year}`
                                     send.cancelled = cancelled;
                                     send.noShows = noShows
                        })
                    //     }
                         return send;
                     }
                    //  console.log("getUniqueDataCount(objAr" ,getUniqueDataCount(objAr, "status"));

                    month_data_list.push(getUniqueDataCount(objAr, "status"));
                });
                month_data_list.sort( function ( a, b ) {
                    return moment(b.title, 'MMMM-YYYY').format('MM') - moment(a.title, 'MMMM-YYYY').format('MM');
                    } );
                data.result = month_data_list;
                console.log("Final list ---- ", month_data_list);
                callback();
            })
        },
        async function (callback) {
            const salesReports = [
                { key: 'January', value1: 0.0, value2: 0, value3: 0 },
                { key: 'February', value1: 0.0, value2: 0, value3: 0 },
                { key: 'March', value1: 0.0, value2: 0, value3: 0 },
                { key: 'April', value1: 0.0, value2: 0, value3: 0 },
                { key: 'May', value1: 0.0, value2: 0, value3: 0 },
                { key: 'June', value1: 0.0, value2: 0, value3: 0 },
                { key: 'July', value1: 0.0, value2: 0, value3: 0 },
                { key: 'August', value1: 0.0, value2: 0, value3: 0 },
                { key: 'September', value1: 0.0, value2: 0, value3: 0 },
                { key: 'October', value1: 0.0, value2: 0, value3: 0 },
                { key: 'November', value1: 0.0, value2: 0, value3: 0 },
                { key: 'December', value1: 0.0, value2: 0, value3: 0 }
            ];
            console.log("cajdskj,,,,,,,,,,,", "cancelled");
            var cancelled = await appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            //  full_payment:true,
                            // status: { $ne: "Cancelled" },
                            status: "Cancelled",
                            created_date: {
                                $gte: new Date("2016-01-01")
                            }
                        }
                    }, {
                        $group: {
                            _id: {

                                "month": { "$month": "$created_date" },
                                "year": { "$year": "$created_date" },

                            },
                            count: { $sum: 1 },
                            data: { $push: "$$ROOT" },
                        }
                    }, { "$sort": { "created_date": 1 } },
                    {
                        $addFields: {
                            "_id.month": {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ["$_id.month", 1] }, then: "January" },
                                        { case: { $eq: ["$_id.month", 2] }, then: "February" },
                                        { case: { $eq: ["$_id.month", 3] }, then: "March" },
                                        { case: { $eq: ["$_id.month", 4] }, then: "April" },
                                        { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                        { case: { $eq: ["$_id.month", 6] }, then: "June" },
                                        { case: { $eq: ["$_id.month", 7] }, then: "July" },
                                        { case: { $eq: ["$_id.month", 8] }, then: "August" },
                                        { case: { $eq: ["$_id.month", 9] }, then: "September" },
                                        { case: { $eq: ["$_id.month", 10] }, then: "October" },
                                        { case: { $eq: ["$_id.month", 11] }, then: "November" },
                                        { case: { $eq: ["$_id.month", 12] }, then: "December" },
                                        // ...
                                    ],
                                    default: "December"
                                }
                            }
                        }

                    }
                ]
            );
            // console.log("cajdskj,,,,,,,,,,," , cancelled);
            cancelled.forEach(ele => {
                let monthName = ele._id.month
                salesReports.map(index => index.key == monthName ? index.value2 += ele.count : index.value);
            })
            var allAppointments = await appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            //  full_payment:true,
                           // status: { $ne: "Cancelled" },
                            created_date: {
                                $gte: new Date("2016-01-01")
                            }
                        }
                    }, {
                        $group: {
                            _id: {

                                "month": { "$month": "$created_date" },
                                "year": { "$year": "$created_date" },

                            },
                            count: { $sum: 1 },
                            data: { $push: "$$ROOT" },
                        }
                    }, { "$sort": { "created_date": 1 } },
                    {
                        $addFields: {
                            "_id.month": {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ["$_id.month", 1] }, then: "January" },
                                        { case: { $eq: ["$_id.month", 2] }, then: "February" },
                                        { case: { $eq: ["$_id.month", 3] }, then: "March" },
                                        { case: { $eq: ["$_id.month", 4] }, then: "April" },
                                        { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                        { case: { $eq: ["$_id.month", 6] }, then: "June" },
                                        { case: { $eq: ["$_id.month", 7] }, then: "July" },
                                        { case: { $eq: ["$_id.month", 8] }, then: "August" },
                                        { case: { $eq: ["$_id.month", 9] }, then: "September" },
                                        { case: { $eq: ["$_id.month", 10] }, then: "October" },
                                        { case: { $eq: ["$_id.month", 11] }, then: "November" },
                                        { case: { $eq: ["$_id.month", 12] }, then: "December" },
                                        // ...
                                    ],
                                    default: "December"
                                }
                            }
                        }

                    }
                ]
            );
            // console.log("all apopointments....." , allAppointments);
            allAppointments.forEach(ele => {
                let monthName = ele._id.month;
                //  console.log("total count---" , ele.count);
                salesReports.map(index => index.key == monthName ? index.value1 += ele.count : index.value);
            })
            var noShows = await appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            //  full_payment:true,
                            status:   "No Show",
                            created_date: {
                                $gte: new Date("2016-01-01")
                            }
                        }
                    }, {
                        $group: {
                            _id: {

                                "month": { "$month": "$created_date" },
                                "year": { "$year": "$created_date" },

                            },
                            count: { $sum: 1 },
                            data: { $push: "$$ROOT" },
                        }
                    }, { "$sort": { "created_date": 1 } },
                    {
                        $addFields: {
                            "_id.month": {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ["$_id.month", 1] }, then: "January" },
                                        { case: { $eq: ["$_id.month", 2] }, then: "February" },
                                        { case: { $eq: ["$_id.month", 3] }, then: "March" },
                                        { case: { $eq: ["$_id.month", 4] }, then: "April" },
                                        { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                        { case: { $eq: ["$_id.month", 6] }, then: "June" },
                                        { case: { $eq: ["$_id.month", 7] }, then: "July" },
                                        { case: { $eq: ["$_id.month", 8] }, then: "August" },
                                        { case: { $eq: ["$_id.month", 9] }, then: "September" },
                                        { case: { $eq: ["$_id.month", 10] }, then: "October" },
                                        { case: { $eq: ["$_id.month", 11] }, then: "November" },
                                        { case: { $eq: ["$_id.month", 12] }, then: "December" },
                                        // ...
                                    ],
                                    default: "December"
                                }
                            }
                        }

                    }
                ]
            );
            noShows.forEach(ele => {
                let monthName = ele._id.month;
                salesReports.map(index => index.key == monthName ? index.value3 += ele.count : index.value);
            })
            console.log("salesReports----------", salesReports);
            data.salesReports = salesReports;
            callback();
            // appointments.find({
            //     ispEmail:req.app.locals.userCustomerSession.mail,
            //   //  full_payment:true,
            //   status: { $ne: "Cancelled" },
            // }, function (err, result) {
            //     if (err) {
            //         throw err;
            //     } else {
            //         const salesReports = [
            //             { key: 'Jan', value1: 0.0, value2: 0, value3: 0 },
            //             { key: 'Feb', value1: 0.0, value2: 0, value3: 0 },
            //             { key: 'Mar', value1: 0.0, value2: 0, value3: 0 },
            //             { key: 'Apr', value1: 0.0, value2: 0, value3: 0 },
            //             { key: 'May', value1: 0.0, value2: 0, value3: 0 },
            //             { key: 'Jun', value1: 0.0, value2: 0, value3: 0 },
            //             { key: 'Jul', value1: 0.0, value2: 0, value3: 0 },
            //             { key: 'Aug', value1: 0.0, value2: 0, value3: 0 },
            //             { key: 'Sep', value1: 0.0, value2: 0, value3: 0 },
            //             { key: 'Oct', value1: 0.0, value2: 0, value3: 0 },
            //             { key: 'Nov', value1: 0.0, value2: 0, value3: 0 },
            //             { key: 'Dec', value1: 0.0, value2: 0, value3: 0 }
            //         ];
            //         salesReports.reverse();
            //         result.forEach(function (user, key, value) {
            //             let monthName = moment(user.created_date).format("MMM");
            //             let amount = parseFloat(user.tip);
            //             salesReports.map(index => index.key == monthName ? index.value1 += amount : index.value);
            //             salesReports.map(index => index.key == monthName ? index.value2 += 1 : index.value);
            //         });
            //         // console.log("salesReports----------", salesReports);
            //         salesReports.reverse();
            //         data.salesReports = salesReports;
            //         callback();
            //     }
            // })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.yearly_visit_overview = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.type = "visit"
    data.tipType = "Year"
    data.filterUrl = "oyyo/visit-filter/yearly"
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/visit-overview';
    data.week_url = 'oyyo/performance/visit-overview/weekly';
    data.month_url = 'oyyo/performance/visit-overview/monthly';
    data.year_url = 'oyyo/performance/visit-overview/yearly';

    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    //  full_payment:true,
                   // status: { $ne: "Cancelled" },
                    created_date: { 
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        "year": { "$year": "$created_date" },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },

            ]).exec(function (err, result) {
                if (err)
                    throw err;
              //  console.log(result)
                var month_data_list = []
                result.forEach(element => {

                    var objAr = element.data
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = {}
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(d[propName]);
                            }
                        });

                        var uniqueList = [...new Set(data)];
                        var totalAppoints = 0;
                        var cancelled = 0;
                        var noShows = 0;
                        for (var i = 0; i < uniqueList.length; i++) {
                            for (var j = 0; j < objArr.length; j++) {
                                if (uniqueList[i] == objArr[j].status) {
                                    // if ( uniqueList[i] == objArr[j].status) {
                                    if (uniqueList[i]) {
                                      //  console.log("all Appointments,,,");
                                        totalAppoints += 1;
                                    }
                                    if (uniqueList[i] == "No Show") {
                                        noShows += 1;
                                    }
                                    if (uniqueList[i] == "Cancelled") {
                                        cancelled += 1;
                                    }
                                    //   }
                                }
                            }
                            //  console.log("all Appointments,,," , totalAppoints);
                            //   if(totalAppoints>0){
                            //       totalAppoints+=1
                            //   }
                            //   if(noShows>0){
                            //     noShows+=1
                            //   }
                            //   if(cancelled>0){
                            //     cancelled+=1
                            //   }
                            send.total = totalAppoints;
                            send.title = `${element._id.year}`
                            send.cancelled = cancelled;
                            send.noShows = noShows
                        }
                        return send;
                    }
                    /// console.log("getUniqueDataCount(objAr , 'title')", getUniqueDataCount(objAr , "title"));
                    month_data_list.push(getUniqueDataCount(objAr, "status"));
                });
                data.result = month_data_list;
                callback();
            })
        },
        async function (callback) {
            //  console.log("years graph start,,,,,,,,,,,,,,,,,");
            var today = new Date();
            var year = today.getFullYear();
            const salesReports = [
                { key: `${year}`, value1: 0.0, value2: 0, value3: 0 },
                { key: `${year - 1}`, value1: 0.0, value2: 0, value3: 0 },
                { key: `${year - 2}`, value1: 0.0, value2: 0, value3: 0 },
            ];
            // console.log("cancelled-----,," , "Start");

            var cancelled = await appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    //  full_payment:true,
                    status: "Cancelled",
                    created_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        "year": { "$year": "$created_date" },

                    },
                    count: { $sum: 1 },
                    //data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },

            ])

            // console.log("cancelled-----,," , cancelled);
            cancelled.forEach(ele => {
                let monthName = ele._id.year;
                salesReports.map(index => index.key == monthName ? index.value2 += ele.count : index.value);
            })

            var allAppointments = await appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    //  full_payment:true,
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        "year": { "$year": "$created_date" },

                    },
                    count: { $sum: 1 },
                    //data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },

            ])
            // console.log("allAppointments----", allAppointments);
            allAppointments.forEach(ele => {
                let monthName = ele._id.year
                salesReports.map(index => index.key == monthName ? index.value1 += ele.count : index.value);
            })

            var noShows = await appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    //  full_payment:true,
                    status: "No Show",
                    created_date: {
                        $gte: new Date("2016-01-01")
                    }
                }
            }, {
                $group: {
                    _id: {

                        "year": { "$year": "$created_date" },

                    },
                    count: { $sum: 1 },
                    //data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },

            ])

            noShows.forEach(ele => {
                let monthName = ele._id.year
                salesReports.map(index => index.key == monthName ? index.value3 += ele.count : index.value);
            })
            data.salesReports = salesReports;
            callback();
            //     appointments.find({
            //         ispEmail:req.app.locals.userCustomerSession.mail,
            //    //     full_payment:"true",
            //    status: { $ne: "Cancelled" },
            //     }, function (err, result) {
            //         if (err) {
            //             throw err;
            //         } else {
            //             var today = new Date();
            //             var year = today.getFullYear();
            //             const salesReports = [
            //                 { key: `${year}`, value1: 0.0, value2: 0 },
            //                 { key: `${year-1}`, value1: 0.0, value2: 0 },
            //                 { key: `${year-2}`, value1: 0.0, value2: 0 },
            //             ];

            //             result.forEach(function (user, key, value) {
            //                 //let monthName = moment(user.created_date).format("yyyy");
            //                 let monthName = new Date(user.created_date).getFullYear()
            //                 let amount = parseFloat(user.tip);
            //                 salesReports.map(index => index.key == monthName ? index.value1 += amount : index.value);
            //                 salesReports.map(index => index.key == monthName ? index.value2 += 1 : index.value);
            //             });
            //             console.log("salesReports----------", salesReports);
            //             salesReports.reverse();
            //             data.salesReports = salesReports;
            //             callback();
            //         }
            //     })
        }
    ]

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.sales_day_filter = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.type = "sales";
    data.filterUrl = "oyyo/sales-filter/daily";
    data.day_url = 'oyyo/performance';
    data.week_url = 'oyyo/performance/weekly-sales';
    data.month_url = 'oyyo/performance/monthly-sales';
    data.year_url = 'oyyo/performance/yearly-sales';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    data.tipType = "Day";
    data.sideDropDown = "non-oyyo"
    console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");
    console.log("a-----------------------a", a, "----b---", b);

    // console.log("req.app.locals.userCustomerSession.mail", req.app.locals.userCustomerSession.mail);
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail, walk_in: false,
                    amount: { $gt: 0 },
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {

                        yearMonthDay: { $dateToString: { format: "%Y-%m-%d", date: "$created_date" } },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                console.log("result----->>");
                console.log(result)
                var month_data_list = []
                result.forEach(element => {

                    var objAr = element.data
                    //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = []
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(d[propName]);
                            }
                        });

                        var uniqueList = [...new Set(data)];

                        for (var i = 0; i < uniqueList.length; i++) {
                            var countt = 0.0;
                            for (var j = 0; j < objArr.length; j++) {
                                if (uniqueList[i] == objArr[j].title) {
                                    countt += parseFloat(objArr[j].amount);
                                }
                            }
                            send.push({
                                "count": data.filter(x => x == uniqueList[i]).length,
                                "title": uniqueList[i],
                                "amount": countt
                            });
                        }
                        return send;
                    }
                    month_data_list.push({ "yearMonthDay": element._id.yearMonthDay, data: getUniqueDataCount(objAr, "title") });
                });
                month_data_list.sort( function ( a, b ) {
                    return new Date(b.yearMonthDay) - new Date(a.yearMonthDay);
                    } );
                data.result = month_data_list;
                console.log("90-------------------90", month_data_list)
                callback();
            })
        },
        function (callback) {

            const _MS_PER_DAY = 1000 * 60 * 60 * 24;

            // a and b are javascript Date objects
            function dateDiffInDays(a, b) {
                // Discard the time and time-zone information.
                const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
                const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

                return Math.floor((utc2 - utc1) / _MS_PER_DAY);
            }

            // test it
            const a = new Date(req.body.from),
                b = new Date(req.body.to),
                difference = dateDiffInDays(a, b);

            var arr = []
            console.log("diff---", difference);
            var date = startDate
            for (let i = 0; i < difference + 1; i++) {
                arr.push({ key: moment(date).format("MM-DD-YYYY"), value1: 0.0, value2: 0 });
                date.setDate(date.getDate() + 1);
            }

            console.log("Arr data--", arr);

            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                amount: { $gt: 0 },
                status: { $ne: "Cancelled" },
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {

                    result.forEach(function (user, key, value) {
                        let monthName = moment(user.created_date).format("MM-DD-YYYY");
                        let amount = parseFloat(user.amount);
                        arr.map(index => index.key == monthName ? index.value1 += amount : index.value);
                        arr.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                    });
                    // console.log("salesReports----------", dates);
                    data.salesReports = arr;
                    callback();
                }
            })
        }
    ]


    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.sales_monthly_filter = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.type = "sales";
    data.filterUrl = "oyyo/sales-filter/monthly";
    data.day_url = 'oyyo/performance';
    data.week_url = 'oyyo/performance/weekly-sales';
    data.month_url = 'oyyo/performance/monthly-sales';
    data.year_url = 'oyyo/performance/yearly-sales';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    data.tipType = "Month";
    data.sideDropDown = "non-oyyo"
    console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);


    const weeksRange = moment1.range(a, b);
    const weeksRangeData = Array.from(weeksRange.by('months')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = moment(currentIndex).format("MMM-yyyy");
        return { key: year, value1: 0.0, value2: 0 };
    });

    console.log("user reports----", userReports);
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    amount: { $gt: 0 },
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {
                        "month": { "$month": "$created_date" },
                        "year": { "$year": "$created_date" },
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            {
                $addFields: {
                    "_id.month": {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id.month", 1] }, then: "January" },
                                { case: { $eq: ["$_id.month", 2] }, then: "February" },
                                { case: { $eq: ["$_id.month", 3] }, then: "March" },
                                { case: { $eq: ["$_id.month", 4] }, then: "April" },
                                { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                { case: { $eq: ["$_id.month", 6] }, then: "June" },
                                { case: { $eq: ["$_id.month", 7] }, then: "July" },
                                { case: { $eq: ["$_id.month", 8] }, then: "August" },
                                { case: { $eq: ["$_id.month", 9] }, then: "September" },
                                { case: { $eq: ["$_id.month", 10] }, then: "October" },
                                { case: { $eq: ["$_id.month", 11] }, then: "November" },
                                { case: { $eq: ["$_id.month", 12] }, then: "December" },
                                // ...
                            ],
                            default: "December"
                        }
                    }
                }
            }]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                console.log(result)
                var month_data_list = []
                if (result.length > 0) {
                    result.forEach(element => {

                        var objAr = element.data
                        //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                        function getUniqueDataCount(objArr, propName) {
                            var data = [];
                            var send = []
                            objArr.forEach(function (d, index) {
                                if (d[propName]) {
                                    data.push(d[propName]);
                                }
                            });

                            var uniqueList = [...new Set(data)];

                            for (var i = 0; i < uniqueList.length; i++) {
                                var countt = 0.0;
                                for (var j = 0; j < objArr.length; j++) {
                                    if (uniqueList[i] == objArr[j].title) {
                                        countt += parseFloat(objArr[j].amount);
                                    }
                                }
                                send.push({
                                    "count": data.filter(x => x == uniqueList[i]).length,
                                    "title": uniqueList[i],
                                    "amount": countt
                                });
                            }
                            return send;
                        }
                        month_data_list.push({ "monthName": `${element._id.month}-${element._id.year}`, data: getUniqueDataCount(objAr, "title") });

                    });
                    month_data_list.sort( function ( a, b ) {
                        return moment(b.monthName, 'MMMM-YYYY').format('MM') - moment(a.monthName, 'MMMM-YYYY').format('MM');
                        } );
                    data.result = month_data_list;
                    callback();
                } else {
                    data.result = month_data_list;
                    callback();
                }
            })
        },
        function (callback) {
            appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            amount: { $gt: 0 },
                            status: { $ne: "Cancelled" },
                            created_date: {
                                $gte: new Date(a),
                                $lte: new Date(b)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                // year: { $year: "$created_date" }, 
                                // month: { $month: "$created_date" } 
                                monthName: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                            },
                            totalAmount: { $sum: "$amount" },
                            count: { $sum: 1 }
                        },

                    },
                    // {
                    //     $addFields: {
                    //         "_id.month": {
                    //             $switch: {
                    //                 branches: [
                    //                     { case: { $eq: ["$_id.month", 1] }, then: "Jan" },
                    //                     { case: { $eq: ["$_id.month", 2] }, then: "Feb" },
                    //                     { case: { $eq: ["$_id.month", 3] }, then: "Mar" },
                    //                     { case: { $eq: ["$_id.month", 4] }, then: "Apr" },
                    //                     { case: { $eq: ["$_id.month", 5] }, then: "May" },
                    //                     { case: { $eq: ["$_id.month", 6] }, then: "Jun" },
                    //                     { case: { $eq: ["$_id.month", 7] }, then: "Jul" },
                    //                     { case: { $eq: ["$_id.month", 8] }, then: "Aug" },
                    //                     { case: { $eq: ["$_id.month", 9] }, then: "Sep" },
                    //                     { case: { $eq: ["$_id.month", 10] }, then: "Oct" },
                    //                     { case: { $eq: ["$_id.month", 11] }, then: "Nov" },
                    //                     { case: { $eq: ["$_id.month", 12] }, then: "Dec" },
                    //                     // ...
                    //                 ],
                    //                 default: "December"
                    //             }
                    //         }
                    //     }
                    // }
                ]
            ).exec(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("result-- jhjhg --jhvjh---", result);
                    if (result.length > 0) {
                        result.forEach(ele => {
                            userReports.map(index => index.key == moment(ele._id.monthName).format("MMM-yyyy") ? index.value2 += ele.count : index.value)
                            userReports.map(index => index.key == moment(ele._id.monthName).format("MMM-yyyy") ? index.value1 += ele.totalAmount : index.value);

                        })
                        data.salesReports = userReports
                        callback();
                    } else {
                        data.salesReports = userReports
                        callback();
                    }
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.sales_weekly_filter = function (req, res) {

    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.type = "sales";
    data.filterUrl = "oyyo/sales-filter/weekly";
    data.day_url = 'oyyo/performance';
    data.week_url = 'oyyo/performance/weekly-sales';
    data.month_url = 'oyyo/performance/monthly-sales';
    data.year_url = 'oyyo/performance/yearly-sales';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    data.tipType = "Week";
    data.sideDropDown = "non-oyyo"

    console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);
    endDate.setDate(endDate.getDate() + 1);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);


    const weeksRange = moment1.range(a, b);
    const weeksRangeData = Array.from(weeksRange.by('weeks')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = Moment(currentIndex).format("MM-DD-YYYY");
        return { key: year, value1: 0.0, value2: 0 };
    });
    var userReport1 = weeksRangeData.map(function (currentIndex) {
        var year = Moment(currentIndex).format("MM-DD-YYYY");
        return { weekName: year, title: '', amount: 0, count: 0 };
    });

    console.log("user weeks reports...", userReports);



    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    amount: { $gt: 0 },
                    status: { $ne: "Cancelled" },
                }
            },
            {
                $group: {
                    _id: {
                        'created_date':"$created_date",
                        'title':"$title"
                    },
                     count:{$sum: 1},
                     amount:{$sum: "$amount"},
                     created_date:{$first:"$created_date"}
                    // data: { $push: "$$ROOT" },
                }    
            },{
            $project:{
                title:"$_id.title",
                amount: "$amount",
                count: "$count",
                created_date:"$_id.created_date", 
                _id:0
                }
            }
            , { "$sort": { "created_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                var weekData = []
             //   console.log("result----->>",result);
             userReport1.map(index => index.data = []);
             result.forEach(element=>{
                console.log( "index.key------created date" , element);
                userReport1.map(index => {
                 //  console.log("index.key=============>" ,index.key , "index.key------created date" , element.created_date);
                    if(moment(index.weekName, "MMDDYYYY").isoWeek() == moment(element.created_date, "MMDDYYYY").isoWeek()){
                       // console.log("index.data---",index.data)
                    var array = index.data;    
                    //var array = (typeof index.data == undefined || typeof index.data == "undefined") ? [] : index.data;

                     array.push({title: element.title, amount: element.amount, count: element.count});
                     index.data = [...array];
                    return index;
                    }
                    });
            })
            console.log("userReportData=== ---" , userReport1);

            userReport1.reverse();
          //  userReport1.map(index => index.data.length > 0);
          userReport1.map(function (currentIndex) {
            console.log("userReport1  title--     --------",userReport1.weekName)
            var startDate = moment(currentIndex.weekName).startOf('week').format("MM-DD-YYYY");
            var endDate = moment(currentIndex.weekName).endOf('week').format("MM-DD-YYYY");
            currentIndex.weekName = startDate+' to '+endDate;
            return currentIndex;
            });
             console.log("userReport1       --------",userReport1)
            data.result = userReport1
            callback();

            })
        },
        function (callback) {
            appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            amount: { $gt: 0 },
                            status: { $ne: "Cancelled" },
                            created_date: {
                                $gte: new Date(a),
                                $lte: new Date(b)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                //  week: { $week:  "$created_date"}
                                week: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },

                            },
                            totalAmount: { $sum: "$amount" },
                            count: { $sum: 1 }
                        },

                    }
                ]
            ).exec(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("result-- jhjhg --jhvjh---", result);
                    if (result.length > 0) {
                        result.forEach(ele => {
                            console.log("date of a week", getDateOfWeek((ele._id.week) + 1, 2021));
                            userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value1 += ele.totalAmount : index.value);
                            //userReports.map(index => index.key == monthName ? index.value1 += ele.totalAmount : index.value);
                            userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value2 += ele.count : index.value);
                        })
                        userReports.map(function (currentIndex) {
                            var startDate = moment(currentIndex.key).startOf('week').format("MM-DD-YYYY");
                            var endDate = moment(currentIndex.key).endOf('week').format("MM-DD-YYYY");
                            currentIndex.key = startDate+' to '+endDate;
                            return currentIndex;
                            });
                        data.salesReports = userReports
                        callback();
                    } else {
                        userReports.map(function (currentIndex) {
                            var startDate = moment(currentIndex.key).startOf('week').format("MM-DD-YYYY");
                            var endDate = moment(currentIndex.key).endOf('week').format("MM-DD-YYYY");
                            currentIndex.key = startDate+' to '+endDate;
                            return currentIndex;
                            });
                        data.salesReports = userReports;
                        callback();
                    }

                    function getDateOfWeek(w, y) {
                        var d = (1 + (w - 1) * 7); // 1st of January + 7 days for each week

                        return new Date(y, 0, d);
                    }
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    })
}
exports.sales_yearly_filter = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.type = "sales";
    data.filterUrl = "oyyo/sales-filter/yearly";
    data.day_url = 'oyyo/performance';
    data.week_url = 'oyyo/performance/weekly-sales';
    data.month_url = 'oyyo/performance/monthly-sales';
    data.year_url = 'oyyo/performance/yearly-sales';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    data.tipType = "Year";
    data.sideDropDown = "non-oyyo";
    console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);

    const weeksRange = moment1.range(a, b);
    const weeksRangeData = Array.from(weeksRange.by('years')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = moment(currentIndex).format("MM-DD-YYYY");
        return { key: year, value1: 0.0, value2: 0 };
    });

    console.log("user reports----", userReports);
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    amount: { $gt: 0 },
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {
                        //  "month": { "$month": "$created_date" },
                        "year": { "$year": "$created_date" },
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    //  throw err;
                    console.log("result----->>", err);
                console.log("table data----", result)
                var month_data_list = []
                var month_year_names = []
                if (result.length > 0) {
                    result.forEach(element => {

                        var objAr = element.data
                        //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                        function getUniqueDataCount(objArr, propName) {
                            var data = [];
                            var send = []
                            objArr.forEach(function (d, index) {
                                if (d[propName]) {
                                    data.push(d[propName]);
                                }
                            });

                            var uniqueList = [...new Set(data)];

                            for (var i = 0; i < uniqueList.length; i++) {
                                var countt = 0.0;
                                for (var j = 0; j < objArr.length; j++) {
                                    if (uniqueList[i] == objArr[j].title) {
                                        countt += parseFloat(objArr[j].amount);
                                    }
                                }
                                send.push({
                                    "count": data.filter(x => x == uniqueList[i]).length,
                                    "title": uniqueList[i],
                                    "amount": countt
                                });
                            }
                            return send;
                        }
                        month_data_list.push({ "monthName": `${element._id.year}`, data: getUniqueDataCount(objAr, "title") });
                        month_year_names.push({ key: `${element._id.month}-${element._id.year}`, value1: 0, value2: 0 });

                    });
                    data.result = month_data_list;
                    callback();
                } else {
                    data.result = month_data_list;
                    callback();
                }
            })
        },
        function (callback) {
            appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            amount: { $gt: 0 },
                            status: { $ne: "Cancelled" },
                            created_date: {
                                $gte: new Date(a),
                                $lte: new Date(b)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                //  year: { $year: "$created_date" }, 
                                year: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                                // month: { $month: "$created_date" } 
                            },
                            totalAmount: { $sum: "$amount" },
                            count: { $sum: 1 }
                        },

                    },
                ]
            ).exec(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("result-- jhjhg --jhvjh009---", result);
                    var reports = [];
                    if (result.length > 0) {
                        result.forEach(ele => {
                            //   console.log("db date----," , ele._id.year , "-----sdhd-------" , userReports[0].key)
                            userReports.map(index => moment(index.key).format('YYYY') == moment(ele._id.year).format('YYYY') ? index.value1 += ele.totalAmount : index.value);
                            //userReports.map(index => index.key == monthName ? index.value1 += ele.totalAmount : index.value);
                            userReports.map(index => moment(index.key).format('YYYY') == moment(ele._id.year).format('YYYY') ? index.value2 += ele.count : index.value);
                            data.salesReports = userReports;
                        })
                        callback();
                    } else {
                        data.salesReports = userReports
                        callback();
                    }
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            console.log("Err---", err);
            res.render('customer/performance/performance.ejs', data);
        } else {
            console.log("Success---",);
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.tips_day_filter = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.type = "tips";
    data.filterUrl = "oyyo/tips-filter/daily";
    data.tipType = "Day";
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/tips';
    data.week_url = 'oyyo/performance/weekly-tips';
    data.month_url = 'oyyo/performance/monthly-tips';
    data.year_url = 'oyyo/performance/yearly-tips';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");
    // console.log("a-----------------------a" , a , "----b---" , b); 

    // console.log("req.app.locals.userCustomerSession.mail", req.app.locals.userCustomerSession.mail);
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    tip: { $gt: 0 },
                    //  full_payment:true,
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {

                        yearMonthDay: { $dateToString: { format: "%Y-%m-%d", date: "$created_date" } },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                // console.log(result)
                var month_data_list = []
                if (result.length > 0) {
                    result.forEach(element => {

                        var objAr = element.data
                        //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                        function getUniqueDataCount(objArr, propName) {
                            var data = [];
                            var send = {}
                            objArr.forEach(function (d, index) {
                                if (d[propName]) {
                                    data.push(moment(d[propName]).format("MM-DD-yyyy"));
                                }
                            });

                            var uniqueList = [...new Set(data)];

                            for (var i = 0; i < uniqueList.length; i++) {
                                var countt = 0;
                                var amountCount = 0.0;
                                for (var j = 0; j < objArr.length; j++) {
                                    // console.log("uniq---", uniqueList[i]);
                                    // console.log("created_date---", moment(objArr[j].created_date).format("MM-DD-yyyy"));
                                    if (uniqueList[i] == moment(objArr[j].created_date).format("MM-DD-yyyy")) {
                                        countt += 1;
                                        if (objArr[j].tip !== undefined) {
                                            amountCount += parseFloat(objArr[j].tip)
                                        }
                                    }
                                }
                                send.recieved = amountCount,
                                    send.title = uniqueList[i],
                                    send.tips = countt
                            }
                            return send;
                        }
                        month_data_list.push(getUniqueDataCount(objAr, "created_date"));
                    });
                    month_data_list.sort( function ( a, b ) {
                        return new Date(b.title) - new Date(a.title);
                        } );
                    data.result = month_data_list;
                    console.log("90-------------------90", month_data_list)
                    callback();
                } else {
                    data.result = month_data_list;
                    callback();
                }
            })
        },
        function (callback) {

            const _MS_PER_DAY = 1000 * 60 * 60 * 24;

            // a and b are javascript Date objects
            function dateDiffInDays(a, b) {
                // Discard the time and time-zone information.
                const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
                const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

                return Math.floor((utc2 - utc1) / _MS_PER_DAY);
            }

            // test it
            const a = new Date(req.body.from),
                b = new Date(req.body.to),
                difference = dateDiffInDays(a, b);

            var arr = []
            console.log("diff---", difference);
            var date = startDate
            for (let i = 0; i < difference + 1; i++) {
                arr.push({ key: moment(date).format("MM-DD-YYYY"), value1: 0.0, value2: 0 });
                date.setDate(date.getDate() + 1);
            }

            console.log("Arr data--", arr);

            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                tip: { $gt: 0 },
                // full_payment:"true",
                status: { $ne: "Cancelled" },
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (result.length > 0) {
                        result.forEach(function (user, key, value) {
                            let monthName = moment(user.created_date).format("MM-DD-YYYY");
                            let amount = 0;
                            if(user.tip !== undefined){
                                amount = parseFloat(user.tip);
                            }
                            arr.map(index => index.key == monthName ? index.value1 += amount : index.value);
                            arr.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                        });
                        // console.log("salesReports----------", dates);
                        data.salesReports = arr;
                        callback();
                    } else {
                        data.salesReports = arr;
                        callback();
                    }
                }
            })
        }
    ]


    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.tips_monthly_filter = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.type = "tips";
    data.filterUrl = "oyyo/tips-filter/monthly"
    data.tipType = "Month";
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/tips';
    data.week_url = 'oyyo/performance/weekly-tips';
    data.month_url = 'oyyo/performance/monthly-tips';
    data.year_url = 'oyyo/performance/yearly-tips';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);


    const weeksRange = moment1.range(a, b);
    const weeksRangeData = Array.from(weeksRange.by('months')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = moment(currentIndex).format("MMM-yyyy");
        return { key: year, value1: 0.0, value2: 0 };
    });

    console.log("user reports----", userReports);

    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    tip: { $gt: 0 },
                    //  full_payment:true,
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {
                        "month": { "$month": "$created_date" },
                        "year": { "$year": "$created_date" },
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            {
                $addFields: {
                    "_id.month": {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id.month", 1] }, then: "January" },
                                { case: { $eq: ["$_id.month", 2] }, then: "February" },
                                { case: { $eq: ["$_id.month", 3] }, then: "March" },
                                { case: { $eq: ["$_id.month", 4] }, then: "April" },
                                { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                { case: { $eq: ["$_id.month", 6] }, then: "June" },
                                { case: { $eq: ["$_id.month", 7] }, then: "July" },
                                { case: { $eq: ["$_id.month", 8] }, then: "August" },
                                { case: { $eq: ["$_id.month", 9] }, then: "September" },
                                { case: { $eq: ["$_id.month", 10] }, then: "October" },
                                { case: { $eq: ["$_id.month", 11] }, then: "November" },
                                { case: { $eq: ["$_id.month", 12] }, then: "December" },
                                // ...
                            ],
                            default: "December"
                        }
                    }
                }
            }]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                console.log(result)
                var month_data_list = []
                var month_year_names = []
                result.forEach(element => {

                    var objAr = element.data
                    //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = {}
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(moment(d[propName]).format("MM-DD-yyyy"));
                            }
                        });

                        var uniqueList = [...new Set(data)];

                        for (var i = 0; i < uniqueList.length; i++) {
                            var countt = 0;
                            var amountCount = 0.0;
                            for (var j = 0; j < objArr.length; j++) {
                                // console.log("uniq---", uniqueList[i]);
                                // console.log("created_date---", moment(objArr[j].created_date).format("MM-DD-yyyy"));
                                if (uniqueList[i] == moment(objArr[j].created_date).format("MM-DD-yyyy")) {
                                    countt += 1;
                                    if (objArr[j].tip !== undefined) {
                                        amountCount += parseFloat(objArr[j].tip)
                                    }
                                }
                            }
                            send.recieved = amountCount;
                            send.title = `${element._id.month}-${element._id.year}`;
                            send.tips = countt;
                        }
                        return send;
                    }
                    month_data_list.push(getUniqueDataCount(objAr, "created_date"));

                });
                //  month_year_names.forEach(ele=>{

                //  })
                month_data_list.sort( function ( a, b ) {
                    return moment(b.title, 'MMMM-YYYY').format('MM') - moment(a.title, 'MMMM-YYYY').format('MM');
                    } );
                data.result = month_data_list;
                callback();
            })
        },
        function (callback) {
            appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            tip: { $gt: 0 },
                            //  full_payment:true,
                            status: { $ne: "Cancelled" },
                            created_date: {
                                $gte: new Date(a),
                                $lte: new Date(b)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                monthName: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                                // year: { $year: "$created_date" }, 
                                // month: { $month: "$created_date" } 
                            },
                            totalAmount: { $sum: "$tip" },
                            count: { $sum: 1 }
                            // data: { $push: "$$ROOT" },
                            // total_cost_month: { $sum: "$amount" },
                            // bookings_month: { 
                            //     $push: { 
                            //         date_started: "$date_started",
                            //         date_finished: "$date_finished",
                            //         total_cost: "$total_cost" 
                            //     } 
                            // }
                        },

                    },
                    // {
                    //     $addFields: {
                    //         "_id.month": {
                    //             $switch: {
                    //                 branches: [
                    //                     { case: { $eq: ["$_id.month", 1] }, then: "Jan" },
                    //                     { case: { $eq: ["$_id.month", 2] }, then: "Feb" },
                    //                     { case: { $eq: ["$_id.month", 3] }, then: "Mar" },
                    //                     { case: { $eq: ["$_id.month", 4] }, then: "Apr" },
                    //                     { case: { $eq: ["$_id.month", 5] }, then: "May" },
                    //                     { case: { $eq: ["$_id.month", 6] }, then: "Jun" },
                    //                     { case: { $eq: ["$_id.month", 7] }, then: "Jul" },
                    //                     { case: { $eq: ["$_id.month", 8] }, then: "Aug" },
                    //                     { case: { $eq: ["$_id.month", 9] }, then: "Sep" },
                    //                     { case: { $eq: ["$_id.month", 10] }, then: "Oct" },
                    //                     { case: { $eq: ["$_id.month", 11] }, then: "Nov" },
                    //                     { case: { $eq: ["$_id.month", 12] }, then: "Dec" },
                    //                     // ...
                    //                 ],
                    //                 default: "December"
                    //             }
                    //         }
                    //     }
                    // }
                ]
            ).exec(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("result-- jhjhg --jhvjh---", result);
                    if (result.length > 0) {
                        result.forEach(ele => {
                            userReports.map(index => index.key == moment(ele._id.monthName).format("MMM-yyyy") ? index.value1 += ele.totalAmount : index.value);
                            //  let monthName = moment(ele._id.monthName).format("MMM-yyyy");
                            userReports.map(index => index.key == moment(ele._id.monthName).format("MMM-yyyy") ? index.value2 += 1 : index.value)
                        })
                        data.salesReports = userReports
                        callback();
                    } else {
                        data.salesReports = userReports
                        callback();
                    }
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.tips_weekly_filter = function (req, res) {

    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.type = "tips";
    data.filterUrl = "oyyo/tips-filter/weekly"
    data.tipType = "Week";
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/tips';
    data.week_url = 'oyyo/performance/weekly-tips';
    data.month_url = 'oyyo/performance/monthly-tips';
    data.year_url = 'oyyo/performance/yearly-tips';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';

    console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);


    const weeksRange = moment1.range(a, b);
    const weeksRangeData = Array.from(weeksRange.by('weeks')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = Moment(currentIndex).format("MM-DD-YYYY");
        return { key: year, value1: 0.0, value2: 0 };
    });


    console.log("user weeks reports...", userReports);

    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    tip: { $gt: 0 },
                    //  full_payment:true,
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {
                        week: { $week: "$created_date" }
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                console.log(result)
                var month_data_list = []
                if (result.length > 0) {
                    result.forEach(element => {

                        var objAr = element.data
                        //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                        function getUniqueDataCount(objArr, propName) {
                            var data = [];
                            var send = {}
                            objArr.forEach(function (d, index) {
                                if (d[propName]) {
                                    data.push(moment(d[propName]).format("MM-DD-yyyy"));
                                }
                            });

                            var uniqueList = [...new Set(data)];

                            for (var i = 0; i < uniqueList.length; i++) {
                                var countt = 0;
                                var amountCount = 0.0;
                                for (var j = 0; j < objArr.length; j++) {
                                    // console.log("uniq---", uniqueList[i]);
                                    // console.log("created_date---", moment(objArr[j].created_date).format("MM-DD-yyyy"));
                                    if (uniqueList[i] == moment(objArr[j].created_date).format("MM-DD-yyyy")) {
                                        countt += 1;
                                        if (objArr[j].tip !== undefined) {
                                            amountCount += parseFloat(objArr[j].tip)
                                        }
                                    }
                                }
                                send.recieved = amountCount,
                                    send.title = moment(getDateOfWeek((element._id.week) + 1, 2021)).format("MM-DD-yyyy"),
                                    send.tips = countt
                            }
                            return send;
                        }
                        month_data_list.push(getUniqueDataCount(objAr, "created_date"));

                    });
                    data.result = month_data_list;
                    callback();
                } else {
                    data.result = month_data_list;
                    callback();
                }
            })
            function getDateOfWeek(w, y) {
                var d = (1 + (w - 1) * 7); // 1st of January + 7 days for each week

                return new Date(y, 0, d);
            }
        },
        function (callback) {
            appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            tip: { $gt: 0 },
                            // full_payment:true,
                            status: { $ne: "Cancelled" },
                            created_date: {
                                $gte: new Date(a),
                                $lte: new Date(b)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                //  week: { $week:  "$created_date"}
                                week: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                            },
                            totalAmount: { $sum: "$tip" },
                            count: { $sum: 1 }
                        },

                    }
                ]
            ).exec(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("result-- jhjhg --jhvjh---", result);
                    var reports = [];
                    if (result.length > 0) {
                        result.forEach(ele => {
                            userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value1 += ele.totalAmount : index.value);
                            userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value2 += ele.count : index.value);
                        })
                        userReports.map(function (currentIndex) {
                            var startDate = moment(currentIndex.key).startOf('week').format("MM-DD-YYYY");
                            var endDate = moment(currentIndex.key).endOf('week').format("MM-DD-YYYY");
                            currentIndex.key = startDate+' to '+endDate;
                            return currentIndex;
                        });
                        data.salesReports = userReports;
                        var arr = [];
                        userReports.forEach(ele=>{
                        if(ele.value1>0){
                         arr.push({title:ele.key , tips:ele.value2, recieved:ele.value1});
                         }
                        });
                        arr.reverse();
                        data.result = arr;
                        callback();
                    } else {
                        userReports.map(function (currentIndex) {
                            var startDate = moment(currentIndex.key).startOf('week').format("MM-DD-YYYY");
                            var endDate = moment(currentIndex.key).endOf('week').format("MM-DD-YYYY");
                            currentIndex.key = startDate+' to '+endDate;
                            return currentIndex;
                        });
                        data.salesReports = userReports
                        callback();
                    }
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    })
}
exports.tips_yearly_filter = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.type = "tips";
    data.filterUrl = "oyyo/tips-filter/yearly"
    data.tipType = "Year";
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/tips';
    data.week_url = 'oyyo/performance/weekly-tips';
    data.month_url = 'oyyo/performance/monthly-tips';
    data.year_url = 'oyyo/performance/yearly-tips';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");
    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);

    const weeksRange = moment1.range(a, b);
    const weeksRangeData = Array.from(weeksRange.by('years')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = moment(currentIndex).format("MM-DD-YYYY");
        return { key: year, value1: 0.0, value2: 0 };
    });

    console.log("user reports----", userReports);
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    tip: { $gt: 0 },
                    // full_payment:true,
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {
                        //  "month": { "$month": "$created_date" },
                        "year": { "$year": "$created_date" },
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                var month_data_list = []
                if (result.length > 0) {
                    result.forEach(element => {

                        var objAr = element.data
                        //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                        function getUniqueDataCount(objArr, propName) {
                            var data = [];
                            var send = {}
                            objArr.forEach(function (d, index) {
                                if (d[propName]) {
                                    data.push(moment(d[propName]).format("MM-DD-yyyy"));
                                }
                            });

                            var uniqueList = [...new Set(data)];

                            for (var i = 0; i < uniqueList.length; i++) {
                                var countt = 0;
                                var amountCount = 0.0;
                                for (var j = 0; j < objArr.length; j++) {
                                    // console.log("uniq---", uniqueList[i]);
                                    // console.log("created_date---", moment(objArr[j].created_date).format("MM-DD-yyyy"));
                                    if (uniqueList[i] == moment(objArr[j].created_date).format("MM-DD-yyyy")) {
                                        countt += 1;
                                        if (objArr[j].tip !== undefined) {
                                            amountCount += parseFloat(objArr[j].tip)
                                        }
                                    }
                                }
                                send.recieved = amountCount,
                                    send.title = element._id.year,
                                    send.tips = countt
                            }
                            return send;
                        }
                        month_data_list.push(getUniqueDataCount(objAr, "created_date"));
                    });
                    data.result = month_data_list;
                    callback();
                } else {
                    data.result = [];
                    callback();
                }
            })
        },
        function (callback) {
            appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            tip: { $gt: 0 },
                            // full_payment:true,
                            status: { $ne: "Cancelled" },
                            created_date: {
                                $gte: new Date(a),
                                $lte: new Date(b)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                // year: { $year: "$created_date" }, 
                                year: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                            },
                            totalAmount: { $sum: "$tip" },
                            count: { $sum: 1 }
                        },

                    },
                ]
            ).exec(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("result-- jhjhg --jhvjh---", result);
                    if (result.length > 0) {
                        result.forEach(ele => {
                            userReports.map(index => moment(index.key).format('YYYY') == moment(ele._id.year).format('YYYY') ? index.value1 += ele.totalAmount : index.value);
                            //userReports.map(index => index.key == monthName ? index.value1 += ele.totalAmount : index.value);
                            userReports.map(index => moment(index.key).format('YYYY') == moment(ele._id.year).format('YYYY') ? index.value2 += ele.count : index.value);
                            data.salesReports = userReports
                            callback();
                        })
                    } else {
                        data.salesReports = userReports;
                        callback();
                    }
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            console.log("Err---", err);
            res.render('customer/performance/performance.ejs', data);
        } else {
            console.log("Success---",);
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.customer_satisfaction_day_filter = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.filterUrl = "oyyo/customer-satisfaction-filter/monthly"
    data.type = "customer_satisfaction"
    data.tipType = "Day";
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/customer-satisfaction';
    data.week_url = 'oyyo/performance/customer-satisfaction/weekly';
    data.month_url = 'oyyo/performance/customer-satisfaction/monthly';
    data.year_url = 'oyyo/performance/customer-satisfaction/yearly';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);
    endDate.setDate(endDate.getDate() + 1);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");
    // console.log("a-----------------------a" , a , "----b---" , b); 

    // console.log("req.app.locals.userCustomerSession.mail", req.app.locals.userCustomerSession.mail);
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    status: "Completed",
                    rate: { $gt: 0 },
                    rated_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {

                        yearMonthDay: { $dateToString: { format: "%Y-%m-%d", date: "$rated_date" } },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "rated_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                 console.log("result----->>" , result);
                // console.log(result)
                var month_data_list = []
                if (result.length > 0) {
                    result.forEach(element => {

                        var objAr = element.data
                        function getUniqueDataCount(objArr, propName) {
                            var data = [];
                            var send = {}
                            objArr.forEach(function (d, index) {
                                if (d[propName]) {
                                    data.push(moment(d[propName]).format("MM-DD-yyyy"));
                                }
                            });

                            var uniqueList = [...new Set(data)];

                            for (var i = 0; i < uniqueList.length; i++) {
                                var countt = 0;
                                var amountCount = 0;
                                for (var j = 0; j < objArr.length; j++) {
                                    // console.log("uniq---", uniqueList[i]);
                                    // console.log("created_date---", moment(objArr[j].created_date).format("MM-DD-yyyy"));
                                    if (uniqueList[i] == moment(objArr[j].created_date).format("MM-DD-yyyy")) {
                                        countt += 1;
                                        if (objArr[j].rate !== undefined) {
                                            amountCount += parseInt(objArr[j].rate)
                                        }
                                    }
                                }
                                send.transactions = countt,
                                send.title = uniqueList[i],
                                send.total = amountCount/countt
                            }
                            return send;
                        }
                        month_data_list.push(getUniqueDataCount(objAr, "rated_date"));
                    });
                    month_data_list.sort( function ( a, b ) {
                        return new Date(b.title) - new Date(a.title);
                        } );
                    data.result = month_data_list;
                    console.log("90-------------------90", month_data_list);
                    callback();
                } else {
                    data.result = month_data_list;
                    callback();
                }
            })
        },
        function (callback) {

            const _MS_PER_DAY = 1000 * 60 * 60 * 24;

            // a and b are javascript Date objects
            function dateDiffInDays(a, b) {
                // Discard the time and time-zone information.
                const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
                const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

                return Math.floor((utc2 - utc1) / _MS_PER_DAY);
            }

            // test it
            const a = new Date(req.body.from),
                b = new Date(req.body.to),
                difference = dateDiffInDays(a, b);

            var arr = []
            console.log("diff---", difference);
            var date = startDate
            for (let i = 0; i < difference + 1; i++) {
                arr.push({ key: moment(date).format("MM-DD-YYYY"), value1: 0, value2: 0 });
                date.setDate(date.getDate() + 1);
            }

            console.log("Arr data--", arr);

            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                status: "Completed",
                rate: { $gt: 0 },
                rated_date: {
                    $gte: new Date(a),
                    $lte: new Date(b)
                }
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (result.length > 0) {
                        result.forEach(function (user, key, value) {
                            let monthName = moment(user.rated_date).format("MM-DD-YYYY");
                            let amount = 0;
                            if(user.rate !== undefined){
                                amount = parseInt(user.rate);
                            }
                            arr.map(index => index.key == monthName ? index.value1 += amount : index.value);
                            arr.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                        });
                        // console.log("salesReports----------", dates);
                        data.salesReports = arr;
                        callback();
                    } else {
                        data.salesReports = arr;
                        callback();
                    }
                }
            })
        }
    ]


    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.customer_satisfaction_monthly_filter = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.filterUrl = "oyyo/customer-satisfaction-filter/monthly"
    data.type = "customer_satisfaction"
    data.tipType = "Month";
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/customer-satisfaction';
    data.week_url = 'oyyo/performance/customer-satisfaction/weekly';
    data.month_url = 'oyyo/performance/customer-satisfaction/monthly';
    data.year_url = 'oyyo/performance/customer-satisfaction/yearly';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);
    endDate.setDate(endDate.getDate() + 1);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);


    const weeksRange = moment1.range(a, b);
    const weeksRangeData = Array.from(weeksRange.by('months')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = moment(currentIndex).format("MMM-yyyy");
        return { key: year, value1: 0, value2: 0 };
    });

    console.log("user reports----", userReports);
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    status: "Completed",
                    rate: { $gt: 0 },
                    rated_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {
                        "month": { "$month": "$rated_date" },
                        "year": { "$year": "$rated_date" },
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "rated_date": 1 } },
            {
                $addFields: {
                    "_id.month": {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id.month", 1] }, then: "January" },
                                { case: { $eq: ["$_id.month", 2] }, then: "February" },
                                { case: { $eq: ["$_id.month", 3] }, then: "March" },
                                { case: { $eq: ["$_id.month", 4] }, then: "April" },
                                { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                { case: { $eq: ["$_id.month", 6] }, then: "June" },
                                { case: { $eq: ["$_id.month", 7] }, then: "July" },
                                { case: { $eq: ["$_id.month", 8] }, then: "August" },
                                { case: { $eq: ["$_id.month", 9] }, then: "September" },
                                { case: { $eq: ["$_id.month", 10] }, then: "October" },
                                { case: { $eq: ["$_id.month", 11] }, then: "November" },
                                { case: { $eq: ["$_id.month", 12] }, then: "December" },
                                // ...
                            ],
                            default: "December"
                        }
                    }
                }
            }]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                console.log(result)
                var month_data_list = []
                result.forEach(element => {
                    var objAr = element.data
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = {}
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(moment(d[propName]).format("MMM"));
                            }
                        });

                        var uniqueList = [...new Set(data)];

                        for (var i = 0; i < uniqueList.length; i++) {
                            var countt = 0;
                            var amountCount = 0;
                            for (var j = 0; j < objArr.length; j++) {
                                if (uniqueList[i] == moment(objArr[j].rated_date).format("MMM")) {
                                    countt += 1;
                                    if (objArr[j].rate !== undefined) {
                                        amountCount += parseInt(objArr[j].rate);
                                    }
                                }
                            }
                            send.transactions = countt,
                            send.title =`${element._id.month}-${element._id.year}`,
                            send.total = amountCount/countt
                        }
                        return send;
                    }
                    /// console.log("getUniqueDataCount(objAr , 'title')", getUniqueDataCount(objAr , "title"));
                    month_data_list.push(getUniqueDataCount(objAr, "rated_date"));
                });
                month_data_list.sort( function ( a, b ) {
                    return moment(b.title, 'MMMM-YYYY').format('MM') - moment(a.title, 'MMMM-YYYY').format('MM');
                    } );
                data.result = month_data_list;
                callback();
            })
        },
        function (callback) {
            appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            status: "Completed",
                            rate: { $gt: 0 },
                            rated_date: {
                                $gte: new Date(a),
                                $lte: new Date(b)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                // year: { $year: "$created_date" }, 
                                // month: { $month: "$created_date" } 
                                monthName: { $dateToString: { format: "%m-%d-%Y", date: "$rated_date" } },

                            },
                            totalAmount: { $sum: "$rate" },
                            count: { $sum: 1 }
                        },

                    },
                ]
            ).exec(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("result-- jhjhg --jhvjh---", result);
                    if (result.length > 0) {
                        result.forEach(ele => {
                           // console.log("db-date ------ ,", moment(ele._id.monthName).format("MM-yyyy"), "user reports--", moment(userReports[0].key).format("MM-yyyy"));

                            userReports.map(index => index.key == moment(ele._id.monthName).format("MMM-yyyy") ? index.value1 += ele.totalAmount : index.value);
                            userReports.map(index => index.key == moment(ele._id.monthName).format("MMM-yyyy") ? index.value2 += ele.count : index.value);
                        })
                        data.salesReports = userReports
                        callback();
                    } else {
                        data.salesReports = userReports
                        callback();
                    }
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}
exports.customer_satisfaction_weekly_filter = function (req, res) {

    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.filterUrl = "oyyo/customer-satisfaction-filter/weekly"
    data.type = "customer_satisfaction"
    data.tipType = "Week";
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/customer-satisfaction';
    data.week_url = 'oyyo/performance/customer-satisfaction/weekly';
    data.month_url = 'oyyo/performance/customer-satisfaction/monthly';
    data.year_url = 'oyyo/performance/customer-satisfaction/yearly';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';

    console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);
    endDate.setDate(endDate.getDate() + 1);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);


    const weeksRange = moment1.range(a, b);
    const weeksRangeData = Array.from(weeksRange.by('weeks')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = Moment(currentIndex).format("MM-DD-YYYY");
        return { key: year, value1: 0, value2: 0 };
    });
    console.log("a-----------------------a", a, "----b---", b);
    function weeksBetween(d1, d2) {
        return Math.round((d2 - d1) / (7 * 24 * 60 * 60 * 1000));
    }
    console.log("Weeks data------,,,",
        weeksBetween(new Date(startDate), new Date(endDate)));



    var tasks = [
        function (callback) {
            appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            status: "Completed",
                            rate: { $gt: 0 },
                            rated_date: {
                                $gte: new Date(a),
                                $lte: new Date(b)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                // week: { $week:  "$created_date"}
                                week: { $dateToString: { format: "%m-%d-%Y", date: "$rated_date" } },
                            },
                            totalAmount: { $sum: "$rate" },
                            count: { $sum: 1 }
                        },

                    }
                ]
            ).exec(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("result-- jhjhg --jhvjh---", result);
                    if (result.length > 0) {
                        result.forEach(ele => {
                            userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value1 += ele.totalAmount : index.value);
                            userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value2 += ele.count : index.value);
                        })
                        userReports.map(function (currentIndex) {
                            var startDate = moment(currentIndex.key).startOf('week').format("MM-DD-YYYY");
                            var endDate = moment(currentIndex.key).endOf('week').format("MM-DD-YYYY");
                            currentIndex.key = startDate+' to '+endDate;
                            return currentIndex;
                        });
                        data.salesReports = userReports
                        var arr = [];
                        userReports.forEach(ele=>{
                            if(ele.value1>0){
                            arr.push({"title":ele.key , "total":ele.value1/ele.value2, "transactions":ele.value2});
                            }
                        });
                        arr.reverse();
                        data.result = arr
                        callback();
                    } else {
                        data.salesReports = userReports
                        data.result = [];
                        callback();
                    }
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    })
}
exports.customer_satisfaction_yearly_filter = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.filterUrl = "oyyo/customer-satisfaction-filter/yearly"
    data.type = "customer_satisfaction"
    data.tipType = "Year";
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/customer-satisfaction';
    data.week_url = 'oyyo/performance/customer-satisfaction/weekly';
    data.month_url = 'oyyo/performance/customer-satisfaction/monthly';
    data.year_url = 'oyyo/performance/customer-satisfaction/yearly';
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);
    endDate.setDate(endDate.getDate() + 1);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);

    const weeksRange = moment1.range(a, b);
    const weeksRangeData = Array.from(weeksRange.by('years')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = moment(currentIndex).format("MM-DD-YYYY");
        return { key: year, value1: 0, value2: 0 };
    });

    console.log("user reports----", userReports);
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    status: "Completed",
                    rate: { $gt: 0 },
                    rated_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {
                        //  "month": { "$month": "$created_date" },
                        "year": { "$year": "$rated_date" },
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "rated_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    //  throw err;
                    console.log("result----->>", err);
                console.log("table data----", result)
                var month_data_list = []
                if (result.length > 0) {
                    result.forEach(element => {
                        var objAr = element.data
                        function getUniqueDataCount(objArr, propName) {
                            var data = [];
                            var send = {}
                            objArr.forEach(function (d, index) {
                                if (d[propName]) {
                                    data.push(moment(d[propName]).format("MM-DD-yyyy"));
                                }
                            });
    
                            var uniqueList = [...new Set(data)];
    
                            for (var i = 0; i < uniqueList.length; i++) {
                                var countt = 0;
                                var amountCount = 0;
                                for (var j = 0; j < objArr.length; j++) {
                                    if (uniqueList[i] == moment(objArr[j].rated_date).format("MM-DD-yyyy")) {
                                        countt += 1;
                                        if (objArr[j].rate !== undefined) {
                                            amountCount += parseInt(objArr[j].rate)
                                        } 
                                    }
                                }
                                send.transactions = countt,
                                send.title = uniqueList[i],
                                send.total = amountCount/countt
                            }
                            return send;
                        }
                        month_data_list.push(getUniqueDataCount(objAr, "rated_date"));
                    });
                    data.result = month_data_list
                    callback();
                } else {
                    data.result = [];
                    callback();
                }
            })
        },
        function (callback) {
            appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            status: "Completed",
                            rate: { $gt: 0 },
                            rated_date: {
                                $gte: new Date(a),
                                $lte: new Date(b)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                //  year: { $year: "$created_date" }, 
                                year: { $dateToString: { format: "%m-%d-%Y", date: "$rated_date" } },
                            },
                            totalAmount: { $sum: "$rate" },
                            count: { $sum: 1 }
                        },
                    },
                ]
            ).exec(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("result-- jhjhg --jhvjh---", result);
                    if (result.length > 0) {
                        result.forEach(ele => {
                            userReports.map(index => moment(index.key).format('YYYY') == moment(ele._id.year).format('YYYY') ? index.value1 += ele.totalAmount : index.value);
                            //userReports.map(index => index.key == monthName ? index.value1 += ele.totalAmount : index.value);
                            userReports.map(index => moment(index.key).format('YYYY') == moment(ele._id.year).format('YYYY') ? index.value2 += ele.count : index.value);
                            data.salesReports = userReports
                        })
                        callback();
                    } else {
                        data.salesReports = userReports;
                        callback();
                    }
                }
            })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            console.log("Err---", err);
            res.render('customer/performance/performance.ejs', data);
        } else {
            console.log("Success---",);
            res.render('customer/performance/performance.ejs', data);
        }
    });
}

exports.visit_day_filter = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.type = "visit";
    data.filterUrl = "oyyo/visit-filter/daily";
    data.tipType = "Day";
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/visit-overview';
    data.week_url = 'oyyo/performance/visit-overview/weekly';
    data.month_url = 'oyyo/performance/visit-overview/monthly';
    data.year_url = 'oyyo/performance/visit-overview/yearly';
   // console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");
    // console.log("a-----------------------a" , a , "----b---" , b); 

    // console.log("req.app.locals.userCustomerSession.mail", req.app.locals.userCustomerSession.mail);
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    //  full_payment:true,
                    // status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {

                        yearMonthDay: { $dateToString: { format: "%Y-%m-%d", date: "$created_date" } },

                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                // console.log(result)
                var month_data_list = []
                if (result.length > 0) {
                    result.forEach(element => {

                        var objAr = element.data
                        //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                        function getUniqueDataCount(objArr, propName) {
                            var data = [];
                            var send = {}
                            objArr.forEach(function (d, index) {
                                if (d[propName]) {
                                    data.push(d[propName]);
                                }
                            });

                            var uniqueList = [...new Set(data)];
                            var totalAppoints = 0;
                            var cancelled = 0;
                            var noShows = 0;
                           // console.log("uniq,,, list " , uniqueList);
                            uniqueList.forEach(uniq=>{
                                var title ;
                                objAr.forEach(ob=>{
                                    title =  moment(ob.created_date).format("MM-DD-yyyy");
                                    if(uniq == ob.status){
                                        if (uniq) {
                                            //console.log("all Appointments,,,");
                                            totalAppoints += 1;
                                        }
                                        if (uniq == "No Show") {
                                            noShows += 1;
                                        }
                                        if (uniq == "Cancelled") {
                                            cancelled += 1;
                                        }
                                    }
                                })
                                send.total = totalAppoints;
                                send.title = title;
                                send.cancelled = cancelled;
                                send.noShows = noShows
                            })
                        //     }
                             return send;
                           
                        }
                        month_data_list.push(getUniqueDataCount(objAr, "status"));
                    });
                    month_data_list.sort( function ( a, b ) {
                        return new Date(b.title) - new Date(a.title);
                        } );
                    data.result = month_data_list;
                  // console.log("90-------------------90", month_data_list)
                    callback();
                } else {
                    data.result = month_data_list;
                    callback();
                }
            })
        },
        function (callback) {

            const _MS_PER_DAY = 1000 * 60 * 60 * 24;

            // a and b are javascript Date objects
            function dateDiffInDays(a, b) {
                // Discard the time and time-zone information.
                const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
                const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

                return Math.floor((utc2 - utc1) / _MS_PER_DAY);
            }

            // test it
            const a = new Date(req.body.from),
                b = new Date(req.body.to),
                difference = dateDiffInDays(a, b);

            var arr = []
           // console.log("diff---", difference);
            var date = startDate
            for (let i = 0; i < difference + 1; i++) {
                arr.push({ key: moment(date).format("MM-DD-YYYY"), value1: 0.0, value2: 0 });
                date.setDate(date.getDate() + 1);
            }

            console.log("Arr data--", arr);

            appointments.find({
                ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                // full_payment:"true",
                status: { $ne: "Cancelled" },
            }, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (result.length > 0) {
                        result.forEach(function (user, key, value) {
                            let monthName = moment(user.created_date).format("MM-DD-YYYY");
                            let amount = parseFloat(user.tip);
                            // total appointments start
                            arr.map(index => index.key == monthName ? index.value1 += 1 : index.value);
                            // arr.map(index => index.key == monthName && user.status == "Cancelled" ? index.value1 += 1 : index.value);
                            // arr.map(index => index.key == monthName && user.status == "Pending" ? index.value1 += 1 : index.value);
                            // arr.map(index => index.key == monthName && user.status == "Ongoing" ? index.value1 += 1 : index.value);
                            // end
                            arr.map(index => index.key == monthName && user.status == "Cancelled" ? index.value2 += 1 : index.value);
                            arr.map(index => index.key == monthName && user.status == "No Show" ? index.value3 += 1 : index.value);
                            //arr.map(index => index.key == monthName && user.status == "Ongoing" ? index.value3 += 1 : index.value);
                            // dates.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                        });
                        //     dates.reverse(); 

                        // result.forEach(function (user, key, value) {
                        //     let monthName = moment(user.created_date).format("DD-MMM");
                        //     let amount = parseFloat(user.tip);
                        //     arr.map(index => index.key == monthName ? index.value1 += amount : index.value);
                        //     arr.map(index => index.key == monthName ? index.value2 += 1 : index.value);
                        // });
                        // console.log("salesReports----------", dates);
                        data.salesReports = arr;
                        callback();
                    } else {
                        data.salesReports = arr;
                        callback();
                    }
                }
            })
        }
    ]


    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}

exports.visit_monthly_filter = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.type = "visit";
    data.filterUrl = "oyyo/visit-filter/monthly"
    data.tipType = "Month";
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/visit-overview';
    data.week_url = 'oyyo/performance/visit-overview/weekly';
    data.month_url = 'oyyo/performance/visit-overview/monthly';
    data.year_url = 'oyyo/performance/visit-overview/yearly';
  //  console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);


    const weeksRange = moment1.range(a, b);
    const weeksRangeData = Array.from(weeksRange.by('months')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = moment(currentIndex).format("MMM-yyyy");
        return { key: year, value1: 0.0, value2: 0, value3: 0 };
    });

    console.log("user reports----", userReports);

    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    //  full_payment:true,
                   // status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {
                        "month": { "$month": "$created_date" },
                        "year": { "$year": "$created_date" },
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            {
                $addFields: {
                    "_id.month": {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id.month", 1] }, then: "January" },
                                { case: { $eq: ["$_id.month", 2] }, then: "February" },
                                { case: { $eq: ["$_id.month", 3] }, then: "March" },
                                { case: { $eq: ["$_id.month", 4] }, then: "April" },
                                { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                { case: { $eq: ["$_id.month", 6] }, then: "June" },
                                { case: { $eq: ["$_id.month", 7] }, then: "July" },
                                { case: { $eq: ["$_id.month", 8] }, then: "August" },
                                { case: { $eq: ["$_id.month", 9] }, then: "September" },
                                { case: { $eq: ["$_id.month", 10] }, then: "October" },
                                { case: { $eq: ["$_id.month", 11] }, then: "November" },
                                { case: { $eq: ["$_id.month", 12] }, then: "December" },
                                // ...
                            ],
                            default: "December"
                        }
                    }
                }
            }]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
               // console.log(result)
                var month_data_list = []
                result.forEach(element => {

                    var objAr = element.data
                    //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                    function getUniqueDataCount(objArr, propName) {
                        var data = [];
                        var send = {}
                        objArr.forEach(function (d, index) {
                            if (d[propName]) {
                                data.push(d[propName]);
                            }
                        });

                        var uniqueList = [...new Set(data)];
                        var totalAppoints = 0;
                        var cancelled = 0;
                        var noShows = 0;
                        for (var i = 0; i < uniqueList.length; i++) {

                            for (var j = 0; j < objArr.length; j++) {
                                if (uniqueList[i] == objArr[j].status) {
                                    // if ( uniqueList[i] == objArr[j].status) {
                                    if (uniqueList[i]) {
                                       // console.log("all Appointments,,,");
                                        totalAppoints += 1;
                                    }
                                    if (uniqueList[i] == "No Show") {
                                        noShows += 1;
                                    }
                                    if (uniqueList[i] == "Cancelled") {
                                        cancelled += 1;
                                    }
                                    //   }
                                }
                            }
                            console.log("all Appointments,,,", totalAppoints);
                            send.total = totalAppoints;
                            send.title = `${element._id.month}-${element._id.year}`
                            send.cancelled = cancelled;
                            send.noShows = noShows
                        }
                        return send;
                    }
                    //  console.log("getUniqueDataCount(objAr" ,getUniqueDataCount(objAr, "status"));

                    month_data_list.push(getUniqueDataCount(objAr, "status"));

                });
                //  month_year_names.forEach(ele=>{

                //  })
                month_data_list.sort( function ( a, b ) {
                    return moment(b.title, 'MMMM-YYYY').format('MM') - moment(a.title, 'MMMM-YYYY').format('MM');
                    } );
                data.result = month_data_list;
                callback();
            })
        },
        async function (callback) {
            var cancelled = await appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            //  full_payment:true,
                            status: "Cancelled",
                            created_date: {
                                $gte: new Date(a),
                                $lte: new Date(b)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                monthName: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                            },
                            //  totalAmount: { $sum: "$tip" },
                            count: { $sum: 1 }
                        },

                    },
                ]
            );
            cancelled.forEach(ele => {
                userReports.map(index => index.key == moment(ele._id.monthName).format("MMM-yyyy") ? index.value2 += ele.count : index.value);
            })
            var totalAppoints = await appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            //  full_payment:true,
                            status: { $ne: "Cancelled" },
                            created_date: {
                                $gte: new Date(a),
                                $lte: new Date(b)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                monthName: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                            },
                            // totalAmount: { $sum: "$tip" },
                            count: { $sum: 1 }
                        },

                    },
                ]
            );
            totalAppoints.forEach(ele => {
                userReports.map(index => index.key == moment(ele._id.monthName).format("MMM-yyyy") ? index.value1 += ele.count : index.value);
            })
            var noShows = await appointments.aggregate(
                [
                    {
                        $match: {
                            ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                            //  full_payment:true,
                            status: "No Show",
                            created_date: {
                                $gte: new Date(a),
                                $lte: new Date(b)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                monthName: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                            },
                            // totalAmount: { $sum: "$tip" },
                            count: { $sum: 1 }
                        },

                    },
                ]
            );
            noShows.forEach(ele => {
                userReports.map(index => index.key == moment(ele._id.monthName).format("MMM-yyyy") ? index.value3 += ele.count : index.value);
            })
            console.log("visit graph filtger", userReports);
            data.salesReports = userReports
            callback();
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    });
}

exports.visit_weekly_filter = function (req, res) {

    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.dateFormat = dateFormat;
    data.type = "visit";
    data.filterUrl = "oyyo/visit-filter/weekly"
    data.tipType = "Week";
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/visit-overview';
    data.week_url = 'oyyo/performance/visit-overview/weekly';
    data.month_url = 'oyyo/performance/visit-overview/monthly';
    data.year_url = 'oyyo/performance/visit-overview/yearly';

    console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");

    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);


    const weeksRange = moment1.range(a, b);
    const weeksRangeData = Array.from(weeksRange.by('weeks')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = Moment(currentIndex).format("MM-DD-YYYY");
        return { key: year, value1: 0.0, value2: 0, value3: 0 };
    });


    console.log("user weeks reports...", userReports);

    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    //  full_payment:true,
                  //  status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {
                        week: { $week: "$created_date" }
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                // console.log("result----->>");
                console.log(result)
                var month_data_list = []
                if (result.length > 0) {
                    result.forEach(element => {

                        var objAr = element.data
                        //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                        function getUniqueDataCount(objArr, propName) {
                            var data = [];
                            var send = {}
                            objArr.forEach(function (d, index) {
                                if (d[propName]) {
                                    data.push(d[propName]);
                                }
                            });
    
                            var uniqueList = [...new Set(data)];
                            var totalAppoints = 0;
                        var cancelled = 0;
                        var noShows = 0;
                       // console.log("uniq,,, list " , uniqueList);
                        uniqueList.forEach(uniq=>{
                            var title ;
                            objAr.forEach(ob=>{
                                title =   moment(getDateOfWeek((element._id.week) + 1, 2021)).format("MM-DD-yyyy");
                                if(uniq == ob.status){
                                    if (uniq) {
                                        //console.log("all Appointments,,,");
                                        totalAppoints += 1;
                                    }
                                    if (uniq == "No Show") {
                                        noShows += 1;
                                    }
                                    if (uniq == "Cancelled") {
                                        cancelled += 1;
                                    }
                                }
                            })
                            send.total = totalAppoints;
                                     send.title = title;
                                     send.cancelled = cancelled;
                                     send.noShows = noShows
                        })
                    //     }
                         return send;
                    }
                        //  console.log("getUniqueDataCount(objAr" ,getUniqueDataCount(objAr, "status"));
    
                        month_data_list.push(getUniqueDataCount(objAr, "status"));
                    });
                    data.result = month_data_list;
                    callback();
                } else {
                    data.result = month_data_list;
                    callback();
                }
            })
            function getDateOfWeek(w, y) {
                var d = (1 + (w - 1) * 7); // 1st of January + 7 days for each week

                return new Date(y, 0, d);
            }
        },
    async function (callback) {

    var cancelled = await appointments.aggregate(
        [
            {
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    // full_payment:true,
                    status:  "Cancelled" ,
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        week: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                    },
                    count: { $sum: 1 }
                },

            }
        ]
    );
    cancelled.forEach(ele => {
        userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value2 += ele.count : index.value);
    })
    var totalAppoints = await appointments.aggregate(
        [
            {
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    // full_payment:true,
                    status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        //  week: { $week:  "$created_date"}
                        week: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                    },
                    count: { $sum: 1 }
                },

            }
        ]
    );
    totalAppoints.forEach(ele => {
        userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value1 += ele.count : index.value);
    })

    var noShows = await appointments.aggregate(
        [
            {
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    // full_payment:true,
                    status: "No Show",
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        week: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                    },
                    count: { $sum: 1 }
                },

            }
        ]
    );
    noShows.forEach(ele => {
        userReports.map(index => moment(index.key, "MMDDYYYY").isoWeek() == moment(ele._id.week, "MMDDYYYY").isoWeek() ? index.value3 += ele.count : index.value);
    })
    console.log("visit graph filtger", userReports);
    userReports.map(function (currentIndex) {
        var startDate = moment(currentIndex.key).startOf('week').format("MM-DD-YYYY");
        var endDate = moment(currentIndex.key).endOf('week').format("MM-DD-YYYY");
        currentIndex.key = startDate+' to '+endDate;
        return currentIndex;
        });
    data.salesReports = userReports
    var arr = [];
            userReports.forEach(ele=>{
                if(ele.value1>0){
                arr.push({title:ele.key , total:ele.value1 , cancelled:ele.value2 , noShows:ele.value3});
                }
            });
            arr.reverse();
            data.result = arr;
    callback();
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            res.render('customer/performance/performance.ejs', data);
        } else {
            res.render('customer/performance/performance.ejs', data);
        }
    })
}
exports.visit_yearly_filter = function (req, res) {
    data = {};
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    data.error = req.flash("error");
    data.success = req.flash("success");
    data.session = req.session;
    data.type = "visit";
    data.filterUrl = "oyyo/visit-filter/yearly"
    data.tipType = "Year";
    data.top_filter_sale = 'oyyo/performance';
    data.top_filter_tip = 'oyyo/performance/tips';
    data.top_filter_customer = 'oyyo/performance/customer-satisfaction';
    data.top_filter_visit = 'oyyo/performance/visit-overview';
    data.sideDropDown = "non-oyyo";
    data.day_url = 'oyyo/performance/visit-overview';
    data.week_url = 'oyyo/performance/visit-overview/weekly';
    data.month_url = 'oyyo/performance/visit-overview/monthly';
    data.year_url = 'oyyo/performance/visit-overview/yearly';
    //console.log(req.body);
    var startDate = new Date(req.body.from);
    var endDate = new Date(req.body.to);

    var a = moment(startDate).format("yyyy-MM-DD");
    var b = moment(endDate).format("yyyy-MM-DD");
    var Moment = require('moment');
    const MomentRange = require('moment-range');
    const moment1 = MomentRange.extendMoment(Moment);

    const weeksRange = moment1.range(a, b);
    const weeksRangeData = Array.from(weeksRange.by('years')); //'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

    var userReports = weeksRangeData.map(function (currentIndex) {
        var year = moment(currentIndex).format("MM-DD-YYYY");
        return { key: year, value1: 0.0, value2: 0, value3: 0 };
    });

    console.log("user reports----", userReports);
    var tasks = [
        function (callback) {
            appointments.aggregate([{
                $match: {
                    ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                    // full_payment:true,
                   // status: { $ne: "Cancelled" },
                    created_date: {
                        $gte: new Date(a),
                        $lte: new Date(b)
                    }
                }
            }, {
                $group: {
                    _id: {
                        //  "month": { "$month": "$created_date" },
                        "year": { "$year": "$created_date" },
                    },
                    // count:{$sum: 1},
                    data: { $push: "$$ROOT" },
                }
            }, { "$sort": { "created_date": 1 } },
            ]).exec(function (err, result) {
                if (err)
                    throw err;
                var month_data_list = []
                if (result.length > 0) {
                    result.forEach(element => {

                        var objAr = element.data
                        //  console.log("unique data :", getUniqueDataCount(objAr , "title"));
                        function getUniqueDataCount(objArr, propName) {
                            var data = [];
                            var send = {}
                            objArr.forEach(function (d, index) {
                                if (d[propName]) {
                                    data.push(d[propName]);
                                }
                            });
    
                            var uniqueList = [...new Set(data)];
                            var totalAppoints = 0;
                            var cancelled = 0;
                            var noShows = 0;
                            for (var i = 0; i < uniqueList.length; i++) {
                                for (var j = 0; j < objArr.length; j++) {
                                    if (uniqueList[i] == objArr[j].status) {
                                        // if ( uniqueList[i] == objArr[j].status) {
                                        if (uniqueList[i]) {
                                         //   console.log("all Appointments,,,");
                                            totalAppoints += 1;
                                        }
                                        if (uniqueList[i] == "No Show") {
                                            noShows += 1;
                                        }
                                        if (uniqueList[i] == "Cancelled") {
                                            cancelled += 1;
                                        }
                                        //   }
                                    }
                                }
                                //  console.log("all Appointments,,," , totalAppoints);
                                //   if(totalAppoints>0){
                                //       totalAppoints+=1
                                //   }
                                //   if(noShows>0){
                                //     noShows+=1
                                //   }
                                //   if(cancelled>0){
                                //     cancelled+=1
                                //   }
                                send.total = totalAppoints;
                                send.title = `${element._id.year}`
                                send.cancelled = cancelled;
                                send.noShows = noShows
                            }
                            return send;
                        }
                        /// console.log("getUniqueDataCount(objAr , 'title')", getUniqueDataCount(objAr , "title"));
                        month_data_list.push(getUniqueDataCount(objAr, "status"));
                    });
                    data.result = month_data_list;
                    callback();
                } else {
                    data.result = [];
                    callback();
                }
            })
        },
  async function (callback) {
         var cancelled = await  appointments.aggregate(
            [
                {
                    $match: {
                        ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                        // full_payment:true,
                        status: "Cancelled" ,
                        created_date: {
                            $gte: new Date(a),
                            $lte: new Date(b)
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            // year: { $year: "$created_date" }, 
                            year: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                        },
                        count: { $sum: 1 }
                    },

                },
            ]
        );
        cancelled.forEach(ele => {
            userReports.map(index => moment(index.key).format('YYYY') == moment(ele._id.year).format('YYYY') ? index.value2 += ele.count : index.value);
        });

        var totalAppoints = await appointments.aggregate(
            [
                {
                    $match: {
                        ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                        // full_payment:true,
                        status: { $ne: "Cancelled" },
                        created_date: {
                            $gte: new Date(a),
                            $lte: new Date(b)
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            // year: { $year: "$created_date" }, 
                            year: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                        },
                        count: { $sum: 1 }
                    },

                },
            ]
        );
        totalAppoints.forEach(ele => {
            userReports.map(index => moment(index.key).format('YYYY') == moment(ele._id.year).format('YYYY') ? index.value1 += ele.count : index.value);
        });

        var noShows = await appointments.aggregate(
            [
                {
                    $match: {
                        ispEmail: req.app.locals.userCustomerSession.mail,walk_in: false,
                        // full_payment:true,
                        status: "No Show",
                        created_date: {
                            $gte: new Date(a),
                            $lte: new Date(b)
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            // year: { $year: "$created_date" }, 
                            year: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
                        },
                        count: { $sum: 1 }
                    },

                },
            ]
        );
        noShows.forEach(ele => {
            userReports.map(index => moment(index.key).format('YYYY') == moment(ele._id.year).format('YYYY') ? index.value3 += ele.count : index.value);
        });
        data.salesReports = userReports
        callback();

            // appointments.aggregate(
            //     [
            //         {
            //             $match: {
            //                 ispEmail: req.app.locals.userCustomerSession.mail,
            //                 // full_payment:true,
            //                 status: { $ne: "Cancelled" },
            //                 created_date: {
            //                     $gte: new Date(a),
            //                     $lte: new Date(b)
            //                 }
            //             }
            //         },
            //         {
            //             $group: {
            //                 _id: {
            //                     // year: { $year: "$created_date" }, 
            //                     year: { $dateToString: { format: "%m-%d-%Y", date: "$created_date" } },
            //                 },
            //                 totalAmount: { $sum: "$tip" },
            //                 count: { $sum: 1 }
            //             },

            //         },
            //     ]
            // ).exec(function (err, result) {
            //     if (err) {
            //         throw err;
            //     } else {
            //         console.log("result-- jhjhg --jhvjh---", result);
            //         if (result.length > 0) {
            //             result.forEach(ele => {
            //                 userReports.map(index => moment(index.key).format('YYYY') == moment(ele._id.year).format('YYYY') ? index.value1 += ele.totalAmount : index.value);
            //                 //userReports.map(index => index.key == monthName ? index.value1 += ele.totalAmount : index.value);
            //                 userReports.map(index => moment(index.key).format('YYYY') == moment(ele._id.year).format('YYYY') ? index.value2 += ele.count : index.value);
            //                 data.salesReports = userReports
            //                 callback();
            //             })
            //         } else {
            //             data.salesReports = userReports;
            //             callback();
            //         }
            //     }
            // })
        }
    ];

    Async.series(tasks, function (err) {   //series: for step by step and parallel: for suffle 
        if (err) {
            console.log("Err---", err);
            res.render('customer/performance/performance.ejs', data);
        } else {
            console.log("Success---",);
            res.render('customer/performance/performance.ejs', data);
        }
    });
}

exports.enter_transaction = async function (req, res) {
    var data = {}
    data.from = req.body.from ? req.body.from : '';
    data.to = req.body.to ? req.body.to : '';
    console.log("data-----,,", req.body);
    var day = dateFormat(req.body.date, "yyyy-mm-dd HH:MM:ss");
    // var transaction = new appointments();

    // transaction.remaining_payment = 0;
    // transaction.full_payment = true;
    // transaction.amount = req.body.amount;
    // transaction.created_date = day;
    var amt = new Number(req.body.amount);
    var tip = new Number(req.body.tip);
    var start_date
    var contact = await appointments.create({
        "name": req.body.name,
        "title": req.body.providded_service,
        "remaining_payment": 0,
        "full_payment": true,
        "amount": amt,
        "tip": tip,
        "created_date": day,
        "start_date": day,
        "status": "Ongoing",
        "walk_in": true,
        "ispEmail": req.app.locals.userCustomerSession.mail
    }).then(result => {
        console.log("result of enter trans---", result);
        res.redirect(baseUrl + 'performance');
    })

}


