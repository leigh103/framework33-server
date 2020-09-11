
    controller = function(){

        scope.extend = {}

        scope.view = {
            question: {
                question:'',
                image:''
            },
            score: {
                correct:[],
                incorrect:[]
            },
            notification:{}
        }

        scope.wsSend = function(question){

            let payload = {
                question: scope.view.question
            }

            if (question){
                payload = {
                   question: question
               }
            }

            http('post','/',payload).then((data)=>{

            }).catch((err)=>{
                alert(err)
            })

        }

        scope.notify = function(msg, type, duration, icon){

            return new Promise(function(resolve, reject){

                scope.view.modal = false

                if (scope.view.notification.timer){
                    clearTimeout(scope.view.notification.timer)
                }

                if (msg == 'cancel'){
                    scope.view.notification = {}
                    return false
                }

                if (typeof duration == 'undefined'){
                    duration = 5000
                } else if (typeof duration == 'string' && duration.match(/[a-zA-Z]/)){
                    duration = 'inf'
                } else {
                    duration = parseInt(duration)*1000
                }

                scope.view.notification.msg = msg //.replace(/<\/?[^>]+(>|$)/g, "")

                if (type){
                    scope.view.notification.type = type
                } else {
                    scope.view.notification.type = 'success'
                }

                if (icon){
                    scope.view.notification.icon = icon
                } else {
                    scope.view.notification.icon = 'fa-check'
                }

                if (duration > 0){
                    scope.view.notification.timer = setTimeout(function(){
                        scope.view.notification = {}
                        resolve()
                    },duration)
                }

            })

        }

        scope.uploadImage = function(base64, obj, path, name){

            return new Promise(function(resolve, reject){

                let payload = {
                    base64: base64,
                    file_name: name.replace(/\s/g,'-').toLowerCase(),
                    file_path: path
                }

                scope.notify('Uploading...',false,'inf')

                http('post','/api/image/save',payload).then((data) => {

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

                http('post','/api/image/delete',payload).then((data) => {
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

                http('get',url)
                    .then((data) => {

                        data = JSON.parse(data)

                        if (output){
                            scope[output] = data
                        } else {
                            scope[collection] = data
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

                http('post',url,obj)
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

                http('put',url, obj)
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

                http('delete',url)
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

        scope.parseDate = function(date, format){

            if (!date.match(/Z$/)){
                return ''
            }
            if (format == 'ago'){
                return moment(date).fromNow()
            } else {
                return moment(date).format(format)
            }

        }

        scope.openDatePicker = function(name, obj){

            let selected_date

            if (obj){
                selected_date = _.get(scope,obj)
            } else {
                selected_date = _.get(scope,name)
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
                selected_date = moment(_.get(scope,obj))
            } else {
                selected_date = moment()
            }

            if (date.iso){
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

            let form_name = 'form-'+form,
                payload = [],
                form_data = document.getElementById(form),
                form_action = form_data.getAttribute('action'),
                fields = document.getElementsByClassName(form_name),
                error = false,
                submit_button

            if (form_data){
                submit_button = form_data.querySelectorAll('button')

                if (submit_button){
                    submit_button[submit_button.length-1].innerHTML = '<i class="fas fa-circle-notch" anim="rotate"></i>'
                }
            }

            for (let i = 0; i < fields.length; i++){

                fields[i].classList.remove('invalid')

                let name = fields[i].getAttribute('id'),
                    type = fields[i].getAttribute('type'),
                    required = fields[i].hasAttribute('required')

                if (name){
                    name = name.replace(/form\-/,'')
                } else {
                    name = ''
                }

                let field_val = fields[i].value

                if (type == 'checkbox'){
                    field_val = fields[i].checked
                }

                if (required == true && !field_val){
                    error = 'The field "'+name.replace(/\-/g,' ')+'" is required'
                    fields[i].classList.add('invalid')
                    break
                }

                if (type == 'email' && !field_val.match(/[^@]+@[^\.]+\..+/gi)){
                    error = 'Please enter a valid email address'
                    fields[i].classList.add('invalid')
                    break
                }

                if (type == 'tel' && !field_val.match(/^(((\+44\s?\d{4}|\(?0\d{4}\)?)\s?\d{3}\s?\d{3})|((\+44\s?\d{3}|\(?0\d{3}\)?)\s?\d{3}\s?\d{4})|((\+44\s?\d{2}|\(?0\d{2}\)?)\s?\d{4}\s?\d{4}))(\s?\#(\d{4}|\d{3}))?$/gi)){
                    error = 'Please enter a valid phone number'
                    fields[i].classList.add('invalid')
                    break
                }

                payload.push({name:name,value:field_val})

            }

            if (error){
                scope.notify(error,'error',15,'fa-exclamation-circle')
                return
            }

        //    if (typing_count > fields.length*3){

                scope.post('/submit-form', payload).then((data)=>{
                    scope.notify('Your message has been sent, someone will respond as soon as possible')
                    if (submit_button){
                        submit_button[submit_button.length-1].innerHTML = 'Sent'
                    }
                }).catch((err)=>{
                    scope.notify(err,'error',15,'fa-exclamation-circle')
                    if (submit_button){
                        submit_button[submit_button.length-1].innerHTML = 'Error'
                    }
                })

            // } else {
            //     scope.notify('This website features bot protection. Please refrain from pasting content into the fields, maybe try giving us a little more information so we can help you further and try again.','error',5,'fa-exclamation-circle')
            // }


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
