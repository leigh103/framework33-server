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
                    self = false

                if (req.session && req.session.user && req.session.user){
                    user_id = req.session.user._id
                    guard = req.session.user.guard
                }

                if (model && model.data && model.data._id && model.data._id == user_id){
                    self = true
                }

                if (model.routes && model.routes.private && model.routes.private[http_method] && guard){ // if the http method is allowed and user is auth'd

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

        }

    }


// routes


    routes.get('/:collection/:id',(req,res)=>{

        let model_class_name = parseClassName(req.params.collection)

        if (global[model_class_name] && typeof global[model_class_name] == 'function'){

            let model = new global[model_class_name]()

            functions.accessGranted(model,req,'find').then(async (self)=>{

                let result = await model.find(req.params.id)
                if (self === true && model.data._id == req.session.user._id){
                    res.json(result.data)
                } else if (!self) {
                    res.json(result.data)
                } else {
                    res.status(401).send(settings.not_authorized)
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

    routes.get('/:collection',async (req,res)=>{

        let model_class_name = parseClassName(req.params.collection)

        if (global[model_class_name] && typeof global[model_class_name] == 'function'){

            let model = new global[model_class_name]()

            functions.accessGranted(model,req,'all').then((self)=>{

                res.json(model.all())

            }).catch((err)=>{

                if (err.status){
                    res.status(err.status).json(err)
                } else {
                    log(err)
                    res.status(500).send(err)
                }

            })

        } else {

            let result = db.read(req.params.collection).get()
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

            let model

            if (method == 'save'){
                model = await new global[model_class_name](req.body)
            } else if (req.body._key || req.body._key == 0){
                model = await new global[model_class_name]().find(req.body._key)
            }

            if (!model){
                res.status(405).json(settings.not_allowed)
                return
            } else if (model && !model[method]){
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
                    log('Error calling the "'+method+'" method on class: '+model_class_name)
                    res.status(500).send('Error calling the "'+method+'" method on class: '+model_class_name)
                }

            })

        } else {

            res.status(405).json(settings.not_allowed)

        }

    })

    routes.put('/:collection/:method?',(req,res)=>{

        let method = 'save'
        if (req.params.method){
            method = parseCamelCase(req.params.method)
        }

        let model_class_name = parseClassName(req.params.collection)

        if (global[model_class_name] && typeof global[model_class_name] == 'function'){

            let model = new global[model_class_name](req.body)

            if (!model){
                res.status(405).json(settings.not_allowed)
                return
            } else if (model && !model[method]){
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

                if (req.params.function && req.params.fid){
                    result = await model[method](req.params.fid)
                } else {
                    result = await model.delete()
                }

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

            let result = db.read(req.params.collection).where(['_key == '+req.params.id]).first()
            res.json(result)

        }

    })

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
