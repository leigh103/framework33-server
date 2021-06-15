
    const Models = require(basedir+'/modules/Models')

    class BlogPost extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'blog_post',
                fields: [
                    {name:'title',input_type:'text',placeholder:'Title', type:'string', required:true},
                    {name:'slug',input_type:'text',placeholder:'URL', type:'slug', required:false},
                    {name:'image',input_type:'image', type:'image', required:false, tab:'SEO'},
                    {name:'status',input_type:'select',options:[{text:'Draft',value:'draft'},{text:'Published',value:'published'}],placeholder:'Status', type:'string', required:false},
                    {name:'publish_date',placeholder:'Publish Date', type:'date', required:false},
                    {name:'meta_title',input_type:'text',placeholder:'Seo Title', type:'string', required:false, tab:'SEO'},
                    {name:'meta_description',input_type:'textarea',placeholder:'SEO Description', type:'string', required:false, truncate:160, tab:'SEO'},
                    {name:'keywords',input_type:'array',placeholder:'Keywords', type:'array', required:false, tab:'SEO'},
                    {name:'content',input_type:'contenteditable',placeholder:'Content', type:'string', required:true, tab:'Content'}
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

        async getRecent(key){

            let result = await DB.read(this.settings.collection).where(['status == published','_key != '+key]).orderBy('_updated','DESC').limit(5).show(['_key','title','slug','_updated']).get()
            return result

        }

    }

    module.exports = BlogPost
