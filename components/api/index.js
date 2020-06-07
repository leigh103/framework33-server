//
// Dashboard Module
// Includes functions and tools for all users
//


// vars

var express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'api',
        not_found: {error:'404 - not found'}
    },


// methods

    functions = {

        get:(collection, key)=>{

            if (key){

                return new Promise(function(resolve, reject){
                    db.get(collection, {_key:key}).then((data)=>{
                        resolve(data)
                    }).catch((err)=>{
                        resolve(err)
                    })
                })

            } else {

                return new Promise(function(resolve, reject){
                    db.get(collection).then((data)=>{
                        resolve(data)
                    }).catch((err)=>{
                        resolve(err)
                    })
                })

            }


        },

        post:(collection, data)=>{

            return new Promise(function(resolve, reject){
                db.post(collection, data).then((data)=>{
                    resolve(data)
                }).catch((err)=>{
                    resolve(err)
                })
            })

        },

        put:(collection, data)=>{

            return new Promise(function(resolve, reject){
                db.put(collection, data).then((data)=>{
                    resolve(data)
                }).catch((err)=>{
                    resolve(err)
                })
            })

        },

        delete:(collection, data)=>{

            return new Promise(function(resolve, reject){

                db.delete(collection, data).then((data)=>{
                    resolve(data)
                }).catch((err)=>{
                    resolve(err)
                })

            })

        }

    }

    routes.get('/:collection/:id',(req,res)=>{

        if (req.params.id == 'search' && typeof global[req.params.collection].search == 'function'){

            global[req.params.collection].search(req.query)
                .then((data) => {
                    res.json(data)
                }).catch(() => {
                    res.json([])
                })

        } else if (global[req.params.collection] && typeof global[req.params.collection].find == 'function'){

            global[req.params.collection].find(req.params.id)
                .then((data) => {
                    res.json(data)
                }).catch(() => {
                    res.json([])
                })

        } else if (!global[req.params.collection] || typeof global[req.params.collection].find == 'undefined'){

            functions.get(req.params.collection, req.params.id)
                .then((data) => {
                    res.json(data)
                }).catch(() => {
                    res.json([])
                })

        } else {

            res.json([])

        }

//         if (req.params.function){
//             req.params.function = req.params.function.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); })
//         } else {
//             req.params.function = req.params.id.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); })
//         }
//
//         if (req.params.function && global[req.params.collection] && typeof global[req.params.collection][req.params.function] == 'function'){
// console.log(1)
//             let data
//
//             if (Object.keys(req.query).length>0){
//                 data = req.query
//             } else {
//                 data = req.params.id
//             }
//
//             global[req.params.collection][req.params.function](data, req)
//                 .then((data) => {
//                     res.json(data)
//                 }).catch(() => {
//                     res.json([])
//                 })
//
//         } else if (req.query && global[req.params.collection] && typeof global[req.params.collection][req.params.id] == 'function'){
//
//             global[req.params.collection][req.params.id](req.query, req)
//                 .then((data) => {
//                     res.json(data)
//                 }).catch(() => {
//                     res.json([])
//                 })
//
//         } else if (global[req.params.collection] && typeof global[req.params.collection].find == 'function'){
//
//             global[req.params.collection].find(req.params.id)
//                 .then((data) => {
//                     res.json(data)
//                 }).catch(() => {
//                     res.json([])
//                 })
//
//         } else if (!global[req.params.collection]){
//
//             functions.get(req.params.collection, req.params.id)
//                 .then((data) => {
//                     res.json(data)
//                 }).catch(() => {
//                     res.json([])
//                 })
//
//         } else {
//
//             res.json([])
//
//         }

    })

    routes.get('/:collection',async (req,res)=>{

        if (global[req.params.collection] && typeof global[req.params.collection].all == 'function'){

            global[req.params.collection].all()
                .then((data) => {
                    res.json(data)
                }).catch(() => {
                    res.json([])
                })

        } else if (!global[req.params.collection] || typeof global[req.params.collection].all == 'undefined'){

            functions.get(req.params.collection)
                .then((data) => {
                    res.json(data)
                }).catch(() => {
                    res.json([])
                })

        } else {

            res.json([])

        }

    })

    routes.post('/:collection/:function',async (req,res) => {

        if (req.params.function){
            req.params.function = req.params.function.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); })
        }

        if (global[req.params.collection] && typeof global[req.params.collection][req.params.function] == 'function'){

            global[req.params.collection][req.params.function](req.body, req)
                .then((data) => {
                    res.json(data)
                }).catch((err) => {
                    if (err && err.code){ // possibly arango erro
                        log(err.code)
                        res.status(err.code).send(err.code)
                    } else if (typeof err == 'string') {
                        res.status(400).send(err)
                    } else {
                        res.status(500).send("Unable to complete the action")
                    }
                })

        } else {

            res.json([])

        }


    })

    routes.post('/:collection', async (req,res) => {

        if (global[req.params.collection] && typeof global[req.params.collection].save == 'function'){

            global[req.params.collection].save(req.body, req)
                .then((data) => {
                    res.json(data)
                }).catch((err) => {
                    if (err && err.code){ // possibly arango erro
                        log(err.code)
                        res.status(err.code).send(err.code)
                    } else if (typeof err == 'string') {
                        res.status(400).send(err)
                    } else {
                        res.status(500).send("Unable to complete the action")
                    }
                })

        } else if (!global[req.params.collection]){

            functions.post(req.params.collection, req.body)
                .then((data) => {
                    res.json(data)
                }).catch((err) => {
                    if (err && err.code){ // possibly arango erro
                        log(err.code)
                        res.status(err.code).send(err.code)
                    } else if (typeof err == 'string') {
                        res.status(400).send(err)
                    } else {
                        res.status(500).send("Unable to complete the action")
                    }
                })

        } else {

            res.json([])

        }


    })

    routes.put('/:collection/:id',(req,res)=>{

        if (global[req.params.collection] && typeof global[req.params.collection].save == 'function'){

            global[req.params.collection].save(req.body, req)
                .then((data) => {
                    res.json(data)
                }).catch((err) => {
                    if (err && err.code){ // possibly arango erro
                        log(err.code)
                        res.status(err.code).send(err.code)
                    } else if (typeof err == 'string') {
                        res.status(400).send(err)
                    } else {
                        res.status(500).send("Unable to complete the action")
                    }
                })

        } else if (!global[req.params.collection]){

            functions.put(req.params.collection, req.params.id, req.body)
                .then((data) => {
                    res.json(data)
                }).catch(() => {
                    res.json([])
                })

        } else {

            res.json([])

        }

    })

    routes.delete('/:collection/:id/:function?',(req,res)=>{

        if (req.params.function){
            req.params.function = req.params.function.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); })
        }

        if (req.params.function && global[req.params.collection] && typeof global[req.params.collection][req.params.function] == 'function'){

            global[req.params.collection][req.params.function](req.params.id, req)
                .then((data) => {
                    res.json(data)
                }).catch((err) => {
                    if (err && err.code){ // possibly arango erro
                        log(err.code)
                        res.status(err.code).send(err.code)
                    } else if (typeof err == 'string') {
                        res.status(400).send(err)
                    } else {
                        res.status(500).send("Unable to complete the action")
                    }
                })

        } else if (global[req.params.collection] && typeof global[req.params.collection].delete == 'function'){

            global[req.params.collection].delete(req.params.id, req)
                .then((data) => {
                    res.json(data)
                }).catch((err) => {
                    if (err && err.code){ // possibly arango erro
                        log(err.code)
                        res.status(err.code).send(err.code)
                    } else if (typeof err == 'string') {
                        res.status(400).send(err)
                    } else {
                        res.status(500).send("Unable to complete the action")
                    }
                })

        } else if (!global[req.params.collection] || global[req.params.collection] && typeof global[req.params.collection].delete == 'undefined'){

            functions.delete(req.params.collection, req.params.id)
                .then((data) => {
                    res.json(data)
                }).catch((err) => {
                    if (err && err.code){ // possibly arango erro
                        log(err.code)
                        res.status(err.code).send(err.code)
                    } else if (typeof err == 'string') {
                        res.status(400).send(err)
                    } else {
                        res.status(500).send("Unable to complete the action")
                    }
                })

        } else {

            res.json(settings.not_found)

        }

    })

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
