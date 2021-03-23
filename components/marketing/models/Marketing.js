
    const Models = require(basedir+'/modules/Models')

    class Marketing extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'marketing',
                fields: [
                    {name:'content',input_type:'textarea',placeholder:'Enter email content', type:'string', required:false},
                    {name:'template_id',input_type:'text',placeholder:'Enter Postmark template ID', type:'string', required:false},
                    {name:'date',input_type:'date',placeholder:'Send on', type:'date', required:true}
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

    module.exports = Marketing
