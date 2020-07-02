
    class Model {

        constructor(data){

            this.data = data
            this.error

        }

        async find(key) {

            if (key || key == 0){

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

                this.data = await db.read(this.settings.collection)
                                    .where(query)
                                    .first()

                if (this.data){
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

        all(data) {

            if (typeof data == 'string'){
                this.data = db.read(this.settings.collection).orderBy(data,'asc').get()
                return this
            } else if (typeof data == 'object'){
                this.data = db.read(this.settings.collection).where(data).omit(['password','password_reset']).get()
                return this
            } else {
                this.data = db.read(this.settings.collection).omit(['password','password_reset']).get()
                return this
            }

        }

        async validate(){

            let fields = {},
                subfields = {}

            this.error = false

            this.settings.fields.map((field)=>{
                fields[field.name] = field
            })

            for (let [key, value] of Object.entries(this.data)) {

                if (fields[key]){

                    if (fields[key].type == 'object' && fields[key].subitems && fields[key].subitems.length > 0){

                        fields[key].subitems.map((subfield)=>{
                            subfields[subfield.name] = subfield
                        })

                        for (let [subkey, subvalue] of Object.entries(this.data[key])) {
                            this.data[key][subkey] = await this.validateField(subfields[subkey], subkey, subvalue)
                        }

                    } else {

                        this.data[key] = await this.validateField(fields[key], key, value)

                    }

                }

            }

            return this

        }

        async validateField(field, key, value){

            if (field.required === true && value == ''){

                this.error = view.functions.parseName(key)+' is a required field'
                return false

            } else {

                if (field.type == 'string' && typeof value == 'string'){

                    return value.toString()

                } else if (field.type == 'integer' && value.match(/\d/) || field.type == 'number' && value.match(/\d/)){

                    return value.replace(/\D/g, '')

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

                } else if (field.type == 'float' && parseFloat(value)){

                    return parseFloat(value)

                } else if (field.type == 'slug' && typeof value == 'string'){

                    return value.replace(/\s/g,'-').replace(/['",./\\()\[\]*&^%$£@!]/g,'').toLowerCase()

                } else if (field.type == 'boolean'){

                    return (value == 'true' || value === true)

                } else if (field.type == 'price' && parseFloat(value).toFixed(2)){

                    return parseFloat(value).toFixed(2)

                } else if (field.type == 'user_id' && typeof value == 'string' && value.match(/^(.*)\/[0-9]+$/)){

                    return value

                } else if (field.type == 'name'){

                    let name = value.split(' ')
                    if (name.length == 1){
                        name.push('')
                    }

                    return value
                    data.name = {
                        first: name[0],
                        last: name[name.length-1]
                    }

                } else if (field.type.match(/tel|phone/)){

                    if (value && !value.match(/^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/)){
                        this.error = 'Invalid phone number'
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

                } else if (field.type == 'image'){

                    if (value.match(/base64/)){

                        let file_name = key
                        if (data.full_name){
                            file_name = data.full_name.replace(/\s/g,'-').replace(/[.,!@£$%^&*()\[\]{}'"><?;:|\\/]/g,'').toLowerCase()
                        } else if (typeof data.name == 'string'){
                            file_name = data.name.replace(/\s/g,'-').replace(/[.,!@£$%^&*()\[\]{}'"><?;:|\\/]/g,'').toLowerCase()
                        }

                        return await new Image(value,file_name,this.settings.collection).save()

                    } else if (!value.match(/(jpg|jpeg|tiff|psd|png|gif|svg|bmp)$/)){

                        this.error = view.functions.parseName(key)+' should be of type: image'
                        return ''

                    } else {
                        return value
                    }
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

        async save() {

            if (!this.data){
                this.error = 'No data'
                return this
            }

            await this.validate()

            if (this.data._id){
                this.data = await db.read(this.settings.collection).where(['_id == '+this.data._id]).update(this.data).first()
            } else {
                this.data = await db.create(this.settings.collection,this.data).first()
            }

            return this

        }

        async delete(){

            this.data = await db.read(this.settings.collection).where(['_key == '+this.data._key]).delete()

            if (this.data.length > 0){
                this.error = 'Not deleted'
                return this
            } else {
                return this.data
            }

        }

        get(){
            return this.data
        }

        first(){
            return this.data[0]
        }

    }

    module.exports = Model
