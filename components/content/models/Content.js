
    const Models = require(basedir+'/modules/Models')

    class Content extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'content',
                fields: [
                    {name:'blocks',type:'object',required:true},
                    {name:'type',input_type:'text',placeholder:'Content Type', type:'string', required:true},
                    {name:'tags',input_type:'text',placeholder:'Tags', type:'string', required:false},
                    {name:'status',input_type:'text',placeholder:'Status', type:'string', required:true},
                    {name:'title',input_type:'text',placeholder:'Content Title', type:'string', required:true},
                    {name:'slug',input_type:'text',placeholder:'Content URL', type:'slug', required:true},
                    {name:'publish_date',input_type:'date',placeholder:'Publish Date', type:'date', required:false}
                ]
            }

            this.routes = {
                public: { // unauth'd routes
                    get: {
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

            this.content_types = []

        }

        async getContentTypes(){


        }


    }

    module.exports = Content
