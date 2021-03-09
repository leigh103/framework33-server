//
// Admin Dashboard Module
// Admin user functions
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard/user',
        views: 'dashboard/views',
        protected_guards:['admin'],
        menu: {
            side_nav:[
                {link:'Users',slug: '/dashboard/user', weight: 10, icon:'<i class="fa fa-users"></i>', protected_guard:['admin']}
            ]
        }
    },


// methods

    functions = {


    }


// routes

    let data = {
        include_scripts: [settings.views+'/scripts/script.ejs'],
        model: new User()
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

        view.current_view = 'users'

        data.title = 'Users'
        data.table = 'user'

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
