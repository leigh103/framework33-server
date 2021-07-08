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
            //    {link:'Automations',slug: '/dashboard/automations', icon:'<span class="icon cycle"></span>', protected_guards:['admin'], weight:15}
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
        tabs: [{href: '/dashboard/automations', text:'All'},{href: '/dashboard/automations/user', text:'User'},{href: '/dashboard/automations/transactions', text:'Transactions'},{href: '/dashboard/automations/products', text:'Products'},{href: '/dashboard/automations/scheduled', text:'Scheduled'},{href: '/dashboard/automations/recurring', text:'Recurring'}]
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/automations/:filter(user|products|transactions)', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Automations'
        }

        view.current_view = 'automations'
        view.current_sub_view = req.params.filter
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Automations'
        data.table = 'automations'
        data.query = '?type='+req.params.filter

        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields

        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/automations/:filter(recurring|scheduled)', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Automations'
        }

        view.current_view = 'automations'
        view.current_sub_view = req.params.filter
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        if (req.params.filter == 'recurring'){
            req.params.filter = 'recur'
        }

        if (req.params.filter == 'scheduled'){
            req.params.filter = 'schedule'
        }

        data.title = 'Automations'
        data.table = 'automations'
        data.query = '?'+req.params.filter+'=has_value'

        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields

        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/automations/:key?', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Automations'
        }

        view.current_view = 'automations'
        view.current_sub_view = 'all'
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Automations'
        data.table = 'automations'
        data.query = undefined

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
