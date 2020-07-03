//
// Admin Dashboard Module
// Admin user functions
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard',
        views: 'dashboard/views',
        protected_guards:['admin'],
        menu: {
            nav: [
                {link:'Dashboard',slug: '/dashboard', weight: 10, protected_guards:['admin']}
            ],
            footer: [
                {link:'Dashboard',slug: '/dashboard', weight: 10, protected_guards:['admin']}
            ],
            side_nav:[
                {link:'Dashboard',slug: '/dashboard', weight: 1, protected_guards:['admin'],subitems:[
                    {link:'Overview',slug: '/dashboard', weight:1},
                    {link:'Mailbox',slug: '/dashboard/mailbox', weight:2},
                    {link:'Logs',slug: '/dashboard/logs', weight:3},
                    {link:'Components',slug: '/dashboard/components', weight:4}
                ]}
            ]
        },
        includes: [
            {name:'users',path:'users.js'},
            {name:'admins',path:'admins.js'}
        ]
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

        view.current_view = 'dashboard'
        data.title = 'Users'
        res.render(settings.views+'/dashboard.ejs',data)

    })

    routes.get('/components', (req, res) => {

        view.current_view = 'dashboard'
        data.title = 'Components'
        data.components = Object.keys(global.component).map(function(key) {
            let obj = global.component[key]
            obj.name = key
            if (!obj.settings){
                obj.settings = {}
            }
            if (obj.settings && !obj.settings.default_route){
                obj.settings.default_route = ''
            }
            return obj;
        })

        data.components.sort((a, b) => a.settings.default_route.localeCompare(b.settings.default_route))

        res.render(settings.views+'/components.ejs',data)

    })

    routes.get('/logs', (req, res) => {

        view.current_view = 'dashboard'
        data.title = 'logs'
        res.render(settings.views+'/logs.ejs',data)

    })

    routes.get('/mailbox', (req, res) => {

        view.current_view = 'dashboard'
        data.title = 'mailbox'
        res.render(settings.views+'/mailbox.ejs',data)

    })


// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
