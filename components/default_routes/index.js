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
                // {link:'Home',slug:'/', weight:0}
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

    routes.get('/session', (req,res) => {
        res.json(req.session.user)
    })

    routes.get('/testemail', async (req,res) => {

        let user = await new User().find(0)
        user.data.password_reset = '23412312341324'
        let email = await new Notification(user.data).useEmailTemplate('password_reset').email()
        res.send(email)

    })

    routes.get('/testsms', async (req,res) => {

        let user = await new User().find(0)
        let sms = await new Notification(user.data).setContent('','This is a test sms whoopwhoop').sms()
        res.send(sms)

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
