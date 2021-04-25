//
// Transaction Component
//


// vars

const express = require('express'),
    routes = express.Router(),

    cart_name = view.ecommerce.cart_name,

    settings = {
        default_route: 'dashboard/settings',
        views: 'dashboard/views'
    },


// methods


    functions = {

    }


// routes


    let data = {

    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/:model', async(req, res) => {

        let model_class_name = parseClassName(view.functions.depluralise(req.params.model))+'Settings'

        if (global[model_class_name] && typeof global[model_class_name] == 'function'){

            data.include_scripts = ['dashboard/views/scripts/script.ejs']

            view.current_view = 'Settings'
            view.current_sub_view = 'settings'

            data.title = req.params.model+' Settings'
            data.table = req.params.model+'_settings'

            data.model = new global[model_class_name]()
            data.fields = await data.model.parseEditFields()

            data.key = 0

            res.render(settings.views+'/edit.ejs',data)

        } else {
            res.redirect('/dashboard/settings')
        }

    })

// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
