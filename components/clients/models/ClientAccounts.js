
    const Models = require(basedir+'/modules/Models')

    class ClientAccounts extends Models {

        constructor(data){

            super(data)

            this.genders = [
                {value:'male',text:'Male'},
                {value:'female',text:'Female'},
                {value:'other',text:'Other'}
            ]

            this.school_years = [
                {value:'1',text:'Year 1'},
                {value:'2',text:'Year 2'},
                {value:'3',text:'Year 3'},
                {value:'4',text:'Year 4'},
                {value:'5',text:'Year 5'},
                {value:'6',text:'Year 6'},
                {value:'7',text:'Year 7'},
                {value:'8',text:'Year 8'},
                {value:'9',text:'Year 9'},
                {value:'10',text:'Year 10'},
                {value:'11',text:'Year 11'},
                {value:'12',text:'Year 12'},
                {value:'13',text:'Year 13'}
            ]

            this.settings = {
                collection: 'client_accounts',
                fields: [
                    {name:'activated',input_type:'checkbox', type:'boolean', required:false},
                    {name:'blocked',input_type:'checkbox', type:'boolean', required:false},
                    {name:'billing_address', type:'object', input_type:'object', required:false, tab:'address', subitems:[
                        {name:'address_line1',input_type:'text',placeholder:'Address Line 1', type:'string', required:true},
                        {name:'address_line2',input_type:'text',placeholder:'Address Line 2', type:'string', required:false},
                        {name:'address_level1',input_type:'text',placeholder:'County', type:'string', required:false},
                        {name:'address_level2',input_type:'text',placeholder:'City', type:'string', required:true},
                        {name:'postal_code',input_type:'text',placeholder:'Post Code', type:'string', required:true}
                    ]},
                    {name:'address', type:'object', input_type:'object', required:false, tab:'address', subitems:[
                        {name:'address_line1',input_type:'text',placeholder:'Address Line 1', type:'string', required:true},
                        {name:'address_line2',input_type:'text',placeholder:'Address Line 2', type:'string', required:false},
                        {name:'address_level1',input_type:'text',placeholder:'County', type:'string', required:false},
                        {name:'address_level2',input_type:'text',placeholder:'City', type:'string', required:true},
                        {name:'postal_code',input_type:'text',placeholder:'Post Code', type:'postcode', required:true}
                    ]},
                    {name:'users',input_type:'array', tab: config.clients.labels.users, label:config.clients.labels.users, type:'array',required: false, subitems:[
                        {name:'name',input_type:'text',placeholder:'Full name', type:'name', required:true},
                        {name:'email',input_type:'email',placeholder:'Email address', type:'email', required:true},
                        {name:'tel',input_type:'tel',placeholder:'Telephone Number', type:'tel', required:false},
                        {name:'gender',input_type:'select',label:'Gender', type:'string', options:this.genders, required:true},
                        {name:'dob_month',input_type:'select',label:'Birth Month', type:'string', options:view.dates.month_list, required:false},
                        {name:'dob_year',input_type:'text', placeholder:'Eg, 2011', label:'Birth Year', type:'string', required:true},
                        {name:'school_year_start',input_type:'text', placeholder:'Eg, 2015', label:'School Year Start', type:'string', required:false}
                    ]},
                ],
                search_fields:['name','email','tel']
            }

            this.routes = {
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

        async postSave(){

            let save_needed = false
            if (this.data.users && this.data.users.length > 0){

                for (var user of this.data.users){

                    if (!user._id){

                        delete user._key

                        user.active = true
                        user._parent_id = this.data._id
                        let new_user = await new ClientUsers(user).save() //.saveIfNotExists(['email == '+user.email])
                        new_user = new_user.get()

                        save_needed = true
                        delete user.active
                        delete user.name
                        delete user.name_obj
                        delete user.tel
                        delete user.email
                        delete user.gender
                        delete user.dob_month
                        delete user.dob_year
                        delete user.school_year_start
                        delete user._parent_id

                    }

                }

                if (save_needed === true){
                    this.save()
                }

            }

            return this

        }

    }

    module.exports = ClientAccounts
