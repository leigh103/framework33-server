//
// ArangoDB Connector
// Connects to ArangoDB service
//


// vars

const arango = require('arangojs'),
      sha2_256 = require('simple-js-sha2-256')


// connection

const Database = arango.Database,
    db = new Database('http://127.0.0.1:8529')

    db.useDatabase(config.db.name);
    db.useBasicAuth(config.db.username, config.db.password);


// methods

const functions = {

        query:(query, callback)=>{

            return new Promise(function(resolve, reject) {

                db.query(query).then(
                    cursor => cursor.all()
                ).then(
                    (keys) => {
                            if (typeof callback == 'function'){
                                callback(keys)
                            }
                            resolve(keys)
                        },
                    (err) => {
                        if (typeof callback == 'function'){
                            callback(err)
                        }
                        reject(err)

                })
            });


        },

        createTable:(name)=>{

            return new Promise(async function(resolve, reject) {

                let collection = db.collection(name),
                    result = await collection.exists()

                if (!result){
                    collection.create().then(
                        () => resolve('created'),
                        err => reject(err)
                    );
                } else {
                    resolve('exists')
                }

            })

        },

        post:(table, data)=>{

            return new Promise(async function(resolve, reject) {

                functions.createTable(table).then(()=>{
                    collection = db.collection(table)
                    collection.document(data._key).then(
                        (() => {resolve('created')}),
                        ((err) => {
                            collection.save(data).then((new_doc)=>{
                                resolve('ok')
                            }).catch((err)=>{
                                reject(err)
                            })
                        })
                    )
                })

            })

        },



        hash:(str)=>{
            return sha2_256(str)
        }

    }

    module.exports = functions
    module.exports.db = db
