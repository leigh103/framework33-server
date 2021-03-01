
    const Models = require(basedir+'/modules/Models')

    class Content extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'content',
                fields: [
                    {name:'title',input_type:'text',placeholder:'Content Title', type:'string', required:true},
                    {name:'slug',input_type:'text',placeholder:'Content URL', type:'slug', required:true},
                    {name:'notification',input_type:'text',placeholder:'Content Notificaton', type:'string', required:false, truncate:400},
                    {name:'blocks',type:'object',required:true},
                    {name:'type',input_type:'select',option_data:'content_types', options:[{text:'None', value:''}], type:'string', required:false},
                    {name:'tags',input_type:'text',placeholder:'Tags', type:'string', required:false},
                    {name:'status',input_type:'select',options:[{text:'Draft',value:'draft'},{text:'Published',value:'published'}],placeholder:'Status', type:'string', required:true},
                    {name:'publish_date',input_type:'date',placeholder:'Publish Date', type:'date', required:false},
                    {name:'hide_top_nav',placeholder:'Hide site nav', type:'boolean', required:false},
                    {name:'meta', type:'object', input_type:'object', required:false, subitems:[
                        {name:'title',input_type:'text',placeholder:'SEO Title', type:'string', required:false},
                        {name:'image',input_type:'image',placeholder:'Image', type:'image', required:false},
                        {name:'description',input_type:'textarea',placeholder:'SEO Descripton', type:'string', required:false, truncate:160}
                    ]},
                ],
                search_fields:['title','slug','tags','status']
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
