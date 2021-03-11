
    const Models = require(basedir+'/modules/Models')

    class PageTypes extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'page_types',
                fields: [
                    {name:'name',input_type:'text',placeholder:'Page Type', type:'string', required:true},
                    {name:'slug',input_type:'text',placeholder:'Page Archive URL', type:'string', required:false},
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

            // let pages_ct = await DB.read(this.settings.collection).where(['name == pages']).first() //await this.find(['_key == 0']).get()
            //
            // if (typeof pages_ct == 'object' && pages_ct._key){
            //
            // } else {
            //
            //     let new_pages_ct = await this.getTemplate()
            //     new_pages_ct.data.name = "pages"
            //     new_pages_ct.data.slug = "/"
            //
            //     await DB.create(this.settings.collection,new_pages_ct.data)
            //     log('Created default page type: pages')
            //
            // }

        }

    }

    new PageTypes().init()

    module.exports = PageTypes
