

    const arango = require('arangojs'),
          aql = arango.aql,
          sha2_256 = require('simple-js-sha2-256')


    // connection

    const Database = arango.Database,
      adb = new Database(config.modules.db.host)

      adb.useDatabase(config.modules.db.name);
      adb.useBasicAuth(config.modules.db.username, config.modules.db.password);



    class db {

        constructor(){
            this.result = []
            this.collection = ''
            this.data_types = {}
        }

        async createCollection(collection) {

            var col = adb.collection(collection)
            try {
                await col.create()
            }

            catch(e){

                if (e.response.body.code != 409){
                    console.error('AQL Query: Create Collection')
                    console.error('Arango Error:', e.response.body)
                }

                this.result = []
            }

            return this.result

        }

        async create(collection, data){

            let exists = this.createCollection(collection)

            data._created = moment().toISOString()

            let col = adb.collection(collection),
                saved

            try {
                saved = await col.save(data)
            }

            catch(e){
                log('Error saving to DB')
                log(e)
                return false
            }

            data._key = saved._key
            data._id = saved._id

            this.result = data
            return this.result

        }

        read(collection){

            this.query_key = collection.substring(0, 3)

            this.collection = collection
            this.query = 'FOR '+this.query_key+' IN '+collection+' '
            this.result = []
            return this

        }

        async upsert(data){

            if (data._id || data._key){
                await this.update(data)
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

            // if (data._id || data._key){
            //
            //     data._updated = moment().toISOString()
            //
            //     let col = adb.collection(this.collection)
            //     col.update(data, data)
            //
            //     this.result = []
            //     this.result.push(data)
            //
            // }

            if (typeof data != 'object'){
                return this
            }

            data._updated = moment().toISOString()

            this.query += 'UPDATE '+this.query_key+' WITH '+JSON.stringify(data)+' IN '+this.collection+' '

            return this

        }

        where(filters){

            if (typeof filters == 'object' && filters.length > 0){
                this.query += 'FILTER '
            }

            filters.map((filter) => {

                let op = filter.match(/["|']*([a-zA-Z_\-0-9\.]*)["|']*\s*([!=<>][=]*|like|not like|not exists|has value)\s*["|']*([^'"]*)["|']*/i)

                if (op[3]){

                    if (op[3].match(/^true|false$/i)){

                    } else {
                        op[3] = '"'+op[3]+'"'
                    }

                    if (op[2] == 'like'){
                        this.query += 'LOWER('+this.query_key+'.'+op[1]+') =~ '+op[3]
                    } else {
                        this.query += this.query_key+'.'+op[1]+' '+op[2]+' '+op[3]
                    }

                } else if (op[2].match(/^has value/i)){

                    this.query += 'LENGTH('+this.query_key+'.'+op[1]+') > 0'

                } else if (op[2].match(/^exists/i)){

                    this.query += 'HAS('+this.query_key+', "'+op[1]+'")'

                } else if (op[2].match(/^not exists/i)){

                    this.query += '!'+this.query_key+'.'+op[1]

                } else {

                    this.query += this.query_key+'.'+op[1]+' == "'+op[2]+'"'

                }

                this.query += ' && '

            })

            this.query = this.query.replace(/\&\&\s$/,'')

            return this

        }

        whereMultiple(keys) {

            this.query = 'RETURN DOCUMENT('+JSON.stringify(keys)+')'
            return this

        }

        orWhere(filters) {

            if (typeof filters == 'object' && filters.length > 0){
                this.query += 'FILTER '
            }

            filters.map((filter) => {

                let op = filter.match(/["|']*([a-zA-Z_\-0-9\.]*)["|']*\s*([!=<>][=]*|like|not like|not exists|has value)\s*["|']*([^'"]*)["|']*/i)

                if (op[3]){

                    if (op[3].match(/^true|false$/i)){

                    } else {
                        op[3] = '"'+op[3]+'"'
                    }

                    if (op[2] == 'like'){
                        this.query += 'LOWER('+this.query_key+'.'+op[1]+') =~ '+op[3]
                    } else {
                        this.query += this.query_key+'.'+op[1]+' '+op[2]+' '+op[3]
                    }

                } else if (op[2].match(/^has value/i)){

                    this.query += 'LENGTH('+this.query_key+'.'+op[1]+') > 0'

                } else if (op[2].match(/^exists/i)){

                    this.query += 'HAS('+this.query_key+', "'+op[1]+'")'

                } else if (op[2].match(/^not exists/i)){

                    this.query += '!'+this.query_key+'.'+op[1]

                } else {

                    this.query += this.query_key+'.'+op[1]+' == "'+op[2]+'"'

                }

                this.query += ' || '

            })

            this.query = this.query.replace(/\|\|\s$/,'')

            return this

        }

        limit(limit, end) {

            if (end){
                this.query += 'LIMIT '+limit+', '+end+' '
            } else {
                this.query += 'LIMIT '+limit+' '
            }

            return this

        }

        orderBy(field, direction) {

            this.query += 'SORT '+this.query_key+'.'+field+' '+direction+' '

            return this

        }

        async delete(){

            this.query += 'REMOVE '+this.query_key+' IN '+this.collection


            try {
                let result = await adb.query(this.query)
                this.result = result._result
            }

            catch(e){
                console.error('AQL Query:', this.query)
                console.error('Arango Error:', e.response.body)
                this.result = []
            }

            this.result = []
            return this.result

        }

        async count(collection){


            this.query = 'RETURN LENGTH('+collection+')'

            try {
                let result = await adb.query(this.query)
                this.result = result._result
            }

            catch(e){
                console.error('AQL Query:', this.query)
                console.error('Arango Error:', e.response.body)
                this.result = []
            }

            return this.result[0]

        }

        show(fields){

            // this.result = this.result.map((item,i) => {
            //
            //     let new_item = {}
            //
            //     fields.map((field)=>{
            //
            //         if (field && item[field]){
            //             new_item[field] = item[field]
            //         }
            //
            //     })
            //
            //     return new_item
            //
            // })

            return this

        }

        omit(fields){

            // this.result = this.result.map((item,i) => {
            //
            //     fields.map((field)=>{
            //
            //         if (field && item[field]){
            //             delete item[field]
            //         }
            //
            //     })
            //
            //     return item
            //
            // })

            return this

        }

        async get(){

            if (this.result && this.result.length > 0){

                return this.result

            } else {

                if (!this.query.match(/^RETURN/)){
                    this.query += 'RETURN '+this.query_key
                }

                this.query = this.query.replace(/FILTER RETURN/,'RETURN')

                // console.log(this.query)
                try {
                    let result = await adb.query(this.query)
                    this.result = result._result
                }

                catch(e){
                    console.error('AQL Query:', this.query)
                    console.error('Arango Error:', e.response.body)
                    this.result = []
                }


                return this.result

            }

        }

        async new(){

            if (this.result && this.result.length > 0){

                return this.result[0]

            } else if (typeof this.query == 'string') {

                if (!this.query.match(/^RETURN/)){
                    this.query += 'RETURN NEW'
                }

                this.query = this.query.replace(/FILTER RETURN/,'RETURN')
//    console.log(this.query)
                try {

                    let result = await adb.query(this.query)
                    if (result._result && result._result.length > 0){
                        this.result = result._result[0]
                    } else {
                        this.result = {}
                    }

                }

                catch(e){
                    console.error('AQL Query:', this.query)
                    console.error('Arango Error:', e.response.body)
                    this.result = {}
                }

                this.query = ''
                return this.result

            } else {

                this.result = {}
                return this.result

            }

        }

        async first(){

            if (this.result && this.result.length > 0){

                return this.result[0]

            } else if (typeof this.query == 'string') {

                if (!this.query.match(/^RETURN/)){
                    this.query += 'RETURN '+this.query_key
                }

                this.query = this.query.replace(/FILTER RETURN/,'RETURN')
//    console.log(this.query)
                try {

                    let result = await adb.query(this.query)
                    if (result._result && result._result.length > 0){
                        this.result = result._result[0]
                    } else {
                        this.result = {}
                    }

                }

                catch(e){
                    console.error('AQL Query:', this.query)
                    console.error('Arango Error:', e.response.body)
                    this.result = {}
                }

                this.query = ''
                return this.result

            } else {

                this.result = {}
                return this.result

            }

        }

        async last(){

            this.query += 'RETURN '+this.query_key+'[-1]'

            try {
                let cursor = await adb.query(aql`${this.query}`)
                this.result = await cursor.next()
            }

            catch(e){
                this.result = []
            }

            return this.result

        }

        async collect(field){

            if (!this.query.match(/^RETURN/)){
                this.query += 'COLLECT field = '+this.query_key+'.'+field+' INTO group RETURN {field, count:COUNT(group)}'
            }

            // console.log(this.query)
            try {
                let result = await adb.query(this.query)
                this.result = result._result
            }

            catch(e){
                console.error('AQL Query:', this.query)
                console.error('Arango Error:', e.response.body)
                this.result = []
            }

            return  await this.result

        }

        hash(str){
            let hash = sha2_256(str)
            return "$$$"+hash+"$$$"
        }

        timestamp(){
            return Date.now()
        }


    }

    module.exports = db
