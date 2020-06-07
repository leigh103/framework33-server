//
// Admin Dashboard Module
// Admin user functions
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard/users',
        views: 'dashboard/views',
        protected_guards:['admin'],
        menu: {
            side_nav:[
                {link:'Users',slug: '/dashboard/users', weight: 10, protected_guard:['admin']}
            ]
        }
    },


// methods

    functions = {


    }


// routes

    let data = {
        include_scripts: [settings.views+'/scripts/script.ejs']
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
            next()
        } else {
            res.redirect('/login/admin')
        }
    })

    routes.get('/', (req, res) => {

        view.current_view = 'users'

        data.title = 'Users'
        data.table = 'users'

        data.fields = users.settings.fields

        res.render(settings.views+'/table.ejs',data)

    })


// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
