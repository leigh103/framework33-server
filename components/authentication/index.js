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

        let user = new global[parseClassName(req.params.guard)]().find(req.body),
            auth_data = user.authenticate(req.body)

        if (auth_data && auth_data.error){
            res.render('authentication/views/login.ejs', {guard:req.params.guard,error:auth_data.error})
        } else if (auth_data && auth_data._id){
            req.session.user = auth_data
            res.redirect(user.routes.redirects.logged_in)
        } else {
            res.render('authentication/views/reset.ejs', {type:'reset',guard:req.params.guard,error:'There has been an issue resetting your password, please try again'})
        }

    })

    routes.post('/login/:guard/send-reset', async (req, res) => {

        let user = await new global[parseClassName(req.params.guard)]().find(req.body),
            auth_data = user.sendReset()

        if (auth_data && auth_data.error){
            res.render('authentication/views/reset.ejs', {type:'reset',error:auth_data.error,guard:req.params.guard})
        } else if (auth_data){
            res.render('authentication/views/reset.ejs', {type:'reset_sent',guard:req.params.guard})
        }

    })

    routes.post('/login/:guard/reset-password', async (req, res) => {

        let user = await new global[parseClassName(req.params.guard)]().find(req.body.password_reset),
            auth_data = await user.resetPassword(req.body)

        if (auth_data && auth_data.error){
            res.render('authentication/views/reset.ejs', {type:'',guard:req.params.guard,error:auth_data.error})
        } else if (auth_data && auth_data._id){
            req.session.user = auth_data
            res.redirect(user.routes.redirects.logged_in)
        } else {
            res.render('authentication/views/reset.ejs', {type:'reset',guard:req.params.guard,error:'There has been an issue resetting your password, please try again'})
        }

    })


// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
