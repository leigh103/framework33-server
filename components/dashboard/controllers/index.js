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
                {link:'Dashboard',slug: '/dashboard', icon:'<span class="icon gauge"></span>', weight: 1, protected_guards:['admin'],subitems:[
                    {link:'Mailbox',slug: '/dashboard/mailbox', icon:'<span class="icon envelope"></span>', weight:2},
                    {link:'Logs',slug: '/dashboard/logs', icon:'<span class="icon contenttext"></span>', weight:3},
                    {link:'Components',slug: '/dashboard/components', icon:'<span class="icon contentfeatures"></span>', weight:4}
                ]},
                {link:'People',slug: '/dashboard/admin', weight: 6, icon:'<span class="icon person"></span>', protected_guard:['admin']}
            ]
        },
        includes: [
            {name:'customers',path:'customers.js'},
            {name:'admins',path:'admins.js'}
        ]
    },


// methods

    functions = {


    }


// routes

    let data = {
        include_scripts: [settings.views+'/scripts/script.ejs'],
        meta:{
            title: config.site.name+' | Dashboard'
        },
        tabs:[{href:'/dashboard', text:'Dashboard'},{href:'/dashboard/mailbox', text:'Mailbox'},{href:'/dashboard/components', text:'Components'},{href:'/dashboard/logs', text:'Logs'}]
    }


    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
            next()
        } else {
            res.redirect('/login/admin')
        }
        next()
    })

    routes.get('/', (req, res) => {

        view.current_view = 'dashboard'
        data.title = 'Dashboard'
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
        data.title = 'Logs'
        res.render(settings.views+'/logs.ejs',data)

    })

    routes.get('/settings', (req, res) => {

        view.current_view = 'settings'
        data.title = 'Settings'
        res.render(settings.views+'/settings.ejs',data)

    })

    routes.get('/mailbox', (req, res) => {

        view.current_view = 'dashboard'
        data.title = 'Mailbox'
        res.render(settings.views+'/mailbox.ejs',data)

    })


// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
