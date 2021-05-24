
    const Models = require(basedir+'/modules/Models')

    class Blog extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'blog',
                fields: [
                    {name:'title',input_type:'text',placeholder:'Title', type:'string', required:true},
                    {name:'slug',input_type:'text',placeholder:'URL', type:'slug', required:false},
                    {name:'image',input_type:'image', type:'image', required:false},
                    {name:'meta_title',input_type:'text',placeholder:'Seo Title', type:'string', required:false},
                    {name:'meta_description',input_type:'textarea',placeholder:'SEO Description', type:'string', required:false, truncate:160},
                    {name:'content',input_type:'contenteditable',placeholder:'Content', type:'string', required:true}
                ]
            }

            this.routes = {
                public: { // unauth'd routes
                    get: {
                        all:[],
                        search:[],
                        find:[]
                    }
                },
                private: { // auth'd routes
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

    module.exports = Blog
