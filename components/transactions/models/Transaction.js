
    const Models = require(basedir+'/modules/Models')

    class Transactions extends Models {

        constructor(data){

            super(data)

            this.statuses = [
                {text:'New',value:'new'},
                {text:'Paid',value:'paid'},
                {text:'Processing',value:'processing'},
                {text:'Shipped',value:'shipped'},
                {text:'Refunded',value:'refunded'},
                {text:'Deleted',value:'deleted'}
            ]

            this.settings = {
                collection: 'transactions',
                fields: [
                    {name:'status',input_field:'select',options:this.statuses, type:'string', required:false},
                    {name:'barcode',input_field:'_key',placeholder:'Barcode', type:'barcode', required:false},
                    {name:'items',input_field:'_key',placeholder:'Barcode', type:'barcode', required:false}
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

                this.data = db.read(this.settings.collection).orWhere(filter).get()
                return this.data

            }

        }


    }

    module.exports = Transactions
