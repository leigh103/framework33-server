
    const Models = require(basedir+'/modules/Models')

    class Products extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'products',
                fields: [
                    {name:'image_1',input_type:'image',placeholder:'Image', type:'image', required:false},
                    {name:'name',input_type:'text',placeholder:'Name', type:'string', required:true},
                    {name:'slug',input_type:'text',placeholder:'URL', type:'string', required:false},
                    {name:'category',input_type:'select',option_data:'product_categories', type:'string', required:false},
                    {name:'price',input_type:'text',placeholder:'Price',type:'price',required: true},
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
