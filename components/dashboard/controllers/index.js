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
                {link:'Dashboard',slug: '/dashboard', icon:'<span class="icon blocks"></span>', weight: 1, protected_guards:['admin'],subitems:[
                    {link:'Mailbox',slug: '/dashboard/mailbox', icon:'<span class="icon envelope"></span>', weight:2},
                    {link:'Logs',slug: '/dashboard/logs', icon:'<span class="icon contenttext"></span>', weight:3},
                    {link:'Components',slug: '/dashboard/components', icon:'<span class="icon contentfeatures"></span>', weight:4}
                ]},
            //    {link:'People',slug: '/dashboard/admin', weight: 6, icon:'<span class="icon person"></span>', protected_guard:['admin']}
            ]
        },
        includes: config.users.guards
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
        tabs:[{href:'/dashboard', text:'Overview'},{href:'/dashboard/admin', text:'People'},{href:'/dashboard/components', text:'Components'},{href:'/dashboard/logs', text:'Logs'},{href:'/dashboard/settings', text:'Settings'}]
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
        view.current_sub_view = 'overview'
        data.title = 'Dashboard'

        res.render(settings.views+'/dashboard.ejs',data)

    })

    routes.get('/components', (req, res) => {

        view.current_view = 'dashboard'
        view.current_sub_view = 'Components'
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
        view.current_sub_view = 'Logs'
        data.title = 'Logs'
        res.render(settings.views+'/logs.ejs',data)

    })

    routes.get('/settings', (req, res) => {

        view.current_view = 'settings'
        view.current_sub_view = 'Settings'
        data.title = 'Settings'
        res.render(settings.views+'/settings.ejs',data)

    })

    routes.get('/mailbox', (req, res) => {

        view.current_view = 'dashboard'
        view.current_sub_view = 'Mailbox'
        data.title = 'Mailbox'
        data.table = 'mailbox'

        data.context_menu = [
            {function: "markUnread",text:"Mark unread", icon:"eye"}
        ]

        res.render(settings.views+'/mailbox.ejs',data)

    })

    routes.get('/stats', async (req, res) => {

        let status_count = await DB.read('mailbox').where(['read != true']).collect('unread')

        let result = 'There are '+status_count.length+' unread notifications'
        if (status_count.length == 1){
            result = 'There is '+status_count.length+' unread notification'
        }
        if (status_count.length == 0){
            result = "You're all caught up"
        }
        res.send(result)

    })

    routes.post('/send-message', async (req, res) => {

        if (getGuard(req) != 'admin'){
            res.send(404).json({error:'404 - not found'})
            return
        }

        let msg = req.body,
            recipient = req.body.to,
            result = 'done',
            user_id = 'none'

        if (msg.id){

            let guard = msg.id.split('/')[0],
                key =  msg.id.split('/')[1]

            let user = await new global[parseClassName(guard)]().find(key)
            user = user.data

            user_id = user._id

            if (msg.method == 'email' && user.email){
                recipient = user.email
            } else if (msg.method == 'sms'){
                if (user.tel && user.tel.match(/^(07|\+447|\+4407)/)){
                    recipient = user.tel
                } else {
                    res.status(404).json({error:'No valid mobile number found'})
                    return
                }
            } else {
                res.status(404).json({error:'No valid email address or mobile number found'})
                return
            }

        }

        if (msg.method == 'email'){
            new Log(req.session.user._id, 'post', user_id, 'Email Sent', req.headers['x-forwarded-for'], req.body).save()
            result = await new Notification(recipient).useEmailTemplate(msg).email()
        } else if (msg.method == 'sms'){
            new Log(req.session.user._id, 'post', user_id, 'SMS Sent', req.headers['x-forwarded-for'], req.body).save()
            result = await new Notification(recipient).setContent(msg.content).sms()
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
