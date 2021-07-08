//
// Transaction Component
//


// vars

const express = require('express'),
    routes = express.Router(),

    cart_name = view.ecommerce.cart_name,

    settings = {
        default_route: 'root',
        views: 'transactions/views',
        protected_guards:['admin'],
        menu: {
            side_nav: [
                {link:'Orders',slug: '/dashboard/transactions/new', icon:'<span class="icon shoppingbag"></span>', weight:3, protected_guards:['admin'],subitems:[
                    {link:'Incomplete Carts',slug: '/dashboard/transactions/incomplete', icon:'<span class="icon shoppingbag"></span>', weight:9},
                    // {link:'New',slug: '/dashboard/transactions/paid', weight:2},
                    // {link:'Processing',slug: '/dashboard/transactions/processing', weight:3},
                    // {link:'Shipped',slug: '/dashboard/transactions/shipped', weight:4},
                    {link:'Archive',slug: '/dashboard/transactions/completed', icon:'<span class="icon shoppingbag"></span>', weight:5},
                    {link:'Settings',slug: '/dashboard/transactions/settings', icon:'<span class="icon shoppingbag"></span>', weight:7}
                ]}
            ],
            nav: [
                {link:view.functions.capitalise(cart_name),slug: '/'+cart_name, weight:30}
            ]
        },
        includes: [
            {name:'stripe',path:'stripe.js'},
            {name:'paypal',path:'paypal.js'},
            {name:'cart',path:'cart.js'}
        ]
    },


// methods


    functions = {

    }


// routes


    let data = {
        include_styles: [settings.views+'/styles/style.ejs', settings.views+'/styles/cart.ejs'],
        cart_name: view.functions.capitalise(cart_name),
        model: new Transactions().settings,
        query: ''
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/'+cart_name, async(req, res) => {

        data.transactions = view.transactions
        data.include_scripts = [settings.views+'/scripts/script.ejs']
        data.cart = await new Cart().init(req)
        data.cart.delivery_options = global.view.transactions.delivery_options

        res.render(config.site.theme_path+'/templates/transactions/cart.ejs',data)

    })

    routes.post('/dashboard/transactions/update', async(req, res) => {

        if (!req.body.ids || !req.body.status){
            res.status(301).send('Please speficy a list of IDs and/or a status')
        } else {
            let ids = await new Transactions().updateStatus(req.body.status, req.body.ids)
            res.json(ids)
        }

    })

    routes.get('/dashboard/transactions/print/:ids', async(req, res) => {

        if (req.params.ids.match(/,/)){
            data.ids = req.params.ids.split(',')

        } else {
            data.ids = []
            data.ids.push(req.params.ids)
        }

        data.transactions = await new Transactions().findAll(data.ids)


        res.render(settings.views+'/dashboard/print.ejs',data)

    })

    routes.get('/dashboard/transactions/settings', async(req, res) => {

        data.include_scripts = ['dashboard/views/scripts/script.ejs', settings.views+'/scripts/dashboard_scripts.ejs']

        view.current_view = 'orders'
        view.current_sub_view = 'settings'

        data.title = 'Transaction Settings'
        data.table = 'transaction_settings'

        data.model = new TransactionSettings()
        data.fields = await data.model.parseEditFields()

        data.key = 0

        res.render(basedir+'/components/dashboard/views/edit.ejs',data)

    })


    routes.get('/dashboard/transactions/edit/:key', async(req, res) => {

        data.include_scripts = ['dashboard/views/scripts/script.ejs', settings.views+'/scripts/dashboard_scripts.ejs']
        view.current_view = 'orders'
        data.key = req.params.key
        data.title = 'Orders'
        data.table = 'transactions'
        data.model = new Transactions()
        data.statuses = data.model.statuses
    //    data.fields = data.model.parseEditFields()
        data.delivery_options = await new TransactionSettings().delivery()
        data.delivery_options = data.delivery_options.map((option)=>{
            let output = {
                _key: option._key,
                name: option.name+' - £'+(option.price/100).toFixed(2)
            }
            return output
        })
        res.render(settings.views+'/dashboard/transaction_edit.ejs',data)

    })


    routes.get('/dashboard/transactions/archive', async(req, res) => {

        data.status = 'completed'
        if (req.params.status){
            data.status = req.params.status
        }

        data.tabs = [{href: '/dashboard/transactions/archive', text:'Completed'},{href: '/dashboard/transactions/refunds', text:'Refunds'},{href: '/dashboard/transactions/deleted', text:'Deleted'}]

        data.include_scripts = ['dashboard/views/scripts/script.ejs', settings.views+'/scripts/dashboard_scripts.ejs']

        view.current_view = 'orders'
        data.title = 'Order Archive'

        data.status_count = await DB.read('transactions').where(['status != completed','status != deleted']).collect('status')

        data.model = new Transactions()
        data.table = 'transactions'
        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields
        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })


    routes.get('/dashboard/transactions/stats', async(req, res) => {

        let status_count = await DB.read('transactions').orWhere(['status == new','status == processing','status == shipped']).collect('status')

        let result = 'There are '

        status_count.map((status,i)=>{
            result += '<a href="/dashboard/transactions/'+status.field+'">'+status.count+' '+status.field+'</a>'

            if (i == status_count.length-2){
                result += ' and '
            } else if (i < status_count.length-2){
                result += ', '
            }
            return status
        })
        res.send(result)

    })


    routes.get('/dashboard/transactions/:status?', async(req, res) => {

        data.status = 'paid'
        if (req.params.status){
            data.status = req.params.status
        }

        data.include_scripts = ['dashboard/views/scripts/script.ejs', settings.views+'/scripts/dashboard_scripts.ejs']
        data.tabs = [
            {href: '/dashboard/transactions/new', text:'New', counter:'new'},
            {href: '/dashboard/transactions/processing', text:'Processing', counter:'processing'},
            {href: '/dashboard/transactions/shipped', text:'Shipped', counter:'shipped'},
            {href: '/dashboard/transactions/settings', text:'Settings'}
        ]

        view.current_view = 'orders'

        data.status_count = await DB.read('transactions').where(['status != completed','status != deleted']).collect('status')

        if (req.params.status == 'incomplete'){

            data.model = new Cart()
            data.statuses = []
            data.title = 'Incomplete Carts'
            data.table = 'cart'
            view.current_sub_view = 'incomplete'
            data.query = '?limit=60'
            data.fields = data.model.settings.fields
            data.search_fields = data.model.settings.search_fields

        } else {

            data.model = new Transactions()

            data.title = 'Orders'
            data.table = 'transactions'
            view.current_sub_view = data.status
            data.query = '?status='+data.status
            data.statuses = data.model.statuses
            data.fields = data.model.settings.fields
            data.search_fields = data.model.settings.search_fields

            if (!data.status.match(/paid|shipped|processing/)){
                data.query += '&limit=60'
            }

        }

        res.render(settings.views+'/dashboard/transactions.ejs',data)

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
