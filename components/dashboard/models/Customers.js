

    const Users = require(basedir+'/modules/Users')

    class Customers extends Users {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'customers',
                fields: [
                    {name:'avatar',input_type:'image',placeholder:'User Picture', type:'image', thumbnail:true, required:false},
                    {name:'title',input_type:'select',options:[{text:'Mr',value:'mr'},{text:'Mrs',value:'mrs'},{text:'Miss',value:'miss'},{text:'Ms',value:'ms'},{text:'Dr',value:'dr'}],placeholder:'Title', type:'string', required:false},
                    {name:'name',input_type:'text',placeholder:'Full name', type:'name', required:true},
                    {name:'password',input_type:'hidden', type:'password', required:false},
                    {name:'email',input_type:'email',placeholder:'Email address', type:'email', required:true},
                    {name:'tel',input_type:'text',placeholder:'Telephone Number', type:'tel', required:false},
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

    module.exports = Customers
