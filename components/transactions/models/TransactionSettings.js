
    const Models = require(basedir+'/modules/Models')

    class TransactionSettings extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'transaction_settings',
                fields: [
                    {name:'stripe_enabled',input_type:'select',options:[{text:'Enabled',value:true},{text:'Disabled',value:false}],placeholder:'Enable Stripe', type:'boolean', required:false},
                    {name:'stripe_public_key',input_type:'text',placeholder:'Stripe Public Key', type:'string', required:false},
                    {name:'stripe_button_text',input_type:'text',placeholder:'Stripe Button Text', type:'string', required:false, margin_bottom:true},
                    {name:'paypal_enabled',input_type:'select',options:[{text:'Enabled',value:true},{text:'Disabled',value:false}],placeholder:'Enable PayPal', type:'boolean', required:false},
                    {name:'paypal_url',input_type:'text',placeholder:'PayPal URL', type:'string', required:false},
                    {name:'paypal_button_text',input_type:'text',placeholder:'PayPal Button Text', type:'string', required:false, margin_bottom:true},
                    {name:'worldpay_enabled',input_type:'select',options:[{text:'Enabled',value:true},{text:'Disabled',value:false}],placeholder:'Enable Worldpay', type:'boolean', required:false},
                    {name:'worldpay_url',input_type:'text',placeholder:'Worldpay URL', type:'string', required:false},
                    {name:'worldpay_button_text',input_type:'text',placeholder:'Worldpay Button Text', type:'string', required:false, margin_bottom:true}
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

        async init(){

            let transaction_settings = await this.find(['_key == 0'])
            if (transaction_settings && transaction_settings.data && Object.keys(this.data).length > 1){

                global.view.transactions = transaction_settings.data
                log('Loaded transaction settings')

            } else {

                let new_transaction_settings = await this.getTemplate()
                global.view.transactions = await DB.create(this.settings.collection,new_transaction_settings.data).first()
                global.view.transactions = new_transaction_settings.data
                global.view.transactions.payment_methods = []
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

    }

    new TransactionSettings().init()

    module.exports = TransactionSettings
