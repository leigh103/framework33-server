
    const Model = require(basedir+'/modules/Models')

    class evnts extends Model {

        constructor(data){

            super(data)

            if (data){
                this.evnt = data
            } else {
                this.evnt = false
            }

            this.settings = {
                collection: 'events',
                fields: [
                    {name:'name',input_type:'text',placeholder:'evnt Name', type:'string', required:true},
                    {name:'trigger',input_type:'text',placeholder:'evnt trigger', type:'string', required:true},
                    {name:'description',input_type:'textarea',placeholder:'evnt Description', type:'string', required:true},
                    {name:'actions',input_type:'array', type:'array', required:false, subitems:[
                        {name:'method',input_type:'select', options:[{text:'Mailbox',value:'mailbox'},{text:'Email',value:'email'},{text:'SMS',value:'sms'}] , type:'string', required:true},
                        {name:'to',input_type:'text',placeholder:'method', type:'string', required:true},
                        {name:'enabled',input_type:'checkbox', type:'boolean', required:false},
                        {name:'content',input_type:'textarea',placeholder:'Content', type:'string', required:false},
                    ]},
                ]
            }

            this.routes = {
                public: { // unauth'd routes
                    get: {
                        all:[],
                        search:[],
                        find:[]
                    },
                },
                private: { // auth'd routes
                    get: {

                    },
                    post: {
                        save:['admin']
                    },
                    put: {
                        save:['admin']
                    },
                    delete: {
                        delete:['admin']
                    }
                }
            }

        }

        trigger(data){

            return new Promise(async (resolve, reject) => {

                if (!this.evnt){
                    reject('No trigger')
                    return false
                }

                if (!data){
                    data = {}
                }

                let evnt_data = await DB.read(this.settings.collection).where(['trigger == '+this.evnt]).first()

                if (evnt_data && evnt_data.actions && evnt_data.actions.length > 0){

                    let actions = evnt_data.actions,
                        customer = await this.findCustomer(data),
                    //    product_link = await this.findProductLink(data),
                        recipient

                    data.admin_email = config.email.admin_to

                    if (data.email){
                        data.customer_email = data.email
                    }

                    if (customer){

                        if (customer.email){
                            data.customer_email = customer.email
                        }

                        if (customer.tel){
                            data.customer_tel = customer.tel
                        }

                        if (customer.name && customer.name.first){
                            data.customer_first_name = customer.name.first
                        }

                        if (customer.name && customer.name.last){
                            data.customer_surname = customer.name.last
                        }

                        if (customer.login_link){
                            data.login_link = config.site_url+'/login/link/'+customer.login_link
                        }

                        if (customer.password_reset){
                            data.password_reset_link = config.site_url+'/login/customer/'+customer.password_reset
                        }

                    }

                    for (let action of actions){

                        if (action.enabled === true){

                            // if (action.method == 'sms' || action.method == 'email'){
                            //     recipient = await evnts.findRecipient(action.method, data)
                            //
                            //     if (!recipient && action.to){
                            //         recipient = action.to
                            //     }
                            // }


                            if (action.to){
                                action.to = await this.findRecipient(action, data)
                            }

                            if (action.subject){
                                action.subject = await this.parseMoustache(action.subject, data)
                            }
                            if (action.text){
                                action.text = await this.parseMoustache(action.text, data)
                            }
                            if (action.button_text){
                                action.button_text = await this.parseMoustache(action.button_text, data)
                            }
                            if (action.button_url){
                                action.button_url = await this.parseMoustache(action.button_url, data)
                            }
                            if (action.link){
                                action.link = await this.parseMoustache(action.link, data)
                            }

                            if (data.timestamp){
                                action.timestamp = data.timestamp
                            }

                            action = Object.assign(action, data)

                            if (action.method == 'email'){
                                new Notification(action).useEmailTemplate(config.email.templates.password_reset).email()
                            }

                            if (action.method == 'sms'){
                                new Notification(action).setContent('',action.content).sms()
                            }

                            if (action.method == 'mailbox'){
                                new Notification().setContent(action.name,action.content).mailbox()
                            }

                        }
                    }

                    resolve(this.evnt+' triggered')

                } else {
                    reject('No evnt found: '+this.evnt)
                }


            })

        }

        findRecipient(action, data) {

            return new Promise( async (resolve, reject) => {

                let result

                if (Array.isArray(data)){



                } else if (typeof data == 'object'){

                    if (data.customer_id){

                    //    result = await customers.find(data.customer_id,'{recipient:c.'+action.method+'}')
                    //    resolve(result.recipient)
                    resolve()

                    }

                    if (action.method == 'email'){
console.log(action)
                        if (action.to && action.to.match(/@/)){
                            resolve(action.to)
                        } else if (data.email){
                            resolve(data.email)
                        }

                    }

                    if (action.method == 'sms' && data.tel){
                        if (action.to && !action.to.match(/^{{/)){
                            resolve(action.to)
                        } else if (data.tel){
                            resolve(data.tel)
                        }
                    }

                }

            })

        }

        findCustomer(data){

            return new Promise( async (resolve, reject) => {

                if (!data){
                    resolve()
                    return
                }

                if (Array.isArray(data)){
                    data = data[0]
                }

                if (data._id && data._id.match(/customers/)){
                    resolve(data)
                    return
                }

                if (data.customer_id){
                    let client = await customers.find(data.customer_id)
                    resolve(client)
                    return
                }

                resolve()

            })

        }

        parseMoustache(text, data){

            return new Promise( async (resolve, reject) => {

                for (let [key,value] of Object.entries(data)){

                    let re = RegExp('{{\s*'+key+'\s*}}','g')
                    text = text.replace(re, value)

                }

                resolve(text)

            })

        }



    }

    module.exports = evnts
