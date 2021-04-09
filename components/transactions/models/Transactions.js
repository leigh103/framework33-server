
    const Models = require(basedir+'/modules/Models')

    class Transactions extends Models {

        constructor(data){

            super(data)

            this.statuses = [
                {text:'New',value:'new',icon:'cart-plus'},
                {text:'Paid',value:'paid',icon:'clipboard-check'},
                {text:'Processing',value:'processing',icon:'box-open'},
                {text:'Shipped',value:'shipped',icon:'mail-bulk'},
                {text:'Completed',value:'completed',icon:'check-circle'},
                {text:'Refund',value:'refund',icon:'mail-bulk'},
                {text:'Deleted',value:'deleted',icon:'trash-alt'}
            ]

            this.settings = {
                collection: 'transactions',
                fields: [
                    // {name:'status',input_field:'select',options:this.statuses, type:'string', required:false},
                    // {name:'barcode',input_field:'_key',placeholder:'Barcode', type:'barcode', required:false},
                    {name:'reference', type:'string', input_type:'text',required:true},
                    {name:'items', type:'array', tab:'items',required:false},
                    {name:'customer', type:'object', required:false, tab:'customer',subitems:[
                        {name:'title',input_type:'select',options:[{text:'Mr',value:'mr'},{text:'Mrs',value:'mrs'},{text:'Miss',value:'miss'},{text:'Ms',value:'ms'},{text:'Dr',value:'dr'}],placeholder:'Title', type:'string', required:false},
                        {name:'full_name',input_type:'text',placeholder:'Name', type:'string', required:true},
                        {name:'email',input_type:'email',placeholder:'Email Address', type:'email', required:false},
                        {name:'tel',input_type:'number',placeholder:'Mobile Number', type:'tel', required:false},
                        {name:'notification_method',input_type:'select',options:[{text:'SMS Text',value:'sms'},{text:'Email',value:'email'}],placeholder:'Select preferred notification method', type:'string', required:false}
                    ]},
                    {name:'billing_address', type:'object', required:false, tab:'customer',subitems:[
                        {name:'address_line1',input_type:'text',placeholder:'Address Line 1', type:'string', required:true},
                        {name:'address_line2',input_type:'text',placeholder:'Address Line 2', type:'string', required:false},
                        {name:'address_level1',input_type:'text',placeholder:'County', type:'string', required:false},
                        {name:'address_level2',input_type:'text',placeholder:'City', type:'string', required:true},
                        {name:'postal_code',input_type:'text',placeholder:'Post Code', type:'string', required:true}
                    ]},
                    {name:'shipping_address', type:'object', required:false, tab:'customer',subitems:[
                        {name:'address_line1',input_type:'text',placeholder:'Address Line 1', type:'string', required:true},
                        {name:'address_line2',input_type:'text',placeholder:'Address Line 2', type:'string', required:false},
                        {name:'address_level1',input_type:'text',placeholder:'County', type:'string', required:false},
                        {name:'address_level2',input_type:'text',placeholder:'City', type:'string', required:true},
                        {name:'postal_code',input_type:'text',placeholder:'Post Code', type:'postcode', required:true}
                    ]},
                    {name:'status', input_type: 'select', options:this.statuses, type:'string', required:true},
                    {name:'_user_id', type:'string', required:true}
                ],
                search_fields:['customer.name','reference','customer.email','customer.tel','billing_address.postal_code','shipping_address.postal_code']
            }

            this.routes = {
                public: { // unauth'd routes
                    get: {

                    },
                },
                private: { // auth'd routes
                    get: {
                        all:['admin','self'],
                        search:['admin'],
                        find:['admin','self']
                    },
                    post: {
                        save:['admin'],
                        updateStatus:['admin'],
                        refund:['admin']
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

        async preSave(){

            return new Promise( async (resolve, reject) => {

                if (this.data._id && this.data._id.match(/^cart/)){ // if saving cart data, ie a new transaction

                    let transaction_data = this.data
                    this.settings.collection = 'cart'
                    await this.delete()
                    this.settings.collection = 'transactions'

                    this.data = transaction_data

                    await this.updateStock()

                    // await new Cart().find(this.data._key).delete()

                    delete this.data._id
                    delete this.data._key
                    delete this.data._created
                    delete this.data.guard

                    resolve()

                } else {

                    resolve()

                }

            })



        }

        async postSave(status){

            let save = false

            if (typeof this.data.customer == 'object' && this.data.customer.email && !this.data.customer._key && this.data.status == 'paid'){

                this.data.customer.billing_address = this.data.billing_address
                this.data.customer.shipping_address = this.data.shipping_address

                if (this.data.tel){
                    this.data.customer.tel = this.data.tel
                }

                if (this.data.email){
                    this.data.customer.email = this.data.email
                }

                let user = await new Customers(this.data.customer).findOrSave()
                this.data.customer._key = user.data._key
                save = true

            }

            if (!this.data.status && !status){
                this.data.status = this.statuses[0].value
                save = true
            }

            if (this.data.reference && !this.data.barcode){

                let barcode_data = {
                    code: config.site.url+'/dashboard/transactions/edit/'+this.data._key,
                    type: 'qrcode',
                    name: this.data.reference
                }
                this.data.barcode = await new Barcode(barcode_data).save()
                save = true

            }

            if (save === true){
                this.save()
            }

        }

        async updateStock(){

            for (let item of this.data.items){

                let model

                if (typeof global[item.type] == 'function'){
                    model = new global[item.type]()

                    if (typeof model.updateStock == 'function'){
                        await model.updateStock(item._key, item.quantity)
                    }
                }


            }
            return this

        }

        async updateStatus(new_status, ids){

            if (typeof ids == 'string' && ids.match(/,/)){
                ids = ids.split(',')
            } else if (typeof ids == 'string'){
                let ids_array = []
                ids_array.push(ids)
                ids = ids_array
            }

            for (let id of ids){

                let payload = {status:new_status}
                let transaction = await DB.read(this.settings.collection).where(['_key == '+id]).update(payload).first() // update the transaction with the status

                if (typeof transaction == 'object' && transaction.status_logs && transaction.status_logs[new_status]){ // if the status has already been appiied
                    continue
                } else if (typeof transaction == 'object') { // if this is the first time the status is being applied, update the timestamp and trigger the notification

                    if (!payload.status_logs){
                        payload.status_logs = {}
                    }

                    payload.status_logs[new_status] = moment().toISOString()

                    try {
                        await DB.read(this.settings.collection).where(['_key == '+id]).update(payload).first()
                    }
                    catch(err){
                        log(err)
                    }

                    try {
                        await new Events('order_'+new_status).trigger(transaction)
                    }
                    catch(err){
                        log(err)
                    }

                }

            }

            return ids

        }

        async refund(data){

            let new_refund_cart = await new Cart().getTemplate()

            new_refund_cart.data.customer = this.data.customer
            new_refund_cart.data._key = Date.now()
            new_refund_cart.data._id = 'cart/'+new_refund_cart.data._key
            new_refund_cart.data._user_id = this.data.customer._key
            new_refund_cart.data.items = data.items
            new_refund_cart.data.status = 'refund'
            new_refund_cart.data.transaction_id = this.data._key
            new_refund_cart.data.reference = 'R'+this.data.reference

            await new_refund_cart.refundItems()
            await new_refund_cart.calcRefundTotal()
            // console.log(new_refund_cart.data)
            let new_refund = await new Transactions(new_refund_cart.data).save()
            await this.updateRefundItems(data, new_refund.data._key)
            this.data.status_logs['refunded'] = moment().toISOString()
// console.log('items',this)
            this.save()
            return this

        }

        async updateRefundItems(data, refund_id){

            return new Promise( async (resolve, reject) => {

                data.items.map((refund_item)=>{
                    for (let i in this.data.items){
                        if (refund_item._key == this.data.items[i]._key && refund_item.type == this.data.items[i].type){
                            this.data.items[i].refund_transaction_id = refund_id
                            this.data.items[i].refund_value = refund_item.refund_value
                            this.data.items[i].refund_date = refund_item.refund_date
                            this.data.items[i].refund_qty = refund_item.refund_qty
                        }
                    }
                })

                resolve()

            })

        }


    }

    module.exports = Transactions
