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
        menu: {
            side_nav: [
                {link:'Orders',slug: '/dashboard/transactions/paid', weight:1, subitems:[
                    {link:'Incomplete Carts',slug: '/dashboard/transactions/new', weight:9},
                    // {link:'New',slug: '/dashboard/transactions/paid', weight:2},
                    // {link:'Processing',slug: '/dashboard/transactions/processing', weight:3},
                    // {link:'Shipped',slug: '/dashboard/transactions/shipped', weight:4},
                    {link:'Archive',slug: '/dashboard/transactions/completed', weight:5},
                    {link:'Settings',slug: '/dashboard/transactions/settings', weight:7}
                ]}
            ],
            nav: [
                {link:view.functions.capitalise(cart_name),slug: '/'+cart_name, weight:30}
            ]
        },
        includes: [
            {name:'stripe',path:'stripe.js'}
        ]
    },


// methods


    functions = {

    }


// routes


    let data = {
        include_styles: [settings.views+'/styles/style.ejs'],
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

        res.render(settings.views+'/cart.ejs',data)

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

        data.fields = new TransactionSettings().settings.fields
        data.delivery_options = data.fields.find((item)=>{
            return item.name == 'delivery_options'
        })
        data.free_delivery = data.fields.find((item)=>{
            return item.name == 'free_delivery'
        })

        res.render(settings.views+'/dashboard/transaction_settings.ejs',data)

    })

    routes.get('/dashboard/transactions/:status', async(req, res) => {

        data.include_scripts = ['dashboard/views/scripts/script.ejs', settings.views+'/scripts/dashboard_scripts.ejs']

        view.current_view = 'orders'

        data.statuses = new Transactions().statuses

        data.status_count = await DB.read('transactions').where(['status != completed','status != deleted']).collect('status')

        if (req.params.status == 'new'){
            data.title = 'Transactions'
            data.table = 'cart'
            view.current_sub_view = data.status
            data.status = req.params.status
            data.query = false
            data.fields = new Cart().settings.fields
            data.search_fields = new Cart().settings.search_fields
        } else {
            data.title = 'Transactions'
            data.table = 'transactions'
            data.status = req.params.status
            view.current_sub_view = data.status
            data.query = '?status='+req.params.status

            data.fields = data.model.fields
            data.search_fields = data.model.search_fields
        }

        if (data.status == 'completed' || data.status == 'deleted'){
            data.query += '&limit=60'
        }

        res.render(settings.views+'/dashboard/transactions.ejs',data)

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
