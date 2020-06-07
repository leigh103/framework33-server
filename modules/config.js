

    var config = {

        db: {
            module:'lowDB',
            name: '',
            username: '',
            password: ''
        },

        admin: {
            email: ''
        },

        host:'localhost',
        websocket:{
            port:6410,
            secret: 'ssshhh'
        },

        http:{
            port:8081
        },

        timezone:'Europe/London',

        site: {
            url:'http://127.0.0.1/',
            name: 'Website Name',
            logo: '/images/logo.svg'
        },

        tax_amount: 1.20,

        users: {
            allow_registration:true,
            email_activation: true,
            guards:['admin','user']
        },

        email:{
            sendgrid_api_key:'',
            from_address: '',
            admin_to: '',
            template_id: '',
            templates:{
                voucher_simple:''
            }
        },

        sms:{
            provider: 'twilio',
            apiKey: '',
            apiSecret: '',
            from: ''
            // apiKey: '5b752c5e',
            // apiSecret: 'dpFbo3BnkxmRPhpd'
        },

        stripe_secret_key: '',
        stripe_publishable_key: ''

    }

    module.exports = config
