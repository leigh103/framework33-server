
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
                    get: {
                        find:['self']
                    },
                    post: {
                        empty:['self'],
                        removeItem:['self'],
                        addItem:['self'],
                        save:['self']
                    },
                },
                private: { // auth'd routes
                    get: {
                        all:['admin'],
                        search:['admin'],
                        find:['admin','self']
                    },
                    post: {
                        empty:['admin','self'],
                        removeItem:['admin','self'],
                        addItem:['admin','self'],
                        save:['admin','self']
                    },
                    put: {
                    },
                    delete: {
                        delete:['self']
                    }
                }
            }

        }

        async init(req){

            if (req && req.session && req.session.cart_id){

                await this.find(req.session.cart_id)
                return this.data

            } else if (req && req.cookies && req.cookies['connect.sid']){

                this.data = {}
                this.data.items = []
                this.data._user_id = req.cookies['connect.sid']
                await this.setReference().save()
                req.session.cart_id = this.data._key
                return this.data

            } else {
                this.error = "Unable to create cart"
                return this
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

                let item_idx = this.data.items.findIndex((cart_item,i)=>{
                    return cart_item._key == item_data.item_key
                })

                if (item_idx >= 0){

                    if (this.data.items[item_idx].quantity >= item.stock){
                        this.error = 'Stock limit reached'
                        return this
                    }

                    this.data.items[item_idx].quantity++

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

        async removeItem(item_data){

            let item_idx = this.data.items.findIndex((cart_item,i)=>{
                return cart_item._key == item_data.item_key
            })

            if (this.data.items[item_idx]){
                this.data.items[item_idx].quantity--

                if (this.data.items[item_idx].quantity <= 0){
                    this.data.items.splice(item_idx,1)
                }
            }

            await this.save()
            return this.data

        }

        async empty(){

            this.data.items = []
            await this.save()
            return this.data

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
