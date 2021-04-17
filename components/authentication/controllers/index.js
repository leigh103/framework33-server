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
                {link:'Login',slug: '/login', weight: 10, authenticated:false}
            ],
            footer: [
                {link:'Admin Login',slug: '/login/admin', weight: 10, authenticated:false},
                {link:'Logout',slug:'/logout', weight: 10, authenticated:true}
            ]
        }
    }


// methods

    functions = {


    }


// routes

    routes.use('/login/static', express.static(__dirname + '/static'))

    routes.get('/login/:guard/:password_reset?', async (req, res) => {

        let guards = config.users.guards,
            theme_path = config.site.theme_path

        if (req.params.guard == 'admin'){
            theme_path = config.site.dashboard_theme_path
        }

        if (guards.indexOf(req.params.guard) >= 0 && req.params.password_reset){ // if password reset key has been given

            let time_diff = moment().diff(moment.unix(req.params.password_reset/1000),'minutes'),
                timestamp_hash = DB.hash('password-reset'+req.body.password_reset)

            if (time_diff > config.users.password_reset_timeout){
                res.render(theme_path+'/templates/authentication/reset.ejs', {type:'reset',guard:req.params.guard,error:'For security reasons, password reset tokens are only valid for '+config.users.password_reset_timeout+' minutes. Please try again.'})
            } else {
                res.render(theme_path+'/templates/authentication/reset.ejs', {type:req.params.password_reset,guard:req.params.guard})
            }

        } else if (guards.indexOf(req.params.guard) >= 0 && req.params.password_reset == 'reset'){ // if password reset key is being requested

            res.render(theme_path+'/templates/authentication/reset.ejs', {type:req.params.guard,guard:req.params.guard})

        } else if (req.params.guard == 'activate' && req.params.password_reset){ // if a user is attempting activation

            let time_diff = moment().diff(moment.unix(req.params.password_reset/1000),'minutes'),
                timestamp_hash = DB.hash('password-reset'+req.params.password_reset)

            if (time_diff > config.users.password_reset_timeout){

                let user = await new global[parseClassName(req.params.guard)]().find(['password_reset == '+timestamp_hash]),
                    auth_data = user.deleteReset()

                res.render(theme_path+'/templates/authentication/activate.ejs', {error:'For security reasons, activation tokens are only valid for '+config.users.password_reset_timeout+' minutes. Please try again.'})

            } else {

                let user = await new global[parseClassName(req.params.guard)]().find(['password_reset == '+timestamp_hash])

                if (user.error){
                    res.render(config.site.theme_path+'/templates/authentication/activate.ejs', {error:'Invalid token'})
                } else {
                    auth_data = user.activate()
                    if (auth_data.error){
                        res.render(theme_path+'/templates/authentication/activate.ejs', {error:auth_data.error})
                    } else {
                        res.render(theme_path+'/templates/authentication/activate.ejs', {user:auth_data})
                    }
                }

            }

        } else { // redirect to login

            res.render(theme_path+'/templates/authentication/login.ejs', {guard:req.params.guard})

        }

    })

    routes.get('/login', (req, res) => {
        res.render(config.site.theme_path+'/templates/authentication/login.ejs', {guard:'customer'})
    })

    routes.get('/sign-up', (req, res) => {

        if (!config.users.allow_registration){
            res.render(config.site.theme_path+'/templates/authentication/login.ejs', {guard:'customer',error:'New account registrations are currently disabled'})
        } else {
            res.render(config.site.theme_path+'/templates/authentication/register.ejs', {guard:'customer'})
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

        if (req.body.password && req.body.password_conf && req.body.password != '' && req.body.password_conf != '' && req.body.password == req.body.password_conf){

            let user = await new Customers(req.body).findOrSave()

             new Log(user.data._id, 'registration', user.data._id, 'User created', req.headers['x-forwarded-for']).save()

            if (!user || user.error){

                res.render(config.site.theme_path+'/templates/authentication/register.ejs', {guard:req.body.guard,error:user.error})

            } else if (config.users.email_activation === true) {

                let success = 'Please click the link in your email to activate your account'
                res.render(config.site.theme_path+'/templates/authentication/register.ejs', {error:success,guard:'user'})

            } else {

                let auth_data = await user.authenticate(req.body)

                if (auth_data && auth_data.error){
                    res.render(config.site.theme_path+'/templates/authentication/login.ejs', {guard:req.body.guard,error:auth_data.error})
                } else if (auth_data && auth_data._id){

                    req.session.user = auth_data
                    if (req.cookies && req.cookies['connect.sid']){
                        req.session.user.ws_id = req.cookies['connect.sid']
                        user.data.ws_id = req.cookies['connect.sid']
                        user.save()
                    }
                    res.redirect(user.routes.redirects.logged_in)
                }

            }

        } else {
            let error = 'Password fields must match'
            res.render(config.site.theme_path+'/templates/authentication/register.ejs', {error:error,guard:'user'})
        }

    })

    routes.post('/login/:guard', async (req, res) => {

        let user = await new global[parseClassName(req.params.guard)]().find(req.body),
            auth_data = await user.authenticate(req.body)

        if (auth_data && auth_data.error){
            new Log(uauth_data._id, req.params.guard+'_auth_failed', auth_data._id, auth_data.error, req.headers['x-forwarded-for']).save()
            res.render(config.site.theme_path+'/templates/authentication/login.ejs', {guard:req.params.guard,error:auth_data.error})
        } else if (auth_data && auth_data._id){
            req.session.user = auth_data
            if (req.cookies && req.cookies['connect.sid']){
                req.session.user.ws_id = req.cookies['connect.sid']
                user.data.ws_id = req.cookies['connect.sid']
                user.save()
            }
            new Log(auth_data._id, req.params.guard+'_logged_in', auth_data._id, req.params.guard+' successfully authenticated', req.headers['x-forwarded-for']).save()
            res.redirect(user.routes.redirects.logged_in)
        } else {
            new Log(false, req.params.guard+'_auth_failed', user.data, auth_data.error, req.headers['x-forwarded-for']).save()
            res.render(config.site.theme_path+'/templates/authentication/reset.ejs', {type:'reset',guard:req.params.guard,error:'There has been an issue resetting your password, please try again'})
        }

    })

    routes.post('/login/:guard/send-reset', async (req, res) => {

        let user = await new global[parseClassName(req.params.guard)]().find(req.body),
            auth_data = user.sendReset()

        if (auth_data && auth_data.error){
            res.render(config.site.theme_path+'/templates/authentication/reset.ejs', {type:'reset',error:auth_data.error,guard:req.params.guard})
        } else if (auth_data){
            res.render(config.site.theme_path+'/templates/authentication/reset.ejs', {type:'reset_sent',guard:req.params.guard})
        }

    })

    routes.post('/login/:guard/reset-password', async (req, res) => {

        let time_diff = moment().diff(moment.unix(req.body.password_reset/1000),'minutes'),
            timestamp_hash = DB.hash('password-reset'+req.body.password_reset)

        if (time_diff > config.users.password_reset_timeout){

            let user = await new global[parseClassName(req.params.guard)]().find(['password_reset == '+timestamp_hash]),
                auth_data = user.deleteReset()

            res.render(config.site.theme_path+'/templates/authentication/reset.ejs', {type:'reset',guard:req.params.guard,error:'For security reasons, password reset tokens are only valid for '+config.users.password_reset_timeout+' minutes. Please try again.'})

        } else {

            let user = await new global[parseClassName(req.params.guard)]().find(['password_reset == '+timestamp_hash]),
                auth_data = await user.resetPassword(req.body)

            if (auth_data && auth_data.error){
                res.render(config.site.theme_path+'/templates/authentication/reset.ejs', {type:'',guard:req.params.guard,error:auth_data.error})
            } else if (auth_data && auth_data._id){
                req.session.user = auth_data
                res.redirect(user.routes.redirects.logged_in)
            } else {
                res.render(config.site.theme_path+'/templates/authentication/reset.ejs', {type:'reset',guard:req.params.guard,error:'There has been an issue resetting your password, please try again'})
            }

        }

    })


// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
