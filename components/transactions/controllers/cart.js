//
// Cart Controller
//


// vars

const express = require('express'),
    routes = express.Router(),

    cart_name = view.ecommerce.cart_name,

    settings = {
        default_route: 'dashboard/cart',
        views: 'transactions/views',
        protected_guards:['admin']
    },


// methods


    functions = {

    }


// routes


    let data = {
        model: new Cart(),
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

    routes.get('/:key', async (req, res) => {

        data.meta = {
            title: config.site.name+' | Customer Cart'
        }

        view.current_view = 'transactions'
        view.current_sub_view = 'cart'
        data.include_scripts = ['dashboard/views/scripts/script.ejs', settings.views+'/scripts/dashboard_scripts.ejs']

        data.title = 'Customer Cart'
        data.table = 'cart'
        data.key = req.params.key

    //    data.option_data = await view.functions.getOptionData('product_categories')
        data.fields = await data.model.parseEditFields()

        res.render(basedir+'/components/dashboard/views/edit.ejs',data)

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
