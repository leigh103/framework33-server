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

    routes.get('/login/:guard/:password_reset?', (req, res) => {

        let guards = config.users.guards
        if (guards.indexOf(req.params.guard) >= 0 && req.params.password_reset){ // if password reset key has been given

            res.render('authentication/views/reset.ejs', {type:req.params.password_reset,guard:req.params.guard})

        } else if (guards.indexOf(req.params.guard) >= 0 && req.params.password_reset == 'reset'){ // if password reset key is being requested

            res.render('authentication/views/reset.ejs', {type:req.params.guard,guard:req.params.guard})

        } else if (req.params.guard == 'activate' && req.params.password_reset){ // if a user is attempting activation

            let user = new User().find(req.params),
                auth_data = new Auth(user.data).activate()

            if (auth_data.error){
                res.render('authentication/views/activate.ejs', {err:auth_data.error})
            } else {
                res.render('authentication/views/activate.ejs', {user:auth_data})
            }

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

    routes.post('/login/register', async (req, res) => {

        let user = await new User(req.body).findOrSave()

        if (user.error){
            res.render('authentication/views/register.ejs', {error:user.error})
        } else if (config.users.email_activation === true) {
            let success = 'Please click the link in your email to activate your account'
            res.render('authentication/views/register.ejs', {error:success})
        } else {
            req.session.user = user.data
            res.redirect(user.routes.redirects.redirects.logged_in)
        }

    })

    routes.post('/login/:guard', (req, res) => {

        if (req.params.guard == 'admin'){

            let admin = new Admin().find(req.body),
                auth_data = new Auth(admin.data, req.body).authenticate()

            if (auth_data && auth_data.error){
                res.render('authentication/views/login.ejs', {guard:req.params.guard,error:auth_data.error})
            } else if (auth_data){
                req.session.user = auth_data
                res.redirect(admin.routes.redirects.logged_in)
            } else {
                res.render('authentication/views/login.ejs', {guard:req.params.guard,error:'Email address and/or password incorrect'})
            }

        } else if (req.params.guard == 'user'){

            let user = new User().find(req.body),
                auth_data = new Auth(user.data, req.body).authenticate()

            if (auth_data && auth_data.error){
                res.render('authentication/views/login.ejs', {guard:req.params.guard,error:auth_data.error})
            } else if (auth_data){
                req.session.user = auth_data
                res.redirect(user.routes.redirects.logged_in)
            }

        }

    })

    routes.post('/login/:guard/send-reset', async (req, res) => {

        if (req.params.guard == 'admin'){

            let user = await new Admin().find(req.body),
                auth_data = await new Auth(user.data, req.body).sendReset()

            if (auth_data && auth_data.error){
                res.render('authentication/views/reset.ejs', {type:'reset',error:auth_data.error,guard:req.params.guard})
            } else if (auth_data){
                res.render('authentication/views/reset.ejs', {type:'reset_sent',guard:req.params.guard})
            }

        } else if (req.params.guard == 'user'){

            let user = await new User().find(req.body),
                auth_data = await new Auth(user.data, req.body).sendReset()

            if (auth_data && auth_data.error){
                res.render('authentication/views/reset.ejs', {type:'reset',error:auth_data.error,guard:req.params.guard})
            } else if (auth_data){
                res.render('authentication/views/reset.ejs', {type:'reset_sent',guard:req.params.guard})
            }

        }

    })

    routes.post('/login/:guard/reset-password', async (req, res) => {

        if (req.params.guard == 'admin'){

            let user = await new Admin().find(req.body.hash),
                auth_data = await new Auth(user.data, req.body).resetPassword()

            if (auth_data && auth_data.error){
                res.render('authentication/views/reset.ejs', {type:'reset',guard:'admin',error:auth_data.error})
            } else if (auth_data){
                res.redirect('/login/admin')
            }

            // admins.resetPassword(req.body).then((data)=>{
            //     res.redirect('/login/admin')
            // }).catch((err)=>{
            //     res.render('authentication/views/reset.ejs', {type:'reset',guard:'admin',error:'Incorrect email address or invalid access code. Please try again.'})
            // })

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
