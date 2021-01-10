#!/usr/bin/env node

const express = require('express'),
    engine = require('ejs-mate')
    path = require('path'),
    session = require('express-session'),
    cookie = require('cookie'),
    cookieParser = require('cookie-parser'),
    http = require('http'),
    https = require('https'),
    WebSocket = require('ws'),
    fs = require('fs'),
    async = require('async'),
    bodyParser = require("body-parser"),
    querystring = require('querystring'),
    busboy = require('connect-busboy'),
    watch = require('node-watch'),
    cors = require('cors'),
    uuid = require('uuid'),
    redis = require("redis"),
    glob = require( 'glob' ),
    prompt = require( 'async-prompt' ),
    stylus = require('stylus'),
    redisStore = require('connect-redis')(session),
    client  = redis.createClient(),
    sessionStore = new redisStore({ host: 'localhost', port: 6379, client: client,ttl: 86400})

    const boot = ()=>{

        global.basedir = __dirname
        global.config = require('./modules/config')

        dbModule = require('./modules/databases/'+config.modules.db.module)
        global.DB = new dbModule()

        global.log = require('./modules/functions/log')
        global.moment = require('moment')
        global.websocket = {}
        global.websocket.clients = {}
        global.websocket.data = {}
        global.component = {}


    // setup express


        const sessionParser = session({
            secret: 'oiernf83049o3in4fihq3rfjkqrfiopj2[r4fioj34]',
            resave: true,
            store: sessionStore,
            saveUninitialized: true,
            cookie:{secure:false}
        })

        const app = express();

        app.use(bodyParser.json({limit: '50mb'}))
        app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}))
        app.use(cookieParser());
        app.use(busboy());
        app.engine('ejs', engine)
        app.set('view engine', 'ejs')
        app.set('trust proxy', 1)
        app.use(cors());
        app.use(sessionParser);

        if (global.config.site.self_serve === true){
            app.use(express.static('public'))
        }

    // start http and ws

        var server = http.createServer(app);

        // starts the websocket server. Messages can be sent to the clients from any component using view.emit()

        const wss = new WebSocket.Server({
            host: '0.0.0.0',
            port: config.websocket.port,
            verifyClient: function(info, done) {
    			done(info.req.headers);
    		}
        })

        wss.on('connection', async function connection(ws, req) {

            ws.upgradeReq = req;

            if (ws.upgradeReq.headers && typeof ws.upgradeReq.headers.cookie == 'string'){

                let cookies = cookie.parse(ws.upgradeReq.headers.cookie),
                    sid = cookies['connect.sid']

                if (global.websocket.clients && global.websocket.clients[sid]){

                    if (global.websocket.data && global.websocket.data[sid]){

                        ws.send(JSON.stringify(global.websocket.data[sid]))

                        if (!global.websocket.data[sid]._persist){
                            delete global.websocket.data[sid]
                        }

                    } else {
                        ws.send('already connected')
                    }

                } else {
                    new WebsocketClient(sid,ws).save()
                    ws.send('connected')
                }

            } else {
                ws.send('connected, no session')
            }

            ws.on('message', (msg) => {
                msg = JSON.parse(msg)

                if (msg.e && msg.e.match(/add|remove|update/) && components[msg.c] && typeof components[msg.c][msg.m] == 'function'){
                    components[msg.c][msg.m](msg.d).then((data)=>{
                        ws.send(JSON.stringify(data))
                    }).catch((err)=>{
                        ws.send(err)
                    })
                }
            })

        });


    // load components


        const loadComponents = ()=>{

            global.view.menus = {}

            if (!global.component){
                global.component = {}
            }

            // fs.readdir('components', (err, files) => {

                var views = ['themes','components']

                config.components.load.forEach((file, index) => {

                    let name = file.replace(/\.\w+$/,'')
                    controllers = file+'/controllers'

                    try {

                        let re = RegExp(file)

                        if (global.component[name]){
                            delete require.cache[require.resolve('./components/'+controllers)]
                            delete global.component[name]
                        }

                        global.component[name] = require('./components/'+controllers)
                        addComponent(name, controllers+'/index.js')

                        if (isSet(global.component[name],'settings','includes')){

                            global.component[name].settings.includes.forEach((include, index) => {

                                global.component[include.name] = require('./components/'+controllers+'/'+include.path)
                                addComponent(include.name, file+'/'+include.path)

                            })

                        }

                        addModels(file)

                    }
                    catch (e) { // gracefully error if component doesn't load

                        if (!global.component[name]){
                            global.component[name] = {}
                        }
                        global.component[name].loaded = false
                        global.component[name].error = e+""
                        global.component[name].settings = {}
                        global.component[name].settings.default_route = 'n/a'
                        log('Component '+file+' not loaded')
                        log(e+'')

                    }

                    if (index >= config.components.load.length - 1){
                        app.set('views', views)
                    }

                })

            // })

        }


    // functions


        const addComponent = (name, file) => {

            if (isSet(global.component[name],'settings','default_route')){

                if (global.component[name].settings.default_route == 'root'){
                    app.use('/', global.component[name].routes)
                } else {

                    app.use('/'+global.component[name].settings.default_route+'/?*?', function (req, res, next) {

                        if (isSet(global.component[name],'settings','protected_guards') && req.session.user && global.component[name].settings.protected_guards.indexOf(req.session.user.guard) >=0){
                            next()
                        } else if (isSet(global.component[name],'settings','protected_guards')){
                            res.redirect('/login')
                        } else {
                            next()
                        }

                    });
                    app.use('/'+global.component[name].settings.default_route, global.component[name].routes)

                }

            //    views.push('components/' + file + '/views')
            }

            if (isSet(global.component[name],'settings','menu')){
                addMenu(global.component[name].settings)
            }
            global.component[name].loaded = true
            global.component[name].error = ''
            // log('Component loaded: '+file)

        }

        const addModels = (component) => {

            log('Adding models for '+component)
            glob.sync( './components/'+component+'/models/*.js' ).forEach( function( file ) {

                let model = path.resolve( file ),
                    model_name = model.match(/\/([a-zA-Z_\-0-9]+)\.js/)[1],
                    model_class_name = model_name.charAt(0).toUpperCase() + model_name.slice(1)

                global[model_class_name] = require(model)

                DB.createCollection(new global[model_class_name]().settings.collection)

            })

        }

        global.addMenu = (obj) => {

            async.forEach(Object.keys(obj.menu),(item, callback )=>{

                if (!global.view.menus[item]){
                    global.view.menus[item] = []
                }

                async.forEach(obj.menu[item],(itemkey, itemcallback)=>{

                    let re = RegExp(obj.default_route)

                    if (obj.default_route && obj.default_route != 'root' && !itemkey.slug.match(/\/\//) && !itemkey.slug.match(re)){
                        itemkey.slug = '/'+obj.default_route+itemkey.slug
                        itemkey.slug = itemkey.slug.replace(/\/$/,'')
                    } else if (itemkey.slug.match(/\/\//)){
                        itemkey.slug = itemkey.slug.replace(/^\//,'')
                    }

                    if (!itemkey.weight){
                        itemkey.weight = 0
                    }

                    obj.menu[item].sort((a, b) => a.weight - b.weight)

                    global.view.menus[item].push(itemkey)

                    global.view.menus[item].sort((a, b) => a.weight - b.weight)

                    if (itemkey.subitems){

                        async.forEach(itemkey.subitems,(subkey, subcallback)=>{

                            let re = RegExp(obj.default_route)

                            if (obj.default_route && obj.default_route != 'root' && !subkey.slug.match(/\/\//) && !subkey.slug.match(re)){
                                subkey.slug = '/'+obj.default_route+subkey.slug
                                subkey.slug = subkey.slug.replace(/\/$/,'')
                            } else if (subkey.slug.match(/\/\//)){
                                subkey.slug = subkey.slug.replace(/^\//,'')
                            }

                            if (!subkey.weight){
                                subkey.weight = 0
                            }

                            itemkey.subitems.sort((a, b) => a.weight - b.weight)

                            subcallback()

                        }, (err, data)=>{


                                itemcallback()


                        })

                    } else {

                        itemcallback()

                    }

                }, (err, data)=>{

                    callback()

                })


            }, (err, data)=>{
            //    console.log(view.menus)
            })

        }

        global.renderTheme = () => {

            let styl = fs.readFileSync(__dirname + '/themes/'+config.site.theme+'/css/css.styl', 'utf8'),
                style_path = __dirname + '/public/style/style.css'

            stylus(styl)
                .set('paths', [__dirname + '/themes/'+config.site.theme+'/css'])
                .render(function(err, css){

                    if (err) return console.error(err)

                    let header_path = __dirname + '/themes/'+config.site.theme+'/partials/head.ejs',
                        header = fs.readFileSync(header_path, 'utf8')

                    if (typeof header == 'string'){
                        header = header.replace(/\/style\/style\.css\?v=(.*?)\"/,'/style/style.css?v='+Date.now()+'"')
                        fs.writeFile(header_path, header, function (err) {
                            if (err) return log(err)
                            log('Style cache updated')
                        })
                    }

                    fs.writeFile(style_path, css, function (err) {
                        if (err) return log(err)
                        log('Styl rendered')
                    })

            })

        }


        // boot components and servers


            // config.modules.load.forEach( (file) => {

            log('Loading modules...')
            for (let file of config.modules.load){

                let file_name = file

                if (file_name.match(/\//)){
                    file_name = file.split('/')
                    file_name = file_name[file_name.length-1]
                }

                global[file_name] = require('./modules/'+file)

            }

            //})
            log('Loading components...')
            loadComponents()
            global.renderTheme()
            app.locals.view = global.view

            app.use('*',(req, res) => {
                res.redirect(404, config.site.url+config.site.not_found_redirect)
                // res.status(404).send({
                //     error:404,
                //     message:'Page not found'
                // })
            })

            watch(['./components'], { recursive: true }, function(evt, name) {

                if (config.site.mode == 'production'){
                    log('Components Reloaded')
                    loadComponents()
                }

            })

            watch(['./themes/'+config.site.theme+'/css'], { recursive: true }, function(evt, name) {

                global.renderTheme()

            })

            server.listen(config.http.port, function() {
                log('Listening on '+config.http.port);
            });

    }

    const install = async () => {

        global.basedir = __dirname
        let config_setup = require(__dirname + '/modules/config.js.sample')

        console.log('')
        console.log('Welcome to Framework-33! Just need some information to get you started...')
        console.log('')
        prompt('')
        config_setup.admin.email = await prompt('Admin email address: ')
        config_setup.site.url = await prompt('Website URL (eg https://localhost): ')
        config_setup.site.name = await prompt('Website name: ')
        config_setup.http.port = await prompt('HTTP port (8033): ')
        config_setup.websocket.url = await prompt('Websocket URL (eg, wss://localhost/ws): ')
        config_setup.websocket.port = await prompt('Websocket Port (6430): ')
        config_setup.email.api_key = await prompt('Email API key: ')
        config_setup.email.from_address = await prompt('Send email notifications from: ')

        let config_file = 'var config = '+JSON.stringify(config_setup, null, "\t")+'\nmodule.exports = config'

        fs.writeFile(__dirname + '/modules/config.js', config_file, function (err) {
            if (err) return log(err)
            console.log('Config updated, starting initial boot...')
            boot()
        })

    }

// init check for config file, if not, create one

    if (fs.existsSync(__dirname+'/modules/config.js')) {
        boot()
    } else {
        install()
    }
