
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
                    {name:'price',input_type:'text',placeholder:'Price',type:'price',required: true},
                    {name:'adjustment',input_type:'text',placeholder:'Adjustment',type:'discount',required: false},
                    {name:'attributes',input_type:'array',placeholder:'Attributes',type:'object',required: false},
                    {name:'customisation',input_type:'array',placeholder:'Customisation',type:'object',required: false},
                    {name:'activated',input_type:'select',options:[{text:'Yes',value:true},{text:'No',value:false}], type:'boolean', required:false},
                    {name:'description',input_type:'textarea',placeholder:'Description', type:'string', required:false},
                    {name:'content_before_details',input_type:'checkbox',placeholder:'Show content before product details', type:'boolean', required:false},
                    {name:'content',input_type:'contenteditable',placeholder:'Content', type:'string', required:false}
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

        all(data) {

            if (typeof data == 'string'){
                this.data = DB.read(this.settings.collection).orderBy(data,'asc').get()
            } else if (typeof data == 'object'){
                this.data = DB.read(this.settings.collection).where(data).get() //.omit(['password','password_reset']).get()
            } else {
                this.data = DB.read(this.settings.collection).get() //.omit(['password','password_reset']).get()
            }

            this.data.map((item, i)=>{
                let category = DB.read('product_categories').where(['_key == '+item.category]).first(),
                    re = new RegExp(category.slug,'i'),
                    sub_category

                if (typeof item.sub_category != 'undefined'){
                    item.url = '/'+category.slug+'/'+category.sub_categories[item.sub_category].slug+'/'+item.slug
                } else {
                    item.url = '/'+category.slug+'/'+item.slug
                }

                return item
            })

            return this

        }

        search(search) {

            if (search.str.length < 3){

                this.data = DB.read(this.settings.collection).limit(30).get()
                return this.data

            } else {

                let filter = []

                filter.push('name like '+search.str)
                filter.push('category like '+search.str)

                this.data = DB.read(this.settings.collection).orWhere(filter).get()
                return this.data

            }

        }


    }

    module.exports = Products
