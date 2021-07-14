const HtmlTableToJson = require('html-table-to-json'),
      axios = require('axios')

class Model {

    constructor(data){

        this.data = data
        this.error

    }

    async find(key) {

        if (key){

            let query = []

            if (typeof key == 'object'){

                if (key._key){
                    query.push('_key == '+key._key)
                } else if (key.email){
                    query.push('email == '+key.email)
                } else if (key.password_reset){
                    query.push('password_reset == '+key.password_reset)
                } else if (key.ws_id){
                    query.push('ws_id == '+key.ws_id)
                } else {
                    query = key
                }

            } else {

                if (typeof key == 'number' || typeof key == 'string' && key.match(/^[0-9]*$/)){
                    query.push('_key == '+key)
                } else if (typeof key == 'string' && key.match(/@/)){
                    query.push('email == '+key)
                } else if (key){
                    query.push('password_reset == '+key)
                } else {
                    query.push('_key == '+key)
                }

            }

            this.data = await DB.read(this.settings.collection)
                                .where(query)
                                .first()

            if (this.data.length > 0 || Object.keys(this.data).length > 0){
                this.error = false
                this.data.guard = this.settings.collection
                return this
            } else {
                this.error = 'Not found'
                return this
            }

        } else {
            this.error = 'No key provided'
            return this
        }

    }

    async findAll(keys){

            if (typeof keys == 'string' && keys.match(',')){

                keys = keys.split(',')

            } else if (!Array.isArray(keys)){
                let err = 'Models: unable to findAll: '+typeof keys+' passed as argument, list array required'
                log(err)
                this.error = err
                this.data = []
                return this
            }

            keys = keys.map((key)=>{
                return this.settings.collection+'/'+key
            })

            this.data = await DB.read(this.settings.collection)
                                .whereMultiple(keys)
                                .first()

            return this.data

    }

    async all(data, sort, start, end) {

        if (!start){
            start = 0
        }

        if (!end){
            end = 999
        }

        if (!sort || !sort.field){
            sort = {
                field: '_updated',
                dir: 'DESC'
            }
        }

        if (data && typeof data == 'object' && data.length > 0){
            this.data = await DB.read(this.settings.collection).where(data).orderBy(sort.field,sort.dir).limit(start, end).get() //.omit(['password','password_reset']).get()
        } else {
            this.data = await DB.read(this.settings.collection).orderBy(sort.field,sort.dir).limit(start, end).get() //.omit(['password','password_reset']).get()
        }

        return this

    }

    sort(field,dir){

        if (Array.isArray(this.data) && this.data.length > 0){

            if (!dir || dir == 'asc'){
                this.data.sort((a, b) => {
                    if (a[field] && b[field]){
                        -a[field].localeCompare(b[field])
                    }
                })
            } else {
                this.data.sort((a, b) => {

                    if (a[field] && b[field]){

                        a[field].localeCompare(b[field])
                    }
                })
            }
        }

        return this

    }

    async allFields(fields) {

        if (!fields){
            return this
        }

        this.data = await DB.read(this.settings.collection).show(fields).get() //.omit(['password','password_reset']).get()

        return this

    }

    async validate(){

        let fields = {},
            subfields = {},
            required_fields = []

        this.error = false

        this.settings.fields.map((field)=>{
            fields[field.name] = field

            if (field.required && field.required === true){
                required_fields.push(field.name)

                if (!this.data[field.name]){
                    this.error = view.functions.parseName(field.name)+' is a required field'
                    return this
                }
            }
        })

        for (let [key, value] of Object.entries(this.data)) {

            if (fields[key]){

                if (fields[key].type == 'object' && fields[key].subitems && fields[key].subitems.length > 0 || fields[key].type == 'array' && fields[key].subitems && fields[key].subitems.length > 0){

                    fields[key].subitems.map((subfield)=>{
                        subfields[subfield.name] = subfield
                    })

                    if (Array.isArray(this.data[key])){
                        for (let subidx of this.data[key]) {
                            for (let [subkey, subvalue] of Object.entries(subidx)) {

                                if (!subkey.match(/^_/) && subfields[subkey]){
                                    subidx[subkey] = await this.validateField(subfields[subkey], subkey, subvalue)
                                }

                            }
                        }
                    }


                } else {

                    this.data[key] = await this.validateField(fields[key], key, value)

                }

                if (fields[key].thumbnail === true){

                    if (Array.isArray(this.data[key]) && this.data[key][0] && this.data[key][0].value){
                        this.data.thumbnail = this.data[key][0].value
                    } else if (typeof this.data[key] == 'string' && this.data[key].match(/^\/image/i)) {
                        this.data.thumbnail = this.data[key]
                    }

                }

                if (fields[key].type == 'name'){

                    let name_parse = this.data[key].split(' ')
                    this.data.name_obj = {
                        first_name: name_parse[0],
                        last_name: name_parse[name_parse.length-1]
                    }

                }

            }

        }

        return this

    }

    async validateField(field, key, value){

        if (typeof field != 'object'){
            return value
        }

        if (field.required === true && !value){

            this.error = view.functions.parseName(key)+' is a required field'
            return false

        } else {

            if (field.type == 'string' && typeof value == 'string'){

                if (field.truncate){
                    value = value.substring(0,field.truncate)
                    return value
                } else {
                    return value
                }

            } else if (field.type == 'integer' || field.type == 'number'){

                if (isNaN(value)){
                    return value.replace(/\D/g, '')
                } else {
                    return value
                }


            } else if (field.type == 'date'){

                if (moment(value, "YYYY-MM-DDThh:mm:ssZ", true)){
                    return value
                } else if (moment(value, "DD/MM/YYYY", true)){
                    return moment(value, "DD/MM/YYYY").toISOString()
                } else if (moment(value, "DD-MM-YYYY", true)){
                    return moment(value, "DD-MM-YYYY").toISOString()
                } else {
                    this.error = 'Invalid date specified for '+view.functions.parseName(key)
                    return ''
                }

            } else if (field.type == 'future_date'){

                if (moment(value).isBefore(moment())){
                    this.error = 'Please select a future date for '+view.functions.parseName(key)
                    return ''
                }

                if (moment(value, "YYYY-MM-DDThh:mm:ssZ", true)){
                    return value
                } else if (moment(value, "DD/MM/YYYY", true)){
                    return moment(value, "DD/MM/YYYY").toISOString()
                } else if (moment(value, "DD-MM-YYYY", true)){
                    return moment(value, "DD-MM-YYYY").toISOString()
                } else {
                    this.error = 'Invalid date specified for '+view.functions.parseName(key)
                    return ''
                }

            } else if (field.type == 'float' && parseFloat(value)){

                return parseFloat(value.replace(/\D/g, ''))

            } else if (field.type == 'slug' && typeof value == 'string'){

                if (!value){
                    if (this.data.name){
                        value = this.data.name
                    } else if (this.data.title){
                        value = this.data.title
                    }
                }

                return value.replace(/\s/g,'-').replace(/['",./\\()\[\]*&^%$£@!]/g,'').toLowerCase()

            } else if (field.type == 'boolean'){

                return (value == 'true' || value === true)

            } else if (field.type == 'price'){

                if (typeof value == 'string'){
                    let gbp = toGBP(value)
                    gbp = parseFloat(gbp)*100
                    return gbp
                } else {
                    return value
                }

            } else if (field.type == 'discount'){

                if (typeof value == 'number'){
                    return value*100
                } else if (typeof value == 'string' && value.match(/^-?[0-9]{1,2}%$/)){
                    return value
                } else if (typeof value == 'string' && value.match(/^-?[0-9]+(.[0-9]{2})?$/)){
                    return parseFloat(value)*100
                } else if (typeof value == 'string' && value.length > 0){
                    this.error = 'Invalid adjustment value. Should be a positive or negative number, or a positive or negative percentage'
                    return ''
                } else {
                    return ''
                }

            } else if (field.type == 'user_id' && typeof value == 'string' && value.match(/^(.*)\/[0-9]+$/) || field.type == 'user_id' && typeof value == 'string' && config.users.guards.indexOf(value) >= 0){

                return value

            } else if (field.type == 'name'){

                if (!value.match(/\s/)){
                    this.error = 'Please specify first and surname'
                    return ''
                } else {
                    return value
                }

            } else if (field.type == 'password'){

                if (typeof value == 'string' && value.match(/^\$\$\$(.*?)\$\$\$$/)){
                    return value
                } else {
                    return DB.hash(value)
                }

            } else if (field.type.match(/tel|phone/)){

                if (value && !value.match(/^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/)){
                    this.error = 'Invalid phone number. Please enter a UK mobile number, starting 07..'
                    return ''
                } else {
                    return value.replace(/\s/g,'')
                }

            } else if (field.type == 'postcode'){

                if (value && !value.match(/^(([gG][iI][rR] {0,}0[aA]{2})|((([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y]?[0-9][0-9]?)|(([a-pr-uwyzA-PR-UWYZ][0-9][a-hjkstuwA-HJKSTUW])|([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y][0-9][abehmnprv-yABEHMNPRV-Y]))) {0,}[0-9][abd-hjlnp-uw-zABD-HJLNP-UW-Z]{2}))$/)){
                    this.error = 'Invalid Postcode'
                    return false
                } else {
                    return value
                }

            } else if (field.type == 'email'){

                if (value && !value.match(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/)){
                    this.error = 'Invalid email address'
                    return ''
                } else {
                    return value
                }

            } else if (field.type == 'barcode' || field.type == 'qrcode'){

                if (value && value.match(/^[a-zA-Z0-9\s]+$/)){

                    let type = 'qrcode'

                    if (!field.barcode_type && field.type == 'barcode'){
                        type = 'code11'
                    }

                    if (field.barcode_type){
                        type = field.barcode_type
                    }

                    value = await new MediaLibraryBarcode(value,type).save()

                    if (typeof value == 'object' && value.error){
                        this.error = value.error

                        return ''
                    } else if (typeof value == 'string'){
                        return value
                    } else {
                        this.error = 'Code not generated, please try again'
                        return ''
                    }

                } else {
                    return value
                }

            } else if (field.type == 'image'){

                if (value.match(/base64/)){

                    let img = await new MediaLibraryImage(value,key,this.settings.collection).save()
                    return img

                } else if (value.match(/^http/)){

                    return value

                } else if (!value.match(/(jpg|jpeg|tiff|psd|png|gif|svg|bmp)$/)){

                    this.error = view.functions.parseName(key)+' should be of type: image'
                    return ''

                } else {
                    return value
                }

            } else if (field.type == 'sku'){

                // let check = await DB.read(this.settings.collection).where(['sku == '+value]).get()
                // if (check.length > 0){
                //     this.error = 'This SKU '+value+' has already been used. Please update and save again'
                //     return ''
                // } else {
                    return value
                // }

            } else if (field.type == 'data'){

                if (typeof value == 'string' && value.match(/\<table/)){

                    let result = HtmlTableToJson.parse(value)

                    if (result && result._results && result._results[0]){
                        return result._results[0]
                    } else {
                        return value
                    }

                } else if (typeof value == 'string' && value.match(/(\d+)(,\s*\d+)*/)){

                    let result = value.replace(/\sstyle=\"(.*?)\"/g,"").split(',')// value.replace(/(<([^>]+)>)/gi, "").split(',')

                    if (result.length > 0){

                        result = result.map((item) => {
                            return item.replace(/<\/*span>/g,"").trim()
                        })

                        return result

                    } else {
                        return value
                    }

                } else {
                    return value
                }


            } else if (field.type == 'array' && typeof value == 'object'){

                return value

            } else if (field.type == 'object' && typeof value == 'object'){

                return value

            } else if (!field.type){ // don't validate if no type specified

                return value

            } else {

                this.error = 'Invalid value for: '+view.functions.parseName(key)+'. Value is "'+value+'" for type '+field.type
                return false
            }

        }

    }

    async saveIfNotExists(query){

        let check = await DB.read(this.settings.collection).where(query).first()

        if (check._key){
            return
        } else {
            this.save()
        }

    }

    async save(update_data, check_existing) {

        if (check_existing){
            let check = await DB.read(this.settings.collection).where(query).first()

            if (check._key){
                this.data = false
                resolve(this)
            } else {
                resolve(this)
            }
        }

        if (!this.data && !update_data){
            this.error = 'No data'
            return this
        }

        if (update_data){
            this.data = update_data
        }

        if (this.preSave && typeof this.preSave == 'function'){
            try{
                await this.preSave(update_data)
            }

            catch(err){
            //    log(err)
                return false
            }

        }
        try {
            await this.validate()
        }

        catch(err){
            this.error = "Error validating fields: "+err
        }

        if (this.error){
            return this
        }

        if (this.data._id){
            this.data = await DB.read(this.settings.collection).where(['_id == '+this.data._id]).update(this.data).new()
        } else if (this.data._key){
            this.data = await DB.read(this.settings.collection).where(['_key == '+this.data._key]).update(this.data).new()
        } else {

            if (this.data.key){
                this.data._key = this.data.key
                delete this.data.key
            }

            this.data = await DB.create(this.settings.collection,this.data)
        }

        if (this.postSave && typeof this.postSave == 'function'){
            await this.postSave(update_data)
        }

        return this

    }

    async duplicate(){

        delete this.data._id
        delete this.data._key
        delete this.data._rev

        let date = moment().toISOString()
        this.data._created = date
        this.data._updated = date

        if (this.data.name){
            this.data.name = this.data.name+' (copy)'
        }

        if (this.data.title){
            this.data.title = this.data.title+' (copy)'
        }

        this.save()
        return this

    }

    async search(str, sort) {

        if (!sort){
            sort = {
                dir: 'DESC',
                field: '_updated'
            }
        }

        if (str.length < 3){

            this.data = []// DB.read(this.settings.collection).limit(30).get()
            return this

        } else {

            let filter = []

            str = '^(?=.*'+str.toLowerCase().replace(/\s/g,')(?=.*')+').*$' // (?=.*\bfox)

            if (this.settings.search_fields){
                for (var field of this.settings.search_fields){
                    filter.push(field+' like '+str)
                }

            } else {
                filter.push('name like '+str)
            }

            this.data = await DB.read(this.settings.collection).orWhere(filter).orderBy(sort.field, sort.dir).get()
            return this

        }

    }

    async delete(){

        if (this.data.protect && this.data.protect == true){
            this.error = 'This document is marked as protected, so cannot be deleted'
            return this
        }

        if (typeof this.preDelete == 'function'){

            await this.preDelete()
            if (this.error){
                return this
            }
        }

        this.data = await DB.read(this.settings.collection).where(['_key == '+this.data._key]).delete()

        // this.data._deleted = moment().toISOString()
        // this.save()

        // if (this.data.length > 0){
        //     this.error = 'Not deleted'
        //     return this
        // } else {
            return this.data
        // }

    }

    get(){
        return this.data
    }

    first(){
        return this.data[0]
    }

    async getTemplate(){

        let fields = {},
            subfields = {}

        this.error = false

        this.data = {}

        this.settings.fields.map((field)=>{
            if (field.type == 'object'){
                this.data[field.name] = {}
            } else if (field.type == 'array'){
                this.data[field.name] = []
            } else if (field.type == 'boolean'){
                this.data[field.name] = false
            } else {
                this.data[field.name] = ''
            }
        })

        return this

    }

    async parseEditFields(){

    //    return new Promise( async (resolve, reject) => {

            let tabs = {details: []}

            // this.settings.fields.map( async (field)=>{
            for (let field of this.settings.fields){

                if (field.option_data){

                    if (field.option_data && global[field.option_data] && typeof global[field.option_data] == 'function'){

                        let data = await new global[field.option_data]().allFields(['_key','name'])
                        field.options = data.data

                    } else {
                        field.options = []
                    }

                }

                if (Array.isArray(field.subitems)){

                    for (let sub_field of field.subitems){

                        if (sub_field.option_data){

                            if (sub_field.option_data && global[sub_field.option_data] && typeof global[sub_field.option_data] == 'function'){

                                let data = await new global[sub_field.option_data]().allFields(['_key','name'])
                                sub_field.options = data.data

                            } else {
                                sub_field.options = []
                            }

                        }

                    }

                }

                if (!field.tab){
                    tabs.details.push(field)
                } else {
                    if (!tabs[field.tab]){
                        tabs[field.tab] = []
                    }
                    tabs[field.tab].push(field)
                }

            }
        //    })

            let keys = Object.keys(tabs),
                i,
                len = keys.length,
                sorted_tabs = {details: tabs['details']}

            keys.sort();

            for (i = 0; i < len; i++) {
                if (keys[i] != 'details'){
                    sorted_tabs[keys[i]] = tabs[keys[i]]
                }

            }

            return sorted_tabs

    }

}

module.exports = Model
