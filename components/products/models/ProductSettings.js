
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
                    {name:'slug',input_type:'text',placeholder:'URL', type:'slug', required:false},
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

                this.data = db.read(this.settings.collection).limit(30).get()
                return this.data

            } else {

                let filter = []

                filter.push('name like '+search.str)

                this.data = db.read(this.settings.collection).orWhere(filter).get()
                return this.data

            }

        }


    }

    module.exports = ProductSettings
