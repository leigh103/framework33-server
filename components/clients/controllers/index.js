//
// accounts Component
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard/clients',
        views: 'accounts/views',
        menu: {
            side_nav: [
                {link:'Clients', protected_guards:['admin'],slug: '/dashboard/clients/'+config.clients.labels.users, icon:'<span class="icon person"></span>', weight:4}
            ]
        }
    }


// methods


    const functions = {

    }


// routes


    let data = {
        meta: {},
        tabs: [
            {href:'/dashboard/clients/'+config.clients.labels.users, text: config.clients.labels.users},
            {href:'/dashboard/clients/'+config.clients.labels.admins, text: config.clients.labels.admins},
            {href:'/dashboard/clients/'+config.clients.labels.accounts, text: config.clients.labels.accounts}
        ]
    }

    routes.get('*', (req, res, next) => {

        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/:page/:key', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Clients',
            edit_link: false
        }

        view.current_view = 'clients'
        view.current_sub_view = req.params.page

        data.include_scripts = ['dashboard/views/scripts/script.ejs','dashboard/views/scripts/editor.ejs']
        data.include_styles = [settings.views+'/dashboard/styles/style.ejs']

        if (req.params.page == config.clients.labels.admins){

            data.title = 'Clients'
            data.edit_label = config.clients.labels.admins
            data.model = new ClientUsers()
            data.table = 'client_users'

        } else if (req.params.page == config.clients.labels.users){

            data.title = 'Clients'
            data.edit_label = config.clients.labels.users
            data.model = new ClientUsers()
            data.table = 'client_users'

        } else if (req.params.page == config.clients.labels.accounts){

            data.title = 'Clients'
            data.edit_label = config.clients.labels.accounts
            data.model = new ClientAccounts()
            data.table = 'client_accounts'

        }

        data.key = req.params.key
        data.fields = await data.model.parseEditFields()

        res.render(basedir+'/components/dashboard/views/edit.ejs',data)

    })

    routes.get('/:page', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Clients',
        }

        view.current_view = 'accounts'
        view.current_sub_view = req.params.page

        data.edit_link = 'accounts/'+req.params.page

        data.include_scripts = ['dashboard/views/scripts/script.ejs','dashboard/views/scripts/editor.ejs']
        data.include_styles = [settings.views+'/dashboard/styles/style.ejs']

        if (req.params.page == config.clients.labels.admins){

            data.title = 'Clients'
            data.edit_label = config.clients.labels.admins
            data.model = new ClientUsers()
            data.table = 'client_users'

        } else if (req.params.page == config.clients.labels.users){

            data.title = 'Clients'
            data.edit_label = config.clients.labels.users
            data.model = new ClientUsers()
            data.table = 'client_users'

        } else if (req.params.page == config.clients.labels.accounts){

            data.title = 'Clients'
            data.edit_label = config.clients.labels.accounts
            data.model = new ClientAccounts()
            data.table = 'client_accounts'

        }

        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields
        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/', async(req, res) => {

        data.title = 'Clients'
        view.current_sub_view = config.clients.labels.users
        res.render(settings.views+'/index.ejs',data)

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
