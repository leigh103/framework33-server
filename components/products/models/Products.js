
    const Models = require(basedir+'/modules/Models')

    class Products extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'products',
                fields: [
                    {name:'image_1',input_type:'image',placeholder:'Image', type:'image', required:false},
                    {name:'gallery', type:'object', required:false, subitems:[
                        {name:'image_1',input_type:'image',placeholder:'Image 1', type:'image', required:false},
                        {name:'image_2',input_type:'image',placeholder:'Image 2', type:'image', required:false},
                        {name:'image_3',input_type:'image',placeholder:'Image 3', type:'image', required:false},
                        {name:'image_4',input_type:'image',placeholder:'Image 4', type:'image', required:false},
                        {name:'image_5',input_type:'image',placeholder:'Image 5', type:'image', required:false},
                        {name:'image_6',input_type:'image',placeholder:'Image 5', type:'image', required:false}
                    ]},
                    {name:'name',input_type:'text',placeholder:'Name', type:'string', required:true},
                    {name:'slug',input_type:'text',placeholder:'URL', type:'slug', required:false},
                    {name:'category',input_type:'select',option_data:'product_categories', type:'string', required:false},
                    {name:'variants',input_type:'multiselect',option_data:'products', type:'string', required:false},
                    {name:'stock',input_type:'number',placeholder:'Stock Amount', type:'number', required:false},
                    {name:'price',input_type:'text',placeholder:'Price',type:'price',required: true},
                    {name:'adjustment',input_type:'text',placeholder:'Adjustment',type:'discount',required: false},
                    {name:'attributes',input_type:'array',placeholder:'Attributes',type:'object',required: false},
                    {name:'customisation',input_type:'array',placeholder:'Customisation',type:'object',required: false},
                    {name:'activated',input_type:'select',options:[{text:'Yes',value:true},{text:'No',value:false}], type:'boolean', required:false},
                    {name:'description',input_type:'textarea',placeholder:'Description', type:'string', required:false}
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

                this.data = db.read(this.settings.collection).limit(30).get()
                return this.data

            } else {

                let filter = []

                filter.push('name like '+search.str)
                filter.push('category like '+search.str)

                this.data = db.read(this.settings.collection).orWhere(filter).get()
                return this.data

            }

        }


    }

    module.exports = Products
