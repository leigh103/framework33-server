
    const Users = require(basedir+'/modules/Users')

    class Admin extends Users {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'admin',
                fields: [
                    {name:'avatar',input_type:'image',placeholder:'Profile Picture', type:'image', required:false},
                    {name:'full_name',input_type:'text',placeholder:'Full name', type:'name', required:true},
                    {name:'email',input_type:'email',placeholder:'Email address', type:'email', required:true},
                    {name:'tel',input_type:'text',placeholder:'Telephone Number', type:'tel', required:false},
                    {name:'activated',input_type:'select',options:[{text:'Yes',value:true},{text:'No',value:false}], type:'boolean', required:false},
                    {name:'blocked',input_type:'select',options:[{text:'Yes',value:true},{text:'No',value:false}], type:'boolean', required:false}
                ]
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

        search(search) {

            if (search.str.length < 3){

                this.data = db.read(this.settings.collection).limit(30).get()
                return this.data

            } else {

                let filter = []

                filter.push('full_name like '+search.str)
                filter.push('email like '+search.str)
                filter.push('full_name like '+search.str)

                this.data = db.read(this.settings.collection).orWhere(filter).get()
                return this.data

            }

        }

        async save() {

            if (!this.data){
                this.error = 'No data to save'
                return this
            }

            await this.validate()

            if (this.data._id){

                this.data = await db.read(this.settings.collection).where(['_id == '+this.data._id]).update(this.data).first()

            } else {

                this.data = await db.create(this.settings.collection,this.data).first()

                if (config.users.email_activation === true){
                    this.data.activated = false
                } else {
                    this.data.activated = true
                }

                this.sendReset()

            }

            return this

        }

        async delete(){

            let admin_count = await db.count(this.settings.collection)

            if (admin_count > 1){
                this.data = db.read(this.settings.collection).where(['_key == '+this.data._key]).delete()
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

            let admin_count = db.count(this.settings.collection)

            if (!admin_count && config.admin.email){

                console.log('Creating new default admin')
                let default_admin = {
                    email: config.admin.email,
                    password:'',
                    full_name: 'Admin',
                    guard:this.settings.collection
                }

                await db.create(this.settings.collection, default_admin)
                new Auth(default_admin).sendReset()

            } else if (!config.admin.email){
                console.log('Please set admin email address in modules/config.js')
            }

        }


    }

    let new_admin = new Admin().setDefault()

    module.exports = Admin
