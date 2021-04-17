//
// Events Component
// Dashboard
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard',
        views: 'automations/views',
        menu: {
            side_nav: [
                {link:'Automations',slug: '/dashboard/automations', icon:'<span class="icon cycle"></span>', weight:5}
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
        model: new Automations()
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/automations/customers', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Automations'
        }

        view.current_view = 'automations'
        view.current_sub_view = 'customers'
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Automations'
        data.table = 'automations'

        data.fields = data.model.fields
        data.search_fields = data.model.search_fields

        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/automations/:key?', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Automations'
        }

        view.current_view = 'automations'
        view.current_sub_view = ''
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Automations'
        data.table = 'automations'

        if (req.params.key){
            data.key = req.params.key
            data.fields = await data.model.parseEditFields()
            res.render(basedir+'/components/dashboard/views/edit.ejs',data)
        } else {
            data.fields = data.model.settings.fields
            data.search_fields = data.model.settings.search_fields
            res.render(basedir+'/components/dashboard/views/table.ejs',data)
        }

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
