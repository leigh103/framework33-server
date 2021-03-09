//
// Admin Dashboard Module
// Admin user functions
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard/admins',
        views: 'dashboard/views',
        protected_guards:['admin'],
        menu: {
            side_nav:[
                {link:'Admins',slug: '/dashboard/admins', weight: 9, icon:'<i class="fa fa-user-shield"></i>', protected_guard:['admin']}
            ]
        }
    },


// methods

    functions = {


    }


// routes

    let data = {
        include_scripts: [settings.views+'/scripts/script.ejs'],
        model: new Admin().settings
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

        view.current_view = 'admins'

        data.title = 'Admins'
        data.table = 'admin'

        data.fields = data.model.fields
        data.search_fields = data.model.search_fields

        res.render(settings.views+'/table.ejs',data)

    })


// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
