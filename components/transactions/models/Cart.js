
    const Models = require(basedir+'/modules/Models')

    class Cart extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'cart',
                fields: [
                    {name:'items', type:'object', required:false},
                    {name:'customer', type:'object', required:false, subitems:[
                        {name:'title',input_type:'select',options:[{text:'Mr',value:'mr'},{text:'Mrs',value:'mrs'},{text:'Miss',value:'miss'},{text:'Ms',value:'ms'},{text:'Dr',value:'dr'}],placeholder:'Title', type:'string', required:false},
                        {name:'name',input_type:'text',placeholder:'Name', type:'string', required:true},
                        {name:'email',input_type:'email',placeholder:'Email Address', type:'email', required:false},
                        {name:'tel',input_type:'number',placeholder:'Mobile Number', type:'tel', required:false},
                        {name:'notification_method',input_type:'select',options:[{text:'SMS Text',value:'sms'},{text:'Email',value:'email'}],placeholder:'Select preferred notification method', type:'string', required:false}
                    ]},
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
                    {name:'_user_id', type:'string', required:true},
                    {name:'delivery_method', type:'number', required:false}
                ],
                search_fields:['reference','customer.name','customer.email','customer.tel','billing_address.postal_code','shipping_address.postal_code']
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
                        save:['self'],
                        setDelivery:['self']
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
                        save:['admin','self'],
                        setDelivery:['admin','self']
                    },
                    put: {
                        save:['self']
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
                await this.save()
                return this.data

            } else if (req && req.session && req.session.user && req.session.user._id){

                this.data = {}
                this.data.items = []
                this.data._user_id = req.session.user._id
                this.data.customer = {
                    full_name: req.session.user.full_name,
                    email: req.session.user.email
                }

                if (req.session.user.tel){
                    this.data.customer.tel = req.session.user.tel
                }

                if (req.session.user.billing_address){
                    this.data.billing_address = req.session.user.billing_address
                }

                if (req.session.user.shipping_address){
                    this.data.shipping_address = req.session.user.shipping_address
                }

                this.data.delivery_method = ''

                await this.setReference().save()
                return this.data

            } else if (req && req.cookies && req.cookies['connect.sid']){

                this.data = {}
                this.data.items = []
                this.data._user_id = req.cookies['connect.sid']
                await this.setReference().save()
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
                item = await item.makeCartResource()

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

                //await this.calcTotals()
                await this.save()

                return this.data

            } else {

                this.error = 'Item not found'
                return this

            }

        }

        async removeItem(item_data){

            let item_idx = this.data.items.findIndex((cart_item,i)=>{
            //    console.log(cart_item._key, item_data.item_key)
                return cart_item._key == item_data.item_key
            })

            if (this.data.items[item_idx]){
                this.data.items[item_idx].quantity--

                if (this.data.items[item_idx].quantity <= 0){
                    this.data.items.splice(item_idx,1)
                }
            }

            //await this.calcTotals()
            await this.save()

            return this.data

        }

        async empty(){

            this.data.items = []

            //await this.calcTotals()
            await this.save()
            return this.data

        }

        async preSave(){
            await this.calcTotals()
            return this
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

        async setDelivery(data){

            this.data.delivery_method = data.delivery._key
            await this.save()
            return this

        }


    // calculations


        async calcTotals() {

            this.data.sub_total = 0
            this.data.item_total = 0
            this.data.tax = 0
            this.data.total = 0
            this.data.shipping_total = 0

            await this.calcItems()
            this.data.item_total = parseInt(this.data.total)
            if (this.data.status != 'refund'){
                await this.calcDiscounts()
                await this.calcTax()
                await this.calcDelivery()
            } else {
                this.data.item_total = -Math.abs(this.data.item_total)
                this.data.total = -Math.abs(this.data.total)
            }

            if (!this.data.total){
                this.data.item_total = 0
                this.data.sub_total = 0
                this.data.shipping_total = 0
                this.data.tax = 0
                this.data.total = 0
            }

            return this

        }

        async calcRefundTotal() {

            this.data.sub_total = 0
            this.data.tax = 0
            this.data.total = 0

            for (let item of this.data.items) {

                item.total = -Math.abs(item.total)
                this.data.total = parseInt(this.data.total)+parseInt(item.refund_value)

            }

            this.data.total = -Math.abs(this.data.total)
            return this

        }

        async refundItems(){

            this.data.items = this.data.items.map((item,i)=>{

                item.sub_total = 0
                item.tax = 0

                if (item.refund_qty > 0 && item.refund_qty <= item.quantity){ // individual item refund

                    item.quantity = parseInt(item.refund_qty)
                    item.total = item.price*item.quantity
                    item.refund_value = item.total

                } else if (item.refund_amount){ // partial refund

                    let percent = false

                    if (item.refund_amount.match(/-/)){
                        item.refund_amount = parseFloat(item.refund_amount.replace(/-/,''))
                    }

                    if (item.refund_amount.match(/%/)){
                        percent = true
                    }

                    let matches = item.refund_amount.match(/([0-9]+.[0-9]{0,2})/)
                    if (matches && matches[1]){

                        if (percent === true){
                            item.refund_value = parseInt((item.total/100)*parseFloat(matches[1]))
                        } else {
                            item.refund_value = parseInt(parseFloat(matches[1])*100)
                        }

                    } else {
                        item.refund_value = 0
                    }

                    item.total = item.total - item.refund_value

                } else { // full item refund
                    item.total = item.price*item.quantity
                    item.refund_value = item.total
                }

                item.refund_date = moment().toISOString()
                return item

            })

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

                    // let price_check = await new global[item.type]().find(item._key)
                    // price_check = await item.makeCartResource()
                    //
                    // item.price = price_check.price

                    if (item.type == 'vouchers' && item.value){ // if a voucher, turn the value negative

                        item.price = item.value
                        item.name = 'Voucher £'+item.value

                    }

                    if (item.price){

                        item.price = parseInt(item.price)

                        if (!item.price || item.price < 0){
                            continue
                        }

                        if (item.adjustment){

                            if (item.original_price){
                                item.price = item.original_price
                            }

                            if (typeof item.adjustment == 'string' && item.adjustment.match(/%/)){

                                item.adjustment = item.adjustment.replace(/\$|\£|\#|p/,'')

                                item.adjustment_value = parseFloat(item.adjustment.replace(/%/,''))
                                item.adjustment_value = (item.price/100)*item.adjustment_value
                                item.original_price = item.price
                                item.price = item.price+item.adjustment_value

                            } else {

                                item.original_price = item.price
                                item.adjustment_value = item.adjustment
                                item.price = item.price+item.adjustment

                            }

                        }

                        item.price = parseInt(item.price)

                        if (item.quantity>1){
                            this.data.total = parseInt(this.data.total)+(parseInt(item.price)*parseInt(item.quantity))
                        } else {
                            item.quantity = 1
                            this.data.total = parseInt(this.data.total)+parseInt(item.price)
                        }

                        if (item.type != 'vouchers' && item.type != 'account'){
                            item.sub_total = parseInt(item.price)/config.tax_amount
                            item.tax = parseInt(item.price)-parseInt(item.sub_total)
                            item.tax = item.tax*parseInt(item.quantity)
                            item.sub_total = item.sub_total*parseInt(item.quantity)
                            item.total = parseInt(item.price)*item.quantity
                        }

                    }

                }

                return this

            }

        }

        async calcTax() {

            for (let item of this.data.items) {

                if (item.price){
                //    cart.total += parseInt(item.price)
                }
                if (item.tax){
                    this.data.tax += parseInt(item.tax)
                }
                if (item.sub_total){
                    this.data.sub_total += parseInt(item.sub_total)
                }

            }

            this.data.sub_total = parseInt(this.data.sub_total)
            this.data.tax = parseInt(this.data.tax)
            this.data.total = parseInt(this.data.total)

            return this

        }

        async calcDelivery() {

            if (this.data.delivery_method){

                delete this.data.delivery_options

                this.data.shipping_total = 0

                let available_delivery_options = global.view.transactions.delivery_options.filter((option)=>{

                    let ok = false

                    if (option.orders_over && this.data.item_total && option.orders_over < this.data.item_total){
                        ok = true
                    }

                    if (option.orders_under && this.data.item_total && option.orders_under >= this.data.item_total){
                        ok = true
                    }

                    if (option.postcode_match && this.data.shipping_address.postcode){

                        let re = new RexExp(option.postcode_match,'i')

                        if (this.data.shipping_address.postcode.match(option.postcode_match)){
                            ok = true
                        } else {
                            ok = false
                        }
                    }

                    return ok

                })

                let check = available_delivery_options.findIndex((option)=>{
                    return option._key == this.data.delivery_method
                })

                if (check >= 0){
                    this.data.shipping_method = available_delivery_options[check].name
                    this.data.shipping_total = available_delivery_options[check].price

                    if (!this.data.shipping_total){
                        this.data.shipping_total = 0
                    }

                    this.data.total += this.data.shipping_total
                } else {
                    this.data.shipping_method = false
                    this.data.shipping_total = false
                    this.data.delivery_method = false
                }

            }

            return this

        }

        async calcDiscounts(){

            // console.log('calcDiscounts')

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

            // console.log('applyOffer')
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
            //                 item_discount = item.original_price * (parseInt(cart.offer_code_data.value)/100)
            //             } else if (cart.offer_code_data.method == 'fixed_off'){
            //                 item_discount = item.original_price - parseInt(cart.offer_code_data.value)
            //             }
            //
            //             cart.payment.discount = cart.payment.discount+item_discount
            //
            //             item.price = parseInt(item.original_price) - item_discount
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
            //                 item.price = parseInt(item.price).toFixed(2)
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

            // console.log('applyVouchers')
            return this

            // return new Promise(function(resolve, reject) {
            //
            //     if (cart.vouchers && cart.vouchers.length > 0){
            //
            //         cart.payment.vouchers = cart.vouchers.reduce((total,a)=>{
            //             return total + parseInt(a.value)
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

            // console.log('applyAccountBalance')
            return this

            // return new Promise(function(resolve, reject) {
            //
            //     if (cart.account_balance){
            //
            //         cart.payment.account = parseInt(cart.account_balance)
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
