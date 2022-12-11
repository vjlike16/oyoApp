jQuery.validator.addMethod("alphanumeric", function (value, element) {
   return this.optional(element) || /^[a-zA-Z0-9]+$/.test(value);
}, "Please use letters and numbers only, do not use space.");

jQuery.validator.addMethod("decimal2", function (value, element) {
   return this.optional(element) || /^\d*(\.\d{0,2})?$/.test(value);
}, "Only 2 digits allowed after decimal.");

jQuery.validator.addMethod("decimal1", function (value, element) {
   return this.optional(element) || /^\d*(\.\d)?$/.test(value);
}, "Only 1 digits allow after decimal.");

jQuery.validator.addMethod("decimal0", function (value, element) {
   return this.optional(element) || /^\d*(\.\d{0,0})?$/.test(value);
}, "Decimal values are not allowed.");

jQuery.validator.addMethod("noSpace", function (value, element) {
   return value.indexOf(" ") < 0;
}, "Please do not use Space.");

jQuery.validator.addMethod("alphanumericspecial", function (value, element) {
   return this.optional(element) || /^[A-Za-z\d=#$@%!_*...-]+$/.test(value);
}, "Please use letters numbers and special characters.");

/* jQuery.validator.addMethod("lettersonly", function(value, element) 
{
	  return this.optional(element) || /^[a-zA-Z\s]+$/.test(value);
}, "Please use letters only, do not use numbers and special characters.");    */

//allow letters, number, spaces, special character
jQuery.validator.addMethod("lettersonly", function (value, element) {
   // return this.optional(element) || /^[a-zA-Z\s\d=#$@%!_*...-]+$/.test(value);
   return true;
}, "Some of the special character not allow.");

jQuery.validator.addMethod("lettersonlywithoutspace", function (value, element) {
   return this.optional(element) || /^[a-zA-Z0-9]+$/.test(value);
}, "Please use letters only, do not use space and numbers.");

jQuery.validator.addMethod("creditNum", function (value) {
   let reg = /^(\d{4}[\s*-]?){4}$/
   return reg.test(value);
}, "Please enter valid card numbers .");

jQuery.validator.addMethod('filesize', function (value, element, param) {
   return this.optional(element) || (element.files[0].size <= param)
});
$.validator.addMethod('positiveNumber',
    function (value) { 
        return Number(value) > 0;
    }, 'Enter a positive number.');

$.validator.addMethod('annual_Price_lessThen_Monthly_Price', function(value, element, params) {
   var annual_price = $('input[name="' + params[0] + '"]').val();
   var monthly_price = $('input[name="' + params[1] + '"]').val();
   if(annual_price == undefined && monthly_price == undefined){
      return false;
   }
   if(annual_price == null && monthly_price == null){
      return false;
   }
   if(annual_price>=monthly_price){
     // console.log("gtr");
      return true;
   }
   else{
     // console.log("less");
      return false;
   }
   
});    
$.validator.addMethod(
   "australianDate",
   function(value, element) {
      var date_regex = /^(0[1-9]|1\d|2\d|3[01])\-(0[1-9]|1[0-2])\-(19|20)\d{2}$/;
       return date_regex.test(value) 
      // return value.match(/(^(((0[1-9]|1[0-9]|2[0-8])[-](0[1-9]|1[012]))|((29|30|31)[-](0[13578]|1[02]))|((29|30)[-](0[4,6,9]|11)))[-](19|[2-9][0-9])\d\d$)|(^29[-]02[-](19|[2-9][0-9])(00|04|08|12|16|20|24|28|32|36|40|44|48|52|56|60|64|68|72|76|80|84|88|92|96)$)/);
   },
   "Please enter a date in the format dd-mm-yyyy."
);
jQuery.validator.addMethod('ckrequired', function (value, element, params) {
   var idname = jQuery(element).attr('id');
   var messageLength =  jQuery.trim ( CKEDITOR.instances[idname].getData() );
   return !params  || messageLength.length !== 0;
}, "Image field is required");

jQuery.validator.addMethod("timeCompare",
   function (value, element, params) {
      var val = new Date('1/1/1991' + ' ' + value);
      var par = new Date('1/1/1991' + ' ' + $(params).val());
      if (!/Invalid|NaN/.test(new Date(val))) {
         return new Date(val) > new Date(par);
      }

      return isNaN(val) && isNaN(par)
         || (Number(val) > Number(par));
      console.log("bbbbb");
   }, 'End Time must be greater than Start Time.'); 
   jQuery.validator.addMethod("greaterThan", 
   function(value, element, params) {
      var a = $(params).val();
      if(value<=a){
         return;
      }
      console.log("value  :"+value +" " +"params"+$(params).val());
       if (!/Invalid|NaN/.test(new Date(value))) {
           return new Date(value) > new Date($(params).val());
       }
       
   
       return isNaN(value) && isNaN($(params).val()) 
           || (Number(value) > Number($(params).val())); 
   },'Must be greater than {0}.');

// jQuery.validator.addMethod("greaterThan",
//     function (value, element, param) {
//           var $otherElement = $(param);
//           return parseInt(value, 10) > parseInt($otherElement.val(), 10);
// });


$.validator.addMethod("atLeastOneLowercaseLetter", function (value, element) {
   return this.optional(element) || /[a-z]+/.test(value);
}, "Password should contain atleast 1 number, 1 lowercase, 1 uppercase and 1 special character");



/**
* Custom validator for contains at least one upper-case letter.
*/
$.validator.addMethod("atLeastOneUppercaseLetter", function (value, element) {
   return this.optional(element) || /[A-Z]+/.test(value);
}, "Password should contain atleast 1 number, 1 lowercase, 1 uppercase and 1 special character");



/**
* Custom validator for contains at least one number.
*/
$.validator.addMethod("atLeastOneNumber", function (value, element) {
   return this.optional(element) || /[0-9]+/.test(value);
}, "Password should contain atleast 1 number, 1 lowercase, 1 uppercase and 1 special character");



/**
* Custom validator for contains at least one symbol.
*/
$.validator.addMethod("atLeastOneSymbol", function (value, element) {
   return this.optional(element) || /[!@#$%^&*()]+/.test(value);
}, "Password should contain atleast 1 number, 1 lowercase, 1 uppercase and 1 special character");

jQuery.validator.addMethod("noSpace", function (value, element) {
   return value.indexOf(" ") < 0;
}, "Please do not use Space.");
jQuery.validator.addMethod('my_url', function( value, element ) {
   // contributed by Scott Gonzalez: http://projects.scottsplayground.com/iri/
   let a = value.substr(0,3);
   if(a == 'www' || a ==''){
      return true;
  }else{
     return false;
  }
   // return this.optional( element ) || /^(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test( value );
}, 'Please enter a valid url without the "www".');
jQuery.validator.addMethod("fromToTimeCompare",
   function (value, element, params) {
      var val = value;
      var par = $(params).val();
      if (val.length > 0) {
        var val = new Date("November 13, 2013 " + val);
        val = val.getTime();
        var par = new Date("November 13, 2013 " + par);
        par = par.getTime();
        return val > par;
      }
}, 'To Time must be greater than From Time.');
