//
// Dashboard Module
// Includes functions and tools for all users
//


// vars

var express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'api',
        not_found: {status:404, message:'Not found'},
        not_allowed: {status:405,message:'Method not allowed'},
        not_authorized: {status:401,message:'Not authorized'}
    },


// methods


    functions = {

        accessGranted: (model, req, method) =>{

            return new Promise(function(resolve, reject) {

                let guard = false,
                    http_method = req.method.toLowerCase(),
                    self = false,
                    user_id = false

                if (req.session && req.session.user && req.session.user){
                    user_id = user_id
                    guard = req.session.user.guard
                } else if (req.cookies['connect.sid']){
                    user_id = req.cookies['connect.sid']
                    guard = 'guest'
                }

                if (model && model.data && model.data._id && model.data._id == user_id ||
                    model && model.data && model.data._user_id && model.data._user_id == user_id ||
                    model && model.data && model.data._user_id && model.data._user_id == guard){
                    self = true
                }

                if (model.routes && model.routes.private && model.routes.private[http_method] && model.routes.private[http_method][method] && guard){ // if the http method is allowed and user is auth'd

                    if (model.routes.private[http_method][method] && guard && model.routes.private[http_method][method].indexOf(guard) !== -1){ // if it's a private method and the guard is allowed
                        resolve()
                    } else if (model.routes.private[http_method][method] && guard && self && model.routes.private[http_method][method].indexOf('self') !== -1){ // if the user is allowed to use the function on their own data
                        resolve()
                    } else if (guard){
                        reject(settings.not_authorized)
                    } else {
                        reject(settings.not_allowed)
                    }

                } else if (model.routes && model.routes.public && model.routes.public[http_method]){ // if the http method is allowed

                    if (model.routes.public[http_method][method]){ // if it's a public route, regardless of guard
                        resolve()
                    } else {
                        reject(settings.not_allowed)
                    }

                } else {
                    reject(settings.not_allowed)
                }

            })

        },

        sanitizeOutput: (result) => {

            result_copy = JSON.parse(JSON.stringify(result))

            return new Promise((resolve, reject) => {

                if (result_copy.error){

                    delete result_copy.data
                    resolve(result_copy)

                } else if (result_copy.data){

                    result_copy.data = result_copy.data.map((item)=>{
                        delete item.password
                        delete item.password_reset
                        delete item.ws_id
                        return item
                    })

                    resolve(result_copy)

                } else if (typeof result_copy == 'object' && typeof result_copy.map == 'function'){

                    result_copy = result_copy.map((item)=>{
                        delete item.password
                        delete item.password_reset
                        delete item.ws_id
                        return item
                    })
                    resolve(result_copy)

                } else {

                    delete result_copy.password
                    delete result_copy.password_reset
                    delete result_copy.ws_id
                    resolve(result_copy)

                }

            })

        }

    }


// routes

    let user_id

    routes.get('*', async (req, res, next) => {

        if (req && req.session && req.session.user && req.session.user._id){
            user_id = req.session.user._id
        } else {
            user_id = 'guest'
        }

        next()

    })

    routes.post('*', async (req, res, next) => {

        if (req && req.session && req.session.user && req.session.user._id){
            user_id = req.session.user._id
        } else {
            user_id = 'guest'
        }

        next()

    })

    routes.put('*', async (req, res, next) => {

        if (req && req.session && req.session.user && req.session.user._id){
            user_id = req.session.user._id
        } else {
            user_id = 'guest'
        }

        next()

    })

    routes.delete('*', async (req, res, next) => {

        if (req && req.session && req.session.user && req.session.user._id){
            user_id = req.session.user._id
        } else {
            user_id = 'guest'
        }

        next()

    })


    routes.get('/:collection/:id?/:function?/:fid?', async (req,res)=>{

        let model_class_name = parseClassName(req.params.collection),
            method = 'find'

        if (req.params.function){
            method = parseCamelCase(req.params.function)
        }

        if (req.params.id == 'search'){
            method = 'search'
        }

        let query,
            sort = {
                dir: 'desc',
                field: '_updated'
            },
            start = 0,
            end = 999,
            not_field = false

        if (Object.keys(req.query).length > 0){
            query = []
            for (let [key, value] of Object.entries(req.query)) {

                not_field = false

                if (key == 'sort'){
                    sort.field = value
                    not_field = true
                }
                if (key == 'asc'){
                    sort.dir = 'asc'
                    not_field = true
                }
                if (key == 'desc'){
                    sort.dir = 'desc'
                    not_field = true
                }
                if (key == 'limit'){
                    end = value
                    not_field = true
                }
                if (key == 'start'){
                    start = value
                    not_field = true
                }
                if (key == 'end'){
                    end = value
                    not_field = true
                }
                if (!not_field){

                    if (value == 'has_value'){
                        query.push(key+' has value')
                    } else {
                        query.push(key+' == '+value)
                    }

                }

            }

        }

        if (global[model_class_name] && typeof global[model_class_name] == 'function'){

            let model

            if (method == 'search'){
                model = await new global[model_class_name]().search(req.query.str, sort)
            } else if (req.params.id){
                model = await new global[model_class_name]().find(req.params.id)
            } else {

                method = 'all'
                model = await new global[model_class_name]()

                if (model.all){ // if the class exists and the all function exists
                    await model.all(query, sort, start, end)

                } else { // else fail
                    res.json(settings.not_found)
                    return false
                }

            }

            functions.accessGranted(model,req,method).then(async ()=>{

                let result

                if (req.params.function){
                    if (req.params.fid){
                        result = await model[method](req.params.fid)
                    } else {
                        result = await model[method]()
                    }
                } else {
                    result = await Promise.resolve(model.data)
                }

                result = await functions.sanitizeOutput(result)

                if (result.error){
                    res.status(500).send(result.error)
                } else if (result.data){
                    res.json(result.data)
                } else {
                    res.json(result)
                }

            }).catch((err)=>{

                if (err.status){
                    res.status(err.status).json(err)
                } else {
                    log(err)
                    res.status(500).send(err)
                }

            })

        } else {

            let result = DB.read(req.params.collection).where(['_key == '+req.params.id]).first()
            res.json(result)

        }

    })

    routes.post('/:collection/:method?', async (req,res) => {

        let method = 'save'
        if (req.params.method){
            method = parseCamelCase(req.params.method)
        }

        let model_class_name = parseClassName(req.params.collection)

        if (global[model_class_name] && typeof global[model_class_name] == 'function'){

            let model, log_method = 'create'

            if (req.body && req.body._key){
                log_method = 'update'
            }

            if (method == 'save'){
                model = await new global[model_class_name](req.body)
            } else if (req.body._key || req.body._key == 0){
                model = await new global[model_class_name]().find(req.body._key)
            } else {
                model = await new global[model_class_name]()
            }

            if (!model){
                res.status(405).json(settings.not_allowed)
                new Log(user_id, log_method+' not_allowed', req.body, 'Method not allowed on '+model_class_name, req.headers['x-forwarded-for']).save()
                return
            } else if (model && !model[method]){
                new Log(user_id, log_method+' not_allowed', req.body, 'Method not allowed on '+model_class_name, req.headers['x-forwarded-for']).save()
                res.status(405).json(settings.not_allowed)
                return
            }

            functions.accessGranted(model, req, method).then(async ()=>{

                let result

                if (method == 'save'){
                    result = await model.save()
                } else {
                    result = await model[method](req.body)
                }

                if (result.error){
                    res.status(500).send(result.error)
                } else if (result.data) {
                    new Log(user_id, log_method, result.data._id, 'Document '+log_method+'d', req.headers['x-forwarded-for'], result.data).save()
                    res.json(result.data)
                } else if (result){
                    res.json(result)
                } else {
                    new Log(user_id, log_method+' not_allowed', req.body, 'Method not allowed on '+model_class_name, req.headers['x-forwarded-for']).save()
                    res.status(405).json(settings.not_allowed)
                }

            }).catch((err)=>{

                if (err.status){
                    new Log(user_id, log_method+' '+err.status, req.body, err.status+' on '+model_class_name, req.headers['x-forwarded-for']).save()
                    res.status(err.status).json(err)
                } else {
                    log(err)
                    res.status(500).send('Error calling the "'+method+'" method on class: '+model_class_name)
                }

            })

        } else {
            new Log(user_id, log_method+' not_allowed', req.body, 'Method not allowed on '+model_class_name, req.headers['x-forwarded-for']).save()
            res.status(405).json(settings.not_allowed)

        }

    })

    routes.put('/:collection/:key/:method?',(req,res)=>{

        let method = 'save'
        if (req.params.method){
            method = parseCamelCase(req.params.method)
        }

        let model_class_name = parseClassName(req.params.collection)

        if (global[model_class_name] && typeof global[model_class_name] == 'function'){

            let model = new global[model_class_name](req.body)

            if (!model){
                new Log(user_id, 'create not_allowed', req.body, 'Method not allowed on '+model_class_name, req.headers['x-forwarded-for']).save()
                res.status(405).json(settings.not_allowed)
                return
            } else if (model && !model[method]){
                new Log(user_id, 'create not_allowed', req.body, 'Method not allowed on '+model_class_name, req.headers['x-forwarded-for']).save()
                res.status(405).json(settings.not_allowed)
                return
            }

            functions.accessGranted(model, req, method).then(async ()=>{

                let result

                if (method == 'save'){
                    result = await model.find(['_key == '+req.params.key])
                    result = await result.save(req.body)
                } else {
                    result = await model.find(['_key == '+req.params.key])
                    result = await result[method](req.body)
                }

                if (result.error){
                    res.status(500).send(result.error)
                } else if (result.data) {
                    new Log(user_id, 'create', result.data._id, 'Document created', req.headers['x-forwarded-for'], result.data).save()
                    res.json(result.data)
                } else if (result){
                    res.json(result)
                } else {
                    res.status(405).json(settings.not_allowed)
                }

            }).catch((err)=>{

                if (err.status){
                    res.status(err.status).json(err)
                } else {
                    log(err)
                    res.status(500).send(err)
                }

            })

        } else {

            res.status(405).json(settings.not_allowed)

        }

    })

    routes.delete('/:collection/:id/:function?/:fid?', async (req,res)=>{

        let model_class_name = parseClassName(req.params.collection),
            method = 'delete'

        if (req.params.function){
            method = parseCamelCase(req.params.function)
        }

        if (global[model_class_name] && typeof global[model_class_name] == 'function'){

            let model = await new global[model_class_name]().find(req.params.id)

            functions.accessGranted(model,req,method).then(async ()=>{

                let result

                if (req.params.function){
                    if (req.params.fid){
                        result = await model[method](req.params.fid)
                    } else {
                        result = await model[method]()
                    }
                } else {
                    result = await model.delete()
                }

                if (result.error){
                    res.status(500).send(result.error)
                } else if (result.data){
                    new Log(user_id, 'delete', result.data._id, 'Document deleted', req.headers['x-forwarded-for'], result.data).save()
                    res.json(result.data)
                } else {
                    new Log(user_id, 'delete', model.data._id, 'Document deleted', req.headers['x-forwarded-for'], model.data).save()
                    res.json(result)
                }

            }).catch((err)=>{

                if (err.status){
                    res.status(err.status).json(err)
                } else {
                    log(err)
                    res.status(500).send(err)
                }

            })

        } else {

            let result = db.read(req.params.collection).where(['_key == '+req.params.id]).first()
            res.json(result)

        }

    })

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
