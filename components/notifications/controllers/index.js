//
// Events Component
// Dashboard
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard',
        views: 'notifications/views',
        dashboard:{
            link: 'notifications',
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
        model: new Automations()
        // tabs:[{href: '/dashboard/notifications', text:'Notifications'},{href: '/dashboard/notifications/send', text:'Send'}]
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/notifications', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Notifications'
        }

        view.current_view = 'notifications'
        view.current_sub_view = 'notifications'
        data.include_scripts = [settings.views+'/scripts/script.ejs','dashboard/views//scripts/script.ejs']
        data.action_buttons = [
            {href:'/dashboard/automations',text:'Advanced Settings'}
        ]

        data.title = 'Notifications'
        data.table = 'automations'
        data.query = ''
        data.model.settings.allow_new = false

        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields

        res.render(settings.views+'/notifications.ejs',data)

    })

    routes.post('/notification-test', async(req, res) => {

        let test = req.body,
            to = req.session.user.email

        if (test.method == 'sms' && req.session.user.tel){
            to = req.session.user.tel
        } else if (test.method == 'sms' && !req.session.user.tel){
            res.status(404).json({error:'Please add your mobile number to test via SMS'})
            return
        }

        let result

        if (test.method == 'email'){
            result = await new Notification(to).useEmailTemplate(test).email()
        } else if (test.method == 'sms'){
            result = await new Notification(to).setContent('Notification',test.content).sms()
        } else {
            res.status(401).json({error:'Method not supported'})
            return
        }

        res.json(result)

    })



// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
