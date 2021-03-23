//
// Admin Dashboard Module
// Admin user functions
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard/customers',
        views: 'dashboard/views',
        protected_guards:['admin']
    },


// methods

    functions = {


    }


// routes

    let data = {
        include_scripts: [settings.views+'/scripts/script.ejs'],
        model: new Customers(),
        tabs: [{href: '/dashboard/admin', text:'Administrators'},{href: '/dashboard/customers', text:'Customers'}]
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
            next()
        } else {
            res.redirect('/login/admin')
        }
    })

    routes.get('/:key?', (req, res) => {

        view.current_view = 'people'
        view.current_sub_view = 'customers'

        data.title = 'People'
        data.table = 'customers'

        if (req.params.key){
            data.key = req.params.key
            data.fields = data.model.parseEditFields()
            res.render(settings.views+'/edit.ejs',data)
        } else {
            data.fields = data.model.settings.fields
            data.search_fields = data.model.settings.search_fields
            res.render(settings.views+'/table.ejs',data)
        }

    })


// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
