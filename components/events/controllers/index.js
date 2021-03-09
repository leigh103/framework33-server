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
                {link:'Events',slug: '/dashboard/events', icon:'<i class="fa fa-mail-bulk"></i>', weight:8}
            ]
        }
    },


// methods


    functions = {



    }


// routes


    let data = {
        meta: {},
        include_styles: ['dashboard/views/styles/dashboard-style.ejs'],
        model: new Events().settings
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

        data.fields = data.model.fields
        data.search_fields = data.model.search_fields

        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/events/:key?', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Events'
        }

        view.current_view = 'events'
        view.current_sub_view = ''
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Events'
        data.table = 'events'

        data.fields = data.model.fields
        data.search_fields = data.model.search_fields

        if (req.params.key){
            data.key = req.params.key
            res.render(basedir+'/components/dashboard/views/edit.ejs',data)
        } else {
            res.render(basedir+'/components/dashboard/views/table.ejs',data)
        }

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
