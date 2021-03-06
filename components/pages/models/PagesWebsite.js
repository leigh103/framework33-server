
    const Models = require(basedir+'/modules/Models')

    class PagesWebsite extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'pages_website',
                fields: [
                    {name:'title',input_type:'text',placeholder:'Page Title', type:'string', required:true},
                    {name:'slug',input_type:'text',placeholder:'Page URL', type:'slug', required:true},
                    {name:'notification',placeholder:'Page Notificaton', type:'string', required:false, truncate:400},
                    {name:'blocks',type:'object',required:false},
                    {name:'type',input_type:'select',option_data:'pages_categories', type:'string', required:false},
                    {name:'tags',placeholder:'Tags', type:'string', required:false},
                    {name:'status',input_type:'select',options:[{text:'Draft',value:'draft'},{text:'Published',value:'published'}],placeholder:'Status', type:'string', required:false},
                    {name:'publish_date',input_type:'datetime',placeholder:'Publish Date', type:'date', required:false},
                    {name:'hide_top_nav',placeholder:'Hide site nav', type:'boolean', required:false},
                    {name:'meta', type:'object', required:false, subitems:[
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
                        save:['admin'],
                        duplicate: ['admin']
                    },
                    put: {
                        save:['admin']
                    },
                    delete: {
                        delete:['admin']
                    }
                }
            }

            this.page_types = []

        }

        async getPageTypes(){


        }

        async registerMenus(){

            let menus = {
                menu: {
                    dashboard: [
                        {link:'Add a new page',slug:'pages/website/new', weight:10, protected_guards:['admin']}
                    ]
                }
            }

            global.addMenu(menus)
            return this

        }


    }

    module.exports = PagesWebsite
