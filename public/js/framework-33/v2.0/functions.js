function setLayer(className, idx){

    var els = document.getElementsByClassName(className)
    for (var i in els){
        if (els[i] && els[i].style){
            els[i].style.zIndex = idx
        }
    }

}

var contextCloseAll = function(){

    let table_wrap = document.querySelector('.table-inner-wrap')
    if (table_wrap){
        table_wrap.style.overflowY = 'auto'
    }

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
            {date:'M',type:'day'},
            {date:'T',type:'day'},
            {date:'W',type:'day'},
            {date:'T',type:'day'},
            {date:'F',type:'day'},
            {date:'S',type:'day'},
            {date:'S',type:'day'},
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

var capitalise = function(str, lower = false){
    return (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
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

var prevScrollpos = window.pageYOffset,
    nav_el = document.querySelector(".nav.auto-hide")

window.onscroll = function() {

    if (nav_el){
        var currentScrollPos = window.pageYOffset;

        if (currentScrollPos > 80 && !nav_el.classList.contains('auto-hide-shown')){
            nav_el.classList.add('auto-hide-shown')
        } else if (currentScrollPos < 1 && nav_el.classList.contains('auto-hide-shown')){
            nav_el.classList.remove('auto-hide-shown')
        }
        if (currentScrollPos < 60 || prevScrollpos > currentScrollPos) {
            nav_el.style.top = "0";
        } else {
            nav_el.style.top = "-100%";
        }
        prevScrollpos = currentScrollPos;
    }

}

let notification_els = document.getElementsByClassName('notification')
if (notification_els){
    for (var i in notification_els){
        if (notification_els[i] && typeof notification_els[i].addEventListener == 'function'){
            notification_els[i].addEventListener('click', function(e){
                scope.view.notification = {}
                this.classList.remove('in-view')
                this.classList.add('exit-view')
            })
        }
    }
}

var carousels = {}

function initCarousels(init){

    let carousel_els = document.getElementsByClassName('carousel')

    if (carousel_els){

        for (var i in carousel_els){
            if (carousel_els[i] && typeof carousel_els[i].querySelector == 'function'){

                let carousel_id = 'carousel_'+i
                carousels[carousel_id] = {}
                carousels[carousel_id].el = carousel_els[i]
                carousel_els[i].setAttribute('id',carousel_id)

                let slides_el = carousel_els[i].querySelector('.slides')

                carousels[carousel_id].slides = slides_el

                if (slides_el){

                    carousel_els[i].setAttribute('data-slide-width',slides_el.offsetWidth)

                    let slides = slides_el.querySelectorAll('.slide'),
                        dots = carousel_els[i].querySelector('.dots')

                    if (slides){
                        carousels[carousel_id].slides_count = slides.length
                        carousel_els[i].setAttribute('data-slide-count',slides.length)
                        carousel_els[i].setAttribute('data-current-slide','0')
                    }

                    if (dots){
                        dots.innerHTML = ''
                        for (let i=0;i<slides.length;i++){
                            let dot = document.createElement('div')
                            dot.classList.add('dot')
                            if (i == 0){
                                dot.classList.add('selected')
                            }
                            dot.setAttribute('onclick','chgSlide(this,'+i+')')
                            dots.appendChild(dot)
                        }
                    }

                }

                if (carousel_els[i].hasAttribute('data-auto-slide') && init === true){

                    let time = carousel_els[i].getAttribute('data-auto-slide')

                    carousels[carousel_id].interval = setInterval(function(){

                        if (!carousels[carousel_id].slide){
                            carousels[carousel_id].slide = 0
                        }
                        carousels[carousel_id].slide++
                        if (carousels[carousel_id].slide >= carousels[carousel_id].slides_count){
                            carousels[carousel_id].slide = 0
                        }

                        chgSlide(carousels[carousel_id].slides,carousels[carousel_id].slide)

                    }, time*1000)

                }

            }

        }

    }

}

var afterResize;
window.onresize = function(){
    clearTimeout(afterResize);
    afterResize = setTimeout(initCarousels, 500);
}

initCarousels(true)



function chgSlide(evnt,slide){

    let carousel = evnt.parentElement

    if (carousel.classList.contains('dots')){

        carousel = carousel.parentElement
    }

    if (!evnt.classList.contains('slides')){
        let carousel_id = carousel.getAttribute('id')
        clearInterval(carousels[carousel_id].interval)
    }

    let slide_width = carousel.getAttribute('data-slide-width'),
        slides = carousel.querySelector('.slides'),
        slide_count = carousel.getAttribute('data-slide-count'),
        current_slide = carousel.getAttribute('data-current-slide'),
        slide_position,
        dots = carousel.querySelectorAll('.dots .dot')

    if (slide == 'prev'){

        current_slide--
        if (current_slide < 0){
            slide_position = -Math.abs(slide_width*(slide_count-1))
            current_slide = slide_count-1
        } else {
            slide_position = -Math.abs(slide_width*current_slide)
        }

    } else if (slide == 'next'){

        current_slide++
        if (current_slide >= slide_count){
            slide_position = 0
            current_slide = 0
        } else {
            slide_position = -Math.abs(slide_width*current_slide)
        }

    } else {
        current_slide = slide
        slide_position = -Math.abs(slide_width*current_slide)
    }

    for (let i=0;i<slides.children.length;i++){
        slides.children[i].style.left = slide_position+'px'
    }

    carousel.setAttribute('data-current-slide',current_slide)

    for (let i=0;i<dots.length;i++){
        if (i == current_slide){
            dots[i].classList.add('selected')
        } else {
            dots[i].classList.remove('selected')
        }

    }

}

function scrollToElm(container, elm, duration){

var pos = getRelativePos(elm);
    scrollTo( container, pos.top , 2);  // duration in seconds
}

function getRelativePos(elm){
    var pPos = elm.parentNode.getBoundingClientRect(), // parent pos
    cPos = elm.getBoundingClientRect(), // target pos
    pos = {};

    pos.top    = cPos.top    - pPos.top + elm.parentNode.scrollTop,
    pos.right  = cPos.right  - pPos.right,
    pos.bottom = cPos.bottom - pPos.bottom,
    pos.left   = cPos.left   - pPos.left;

    return pos;
}

function scrollTo(element, to, duration, onDone) {

    var start = element.scrollTop,
    change = to - start,
    startTime = performance.now(),
    val, now, elapsed, t;

    function animateScroll(){

        now = performance.now();
        elapsed = (now - startTime)/1000;
        t = (elapsed/duration);

        element.scrollTop = start + change * easeInOutQuad(t);

        if( t < 1 )
        window.requestAnimationFrame(animateScroll);
        else
        onDone && onDone();
    };

    animateScroll();
}

function easeInOutQuad(t){ return t<.5 ? 2*t*t : -1+(4-2*t)*t };

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

function toggleMenu(menu){
    var mega_menu = document.querySelector(menu)
    if (mega_menu && mega_menu.classList.contains('open')){
        mega_menu.classList.remove('open')
    } else if (mega_menu) {
        mega_menu.classList.add('open')
    }
}
