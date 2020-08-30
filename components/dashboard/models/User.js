

    const Users = require(basedir+'/modules/Users')

    class User extends Users {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'user',
                fields: [
                    {name:'avatar',input_type:'image',placeholder:'User Picture', type:'image', required:false},
                    {name:'full_name',input_type:'text',placeholder:'Full name', type:'name', required:true},
                    {name:'email',input_type:'email',placeholder:'Email address', type:'email', required:true},
                    {name:'tel',input_type:'text',placeholder:'Telephone Number', type:'tel', required:false},
                    {name:'activated',input_type:'select',options:[{text:'Yes',value:true},{text:'No',value:false}], type:'boolean', required:false},
                    {name:'blocked',input_type:'select',options:[{text:'Yes',value:true},{text:'No',value:false}], type:'boolean', required:false}
                ]
            }

            this.routes = {
                redirects: {
                    login: '/login',
                    logged_in: '/'
                },
                public: { // unauth'd routes

                },
                private: { // auth'd routes
                    get: {
                        all:['admin'],
                        search:['admin'],
                        find:['admin','self']
                    },
                    post: {
                        save:['admin','self']
                    },
                    put: {
                        save:['admin']
                    },
                    delete: {
                        delete:['admin']
                    }
                }
            }

            this.error = ''
            this.sucess = ''

        }

        async findOrSave() {

            if (!this.data){
                this.error = 'No user data'
                return this
            }

            let existing = DB.read(this.settings.collection).where(['email == '+this.data.email]).get()

            if (existing.length > 0){

                if (config.users.email_activation === true && !this.data.activated){
                    new Auth(this.data).sendReset()
                }

                this.data = existing
                return this

            } else {

                await this.save()

                if (config.users.email_activation === true){
                    this.data.activated = false
                    new Auth(this.data).sendReset()
                } else {
                    this.data.activated = true
                }

                return this

            }

        }

        search(search) {

            if (search.str.length < 3){

                this.data = DB.read(this.settings.collection).limit(30).get()
                return this.data

            } else {

                let filter = []

                filter.push('full_name like '+search.str)
                filter.push('email like '+search.str)
                filter.push('full_name like '+search.str)

                this.data = DB.read(this.settings.collection).orWhere(filter).get()
                return this.data

            }

        }

    }

    module.exports = User
