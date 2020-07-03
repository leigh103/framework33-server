function setLayer(className, idx){

    var els = document.getElementsByClassName(className)
    for (var i in els){
        if (els[i] && els[i].style){
            els[i].style.zIndex = idx
        }
    }

}

var contextCloseAll = function(){

    if (scope && scope.view && scope.view.context){
        scope.view.context = false
    }

    var contexts = document.querySelectorAll('.context')
    for (var i=0; i < contexts.length; i++){
        contexts[i].style.display = 'none'
    }
}

var modalCloseAll = function(){
    if (scope){
        scope.view.modal = false
        scope.resetNew()
    }
    var modals = document.querySelectorAll('.modal')
    for (var i=0; i < modals.length; i++){
        modals[i].style.display = 'none'
    }
}

var getDaysArray = function(year, month, short) {

    var monthIndex = month - 1,
        names = [ 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat' ],
        date = new Date(Date.UTC(year, monthIndex, 1)),
        pre_dates = new Date(Date.UTC(year, monthIndex, 1))
        result = [
            {date:'Mon',type:'day'},
            {date:'Tue',type:'day'},
            {date:'Wed',type:'day'},
            {date:'Thu',type:'day'},
            {date:'Fri',type:'day'},
            {date:'Sat',type:'day'},
            {date:'Sun',type:'day'},
        ],
        offset = date.getUTCDay()-1,
        today = new Date().getUTCDate(),
        this_month = new Date().getUTCMonth()

    if (short){
        result = []
    }

    if (offset < 0){
        offset = 6
    }

    if (!short){
        pre_dates.setUTCDate(pre_dates.getUTCDate() - offset);

        for (var i=0;i<offset;i++){
            let iso = pre_dates.toISOString()
            result.push({date:pre_dates.getUTCDate()+'',type:'pre',iso:iso})
            pre_dates.setUTCDate(pre_dates.getUTCDate() + 1);
        }
    }

    while (date.getUTCMonth() == monthIndex) {

        let day = date.getUTCDate(),
            iso = date.toISOString()

        if (day < today && this_month == monthIndex){
            result.push({date:day+'',type:'passed',iso:iso});
        } else if (day == today && this_month == monthIndex){
            result.push({date:day+'',type:'today',iso:iso});
        } else {
            result.push({date:day+'',type:'reg',iso:iso});
        }

        date.setUTCDate(date.getUTCDate() + 1);

    }

    if (result.length > 42){
        var post_dates = 49 - result.length;
    }

    if (!short){
        while (date.getUTCDate() <= post_dates) {

            let day = date.getUTCDate(),
                iso = date.toISOString()

            result.push({date:day+'',type:'post',iso:iso});

            date.setUTCDate(date.getUTCDate() + 1);

        }
    }
    return result;
}

document.addEventListener("click", function (e) {

    if (e.target.classList.contains('context') || e.target.classList.contains('context-link')){

    } else {
        contextCloseAll()
    }

    if (e.target.classList.contains('modal')){
        modalCloseAll()
    }

    if (e.target.classList.contains('appointment')){
        appointmentCloseAll()
    }

});

let notification_els = document.getElementsByClassName('notification')
if (notification_els){
    for (var i in notification_els){
        notification_els[i].addEventListener('click', function(e){
            this.classList.remove('in-view')
            this.classList.add('exit-view')
        })
    }
}


function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name+'=; Max-Age=-99999999;';
}

function toggleMenu(){
    var nav = document.getElementById('nav')
    if (nav && nav.classList.contains('open')){
        nav.classList.remove('open')
    } else if (nav) {
        nav.classList.add('open')
    }
}
