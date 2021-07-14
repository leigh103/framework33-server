
    const Models = require(basedir+'/modules/Models')

    class ProductSettings extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'product_settings',
                fields: [
                    {name:'image',input_type:'image',placeholder:'Image', type:'image', required:false},
                    {name:'name',input_type:'text',placeholder:'Name', type:'string', required:true},
                    {name:'sub_title',input_type:'text',placeholder:'Sub Title', type:'string', required:true},
                    {name:'description',input_type:'textarea',placeholder:'Description', type:'string', required:false}
                ]
            }

            this.routes = {
                public: { // unauth'd routes
                },
                private: { // auth'd routes
                    get: {
                        all:['admin'],
                        find:['admin']
                    },
                    put: {
                        save:['admin']
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

        async init(){

            let product_settings = await this.find(['_key == 0'])
            if (product_settings && product_settings.data && product_settings.data.name && product_settings.data.slug){
                let slug = global.view.ecommerce.shop.slug
                global.view.ecommerce.shop = product_settings.data
                global.view.ecommerce.shop.slug = slug
                log('Setting up product shop: '+global.view.ecommerce.shop.name)
            } else {
                
            }

        }

        async registerMenus(){

            let menus = {
                menu: {
                    settings: [
                        {link:'Product Settings',slug:'products', weight:1}
                    ]
                }
            }

            global.addMenu(menus)
            return this

        }


    }

    new ProductSettings().init()

    module.exports = ProductSettings
