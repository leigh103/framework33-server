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
                {link:'Transactions',slug: '/dashboard/transactions', weight:1, subitems:[
                    {link:'New',slug: '/dashboard/transactions/new', weight:1},
                    {link:'Paid',slug: '/dashboard/transactions/paid', weight:2},
                    {link:'Processing',slug: '/dashboard/transactions/processing', weight:3},
                    {link:'Shipped',slug: '/dashboard/transactions/shipped', weight:4},
                    {link:'Refunded',slug: '/dashboard/transactions/refunded', weight:5},
                    {link:'Deleted',slug: '/dashboard/transactions/deleted', weight:6},
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
        cart_name: view.functions.capitalise(cart_name)
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

        res.render(settings.views+'/cart.ejs',data)

    })

    routes.get('/dashboard/transactions/settings', async(req, res) => {

        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        view.current_view = 'transactions'
        view.current_sub_view = 'settings'

        data.title = 'Transaction Settings'
        data.table = 'transaction_settings'

        data.fields = new TransactionSettings().settings.fields

        res.render(settings.views+'/dashboard/transaction_settings.ejs',data)

    })

    routes.get('/dashboard/transactions/:status', async(req, res) => {

        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        view.current_view = 'transactions'

        data.title = 'Transactions'
        data.table = 'transactions'
        data.status = req.params.status
        view.current_sub_view = data.status
        data.query = '?status='+req.params.status

        data.fields = new Transactions().settings.fields

        res.render(config.site.theme_path+'/templates/transactions/table.ejs',data)

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
