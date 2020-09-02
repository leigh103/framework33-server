

    const Users = require(basedir+'/modules/Users')

    class User extends Users {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'user',
                fields: [
                    {name:'avatar',input_type:'image',placeholder:'User Picture', type:'image', required:false},
                    {name:'full_name',input_type:'text',placeholder:'Full name', type:'name', required:true},
                    {name:'password',input_type:'hidden', type:'password', required:false},
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


    }

    module.exports = User
