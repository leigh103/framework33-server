
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
                    {name:'sub_categories',input_type:'array',placeholder:'Sub Categories', tab:'sub_categories', type:'array', required:false, subitems:[
                        {name:'image',input_type:'image',placeholder:'Image', type:'image', required:false},
                        {name:'name',input_type:'text',placeholder:'Name', type:'string', required:false},
                        {name:'sub_title',input_type:'text',placeholder:'Sub Title', type:'string', required:false},
                        {name:'slug',input_type:'text',placeholder:'URL', type:'slug', required:false},
                        {name:'description',input_type:'textarea',placeholder:'Description', type:'string', required:false}
                    ]},
                ],
                search_fields:['name']
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

        async postSave(){

            await this.makeMenus()
            return this

        }

        async preDelete(){

            let products = await new Products().all(['category == '+this.data._key]).get()
            if (Array.isArray(products) && products.length > 0){
                this.error = 'Please remove all products from this category before deleting'
                return this
            } else {
                return this
            }

        }

        async makeMenus(){

            let menus = {},
                menu_item

            menus.menu = {}
            menus.menu.nav = [
                {link:view.ecommerce.shop.name, weight:1, subitems:[]}
            ]

            let cats = await new ProductCategories().all()
            cats.data = await cats.data

            cats.data.map((category,i)=>{
                menus.menu.nav[0].subitems.push({link:category.name, slug: '/'+category.slug, weight:i})
            })

            global.addMenu(menus)
            return this

        }

        slug(product_data){

            return new Promise(async (resolve, reject) => {

                let slug = '/'

                if (typeof product_data.category != 'undefined'){

                    await this.find(product_data.category)

                    if (this.data.slug){
                        slug += this.data.slug+'/'
                    }

                    if (product_data.sub_category.match(/^\d+$/) && this.data.sub_categories.length > 0 && this.data.sub_categories[product_data.sub_category]){
                        slug += this.data.sub_categories[product_data.sub_category].slug+'/'
                    }

                } else {

                    await this.find(product_data)

                    if (this.data.slug){
                        slug += this.data.slug+'/'
                    }

                }

                resolve(slug)

            })

        }


    }

    new ProductCategories().makeMenus()


    module.exports = ProductCategories
