<<<<<<< HEAD
!function(){"use strict";var a=function(){var a=function(){1===$(".provider-select").length&&$(".provider-select").on("change",function(){$.get("/schedule/patients/"+$(".provider-select").val(),function(a){$(".patient-select").html("");for(var b=0;b<a.length;b++)$(".patient-select").append('<option value="'+a[b]._id+'">'+a[b].name+"</option>")},"json")})},b=function(){$('[data-toggle="tooltip"]').tooltip(),$('[data-toggle="tab"]').click(function(a){a.preventDefault(),$(this).tab("show")}),$(".js-select2 not:js-following-popover-template").select2(),$(".js-upcoming-date").datepicker({orientation:"top auto",startDate:new Date}),$("#smsNotifications").length>0&&$("#smsNotifications").change(function(){$("#_smsNotifications").val($("#smsNotifications").is(":checked"))}),a()};return{init:b}}();$(document).ready(a.init)}(),function(){"use strict";var a=function(){var a,b,c,d,e,f,g,h,i,j=!0,k="",l=function(){if(j){for(var a="",b=0;b<k.length;b++)a+="●";i.val(a)}else i.val(k)},m=function(){k.length<10&&(k+=$(this).text()),l()},n=function(){k.length>0&&(k=k.substr(0,k.length-1)),l()},o=function(){j=c.hasClass("active")?!0:!1,l(),c.toggleClass("active")},p=function(){return h.val(k),d.submit(),!1},q=function(){a=$(".js-password-keypad"),b=$("button:not(.js-btn-reveal)",a),c=$(".js-btn-reveal",a),f=$(".js-password-container"),g=$(".js-btn-delete-char",f),i=$(".js-password",f),h=$(".js-password-real",f),d=$(".js-form-numpad"),e=$(".js-btn-submit",d),b.click(m),g.click(n),c.click(o),e.click(p)};return{init:q}}();$(document).ready(a.init)}(),function(){"use strict";var a=function(){var a,b,c,d,e=".js-remove-field-btn",f=function(){d=$(b,a).last(),c=d.clone(),$("input",c).val(""),d.after(c),h()},g=function(){$(this).parents(b).remove(),h()},h=function(){var c=$(b,a);c.length>1?$(e,c).attr("disabled",!1):$(e,c).attr("disabled",!0)},i=function(){a=$(".js-clone-field"),b=a.attr("data-clone"),a.delegate(".js-clone-field-btn","click",f),a.delegate(e,"click",g),h()};return{init:i}}();$(document).ready(a.init)}(),function(){"use strict";var a=function(){var a,b,c,d="js-visibility-select-hide",e="js-visibility-select-show",f=function(){var a=$("option:selected",this);c=a.attr("data-hide"),void 0!==c&&($(c).removeClass(e),$(c).addClass(d)),c=a.attr("data-show"),void 0!==c&&($(c).removeClass(d),$(c).addClass(e))},g=function(){a=$(".js-visibility-select"),b=$("option",a),b.each(function(a,b){c=$(b).attr("data-show"),c&&$(c).addClass(d)}),a.on("change",f),a.trigger("change")};return{init:g}}();$(document).ready(a.init)}(),function(){"use strict";var a=function(){var a,b=function(){a=$("[rel=popover][data-tpl]"),a.each(function(a,b){var c=$(b),d=$(c.attr("data-tpl")).html();$(c.attr("data-tpl")).remove(),c.popover({html:!0,content:d}),c.on("shown.bs.popover",function(){var a=c.siblings(".popover"),b=$(".js-select2",a);b.select2()})})};return{init:b}}();$(document).ready(a.init)}();var dashboard={init:function(){0!==$(".dashboard-index").length&&(0===jsVars.weekResults.length&&0===jsVars.monthResults.length&&0===jsVars.yearResults.length&&dashboard.showNoData("You haven't made any check-ins yet. Come back later, once you've checked-in a couple of times."),dashboard.plotChart("#week-results",jsVars.weekResults,"%a, %e %b",function(a,b){return a.setHours(0,0,0,0),b.setHours(0,0,0,0),b.getTime()===a.getTime()}),dashboard.plotChart("#month-results",jsVars.monthResults,"%b",function(a,b){return a.setDate(1),a.setHours(0,0,0,0),b.setDate(1),b.setHours(0,0,0,0),b.getTime()===a.getTime()}),dashboard.plotChart("#year-results",jsVars.yearResults,"%Y",function(a,b){return a.setMonth(1),a.setDate(1),a.setHours(0,0,0,0),b.setMonth(1),b.setDate(1),b.setHours(0,0,0,0),b.getTime()===a.getTime()}))},showNoData:function(a){$(".plots").hide(),$(".notice").html(a).show()},plotChart:function(a,b,c,d,e){e=void 0===e?!0:!1,0===b.length&&$(a+"-no").show();var f=[];if(b.length>0)for(var g=0;g<b.length;g++){for(var h=new Date(b[g].timestamp),i=b[g].score,j=g+1;j<b.length;j++){var k=new Date(b[g].timestamp),l=new Date(b[j].timestamp);if(!d(k,l))break;i+=b[j].score,g++}f.push([h.getTime(),i])}return e===!0&&$.plot($(a),[f],{xaxis:{mode:"time",timeformat:c},series:{lines:{show:!0,fill:!0},points:{show:!0,fill:!1}}}),f}};$(document).ready(function(){dashboard.init()});

=======
!function(){"use strict";var a=function(){var a=function(){1===$(".provider-select").length&&$(".provider-select").on("change",function(){$.get("/schedule/patients/"+$(".provider-select").val(),function(a){$(".patient-select").html("");for(var b=0;b<a.length;b++)$(".patient-select").append('<option value="'+a[b]._id+'">'+a[b].name+"</option>")},"json")})},b=function(){1==$("#password-input").length&&$(window).width()>1024&&($("#password-input").css("cursor","default"),$("#password-input").keyup(function(a){var b=a.keyCode?a.keyCode:a.which;b>=48&&57>=b&&numpad.addDigitManual(String.fromCharCode(b))}),$(".password-keypad").hide())},c=function(){$('[data-toggle="tooltip"]').tooltip(),$('[data-toggle="tab"]').click(function(a){a.preventDefault(),$(this).tab("show")}),$(".js-select2 not:js-following-popover-template").select2(),$(".js-upcoming-date").datepicker({orientation:"top auto",startDate:new Date}),$("#smsNotifications").length>0&&$("#smsNotifications").change(function(){$("#_smsNotifications").val($("#smsNotifications").is(":checked"))}),a(),b()};return{init:c}}();$(document).ready(a.init)}(),function(){"use strict";var a=function(){var a,b,c,d,e,f,g,h,i,j=!0,k="",l=function(){if(j){for(var a="",b=0;b<k.length;b++)a+="●";i.val(a)}else i.val(k)},m=function(){k.length<10&&(k+=$(this).text()),l()},n=function(a){k.length<10&&(k+=a.toString()),l()},o=function(){k.length>0&&(k=k.substr(0,k.length-1)),l()},p=function(){j=c.hasClass("active")?!0:!1,l(),c.toggleClass("active")},q=function(){return h.val(k),d.submit(),!1},r=function(){a=$(".js-password-keypad"),b=$("button:not(.js-btn-reveal)",a),c=$(".js-btn-reveal",a),f=$(".js-password-container"),g=$(".js-btn-delete-char",f),i=$(".js-password",f),h=$(".js-password-real",f),d=$(".js-form-numpad"),e=$(".js-btn-submit",d),b.click(m),g.click(o),c.click(p),e.click(q)};return{init:r,addDigitManual:n}}();$(document).ready(a.init),window.numpad=a}(),function(){"use strict";var a=function(){var a,b,c,d,e=".js-remove-field-btn",f=function(){d=$(b,a).last(),c=d.clone(),$("input",c).val(""),d.after(c),h()},g=function(){$(this).parents(b).remove(),h()},h=function(){var c=$(b,a);c.length>1?$(e,c).attr("disabled",!1):$(e,c).attr("disabled",!0)},i=function(){a=$(".js-clone-field"),b=a.attr("data-clone"),a.delegate(".js-clone-field-btn","click",f),a.delegate(e,"click",g),h()};return{init:i}}();$(document).ready(a.init)}(),function(){"use strict";var a=function(){var a,b,c,d="js-visibility-select-hide",e="js-visibility-select-show",f=function(){var a=$("option:selected",this);c=a.attr("data-hide"),void 0!==c&&($(c).removeClass(e),$(c).addClass(d)),c=a.attr("data-show"),void 0!==c&&($(c).removeClass(d),$(c).addClass(e))},g=function(){a=$(".js-visibility-select"),b=$("option",a),b.each(function(a,b){c=$(b).attr("data-show"),c&&$(c).addClass(d)}),a.on("change",f),a.trigger("change")};return{init:g}}();$(document).ready(a.init)}(),function(){"use strict";var a=function(){var a,b=function(){a=$("[rel=popover][data-tpl]"),a.each(function(a,b){var c=$(b),d=$(c.attr("data-tpl")).html();$(c.attr("data-tpl")).remove(),c.popover({html:!0,content:d}),c.on("shown.bs.popover",function(){var a=c.siblings(".popover"),b=$(".js-select2",a);b.select2()})})};return{init:b}}();$(document).ready(a.init)}();var dashboard={init:function(){0!==$(".dashboard-index").length&&(0===jsVars.weekResults.length&&0===jsVars.monthResults.length&&0===jsVars.yearResults.length&&dashboard.showNoData("You haven't made any check-ins yet. Come back later, once you've checked-in a couple of times."),dashboard.plotChart("#week-results",jsVars.weekResults,"%a, %e %b",function(a,b){return a.setHours(0,0,0,0),b.setHours(0,0,0,0),b.getTime()===a.getTime()}),dashboard.plotChart("#month-results",jsVars.monthResults,"%b",function(a,b){return a.setDate(1),a.setHours(0,0,0,0),b.setDate(1),b.setHours(0,0,0,0),b.getTime()===a.getTime()}),dashboard.plotChart("#year-results",jsVars.yearResults,"%Y",function(a,b){return a.setMonth(1),a.setDate(1),a.setHours(0,0,0,0),b.setMonth(1),b.setDate(1),b.setHours(0,0,0,0),b.getTime()===a.getTime()}))},showNoData:function(a){$(".plots").hide(),$(".notice").html(a).show()},plotChart:function(a,b,c,d,e){e=void 0===e?!0:!1,0===b.length&&$(a+"-no").show();var f=[];if(b.length>0)for(var g=0;g<b.length;g++){for(var h=new Date(b[g].timestamp),i=b[g].score,j=g+1;j<b.length;j++){var k=new Date(b[g].timestamp),l=new Date(b[j].timestamp);if(!d(k,l))break;i+=b[j].score,g++}f.push([h.getTime(),i])}return e===!0&&$.plot($(a),[f],{xaxis:{mode:"time",timeformat:c},series:{lines:{show:!0,fill:!0},points:{show:!0,fill:!1}}}),f}};$(document).ready(function(){dashboard.init()});
>>>>>>> develop
