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

        if (getGuard(req) == 'admin'){
            let email = await new Notification('lee@reformedreality.com').setContent('This is a test','This is a test email, sent from '+config.site.name).email()
            res.send(email)
        } else {
            res.redirect('/login/admin')
        }

    })

    routes.get('/testbarcode', async (req,res) => {

        if (getGuard(req) == 'admin'){
            let barcode = await new Barcode(23423453423,'qrcode').save()
            res.sendFile(barcode)
        } else {
            res.redirect('/login/admin')
        }

    })

    routes.get('/testevent', async (req,res) => {

        if (getGuard(req) == 'admin'){
            let transaction = await new Transactions().find('19160320')

            if (transaction.data){
                new global.Events('send_receipt').trigger(transaction.data)
            }

            // let user_data = {
            //     full_name: 'billy bob',
            //     email: 'leeanderson60@gmail.com',
            //     billing_address: {
            //         address_level1: "Audenshaw",
            //         address_level2: "Manchester",
            //         address_line1: "16 Duchess Drive",
            //         postal_code: "M34 5FT"
            //     }
            // }
            //
            // let user = await new User(user_data).findOrSave()
            //
            res.json(transaction.data)
        } else {
            res.redirect('/login/admin')
        }

    })

    routes.get('/testsms', async (req,res) => {

        if (getGuard(req) == 'admin'){
            let admin = await new Admin().find(0)

            try {
                let sms = await new Notification(admin).setContent('','This is a test sms whoopwhoop').sms()
                res.send(sms)
            } catch (error) {
                log(error)
                res.send(error)
            }


        } else {
            res.redirect('/login/admin')
        }

    })

    routes.get('/testnotification', async (req,res) => {

        if (getGuard(req) == 'admin'){
            let admin = await new Admin().find(0)
            let user = await new User().find(0)
            let sms = await new Notification().setContent('Notification','This is a test notification').mailbox(user.data)
            res.send(sms)
        } else {
            res.redirect('/login/admin')
        }

    })


        routes.get('/add', async (req,res) => {

            let cart, error

            if (req.session.user && typeof req.session.user.cart_id != 'undefined'){
                cart = await new Cart().find(req.session.user.cart_id)
            } else {
                cart = new Cart({_user_id:req.session.user._id})
            }

            if (cart.data){

                await cart.addItem(1,'Products')

                if (cart.error){
                    error = cart.error
                } else {
                    await cart.save()
                }

                req.session.user.cart_id = cart.data._key

                if (error){
                    res.json({status:500,message:error})
                } else {
                    res.json(cart.data)
                }

            } else {
                res.json({status:404,message:'Not Found'})
            }

        })

// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
