
    const Models = require(basedir+'/modules/Models')

    class PagesCategories extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'pages_categories',
                fields: [
                    {name:'name',input_type:'text',placeholder:'Page Type', type:'string', required:true},
                    {name:'slug',input_type:'text',placeholder:'Page Archive URL', type:'string', required:false},
                    {name:'is_category',input_type:'checkbox',placeholder:'Use as a page category', type:'boolean', required:false},
                    {name:'meta', type:'object', required:false, subitems:[
                        {name:'title',input_type:'text',placeholder:'SEO Title', type:'string', required:false},
                        {name:'description',input_type:'text',placeholder:'SEO Descripton', type:'string', required:false, truncate:160},
                    ]},
                    // {name:'template', input_type:'array', tab:'template', type:'array', required:false, subitems:[
                    //     {name:'block',input_type:'select',options:[{text:'Hero',value:'text-hero'},{text:'Text Two Col',value:'text-two-col'}],placeholder:'Add block', type:'string', required:false}
                    // ]}
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

    new PagesCategories().init()

    module.exports = PagesCategories
