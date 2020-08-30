
    const Models = require(basedir+'/modules/Models')

    class Cart extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'cart',
                fields: [
                    {name:'name',input_type:'text',placeholder:'Name', type:'string', required:true},
                    {name:'email',input_type:'email',placeholder:'Email Address', type:'email', required:false},
                    {name:'tel',input_type:'number',placeholder:'Moile Number', type:'tel', required:false},
                    {name:'notification_method',input_type:'select',options:[{text:'SMS Text',value:'sms'},{text:'Email',value:'email'}],placeholder:'Select preferred notification method', type:'string', required:false},
                    {name:'items', type:'object', required:false},
                    {name:'billing_address', type:'object', required:false, subitems:[
                        {name:'address_line1',input_type:'text',placeholder:'Address Line 1', type:'string', required:true},
                        {name:'address_line2',input_type:'text',placeholder:'Address Line 2', type:'string', required:false},
                        {name:'address_level1',input_type:'text',placeholder:'County', type:'string', required:false},
                        {name:'address_level2',input_type:'text',placeholder:'City', type:'string', required:true},
                        {name:'postal_code',input_type:'text',placeholder:'Post Code', type:'string', required:true}
                    ]},
                    {name:'shipping_address', type:'object', required:false, subitems:[
                        {name:'address_line1',input_type:'text',placeholder:'Address Line 1', type:'string', required:true},
                        {name:'address_line2',input_type:'text',placeholder:'Address Line 2', type:'string', required:false},
                        {name:'address_level1',input_type:'text',placeholder:'County', type:'string', required:false},
                        {name:'address_level2',input_type:'text',placeholder:'City', type:'string', required:true},
                        {name:'postal_code',input_type:'text',placeholder:'Post Code', type:'postcode', required:true}
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
                    put: {
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

                this.data = DB.read(this.settings.collection).limit(30).get()
                return this.data

            } else {

                let filter = []

                filter.push('name like '+search.str)

                this.data = DB.read(this.settings.collection).orWhere(filter).get()
                return this.data

            }

        }

        async addItem(item_data){

            let qty_check
            item_data.type = parseClassName(item_data.type)

            if (!item_data.quantity){
                item_data.quantity = 1
            } else {
                item_data.quantity = parseInt(item_data.quantity)
            }

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

                    qty_check = this.data.items[item_idx].quantity+item_data.quantity

                    if (qty_check > item.stock || item.items_per_customer && qty_check > item.items_per_customer){
                        this.error = "We are currently unable to supply that number of this particular item. Please lower the quantity and try again."
                        return this
                    }

                    this.data.items[item_idx].quantity = qty_check

                } else {

                    if (item_data.quantity > item.stock || item.items_per_customer && item_data.quantity > item.items_per_customer){
                        this.error = "We are currently unable to supply that number of this particular item. Please lower the quantity and try again."
                        return this
                    }

                    item.quantity = item_data.quantity
                    item.type = item_data.type
                    this.data.items.push(item)
                }

                await this.calcTotals()
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

            await this.calcTotals()
            await this.save()

            return this.data

        }

        async empty(){

            this.data.items = []

            await this.calcTotals()
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


    // calculations


        async calcTotals() {

            this.data.sub_total = 0
            this.data.item_total = 0
            this.data.tax = 0
            this.data.total = 0

            await this.calcItems()
            this.data.item_total = parseFloat(this.data.total).toFixed(2)
            await this.calcDiscounts()
            await this.calcTax()

            if (!this.data.total){
                this.data.item_total = "0.00"
                this.data.sub_total = "0.00"
                this.data.tax = "0.00"
                this.data.total = "0.00"
            }

            return this

        }

        async calcItems() {

            this.data.sub_total = 0

            let i = 0;

            if (!this.data.items || this.data.items.length <= 0){

                this.data.items = []
                this.data.total = 0

                return this

            } else {

                for (let item of this.data.items) {

                    if (item.type == 'vouchers' && item.value){ // if a voucher, turn the value negative

                        item.price = item.value
                        item.name = 'Voucher £'+item.value

                    }

                    if (item.price){

                        if (item.adjustment){

                            if (item.original_price){
                                item.price = item.original_price
                            }

                            item.adjustment = item.adjustment.replace(/\$|\£|\#|p/,'')

                            if (item.adjustment.match(/%/)){

                                item.adjustment_value = item.adjustment.replace(/%/,'')
                                item.adjustment_value = (item.price/100)*item.adjustment_value
                                item.original_price = parseFloat(item.price).toFixed(2)
                                item.price = parseFloat(item.price)+parseFloat(item.adjustment_value)

                            } else {

                                item.original_price = parseFloat(item.price).toFixed(2)
                                item.price = parseFloat(item.price)+parseFloat(item.adjustment)

                            }

                        }

                        item.price = parseFloat(item.price).toFixed(2)

                        if (item.quantity>1){
                            this.data.total = parseFloat(this.data.total)+(parseFloat(item.price)*parseInt(item.quantity))
                        } else {
                            item.quantity = 1
                            this.data.total = parseFloat(this.data.total)+parseFloat(item.price)
                        }

                        if (item.type != 'vouchers' && item.type != 'account'){
                            item.sub_total = parseFloat(item.price)/config.tax_amount
                            item.tax = parseFloat(item.price)-parseFloat(item.sub_total)
                            item.tax = (item.tax*parseInt(item.quantity)).toFixed(2)
                            item.sub_total = (item.sub_total*parseInt(item.quantity)).toFixed(2)
                        }

                    }

                }

                return this

            }

        }

        async calcTax() {

            for (let item of this.data.items) {

                if (item.price){
                //    cart.total += parseFloat(item.price)
                }
                if (item.tax){
                    this.data.tax += parseFloat(item.tax)
                }
                if (item.sub_total){
                    this.data.sub_total += parseFloat(item.sub_total)
                }

            }

            this.data.sub_total = parseFloat(this.data.sub_total).toFixed(2)
            this.data.tax = parseFloat(this.data.tax).toFixed(2)
            this.data.total = parseFloat(this.data.total).toFixed(2)

            return this

        }

        async calcDiscounts(){

            console.log('calcDiscounts')

            await this.applyOfferCode()
            await this.applyVouchers()
            await this.applyAccountBalance()

            return this

            // return new Promise(async function(resolve, reject){
            //
            //     if (typeof cart == 'object'){
            //
            //         cart = await transactions.applyOfferCode(cart)
            //         cart = await transactions.applyVouchers(cart)
            //         cart = await transactions.applyAccountBalance(cart)
            //
            //         resolve(cart)
            //
            //     } else {
            //
            //         reject('not found')
            //
            //     }
            //
            // })

        }

        async applyOfferCode() {

            console.log('applyOffer')
            return this

            // return new Promise(async (resolve, reject) => {
            //
            //     if (cart.offer_code_data && cart.offer_code_data.method && cart.offer_code_data.value){
            //
            //         let item_discount
            //
            //         cart.payment.discount = 0
            //
            //         for (let item of cart.items){
            //
            //             if (!item.original_price){
            //                 item.original_price = item.price
            //             }
            //
            //             if (cart.offer_code_data.method == 'percent_off'){
            //                 item_discount = item.original_price * (parseFloat(cart.offer_code_data.value)/100)
            //             } else if (cart.offer_code_data.method == 'fixed_off'){
            //                 item_discount = item.original_price - parseFloat(cart.offer_code_data.value)
            //             }
            //
            //             cart.payment.discount = cart.payment.discount+item_discount
            //
            //             item.price = parseFloat(item.original_price) - item_discount
            //             item.price = item.price.toFixed(2)
            //
            //         }
            //
            //         resolve(cart)
            //
            //     } else {
            //
            //         cart.payment.discount = 0
            //
            //         for (let item of cart.items){
            //
            //             if (item.original_price){
            //                 item.price = item.original_price
            //             }
            //             if (item.price){
            //                 item.price = parseFloat(item.price).toFixed(2)
            //             }
            //
            //         }
            //
            //         resolve(cart)
            //     }
            //
            // })

        }

        async applyVouchers() {

            console.log('applyVouchers')
            return this

            // return new Promise(function(resolve, reject) {
            //
            //     if (cart.vouchers && cart.vouchers.length > 0){
            //
            //         cart.payment.vouchers = cart.vouchers.reduce((total,a)=>{
            //             return total + parseFloat(a.value)
            //         },0)
            //
            //         cart.vouchers_total = cart.payment.vouchers
            //         cart.total = cart.total - cart.payment.vouchers
            //
            //         if (cart.total <= 0){
            //             let diff = Math.abs(cart.total) * 1
            //             cart.total = 0
            //             cart.payment.vouchers = cart.payment.vouchers - diff
            //             cart.vouchers_total = cart.payment.vouchers
            //         }
            //
            //         resolve(cart)
            //
            //     } else {
            //         cart.payment.vouchers = 0
            //         resolve(cart)
            //     }
            //
            // })

        }

        async applyAccountBalance() {

            console.log('applyAccountBalance')
            return this

            // return new Promise(function(resolve, reject) {
            //
            //     if (cart.account_balance){
            //
            //         cart.payment.account = parseFloat(cart.account_balance)
            //
            //         cart.total = cart.total - cart.payment.account
            //
            //         if (cart.total <= 0){
            //             let diff = Math.abs(cart.total) * 1
            //             cart.total = 0
            //             cart.payment.account = cart.payment.account - diff
            //         }
            //         cart.account_total = cart.payment.account
            //         resolve(cart)
            //
            //     } else {
            //         cart.payment.account = 0
            //         resolve(cart)
            //     }
            //
            // })

        }

    }

    module.exports = Cart
