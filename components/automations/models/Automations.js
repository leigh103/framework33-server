
    const Model = require(basedir+'/modules/Models'),
          schedule = require('node-schedule')

    class Automations extends Model {

        constructor(data){

            super(data)

            if (data){
                this.evnt = data
            } else {
                this.evnt = false
            }

            this.settings = {
                collection: 'automations',
                fields: [
                    {name:'name',input_type:'text',placeholder:'Automation Name', type:'string', required:true},
                    {name:'trigger',input_type:'text',placeholder:'Automation trigger', type:'string', required:true},
                    {name:'schedule',input_type:'datetime',placeholder:'Schedule Automation', type:'date', required:false},
                    {name:'description',input_type:'textarea',placeholder:'Automation Description', type:'string', required:true},
                    {name:'actions',input_type:'array', type:'array', tab:'actions', required:true, subitems:[
                        {name:'method',input_type:'select', options:[{text:'Mailbox',value:'mailbox'},{text:'Email',value:'email'},{text:'Bulk Email',value:'bulk_email'},{text:'SMS',value:'sms'},{text:'Notify',value:'notify'}] , type:'string', required:true},
                        {name:'to',input_type:'text',placeholder:'method', type:'string', required:true},
                        {name:'enabled',input_type:'checkbox', type:'boolean', required:false},
                        {name:'subject',input_type:'text',placeholder:'Subject', type:'string', required:false},
                        {name:'content',input_type:'textarea',placeholder:'Content', type:'string', required:false},
                    ]},
                ],
                search_fields:['name','trigger','description']
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
                        getScheduled:['admin']
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

        preSave(){



        }

        postSave(){

            if (this.data.schedule){
                this.schedule(this.data.schedule)
                console.log('adding sched')
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
                        customer,
                        recipient

                    if (!Array.isArray(data)){ // if data is an array of recipients for eg. this part needs to be skipped

                        customer = await this.findCustomer(data)
                    //    product_link = await this.findProductLink(data),



                        data.admin_email = config.email.admin_to
                        data.site_name = config.site.name

                        if (data.email){
                            data.customer_email = data.email
                        }

                    } else {
                        customer = false
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

                            if (typeof data == 'object' && data.customer && data.customer.notification_method){ // override action settings if customer has specified the notification method
                                action.method = data.customer.notification_method
                            }

                            if (action.to){
                                action.to = await this.findRecipient(action, data)
                            }

                            if (action.subject){
                                action.subject = await this.parseMoustache(action.subject, data)
                            }

                            if (action.content){
                                action.content = await this.parseMoustache(action.content, data)
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

                            if (!Array.isArray(data)){

                                if (data.timestamp){
                                    action.timestamp = data.timestamp
                                }

                                delete data.content // don't overwrite the content of the action
                                action = Object.assign(action, data)

                            }

                            if (action.method == 'email'){

                                try{
                                    new Notification(action).useEmailTemplate(action).email()
                                }
                                catch(err){
                                    log(err)
                                }

                            }

                            if (action.method == 'notify'){

                                try{
                                    new Notification(action).setContent(action.subject, action.content).notify()
                                }
                                catch(err){
                                    log(err)
                                }

                            }

                            if (action.method == 'bulk_email'){

                                try{
                                    if (action.template_id){
                                        new Notification(data).useEmailTemplate(action.template_id).email()
                                    } else {
                                        new Notification(data).useEmailTemplate(action).email()
                                    }

                                }
                                catch(err){
                                    log('Could not send bulk email for trigger: '+evnt_data.trigger)
                                }

                            }

                            if (action.method == 'sms'){

                                try{
                                    new Notification(action).useSMSTemplate(action).sms()
                                }
                                catch(err){
                                    log(err)
                                }


                            }

                            if (action.method == 'mailbox'){

                                try{
                                    new Notification().setContent(action.subject,action.content).mailbox()
                                }
                                catch(err){
                                    log(err)
                                }

                            }

                        } else {
                            resolve
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

                if (typeof data != 'object'){
                    resolve(action.to)
                    return
                }

                let result

                if (Array.isArray(data)){


                } else if (typeof data == 'object'){

                    if (typeof data.customer == 'object'){

                        if (data.customer.notification_method == 'email'){
                            resolve(data.customer.email)
                        } else if (data.customer.notification_method == 'sms'){
                            resolve(data.customer.tel)
                        }

                    } else if (action.method == 'email'){

                        if (action.to && action.to.match(/@/)){
                            resolve(action.to)
                        } else if (data.email){
                            resolve(data.email)
                        } else { // moustache in the to field
                            action.to = await this.parseMoustache(action.to, data)
                            resolve(action.to)
                        }

                    } else if (action.method == 'sms' && data.tel){

                        if (action.to && !action.to.match(/^{{/)){
                            resolve(action.to)
                        } else if (data.tel){
                            resolve(data.tel)
                        } else { // moustache in the to field
                            action.to = await this.parseMoustache(action.to, data)
                            resolve(action.to)
                        }

                    } else {
                        resolve(action.to)
                    }

                } else {
                    resolve(action.to)
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
                } else {
                    if (data._id && data._id.match(/customers/)){
                        resolve(data)
                        return
                    }

                    if (data.customer_id){
                        let client = await customers.find(data.customer_id)
                        resolve(client)
                        return
                    }
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

        getScheduled(){
            console.log(schedule.scheduledJobs)
            return schedule.scheduledJobs
        }

        async recur(times){

            if (!times){
                this.error = 'No times specified for recurring automation'
                return this
            }

            let rule = new schedule.RecurrenceRule()
            rule.tz = 'Europe/London'

            rule = Object.assign(rule, times)

            if (schedule.scheduledJobs[this.evnt]){
                schedule.scheduledJobs[this.evnt].cancel()
            }

            schedule.scheduleJob(this.evnt, rule, async () => {

                let evnt = await DB.read(this.settings.collection).where(['trigger == '+this.evnt]).first()

                if (!evnt.query || !evnt.query.filter || !evnt.query.collection){
                    new Automations(evnt.trigger).trigger()
                } else {
                    let evnt_data = await DB.read(evnt.query.collection).where(evnt.query.filter).first()
                    new Automations(evnt.trigger).trigger(evnt_data)
                }

            })

            return this

        }

        async schedule(date){

            if (!date){
                this.error = 'No date specified for scheduled automation'
                return this
            }

            date = Date.parse(date)

            if (schedule.scheduledJobs[this.evnt]){
                schedule.scheduledJobs[this.evnt].cancel()
            }
            console.log(this.evnt)

            schedule.scheduleJob(this.evnt, date, async () => {

                let evnt = await DB.read(this.settings.collection).where(['trigger == '+this.evnt]).first()

                if (!evnt.query || !evnt.query.filter || !evnt.query.collection){
                    new Automations(evnt.trigger).trigger()
                } else {
                    let evnt_data = await DB.read(evnt.query.collection).where(evnt.query.filter).first()
                    new Automations(evnt.trigger).trigger(evnt_data)
                }

                schedule.cancelJob(this.evnt)

            })

            return this

        }

        async setRecurring(){

            let evnts = await DB.read(this.settings.collection).where(['recur has value']).get()

            evnts.map((evnt)=>{
                if (evnt.trigger && evnt.recur){
                    new Automations(evnt.trigger).recur(evnt.recur)
                }
            })

        }

        async setScheduled(){

            let date_now = moment().toISOString()
            let evnts = await DB.read(this.settings.collection).where(['schedule > '+date_now]).get()

            evnts.map((evnt)=>{
                if (evnt.trigger && evnt.schedule){
                    new Automations(evnt.trigger).schedule(evnt.schedule)
                }
            })

        }


    }

    new Automations().setRecurring()
    new Automations().setScheduled()


    module.exports = Automations
