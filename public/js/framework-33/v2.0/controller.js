
    controller = function(){

        scope.view = {
            notification:{},
            menu: false
        }

        scope.window = {
            path: window.location.pathname,
            path_obj: window.location.pathname.replace(/^\//,'').split('/'),
            hash: window.location.hash.substr(1),
            search: window.location.search.substr(1).split(/&|&&/),
            query: {}
        }

        scope.window.search.map((search) => {

            let key = search.split(/=|==/),
                val = key[1]

            scope.window.query[key[0]] = val

        })

        scope.notify = function(msg, type, duration, icon){

            return new Promise(function(resolve, reject){

                if (scope.view.notification.timer){
                    clearTimeout(scope.view.notification.timer)
                }

                if (msg == 'cancel'){
                    scope.view.notification = {}
                    view.update('view.notification')
                    return false
                }

                if (typeof duration == 'undefined'){
                    duration = 5000
                } else if (typeof duration == 'string' && duration.match(/[a-zA-Z]/)){
                    duration = 'inf'
                } else {
                    duration = parseInt(duration)*1000
                }

                if (msg == '{}'){
                    msg = 'Unable to complete the request'
                }

                scope.view.notification.msg = msg //.replace(/<\/?[^>]+(>|$)/g, "")

                if (type){
                    scope.view.notification.type = type
                } else {
                    scope.view.notification.type = 'success'
                }

                if (icon){
                    scope.view.notification.icon = icon
                } else if (type == 'error') {
                    scope.view.notification.icon = 'x'
                } else {
                    scope.view.notification.icon = 'tick'
                }

                view.update('view.notification')

                if (duration > 0){
                    scope.view.notification.timer = setTimeout(function(){
                        scope.view.notification = {}
                        view.update('view.notification')
                        resolve()
                    },duration)
                }

            })

        }

        scope.uploadMedia = function(path){

            return new Promise( async (resolve, reject) => {

                scope.notify('Uploading...',false,'inf','clock')

                var file = this.target.files[0],
                    imageType = /image.*/

                if (!path){
                    path = 'media'
                }

                if (typeof file == 'object' && typeof file.type == 'string' && file.type.match(imageType)) {

                    let reader = new FileReader(),
                        filename = this.target.files[0].name

                    filename = filename.split('.')[0]

                    reader.onload = function(e) {

                        let payload = {
                            base64: reader.result,
                            file_name: filename.replace(/\s/g,'-').toLowerCase(),
                            file_path: path
                        }

                        http.post('/api/media_library_image/save',payload).then((data) => {

                            scope.media_library.unshift(JSON.parse(data))
                            view.update('media_library')

                            scope.notify('cancel')
                            scope.notify('Done')
                            resolve(data)

                        }).catch((err)=>{
                            scope.notify(err,'error').then(()=>{
                                reject(err)
                            })
                        })

                    }

                    reader.readAsDataURL(file);

                }

            })
            // return new Promise(function(resolve, reject){
            //
            //     let payload = {
            //         base64: data,
            //         file_name: name.replace(/\s/g,'-').toLowerCase(),
            //         file_path: path
            //     }
            //
            //     scope.notify('Uploading...',false,'inf')
            //
            //     http.post('/api/image/save',payload).then((img_data) => {
            //
            //         img_data = img_data.replace(/\"/g,'')
            //
            //         scope.media_library.push({url:img_data})
            //         view.update('media_library')
            //
            //         scope.notify('cancel')
            //         resolve(img_data)
            //
            //     }).catch((err)=>{
            //         scope.notify(err,'error').then(()=>{
            //             reject(err)
            //         })
            //     })
            //
            // })

        }

        scope.uploadImage = function(base64, obj, path, name){

            return new Promise(function(resolve, reject){

                let payload = {
                    base64: base64,
                    file_name: name.replace(/\s/g,'-').toLowerCase(),
                    file_path: path
                }

                scope.notify('Uploading...',false,'inf')

                http.post('/api/image/save',payload).then((data) => {

                    data = data.replace(/\"/g,'')

                    if (obj){
                        app.methods.setValue(scope,obj,data)
                        let img = document.querySelector('[app-src="'+obj+'"]')
                        if (img){
                            img.setAttribute('src',data)
                        }
                    }

                    scope.notify('cancel')
                    resolve(data)

                }).catch((err)=>{
                    scope.notify(err,'error').then(()=>{
                        reject(err)
                    })
                })

            })

        }

        scope.deleteImage = function(path,obj){

            return new Promise(function(resolve, reject){

                let payload = {
                    path: path
                }

                http.post('/api/image/delete',payload).then((data) => {
                    if (obj){
                        app.methods.setValue(scope,obj,'')
                        let img = document.querySelector('[app-src="'+obj+'"]')
                        if (img){
                            img.setAttribute('src','/images/Product_Placeholder.svg')
                        }
                    }
                    scope.notify('Image removed','success',2).then(()=>{
                        resolve()
                    })
                }).catch((err)=>{
                    scope.notify(err,'error').then(()=>{
                        reject(err)
                    })
                })

            })

        }

        scope.get = function(collection, id, output){

            return new Promise(function(resolve, reject){

                let url

                if (collection.match(/^\//)){
                    url = collection
                    if (id){
                        url += '/'+id
                    }
                } else {
                    url = '/api/'+collection

                    if (id){
                        url += '/'+id
                    }
                }

                if (collection.match(/\?/)){
                    collection = collection.split('?')[0]
                }

                if (collection.match(/\//)){
                    collection = collection.split('/')[0]
                }

                http.get(url)
                    .then((data) => {

                        data = JSON.parse(data)

                        if (output){
                            scope[output] = data
                            view.update(output)
                        } else {

                            scope[collection] = data
                            view.update(collection)
                        }

                        if (typeof initCarousels == 'function'){
                            setTimeout(function(){
                                initCarousels()
                            },1000)
                        }

                        resolve(data)

                    }).catch((err) => {
                        scope.notify(err, 'error',5)
                    })

            })

        }

        scope.post = function(collection, obj){

            return new Promise(function(resolve, reject){

                let url

                if (collection.match(/^\//)){
                    url = collection
                } else {
                    url = '/api/'+collection
                }

            //    scope.view.modal = false

                http.post(url,obj)
                    .then((data) => {

                        data = JSON.parse(data)

                        if (scope[collection]){

                            for (var i in scope[collection]){
                                if (scope[collection][i]._key == data._key){
                                    scope[collection][i] = data
                                    break;
                                }
                                if (i >= scope[collection].length-1){
                                    scope[collection].unshift(data)
                                }
                            }

                        }

                        resolve(data)

                    }).catch((err) => {
                        console.log(err)
                        reject(err)
                    })

            })

        }

        scope.put = function(collection, id, obj){

            return new Promise(function(resolve, reject){

                let url

                if (collection.match(/^\//)){
                    url = collection
                    if (id){
                        url += '/'+id
                    }
                } else {
                    url = '/api/'+collection

                    if (id){
                        url += '/'+id
                    }
                }

                scope.view.modal = false

                http.put(url, obj)
                    .then((data) => {

                        data = JSON.parse(data)

                        if (scope[collection]){

                            for (var i in scope[collection]){
                                if (scope[collection][i]._key == data._key){
                                    scope[collection][i] = data
                                    break;
                                }
                                if (i >= scope[collection].length-1){
                                    scope[collection].unshift(data)
                                }
                            }

                        }

                        resolve(data)

                    }).catch((err) => {
                        reject(err)
                    })

            })

        }

        scope.delete = function(collection, id, output){

            return new Promise(function(resolve, reject) {

                if (!collection || !id && id != 0){
                    return false
                }

                let url

                if (collection.match(/^\//)){
                    url = collection
                    if (id){
                        url += '/'+id
                    }
                } else {
                    url = '/api/'+collection

                    if (id){
                        url += '/'+id
                    }
                }

                http.delete(url)
                    .then((data) => {

                        data = JSON.parse(data)

                        if (output){
                            let obj = scope[output].find((o, i) => {
                                if (i == id || o._key === id) {
                                    scope[output].splice(i,1)
                                    return true; // stop searching
                                }
                            })
                        } else if (scope[collection] && scope[collection].length > 0) {
                            let obj = scope[collection].find((o, i) => {
                                if (i == id || o._key === id) {
                                    scope[collection].splice(i,1)
                                    return true; // stop searching
                                }
                            })
                        }

                        scope.view.modal = false
                        resolve(data)

                    }).catch((err) => {
                        reject(err)
                    //    console.log(err)
                    })

            })
        }

        scope.duplicate = function(collection, obj){

            return new Promise( async (resolve, reject) => {

                let dupe_collection = collection+'/duplicate'
                scope.post(dupe_collection, obj).then((data)=>{

                    if (scope.view.query){
                        scope.get(collection, scope.view.query)
                    } else {
                        scope.get(collection)
                    }

                    resolve(data)

                }).catch((err)=>{
                    reject(err)
                })

            })



        }

        scope.parseDate = function(date, format){

            if (!date){
                return
            }
            if (!date.match(/Z$/)){
                date = moment()
            } else {
                date = moment(date)
            }
            if (format == 'ago'){
                return date.fromNow()
            } else {
                return date.format(format)
            }

        }

        scope.parseCurrency = function(input){

            if (typeof input == 'object' && input.price && input.quantity){
                let item_total = input.price*input.quantity
                return '£'+(item_total/100).toFixed(2)
            } else if (parseInt(input)){
                return '£'+(input/100).toFixed(2)
            } else {
                return '£0.00'
            }

        }

        scope.parseSnakeCase = function(str){
            if (typeof str == 'string'){
                return str.replace(/_/g,' ')
            } else {
                return str
            }

        }

        scope.parsePriceField = function(field){
            console.log(field)
        }

        scope.parseAdjustment = function(input){

            if (typeof input == 'string' && input.match(/%/)){
                return input
            } else if (typeof input == 'number'){
                input = input/100
                if (input < 0){
                    input = Math.abs(input)
                    return '-£'+input.toFixed(2)
                } else {
                    return '£'+input.toFixed(2)
                }

            } else {
                return ''
            }

        }

        scope.truncate = function(input){

            return input.replace(/<br><br>/,'<br>').substring(0,100)

        }

        scope.openDatePicker = function(name, obj){

            let selected_date

            if (obj){
                selected_date = evaluate.getValue(scope,obj)
            } else {
                selected_date = evaluate.getValue(scope,name)
            }

            if (selected_date && selected_date.match(/Z$/)){
                scope.view.selected_date = moment(selected_date)
            } else if (!scope.view.selected_date) {
                scope.view.selected_date = moment()
            }

            scope.view.dates = getDaysArray(scope.view.selected_date.format('YYYY'),scope.view.selected_date.format('M'))
            scope.view.datepicker = {
                name: name,
                selected_month: scope.view.selected_date.format('MMMM')+' '+scope.view.selected_date.format('YYYY')
            }

        }

        scope.changeDate = function(name, type, direction){

            if (!scope.view.selected_date){
                return false
            }

            if (direction == 'next'){
                scope.view.selected_date = scope.view.selected_date.add(1,type)
            } else {
                scope.view.selected_date = scope.view.selected_date.subtract(1,type)
            }

            scope.view.dates = getDaysArray(scope.view.selected_date.format('YYYY'),scope.view.selected_date.format('M'))
            scope.view.datepicker = {
                name: name,
                selected_month: scope.view.selected_date.format('MMMM')+' '+scope.view.selected_date.format('YYYY')
            }

        }

        scope.removeDate = function(name){

            _.set(scope,name,false)

        }

        scope.datepickerClass = function(date, obj){

            let selected_date

            if (obj){
                selected_date = moment(evaluate.getValue(obj))
            } else {
                selected_date = moment()
            }

            if (typeof date == 'object' && date.iso){
                let date_obj = moment(date.iso)
                if (selected_date && selected_date.isSame(date_obj,'day')){
                    return 'selected'
                } else {
                    return date.type
                }
            } else {
                return date.type
            }

        }

        scope.gotoURL = function(str){

            str = str.replace(/\s/g,'-').toLowerCase()
            window.location.href = str

        }

        scope.goto = function(str1, str2){

            str1 = str1.replace(/\s/g,'-').toLowerCase()

            if (str2 || str2 == 0){
                if (typeof str2 == 'string'){
                    str2 = str2.replace(/\s/g,'-').toLowerCase()
                }
                window.location.href = '/dashboard/'+str1+'/'+str2
            } else {
                window.location.href = '/dashboard/'+str1
            }

        }

        scope.submitForm = function(form){

            let form_name = form,
                payload = [],
                form_data = document.getElementById(form_name),
                form_action = form_data.getAttribute('action'),
                fields = document.getElementsByClassName(form_name),
                error = false,
                submit_button,
                selected_month,
                selected_date,
                selected_year,
                date_check = false

            if (form_data){
                submit_button = form_data.querySelectorAll('button')

                if (submit_button){
                    submit_button[submit_button.length-1].innerHTML = '<span class="icon cycle white right" anim="rotate"></span>'
                }
            }

            for (let i = 0; i < fields.length; i++){

                fields[i].classList.remove('invalid')

                let name = fields[i].getAttribute('id'),
                    type = fields[i].type,
                    required = fields[i].required

                if (name){
                    name = name.replace(/form\-/,'')
                } else {
                    name = ''
                }

                let field_val = fields[i].value

                if (type == 'checkbox'){
                    field_val = fields[i].checked
                }

                if (typeof name == 'string' && name.match(/year/i)){
                    selected_year = field_val
                }

                if (typeof name == 'string' && name.match(/month/i)){
                    selected_month = field_val
                }

                if (typeof name == 'string' && name.match(/date/i)){
                    selected_date = field_val
                }

                if (selected_year && selected_month && selected_date && !date_check){
                    date_check = moment(selected_date+' '+selected_month+' '+selected_year,'DD MMMM YYYY')
                    if (date_check.isValid() === false){
                        error = 'The selected date is invalid'
                        fields[i-2].classList.add('invalid')
                        scope.sendForm(payload,submit_button,error)
                        break
                    }
                }

                if (required == true && !field_val){
                    error = 'The field "'+name.replace(/\-/g,' ')+'" is required'
                    fields[i].classList.add('invalid')
                    scope.sendForm(payload,submit_button,error)
                    break
                }

                if (type == 'email' && !field_val.match(/[^@]+@[^\.]+\..+/gi)){
                    error = 'Please enter a valid email address'
                    fields[i].classList.add('invalid')
                    scope.sendForm(payload,submit_button,error)
                    break
                }

                if (type == 'tel' && !field_val.match(/^(((\+44\s?\d{4}|\(?0\d{4}\)?)\s?\d{3}\s?\d{3})|((\+44\s?\d{3}|\(?0\d{3}\)?)\s?\d{3}\s?\d{4})|((\+44\s?\d{2}|\(?0\d{2}\)?)\s?\d{4}\s?\d{4}))(\s?\#(\d{4}|\d{3}))?$/gi)){
                    error = 'Please enter a valid phone number'
                    fields[i].classList.add('invalid')
                    scope.sendForm(payload,submit_button,error)
                    break
                }

                payload.push({name:name,value:field_val})

                if (i >= fields.length-1){
                    scope.sendForm(payload,submit_button,error)

                    submit_button[submit_button.length-1].setAttribute('disabled',true)
                }

            }



        }

        scope.sendForm = function(payload, submit_button, error){

            if (error){

                scope.notify(error,'error')
                if (submit_button){
                    submit_button[submit_button.length-1].innerHTML = 'Please check all required fields and click here to submit'
                }

            } else {

                scope.post('/submit-form', payload).then((data)=>{
                    scope.notify('Your message has been sent, someone will respond as soon as possible')
                    if (submit_button){
                        submit_button[submit_button.length-1].innerHTML = 'Sent'
                    }
                }).catch((err)=>{
                    scope.notify(err,'error')
                    if (submit_button){
                        submit_button[submit_button.length-1].innerHTML = 'Error'
                    }
                })

            }

        }

        if (scope.window.hash){
            scope.view.tab = scope.window.hash
        }

        let page_form = document.getElementsByTagName('form')

        if (page_form.length > 0){
            let action = page_form[0].getAttribute('action')
            if (!action){
                page_form[0].addEventListener('submit', function(e) {
                    e.preventDefault();
                })
            }
        }

        if (document.cookie.indexOf("cookietest=") == -1){
            document.cookie = "cookietest=1";
            if (document.cookie.indexOf("cookietest=") != -1){
                scope.notify("This site uses cookies to enhance your experience. By continuing to use the site, we'll assume you're ok with that. Yum!","success",30,"fa-cookie-bite")
            }
        }

    }
