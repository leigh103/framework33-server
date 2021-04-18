
    const Models = require(basedir+'/modules/Models')

    class Products extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'products',
                fields: [
                    {name:'gallery',input_type:'img_array',placeholder:'Images', type:'object', tab:'images', thumbnail:true, required:false},
                    {name:'name',input_type:'text',placeholder:'Name', type:'string', required:true},
                    {name:'brand',input_type:'text',placeholder:'Brand', type:'string', required:false},
                    {name:'active',input_type:'checkbox',type:'boolean',required: false},
                    {name:'slug',input_type:'text',placeholder:'URL', type:'slug', required:false},
                    {name:'barcode',input_type:'text',placeholder:'barcode', type:'barcode', required:false, barcode_type:'ean13'},
                    {name:'category',input_type:'select',option_data:'ProductCategories', type:'string', required:false},
                    {name:'sub_category',input_type:'select', option_for:'sub_category in sub_categories',type:'string', required:false},
                    {name:'variants',input_type:'multiselect',option_data:'products', tab:'product_variants', type:'string', required:false},
                    {name:'price',input_type:'text',placeholder:'Price',type:'price', tab:'prices and stock',required: true},
                    {name:'adjustment',input_type:'text',placeholder:'Adjustment', tab:'prices and stock',type:'discount',required: false},
                    {name:'stock',input_type:'number',placeholder:'Stock Amount', type:'number', tab:'prices and stock',  required:false},
                    {name:'sku',input_type:'text',placeholder:'Unique Product Code', tab:'prices and stock',type:'string',required: false},
                    {name:'items_per_customer',input_type:'number',placeholder:'Items per customer', tab:'prices and stock', type:'number', required:false},
                    {name:'attributes',input_type:'array', tab:'product_attributes', placeholder:'Attributes',type:'array',required: false, subitems:[
                        {name:'attribute',input_type:'select', option_data:'ProductAttributes', type:'string', required:false},
                        {name:'value',input_type:'select', option_for:'value in selected_attribute', type:'string', required:false}
                    ]},
                    {name:'customisation',input_type:'array',placeholder:'Customisation', tab:'product_customisation', type:'object',required: false},
                    {name:'description',input_type:'textarea',placeholder:'Description', type:'string', truncate:160, required:false},
                    {name:'content',input_type:'contenteditable',placeholder:'Content', type:'string', required:false}
                ],
                search_fields:['name','brand', 'barcode']
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

        all(data, start, end) {

            if (!start){
                start = 0
            }

            if (!end){
                end = 999
            }

            if (typeof data == 'string'){
                this.data = DB.read(this.settings.collection).orderBy(data,'asc').orderBy('_updated','DESC').limit(start, end).get()
            } else if (typeof data == 'object' && data.length > 0){
                this.data = DB.read(this.settings.collection).where(data).orderBy('_updated','DESC').limit(start, end).get() //.omit(['password','password_reset']).get()
            } else {
                this.data = DB.read(this.settings.collection).orderBy('_updated','DESC').limit(start, end).get() //.omit(['password','password_reset']).get()
            }

            if (Array.isArray(this.data)){
                this.data.map((item, i)=>{
                    let category = DB.read('product_categories').where(['_key == '+item.category]).first(),
                        re = new RegExp(category.slug,'i'),
                        sub_category

                    if (typeof item.sub_category != 'undefined' && typeof category.sub_categories == 'object' && category.sub_categories[item.sub_category]){
                        item.url = '/'+category.slug+'/'+category.sub_categories[item.sub_category].slug+'/'+item.slug
                    } else {
                        item.url = '/'+category.slug+'/'+item.slug
                    }

                    return item
                })
            }


            return this

        }

        async updateStock(key, quantity){

            return new Promise( async (resolve, reject) => {

                let item = await new Products().find(key)

                if (item.data && item.data.stock){

                    let payload = {
                        _key: item.data._key,
                        stock: parseInt(item.data.stock)-parseInt(quantity)
                    }
                //    item.data.stock = parseInt(item.data.stock)-parseInt(quantity)

                    item.save(payload)

                    if (item.data.stock < 1){
                        new Automations().trigger('out_of_stock')
                    } else if (item.data.stock < 6){
                        new Automations().trigger('low_stock')
                    }

                }
                resolve()

            })

        }

        async preSave(){

            let category_slug = await new ProductCategories().slug(this.data)

            if (category_slug){
                this.data.url = category_slug+this.data.slug
            }

        }

        async getRelated(){

            if (this.data && this.data.category && this.data.sub_category){
                return await new Products().all(['category like '+this.data.category, 'sub_category like '+this.data.sub_category, '_key != '+this.data._key,'activated == true']).get()
            } else if (this.data && this.data.category){
                return await new Products().all(['category like '+this.data.category, '_key != '+this.data._key, 'activated == true']).get()
            } else {
                return []
            }

        }

        async getMostRecent(){

            return await new DB.read(this.settings.collection).where(['activated == true']).orderBy('_updated','DESC').limit(5).get()

        }

        makeCartResource(){

            return new Promise( async (resolve, reject) => {

                let category_slug = await new ProductCategories().slug(this.data)

                resolve({
                    _key: this.data._key,
                    price: this.data.price,
                    thumbnail: this.data.thumbnail,
                    name: this.data.name,
                    slug: category_slug+this.data.slug,
                    stock: this.data.stock,
                    activated: this.data.activated,
                    adjustment: this.data.adjustment,
                    items_per_customer: this.data.items_per_customer
                })

            })

        }


    }

    module.exports = Products
