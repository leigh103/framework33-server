
    const Models = require(basedir+'/modules/Models')

    class Cart extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'cart',
                fields: [
                    {name:'name',input_type:'text',placeholder:'Name', type:'string', required:false},
                    {name:'items', type:'object', required:false},
                    {name:'billing_address', type:'object', required:false, subitems:[
                        {name:'address_line1',input_type:'text',placeholder:'Address Line 1', type:'string', required:false},
                        {name:'address_line2',input_type:'text',placeholder:'Address Line 2', type:'string', required:false},
                        {name:'address_level1',input_type:'text',placeholder:'County', type:'string', required:false},
                        {name:'address_level2',input_type:'text',placeholder:'City', type:'string', required:false},
                        {name:'postal_code',input_type:'text',placeholder:'Post Code', type:'string', required:false}
                    ]},
                    {name:'shipping_address', type:'object', required:false, subitems:[
                        {name:'address_line1',input_type:'text',placeholder:'Address Line 1', type:'string', required:false},
                        {name:'address_line2',input_type:'text',placeholder:'Address Line 2', type:'string', required:false},
                        {name:'address_level1',input_type:'text',placeholder:'County', type:'string', required:false},
                        {name:'address_level2',input_type:'text',placeholder:'City', type:'string', required:false},
                        {name:'postal_code',input_type:'text',placeholder:'Post Code', type:'postcode', required:false}
                    ]},
                    {name:'_user_id', type:'string', required:true}
                ]
            }

            this.routes = {
                public: { // unauth'd routes
                    post: {
                        addItem:[],
                        save:[]
                    },
                },
                private: { // auth'd routes
                    get: {
                        all:['self'],
                        search:['self'],
                        find:['self']
                    },
                    post: {
                        addItem:[],
                        save:[]
                    },
                    put: {
                    },
                    delete: {
                        delete:['self']
                    }
                }
            }

        }

        async init(){

            this.data = {}
            this.data.items = []
            await this.setReference().save()
            return this.data

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

        async addItem(item_data){

            item_data.type = parseClassName(item_data.type)

            if (typeof global[item_data.type] == 'function'){

                let item = await new global[item_data.type]().find(item_data.item_key)
                item = item.get()

                if (typeof item.stock != 'undefined' && item.stock == 0){
                    this.error = 'Item is out of stock'
                    return this
                }

                if (typeof item.activated != 'undefined' && !item.activated){
                    this.error = 'Item not available'
                    return this
                }

                let added = this.data.items.findIndex((cart_item,i)=>{
                    return cart_item._key == item_data.item_key
                })

                if (added >= 0){

                    if (this.data.items[added].quantity >= item.stock){
                        this.error = 'Stock limit reached'
                        return this
                    }

                    this.data.items[added].quantity++

                } else {
                    item.quantity = 1
                    this.data.items.push(item)
                }

                await this.save()

                return this.data

            } else {

                this.error = 'Item not found'
                return this

            }

        }

        setReference(){

            let date = moment().utc()
            let str = date.format('YY')+'-'+date.format('DDD')
            this.data.reference = str+'-xxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 9 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            })
            return this

        }

    }

    module.exports = Cart
