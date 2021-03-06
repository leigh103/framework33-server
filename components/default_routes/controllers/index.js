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
            let evnt_data = await DB.read('customers').where(['email like lee']).get()
            let email = await new Notification(evnt_data).useEmailTemplate('21184908').email()
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
            let transaction = await new Products().find('16302173')

            if (transaction.data){
                new Automations('low_stock').trigger(transaction.data)
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

    routes.get('/testsuccess', async (req,res) => {

        if (getGuard(req) == 'admin'){
            let data = {
                transaction: {
                    data:{
                        reference: '21-234-ASDC'
                    }
                }
            }
            res.render(config.site.theme_path+'/templates/transactions/success.ejs',data)
        } else {
            res.redirect('/login/admin')
        }

    })

    routes.get('/testsms', async (req,res) => {

        if (getGuard(req) == 'admin'){

            try {
            //    let sms = await new Notification(admin[0]).setContent('','This is a test sms whoopwhoop').sms()
                let result = await new Notification('07936642915').setContent('Notification','This is a test notification').sms()
                res.send(result)
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
            // let admin = await new Admin().find(0)
            // let user = await new Customer().find(0)
            let sms = await new Notification().setContent('Notification','This is a test notification').mailbox()
        //    let sms = await new Notification().setContent('This is a test','This is a test notification').notify()
            res.send(sms)
        } else {
            res.redirect('/login/admin')
        }

    })


// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
