
    const Models = require(basedir+'/modules/Models')

    class ContentTypes extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'content_types',
                fields: [
                    {name:'type',input_type:'text',placeholder:'Content Type', type:'string', required:true},
                    {name:'slug',input_type:'text',placeholder:'Content Archive URL', type:'string', required:false},
                    {name:'meta', type:'object', required:false, subitems:[
                        {name:'title',input_type:'text',placeholder:'SEO Title', type:'string', required:false},
                        {name:'description',input_type:'text',placeholder:'SEO Descripton', type:'string', required:false, truncate:160},
                    ]},
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

        async init(){

            let pages_ct = await DB.read(this.settings.collection).where(['type == pages']).first() //await this.find(['_key == 0']).get()

            if (typeof pages_ct == 'object' && pages_ct._key){

            } else {

                let new_pages_ct = await this.getTemplate()
                new_pages_ct.data.type = "pages"

                await DB.create(this.settings.collection,new_pages_ct.data).first()
                log('Created default content type: pages')

            }

        }

    }

    new ContentTypes().init()

    module.exports = ContentTypes
