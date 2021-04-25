
    const Models = require(basedir+'/modules/Models')

    class TransactionSettings extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'transaction_settings',
                fields: [
                    {name:'stripe_enabled',input_type:'checkbox',placeholder:'Enable Stripe', type:'boolean', required:false},
                    {name:'stripe_public_key',input_type:'text',placeholder:'Stripe Public Key', type:'string', required:false},
                    {name:'stripe_button_text',input_type:'text',placeholder:'Stripe Button Text', type:'string', required:false},
                    {name:'paypal_enabled',input_type:'checkbox',placeholder:'Enable PayPal', type:'boolean', required:false},
                    {name:'paypal_url',input_type:'text',placeholder:'PayPal URL', type:'string', required:false},
                    {name:'paypal_button_text',input_type:'text',placeholder:'PayPal Button Text', type:'string', required:false},
                    {name:'worldpay_enabled',input_type:'checkbox',placeholder:'Enable Worldpay', type:'boolean', required:false},
                    {name:'worldpay_url',input_type:'text',placeholder:'Worldpay URL', type:'string', required:false},
                    {name:'worldpay_button_text',input_type:'text',placeholder:'Worldpay Button Text', type:'string', required:false},
                    {name:'delivery_options',input_type:'array',placeholder:'Delivery Options', type:'array', required:false, subitems:[
                        {name:'enabled',input_type:'checkbox',placeholder:'Enabled', type:'boolean', required:false},
                        {name:'name',input_type:'text',placeholder:'Option Name', type:'string', required:true},
                        {name:'price',input_type:'text',placeholder:'Delivery Price', type:'price', required:true},
                        {name:'orders_under',input_type:'text',placeholder:'Orders Under', type:'price', required:false},
                        {name:'orders_over',input_type:'text',placeholder:'Orders Over', type:'price', required:false},
                        {name:'postcode_match',input_type:'text',placeholder:'Postcode Match', type:'string', required:false, colspan: 5}
                    ]},
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
                    },
                    post: {
                        save:['admin']
                    }
                }
            }

        }

        async init(){

            let transaction_settings = await DB.read('transaction_settings').where(['_key == 0']).first() //await this.find(['_key == 0']).get()

            if (typeof transaction_settings == 'object' && transaction_settings._key){

                global.view.transactions = transaction_settings
                log('Loaded transaction settings')

            } else {

                let new_transaction_settings = await this.getTemplate()
                new_transaction_settings.data._key = "0"
                global.view.transactions = await DB.create(this.settings.collection,new_transaction_settings.data).first()
                global.view.transactions = new_transaction_settings.data
                global.view.transactions.payment_methods = []
                global.view.transactions.delivery_options = []
                console.error('No transaction settings available. Please set these options via the dashboard and restart Framework-33')

            }

        }

        preSave(){

            this.data.payment_methods = []
            if (this.data.stripe_enabled === true){
                let stripe = {
                    name:'Stripe'
                }
                if (this.data.stripe_button_text){
                    stripe.button_text = this.data.stripe_button_text
                }
                this.data.payment_methods.push(stripe)
            }

            if (this.data.paypal_enabled === true && this.data.paypal_url){
                let paypal = {
                    name:'Paypal'
                }
                if (this.data.paypal_button_text){
                    stripe.button_text = this.data.paypal_button_text
                }
                this.data.payment_methods.push(paypal)
            }

            if (this.data.worldpay_enabled === true && this.data.worldpay_url){
                let worldpay = {
                    name:'Worldpay'
                }
                if (this.data.worldpay_button_text){
                    stripe.button_text = this.data.worldpay_button_text
                }
                this.data.payment_methods.push(worldpay)
            }

            return this

        }

        postSave(){

            global.view.transactions = this.data

        }

        async delivery(){

            this.data = await DB.read(this.settings.collection).where(['_key == 0']).first()
            return this.data.delivery_options

        }

        async registerMenus(){

            let menus = {
                menu: {
                    settings: [
                        {link:'Transaction Settings',slug:'transactions', weight:1}
                    ]
                }
            }

            global.addMenu(menus)
            return this

        }

    }

    new TransactionSettings().init()

    module.exports = TransactionSettings
