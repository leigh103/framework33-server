//
// Events Component
// Dashboard
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard',
        views: 'events/views',
        menu: {
            side_nav: [
                {link:'Events',slug: '/dashboard/events', weight:1, subitems:[
                    {link:'Customers',slug: '/dashboard/events/customers', weight:1},
                    {link:'Admins',slug: '/dashboard/events/admins', weight:2},
                    {link:'Misc',slug: '/dashboard/events/misc', weight:3}
                ]}
            ]
        }
    },


// methods


    functions = {



    }


// routes


    let data = {
        meta: {},
        include_styles: ['dashboard/views/styles/dashboard-style.ejs']
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/events/customers', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Events'
        }

        view.current_view = 'events'
        view.current_sub_view = 'customers'
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Events'
        data.table = 'events'

        data.fields = new Events().settings.fields

        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/events', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Events'
        }

        view.current_view = 'events'
        view.current_sub_view = ''
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Events'
        data.table = 'events'

        data.fields = new Events().settings.fields

        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings