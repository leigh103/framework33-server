
    const Models = require(basedir+'/modules/Models')

    class ProductCategories extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'product_categories',
                fields: [
                    {name:'image',input_type:'image',placeholder:'Image', type:'image', required:false},
                    {name:'name',input_type:'text',placeholder:'Name', type:'string', required:true},
                    {name:'sub_title',input_type:'text',placeholder:'Sub Title', type:'string', required:true},
                    {name:'slug',input_type:'text',placeholder:'URL', type:'slug', required:false},
                    {name:'description',input_type:'textarea',placeholder:'Description', type:'string', required:false},
                    {name:'sub_categories',input_type:'array',placeholder:'Sub Categories', type:'array', required:false, subitems:[
                        {name:'image',input_type:'image',placeholder:'Image', type:'image', required:false},
                        {name:'name',input_type:'text',placeholder:'Name', type:'string', required:false},
                        {name:'sub_title',input_type:'text',placeholder:'Sub Title', type:'string', required:false},
                        {name:'slug',input_type:'text',placeholder:'URL', type:'slug', required:false},
                        {name:'description',input_type:'textarea',placeholder:'Description', type:'string', required:false}
                    ]},
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

        search(search) {

            if (search.str.length < 3){

                this.data = DB.read(this.settings.collection).limit(30).get()
                return this.data

            } else {

                let filter = []

                filter.push('name like '+search.str)

                this.data = DB.read(this.settings.collection).orWhere(filter).get()
                return this.data

            }

        }

        async postSave(){

            await this.makeMenus()
            return this

        }

        async makeMenus(){

            let menus = {},
                menu_item

            menus.menu = {}
            menus.menu.nav = []

            if (this.data.name){

                menu_item = {link:this.data.name, slug: '/'+this.data.slug, weight:view.menus.nav.length}
                menus.menu.nav.push(menu_item)

            } else {
                this.data.map((category,i)=>{

                    menu_item = {link:category.name, slug: '/'+category.slug, weight:i}
                    menus.menu.nav.push(menu_item)

                })

            }

            global.addMenu(menus)
            return this

        }


    }

    // new ProductCategories().all().makeMenus()

    module.exports = ProductCategories
