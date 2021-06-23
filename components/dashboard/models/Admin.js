
    const Users = require(basedir+'/modules/Users')

    class Admin extends Users {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'admin',
                fields: [
                    {name:'avatar',input_type:'image',placeholder:'Profile Picture', type:'image', thumbnail:true, required:false},
                    {name:'name',input_type:'text',placeholder:'Full name', type:'name', required:true},
                    {name:'password',input_type:'hidden', type:'password', required:false},
                    {name:'email',input_type:'email',placeholder:'Email address', type:'email', required:true},
                    {name:'tel',input_type:'tel',placeholder:'Telephone Number', type:'tel', required:false},
                    {name:'activated',input_type:'checkbox', type:'boolean', required:false},
                    {name:'blocked',input_type:'checkbox', type:'boolean', required:false},
                    {name:'billing_address', type:'object', input_type:'object', required:false, tab:'address', subitems:[
                        {name:'address_line1',input_type:'text',placeholder:'Address Line 1', type:'string', required:true},
                        {name:'address_line2',input_type:'text',placeholder:'Address Line 2', type:'string', required:false},
                        {name:'address_level1',input_type:'text',placeholder:'County', type:'string', required:false},
                        {name:'address_level2',input_type:'text',placeholder:'City', type:'string', required:true},
                        {name:'postal_code',input_type:'text',placeholder:'Post Code', type:'string', required:true}
                    ]},
                    {name:'shipping_address', type:'object', input_type:'object', required:false, tab:'address', subitems:[
                        {name:'address_line1',input_type:'text',placeholder:'Address Line 1', type:'string', required:true},
                        {name:'address_line2',input_type:'text',placeholder:'Address Line 2', type:'string', required:false},
                        {name:'address_level1',input_type:'text',placeholder:'County', type:'string', required:false},
                        {name:'address_level2',input_type:'text',placeholder:'City', type:'string', required:true},
                        {name:'postal_code',input_type:'text',placeholder:'Post Code', type:'postcode', required:true}
                    ]},
                ],
                search_fields:['name','email','tel']
            }

            this.routes = {
                redirects: {
                    login: '/login/admin',
                    logged_in: '/dashboard'
                },
                public: { // unauth'd routes

                },
                private: { // auth'd routes
                    get: {
                        all:['admin'],
                        getMessages:['self'],
                        search:['admin'],
                        find:['admin']
                    },
                    post: {
                        save:['admin']
                    },
                    put: {
                        save:['admin']
                    },
                    delete: {
                        delete:['admin'],
                        deleteMessage:['self']
                    }
                }
            }
        }

        async delete(){

            let admin_count = await DB.count(this.settings.collection)

            if (admin_count > 1){
                this.data = DB.read(this.settings.collection).where(['_key == '+this.data._key]).delete()
                if (this.data.length > 0){
                    this.error = 'Not deleted'
                    return this
                } else {
                    return this.data
                }
            } else {
                this.error = 'At least 1 admin account must be registered'
                return this
            }

        }

        async setDefault() {

            let admin_count = await DB.count(this.settings.collection)

            if (!admin_count && config.admin.email){

                console.log('Creating new default admin')
                let default_admin = {
                    email: config.admin.email,
                    password:'',
                    full_name: 'Admin',
                    guard:this.settings.collection
                }

                await DB.create(this.settings.collection, default_admin)
                new Admin(default_admin).sendReset()

            } else if (!config.admin.email){
                console.log('Please set admin email address in modules/config.js')
            }

        }

        registerAutomations(){

            let activate_account = {
                "trigger": "activate_account",
                "name": "Account Activation",
                "description": "Notification that is sent when a user needs to activate their account, either by email or SMS.",
                "actions": [
                    {
                    "method": "email",
                    "to": "{{email}}",
                    "enabled": true,
                    "subject": "Account Activation",
                    "content": "Welcome to {{site_name}}! For your security, we ask that all new registrations are confirmed from a valid email address. Please click the link below to activate your account",
                    "_key": 1613930962141
                    }
                ],
                "type":"user",
                "protect": true
            }

            let complete_registration = {
              "name": "Complete Registration",
              "trigger": "complete_registration",
              "description": "Notification sent to customer to complete their registration. Normally used when a guest purchases something.",
              "actions": [
                {
                  "method": "email",
                  "to": "{{email}}",
                  "enabled": true,
                  "subject": "Complete your registration",
                  "content": "Thanks for your interest in our site! We'd love for you to visit us again sometime, so why not complete your registration so we can save your details for future purchases. If this sounds good, click the link below.\n",
                  "_key": 1613921115788
                }
              ],
              "type":"user",
              "protect": true
            }

            let password_reset = {
              "name": "Password Reset",
              "description": "Password reset notifications",
              "trigger": "password_reset",
              "actions": [
                {
                  "to": "{{email}}",
                  "method": "email",
                  "subject": "Password Reset",
                  "content": "Please click the link below to reset your password. \n\nIf this wasn't you, your password has not been changed, so you don't need to take further action. However, if you suspect any suspicious activity on your account, please change your password.",
                  "_key": 1613725131832,
                  "enabled": true
                }
              ],
              "type":"user",
              "protect": true
            }

            new Automations(activate_account).saveIfNotExists(['trigger == activate_account'])
            new Automations(complete_registration).saveIfNotExists(['trigger == complete_registration'])
            new Automations(password_reset).saveIfNotExists(['trigger == password_reset'])

        }

    }

    let new_admin = new Admin().setDefault()

    module.exports = Admin
