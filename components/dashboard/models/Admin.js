
    const Users = require(basedir+'/modules/Users')

    class Admin extends Users {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'admin',
                fields: [
                    {name:'avatar',input_type:'image',placeholder:'Profile Picture', type:'image', thumbnail:true, required:false},
                    {name:'full_name',input_type:'text',placeholder:'Full name', type:'name', required:true},
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
                search_fields:['full_name','email','tel']
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

    }

    let new_admin = new Admin().setDefault()

    module.exports = Admin
