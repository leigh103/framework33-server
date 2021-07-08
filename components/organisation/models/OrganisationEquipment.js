
    const Models = require(basedir+'/modules/Models')

    class OrganisationEquipment extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'organisation_equipment',
                fields: [
                    {name:'name',input_type:'text',placeholder:'Name', type:'string', required:true},
                    {name:'image',input_type:'image',placeholder:'Image', type:'string', required:false},
                    {name:'category',input_type:'text',placeholder:'Category', type:'string', required:false},
                    {name:'age_from',input_type:'text',label:'Available to ages above', type:'string', required:false}
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

    }

    module.exports = OrganisationEquipment
