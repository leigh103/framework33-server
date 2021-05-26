
    const Collections = require(basedir+'/modules/Collections')

    class ProductCollections extends Collections {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'product_collections',
                collection_of: 'products',
                fields: [
                    {name:'name',input_type:'text',placeholder:'Collection Name', type:'string', required:true},
                    {name:'active',input_type:'checkbox',placeholder:'Active', type:'boolean', required:false},
                    {name:'include_in_menu',input_type:'checkbox',placeholder:'Include in category menu', type:'boolean', required:false},
                    {name:'description',input_type:'textarea',placeholder:'Collection Description', type:'string', required:false},
                    {name:'items',input_type:'model_array',placeholder:'Items', option_data:'Products', type:'array', required:false, subitems:[
                        {name:'thumbnail', type:'image', required:false},
                        {name:'name', type:'string', required:false}
                    ]}
                ]
            }

            this.routes = {
                public: { // unauth'd routes
                    get: {
                        all:[],
                        search:[],
                        find:[],
                        getItems:[]
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

    }

    module.exports = ProductCollections
