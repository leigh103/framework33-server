
    const Models = require(basedir+'/modules/Models')

    class Products extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'products',
                fields: [
                    {name:'image',input_type:'image',placeholder:'Image', type:'image', required:false},
                    {name:'gallery',input_type:'img_array',placeholder:'Gallery', type:'object', required:false},
                    {name:'name',input_type:'text',placeholder:'Name', type:'string', required:true},
                    {name:'brand',input_type:'text',placeholder:'Brand', type:'string', required:false},
                    {name:'slug',input_type:'text',placeholder:'URL', type:'slug', required:false},
                    {name:'barcode',input_type:'text',placeholder:'barcode', type:'barcode', required:false, barcode_type:'ean13'},
                    {name:'category',input_type:'select',option_data:'product_categories', type:'string', required:false},
                    {name:'variants',input_type:'multiselect',option_data:'products', type:'string', required:false},
                    {name:'stock',input_type:'number',placeholder:'Stock Amount', type:'number', required:false},
                    {name:'items_per_customer',input_type:'number',placeholder:'Items per customer', type:'number', required:false},
                    {name:'price',input_type:'text',placeholder:'Price',type:'price',required: true},
                    {name:'adjustment',input_type:'text',placeholder:'Adjustment',type:'discount',required: false},
                    {name:'attributes',input_type:'array',option_data:'product_attributes',placeholder:'Attributes',type:'object',required: false},
                    {name:'customisation',input_type:'array',placeholder:'Customisation',type:'object',required: false},
                    {name:'description',input_type:'textarea',placeholder:'Description', type:'string', truncate:160, required:false},
                    {name:'content_before_details',input_type:'checkbox',placeholder:'Show content before product details', type:'boolean', required:false, table_hide: true},
                    {name:'content',input_type:'contenteditable',placeholder:'Content', type:'string', required:false},
                    {name:'activated',input_type:'checkbox',type:'boolean',required: false},
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

        makeCartResource(){

            return new Promise( async (resolve, reject) => {

                let category_slug = await new ProductCategories().slug(this.data)

                resolve({
                    _key: this.data._key,
                    price: this.data.price,
                    image: this.data.image,
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
