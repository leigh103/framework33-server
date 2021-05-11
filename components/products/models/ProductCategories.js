
    const Models = require(basedir+'/modules/Models')

    class ProductCategories extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'product_categories',
                fields: [
                    {name:'image',input_type:'image',placeholder:'Image', type:'image', required:false},
                    {name:'name',input_type:'text',placeholder:'Name', type:'string', required:true},
                    {name:'sub_title',input_type:'text',placeholder:'Sub Title', type:'string', required:false},
                    {name:'slug',input_type:'text',placeholder:'URL', type:'slug', required:true},
                    {name:'weight',input_type:'select',placeholder:'URL', options:[], type:'number', required:false},
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

            let weight_idx = this.settings.fields.findIndex((field)=>{
                return field.name == 'weight'
            })

            if (weight_idx >= 0){
                for (var i=0; i<=20;i++){
                    this.settings.fields[weight_idx].options.push({value:i,text:i})
                }
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

            await this.registerMenus()
            return this

        }

        async preDelete(){

            let products = await new Products().all(['category == '+this.data._key])
            if (Array.isArray(products.data) && products.data.length > 0){
                this.error = 'Please remove all products from this category before deleting'
                return this
            } else {
                return this
            }

        }

        async registerMenus(){

            let menus = {},
                menu_item

            menus.menu = {}
            menus.menu.nav = [
                {link:view.ecommerce.shop.name, weight:1, subitems:[]}
            ]
            menus.menu.product_categories = []

            let cats = await new ProductCategories().all()
            cats.data = await cats.data

            cats.data.map((category,i)=>{
                menus.menu.nav[0].subitems.push({link:category.name, slug: '/'+category.slug, weight:i})
                menus.menu.product_categories.push({link:category.name, slug: '/'+category.slug, weight:i, subitems:[]})

                if (category.sub_categories){
                    category.sub_categories.map((sub_category,ii)=>{
                        menus.menu.product_categories[menus.menu.product_categories.length-1].subitems.push({link:sub_category.name, slug: '/'+sub_category.slug, weight:ii})
                    })
                }

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

                    if (this.data.sub_categories && this.data.sub_categories.length > 0){

                        let sub_category = this.data.sub_categories.find((sub_cat)=>{
                            return sub_cat._key == product_data.sub_category
                        })

                        if (sub_category && sub_category.slug){
                            slug = slug+sub_category.slug+'/'
                        }

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

    module.exports = ProductCategories
