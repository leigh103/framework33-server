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
        dashboard:{
            link: 'automations',
            label: 'Edit website notifications'
        },
        menu: {
            side_nav: [
                {link:'Notifications',slug: '/dashboard/notifications', icon:'<span class="icon bell"></span>', protected_guards:['admin'], weight:8}
            ]
        }
    },


// methods


    functions = {



    }


// routes


    let data = {
        query:'',
        meta: {},
        include_styles: ['dashboard/views/styles/dashboard-style.ejs'],
        model: new Automations(),
        tabs: [{href: '/dashboard/notifications', text:'All'},{href: '/dashboard/notifications/user', text:'User'},{href: '/dashboard/notifications/transactions', text:'Transactions'},{href: '/dashboard/notifications/products', text:'Products'}]
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/notifications/:key', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Notifications'
        }

        view.current_view = 'notifications'
        view.current_sub_view = 'all'
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Notifications'
        data.table = 'automations'
        data.query = undefined

        data.key = req.params.key
        data.fields = await data.model.parseEditFields()
        res.render(basedir+'/components/dashboard/views/edit.ejs',data)

    })

    routes.get('/notifications', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Notifications'
        }

        view.current_view = 'notifications'
        view.current_sub_view = req.params.filter
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Notifications'
        data.table = 'automations'
        data.query = ''

        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields

        res.render(basedir+'/components/dashboard/views/grid.ejs',data)

    })





// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
