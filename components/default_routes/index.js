//
// Default Routes
// Includes functions and tools for all users
//


// vars

var express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'root',
        views: 'default_routes/views',
        menu: {
            nav: [
                {link:'Home',slug:'/', weight:0}
            ]
        }
    }


// methods

    functions = {



    }


// routes

    routes.use('default_routes/static', express.static(__dirname + '/static'))

    routes.get('*',(req, res, next)=>{
        view.current_view = 'home'
        next()
    })

    routes.get('/', (req, res) => {
        res.render(settings.views+'/homepage.ejs', {user:req.session.user, menus:view.menus})
    })

    routes.get('/testemail', (req,res) => {

        let data = {
          to: 486288,
          subject: 'This is a test email',
          text: 'This is a test email. '+config.site_url+'/book/confirm/1582455692451 ',
          html: '<h1>This is a test email</h1><p>Wowzers</p>'
        }

        notification.email(data).then(()=>{
            res.send('sent!')
        }).catch((err)=>{
            res.send(err)
        })

    })

    routes.get('/testsms', (req,res) => {

        let data = {
            msg: 'This is all but a test'
        }

        notification.sms(data).then(()=>{
            res.send('sent!')
        }).catch((err)=>{
            res.send(err)
        })

    })

    routes.get('/testnotification', (req,res) => {

        let admin_msg = {
            msg:'This is test notification. <a href="/book">Click here</a>',
            type:'Test Notification'
        }
        notification.broadcastToAdmins(admin_msg).then(()=>{
            res.send('sent!')
        }).catch((err)=>{
            res.send(err)
        })

    })



// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
