!function(){"use strict";var a=function(){var a,b,c,d,e,f,g,h,i,j=!0,k="",l=function(){if(j){for(var a="",b=0;b<k.length;b++)a+="●";i.val(a)}else i.val(k)},m=function(){k.length<10&&(k+=$(this).text()),l()},n=function(){k.length>0&&(k=k.substr(0,k.length-1)),l()},o=function(){j=c.hasClass("active")?!0:!1,l(),c.toggleClass("active")},p=function(){return h.val(k),d.submit(),!1},q=function(){a=$(".js-password-keypad"),b=$("button:not(.js-btn-reveal)",a),c=$(".js-btn-reveal",a),f=$(".js-password-container"),g=$(".js-btn-delete-char",f),i=$(".js-password",f),h=$(".js-password-real",f),d=$(".js-form-numpad"),e=$(".js-btn-submit",d),b.click(m),g.click(n),c.click(o),e.click(p)};return{init:q}}();$(document).ready(a.init)}(),function(){"use strict";var a=function(){var a,b=function(){a=$("[rel=popover][data-tpl]"),a.each(function(a,b){var c=$(b),d=$(c.attr("data-tpl")).html();c.popover({html:!0,content:d}),c.on("shown.bs.popover",function(){var a=c.siblings(".popover"),b=$(".js-select2",a);b.select2()})})};return{init:b}}();$(document).ready(a.init)}();