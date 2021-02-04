
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
                    // {name:'status',input_field:'select',options:this.statuses, type:'string', required:false},
                    // {name:'barcode',input_field:'_key',placeholder:'Barcode', type:'barcode', required:false},
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
                    {name:'_user_id', type:'string', required:true}
                ]
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

        async preSave(){

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

            }

        }

        async postSave(status){

            let save = false

            if (!this.data.status && !status){
                this.data.status = this.statuses[0].value
                save = true
            // } else if (status){
            //
            //     let status_check = this.statuses.findIndex((sts)=>{
            //         return sts.value == status.toLowerCase().replace(/\s/g,'_')
            //     })
            //
            //     if (status_check >= 0){
            //         this.data.status = status
            //         save = true
            //     }

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


    }

    module.exports = Transactions
