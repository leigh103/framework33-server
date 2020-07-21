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
    redisStore = require('connect-redis')(session),
    client  = redis.createClient(),
    sessionStore = new redisStore({ host: 'localhost', port: 6379, client: client,ttl: 86400})

// load scope and config

    global.basedir = __dirname
    global.config = require('./modules/config')

    dbModule = require('./modules/databases/'+config.modules.db.module)
    global.db = new dbModule()

    global.log = require('./modules/functions/log')
    global.moment = require('moment')
    global.websocket_clients = {}
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

            let cookies = cookie.parse(ws.upgradeReq.headers.cookie)
            let user = await new Admin().find({ws_id:cookies['connect.sid']})

            if (user.data && user.data._id){
                new WebsocketClient(user.data._id, ws).save()
                ws.send('connected to session')
            } else {
                new WebsocketClient(Date.now(), ws).save()
                ws.send('connected, no session')
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

        fs.readdir('components', (err, files) => {

            var views = ['themes','components']

            files.forEach((file, index) => {

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

                if (index >= files.length - 1){
                    app.set('views', views)
                }

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
    app.locals.view = global.view

    watch(['./components'], { recursive: true }, function(evt, name) {

        if (config.site.mode == 'production'){
            log('Components Reloaded')
            loadComponents()
        }

    });

    server.listen(config.http.port, function() {
        log('Listening on '+config.http.port);
    });


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

            db.createCollection(new global[model_class_name]().settings.collection)

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
