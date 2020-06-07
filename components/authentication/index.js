//
// Admin Module
// Admin user functions
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'root',
        menu: {
            nav: [
                {link:'Login',slug: '/login', weight: 10, authenticated:false},
                {link:'Logout',slug:'/logout', weight: 10, authenticated:true}
            ],
            side_nav: [
                {link:'Login',slug: '/login', weight: 99, authenticated:false},
                {link:'Logout',slug:'/logout', weight: 99, authenticated:true}
            ],
            footer: [
                {link:'Admin Login',slug: '/login/admin', weight: 10, authenticated:false}
            ]
        }
    }


// methods

    functions = {


    }


// routes

    routes.use('/login/static', express.static(__dirname + '/static'))


    routes.get('/login/:guard/:type?', (req, res) => {

        let guards = ['admin','user']
        if (guards.indexOf(req.params.guard) >= 0 && req.params.type){ // if password reset key has been given

            res.render('authentication/views/reset.ejs', {type:req.params.type,guard:req.params.guard})

        } else if (guards.indexOf(req.params.guard) >= 0 && req.params.type == 'reset'){ // if password reset key is being requested

            res.render('authentication/views/reset.ejs', {type:req.params.guard,guard:'user'})

        } else if (req.params.guard == 'activate' && req.params.type){ // if a user is attempting activation

            users.activate(req.params.type).then((user_data)=>{
                res.render('authentication/views/activate.ejs', {user:user_data})
            }).catch((err)=>{
                res.render('authentication/views/activate.ejs', {err:err})
            })

        } else { // redirect to login

            res.render('authentication/views/login.ejs', {guard:req.params.guard})

        }

    })

    routes.get('/login', (req, res) => {
        res.render('authentication/views/login.ejs', {guard:'user'})
    })

    routes.get('/sign-up', (req, res) => {
        
        if (!config.users.allow_registration){
            res.render('authentication/views/login.ejs', {guard:'user',error:'New account registrations are currently disabled'})
        } else {
            res.render('authentication/views/register.ejs', {guard:'user'})
        }

    })

    routes.get('/logout', (req, res) => {

        req.session.guard = ''
        req.session.destroy((err)=>{
            if (err){
                console.log(err)
            } else {
                res.redirect('/')
            }
        })

    })

    routes.post('/login/register', (req, res) => {

        users.findOrSave(req.body).then((data)=>{
            req.session.user = data
            res.redirect(users.routes.login)
        }).catch((err)=>{
            res.render('authentication/views/register.ejs', {error:err})
        })

    })

    routes.post('/login/:guard', (req, res) => {

        if (req.params.guard == 'admin'){

            admins.authenticate(req.body).then((data)=>{
                req.session.user = data
                res.redirect(admins.routes.logged_in)
            }).catch((err)=>{
                res.render('authentication/views/login.ejs', {guard:req.params.guard,error:err})
            })

        } else if (req.params.guard == 'user'){

            users.authenticate(req.body).then((data)=>{
                req.session.user = data
                res.redirect(users.routes.logged_in)
            }).catch((err)=>{
                res.render('authentication/views/login.ejs', {guard:req.params.guard,error:err})
            })

        }

    })

    routes.post('/login/:guard/send_reset', (req, res) => {

        if (req.params.guard == 'admin'){

            admins.sendReset(req.body).then((data)=>{
                res.render('authentication/views/reset.ejs', {type:'reset_sent'})
            }).catch((err)=>{
                res.status(401).send(err)
            })

        } else if (req.params.guard == 'user'){

            users.sendReset(req.body).then((data)=>{
                res.render('authentication/views/reset.ejs', {type:'reset_sent'})
            }).catch((err)=>{
                res.status(401).send(err)
            })

        }

    })

    routes.post('/login/:guard/reset_password', (req, res) => {

        if (req.params.guard == 'admin'){

            admins.resetPassword(req.body).then((data)=>{
                res.redirect('/login/admin')
            }).catch((err)=>{
                res.render('authentication/views/reset.ejs', {type:'reset',guard:'admin',error:'Incorrect email address or invalid access code. Please try again.'})
            })

        } else if (req.params.guard == 'user'){

            users.resetPassword(req.body).then((data)=>{
                res.redirect('/login')
            }).catch((err)=>{
                res.render('authentication/views/reset.ejs', {type:'reset',guard:'user',error:'Incorrect email address or invalid access code. Please try again.'})
            })

        }

    })


// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
