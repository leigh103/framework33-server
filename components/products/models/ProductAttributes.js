
    const Models = require(basedir+'/modules/Models')

    class ProductAttributes extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'product_attributes',
                fields: [
                    {name:'attribute',input_type:'text',placeholder:'Attribute', type:'string', required:true},
                    {name:'options',input_type:'array',placeholder:'Options', type:'object', required:false}
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

    }

    module.exports = ProductAttributes
