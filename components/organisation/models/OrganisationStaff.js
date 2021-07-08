
    const Users = require(basedir+'/modules/Users')

    class OrganisationStaff extends Users {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'organisation_staff',
                fields: [
                    {name:'avatar',input_type:'image',placeholder:'Profile Picture', type:'image', thumbnail:true, required:false},
                    {name:'name',input_type:'text',placeholder:'Full name', type:'name', required:true},
                    {name:'password',input_type:'hidden', type:'password', required:false},
                    {name:'email',input_type:'email',placeholder:'Email address', type:'email', required:true},
                    {name:'tel',input_type:'tel',placeholder:'Telephone Number', type:'tel', required:false},
                    {name:'activated',input_type:'checkbox', type:'boolean', required:false},
                    {name:'blocked',input_type:'checkbox', type:'boolean', required:false},
                    {name:'address', type:'object', input_type:'object', required:false, tab:'address', subitems:[
                        {name:'address_line1',input_type:'text',placeholder:'Address Line 1', type:'string', required:true},
                        {name:'address_line2',input_type:'text',placeholder:'Address Line 2', type:'string', required:false},
                        {name:'address_level1',input_type:'text',placeholder:'County', type:'string', required:false},
                        {name:'address_level2',input_type:'text',placeholder:'City', type:'string', required:true},
                        {name:'postal_code',input_type:'text',placeholder:'Post Code', type:'string', required:true}
                    ]},
                ],
                search_fields:['name','email','tel']
            }

            this.routes = {
                redirects: {
                    login: '/login/staff',
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

    }

    module.exports = OrganisationStaff
