
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
                {text:'Deleted',value:'deleted',icon:'trash-alt'}
            ]

            this.settings = {
                collection: 'transactions',
                fields: [
                    // {name:'status',input_field:'select',options:this.statuses, type:'string', required:false},
                    // {name:'barcode',input_field:'_key',placeholder:'Barcode', type:'barcode', required:false},
                    {name:'reference', type:'string', input_type:'text',required:true},
                    {name:'items', type:'array', required:false},
                    {name:'customer', type:'object', required:false, subitems:[
                        {name:'title',input_type:'select',options:[{text:'Mr',value:'mr'},{text:'Mrs',value:'mrs'},{text:'Miss',value:'miss'},{text:'Ms',value:'ms'},{text:'Dr',value:'dr'}],placeholder:'Title', type:'string', required:false},
                        {name:'full_name',input_type:'text',placeholder:'Name', type:'string', required:true},
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
                        updateStatus:['admin']
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

                    // await new Cart().find(this.data._key).delete()

                    delete this.data._id
                    delete this.data._key
                    delete this.data._created
                    delete this.data.guard

                    resolve()

                } else if (this.data.status && !this.data.status.match(/completed/)) {

                    resolve()

                } else {
                    reject()
                }

            })



        }

        async postSave(status){

            let save = false

            if (typeof this.data.customer == 'object' && this.data.customer.email && !this.data.customer._key && this.data.status == 'paid'){

                this.data.customer.billing_address = this.data.billing_address
                this.data.customer.shipping_address = this.data.shipping_address
                let user = await new User(this.data.customer).findOrSave()
                this.data.customer._key = user.data._key
                save = true

            }

            if (!this.data.status && !status){
                this.data.status = this.statuses[0].value
                save = true
            }

            if (this.data.reference && !this.data.barcode){

                let barcode_data = {
                    code: this.data.reference,
                    type: 'qrcode'
                }
                this.data.barcode = await new Barcode(barcode_data).save()
                save = true
            }

            if (save === true){
                this.save()
            }

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


    }

    module.exports = Transactions
