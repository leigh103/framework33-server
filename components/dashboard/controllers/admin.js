//
// Admin Dashboard Module
// Admin user functions
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard/admin',
        views: 'dashboard/views',
        protected_guards:['admin']
    },


// methods

    functions = {


    }


// routes

    let data = {
        include_scripts: [settings.views+'/scripts/script.ejs'],
        model: new Admin(),
        tabs: []
    }

    config.users.guards.map((grd) => {
        data.tabs.push({href: '/dashboard/'+grd.name, text: view.functions.capitalise(grd.name)})
    })

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
            next()
        } else {
            res.redirect('/login/admin')
        }
        next()
    })

    routes.get('/:key?', async (req, res) => {

        view.current_view = 'people'
        view.current_sub_view = 'admin'

        data.title = 'People'
        data.table = 'admin'

        if (req.params.key){

            data.action_buttons = [
                {click:"sendMessage('admin/"+req.params.key+"')",text:"Contact Admin"}
            ]

            data.key = req.params.key
            data.fields = await data.model.parseEditFields()
            res.render(settings.views+'/edit.ejs',data)
        } else {
            data.fields = data.model.settings.fields
            data.search_fields = data.model.settings.search_fields
            res.render(settings.views+'/table.ejs',data)
        }

    })


// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
