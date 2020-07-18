
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

                if (msg == 'cancel'){
                    scope.view.notification = {}
                    return false
                }

                if (typeof duration == 'undefined'){
                    duration = 5000
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
                    setTimeout(function(){
                        scope.view.notification = {}
                        resolve()
                    },duration)
                }

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
                        scope.resetNew()

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
                        scope.resetNew()

                    }).catch((err) => {
                        console.log(err)
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

        if (document.cookie.indexOf("cookietest=") == -1){
            document.cookie = "cookietest=1";
            if (document.cookie.indexOf("cookietest=") != -1){
                scope.notify("This site uses cookies to enhance your experience. By continuing to use the site, we'll assume you're ok with that. Yum!","success",30,"fa-cookie-bite")
            }
        }

    }
