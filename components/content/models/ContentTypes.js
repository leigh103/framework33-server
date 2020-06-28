
    const Models = require(basedir+'/modules/Models')

    class ContentTypes extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'content_types',
                fields: [
                    {name:'type',input_type:'text',placeholder:'Content Type', type:'string', required:true},
                    {name:'slug',input_type:'text',placeholder:'Content Archive URL', type:'string', required:false},
                    {name:'_user_id',input_type:'hidden',value:'user_id', type:'user_id', required:true}
                ]
            }

            this.routes = {
                public: { // unauth'd routes
                    get:{
                        find:[],
                        search:[],
                        all:[]
                    }
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

    module.exports = ContentTypes
