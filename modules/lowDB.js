

    const low = require('lowdb'),
          FileSync = require('lowdb/adapters/FileSync'),
          adapter = new FileSync('db.json'),
          lowDb = low(adapter),
          sha2_256 = require('simple-js-sha2-256')

    class db {

        constructor(){
            this.result = []
            this.collection = ''
            this.data_types = {}
        }

        async createCollection(collection) {

            let exists = lowDb.has(collection).value()

            if (exists){

            } else {
                let new_collection = await lowDb.set(collection, []).write()
            }

            return this.result

        }

        create(collection, data){

            let exists = this.createCollection(collection)

            let new_key = lowDb.get(collection).size().value()

            data._id = collection+'/'+new_key
            data._key = new_key
            data._created = moment().toISOString()

            lowDb.get(collection).push(data).write()

            this.result = []
            this.result.push(data)

            return this

        }

        read(collection){

            this.collection = collection
            this.result = lowDb.get(this.collection).value()
            return this

        }

        upsert(data){

            if (this.result && this.result.length > 0){
                this.result = this.result.map(async (item,i) =>{

                    await lowDb.get(this.collection)
                        .find({_key: item._key})
                        .assign(data)
                        .write()

                    item = Object.assign(item, data)

                    return item

                })
            } else {
                this.result = this.create(this.collection,data).first()
            }
            return this.result

        }

        async parseDataTypes(collection, data){

            if (collection && global[collection] && global[collection].settings && global[collection].settings.fields){

                let fields = {}

                if (this.data_types[collection]){
                    fields = this.data_types[collection]
                } else {

                    global[collection].settings.fields.map((field)=>{
                        fields[field.name] = field
                    })

                }

                for (let [key, value] of Object.entries(data)) {

                    if (fields[key]){

                        if (fields[key].type == 'string'){
                            data[key] = value.toString()
                        } else if (fields[key].type == 'integer'){
                            data[key] = parseInt(value)
                        } else if (fields[key].type == 'float'){
                            data[key] = parseFloat(value)
                        } else if (fields[key].type == 'boolean' && typeof value == 'string'){
                            data[key] = (value == 'true')
                        } else if (fields[key].type == 'price'){
                            data[key] = parseFloat(value).toFixed(2)
                        }

                    }

                }

                return data

            } else {
                return data
            }

        }

        update(data) {

            this.result = this.result.map(async (item,i) => {

                item._updated = moment().toISOString()

                await lowDb.get(this.collection)
                    .find({_key: item._key})
                    .assign(data)
                    .write()

                item = Object.assign(item, data)

                return item

            })

            return this

        }

        where(filters){

            this.result = this.result.filter((o) => {

                let match = false,
                    match_count = 0

                filters.map((filter) => {

                    let op = filter.match(/["|']*([a-zA-Z_\-0-9]*)["|']*\s*([!=<>][=]*|like|not like)\s*["|']*([^'"]*)["|']*/i)

                    if (op[3]){ // if middle item is operator

                        if (op[2] == '==' && o[op[1]] == op[3]){
                            match_count++
                        } else if (op[2] == '!=' && o[op[1]] != op[3]){
                            match_count++
                        } else if (op[2] == '>' && o[op[1]] > op[3]){
                            match_count++
                        } else if (op[2] == '>=' && o[op[1]] >= op[3]){
                            match_count++
                        } else if (op[2] == '<' && o[op[1]] < op[3]){
                            match_count++
                        } else if (op[2] == '<=' && o[op[1]] <= op[3]){
                            match_count++
                        } else if (op[2].match(/^like/i)){

                            let re = new RegExp(op[3],'i')

                            if (o[op[1]] && o[op[1]].match(re)){
                                match_count++
                            }

                        } else if (op[2].match(/^not\s*like/i)){

                            let re = new RegExp(op[3],'i')

                            if (!o[op[1]] || !o[op[1]].match(re)){
                                match_count++
                            }

                        }

                    } else {

                        if (o[op[1]] == op[2]){
                            match_count++
                        }

                    }

                    if (filters.length === match_count) {
                        match = true
                    }

                })

                return match

            })

            return this

        }

        orWhere(filters) {

            this.result = this.result.filter((o) => {

                let match = false

                filters.map((filter) => {

                    let op = filter.match(/["|']*([a-zA-Z_\-0-9]*)["|']*\s*([!=<>][=]*|like|not like)\s*["|']*([^'"]*)["|']*/i)

                    if (op[3]){ // if middle item is operator

                        if (op[2] == '==' && o[op[1]] == op[3]){
                            match = true
                        } else if (op[2] == '!=' && o[op[1]] != op[3]){
                            match = true
                        } else if (op[2] == '>' && o[op[1]] > op[3]){
                            match = true
                        } else if (op[2] == '>=' && o[op[1]] >= op[3]){
                            match = true
                        } else if (op[2] == '<' && o[op[1]] < op[3]){
                            match = true
                        } else if (op[2] == '<=' && o[op[1]] <= op[3]){
                            match = true
                        } else if (op[2].match(/^like/i)){

                            let re = new RegExp(op[3],'i')

                            if (o[op[1]] && o[op[1]].match(re)){
                                match = true
                            }

                        } else if (op[2].match(/^not\s*like/i)){

                            let re = new RegExp(op[3],'i')

                            if (!o[op[1]] || !o[op[1]].match(re)){
                                match = true
                            }

                        }

                    } else {

                        if (o[op[1]] == op[2]){
                            match = true
                        }

                    }


                })

                return match

            })

            return this

        }

        limit(limit) {

            this.result = this.result.slice(0,limit)
            return this

        }

        orderBy(field, direction) {

            if (direction && direction.match(/desc/i)){
                this.result.sort((b, a) => {
                    if (a[field] && b[field]){
                        return a[field].localeCompare(b[field])
                    }
                })
            } else {
                this.result.sort((a, b) => {
                    if (a[field] && b[field]){
                        return a[field].localeCompare(b[field])
                    }
                })
            }

            return this

        }

        delete(){

            this.result = this.result.map((item,i) =>{

                lowDb.get(this.collection)
                    .remove({ _key: parseInt(item._key) })
                    .write()

                return item

            })

            return this.result

        }

        async count(collection){

            if (collection){

                let result = await lowDb.get(collection)
                    .size()
                    .value()

                return result

            } else if (this.result.length > 0){
                this.result.length
            } else {
                return 0
            }

        }

        get(fields){

            if (fields){

                let result = JSON.parse(JSON.stringify(this.result))
                result = result.map((item,i)=>{

                    fields.map((field)=>{

                        if (field && item[field]){
                            delete item[field]
                        }

                    })

                    return item

                })

                return result

            } else {

                return this.result

            }

        }

        first(fields){

            if (fields){

                let result = JSON.parse(JSON.stringify(this.result[0]))

                fields.map((field)=>{

                    if (result[field]){
                        delete result[field]
                    }

                })

                return result

            } else {

                return this.result[0]

            }

        }

        getOmit(fields){



        }

        hash(str){
            return sha2_256(str)
        }


    }

    module.exports = db
