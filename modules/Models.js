
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

        all(orderBy) {

            if (orderBy){
                this.data = db.read(this.settings.collection).orderBy(orderBy,'asc').get(['password','password_reset'])
                return this
            } else {
                this.data = db.read(this.settings.collection).get(['password','password_reset'])
                return this
            }

        }

        async validate(){

            let fields = {}

            this.error = false

            this.settings.fields.map((field)=>{
                fields[field.name] = field
            })

            for (let [key, value] of Object.entries(this.data)) {

                if (fields[key]){

                    if (fields[key].required === true && value == ''){
                        this.error = view.functions.parseName(key)+' is a required field'
                        break
                    } else {

                        if (fields[key].type == 'string' && typeof value == 'string'){
                            this.data[key] = value.toString()
                        } else if (fields[key].type == 'integer' && parseInt(value) || fields[key].type == 'number' && parseInt(value)){
                            this.data[key] = parseInt(value)
                        } else if (fields[key].type == 'date'){

                            if (moment(value, "YYYY-MM-DDThh:mm:ssZ", true)){
                                this.data[key] = value
                            } else if (moment(value, "DD/MM/YYYY", true)){
                                this.data[key] = moment(value, "DD/MM/YYYY").toISOString()
                            } else if (moment(value, "DD-MM-YYYY", true)){
                                this.data[key] = moment(value, "DD-MM-YYYY").toISOString()
                            } else {
                                this.error = 'Invalid date specified for '+view.functions.parseName(key)
                                this.data[key] = ''
                            }

                        } else if (fields[key].type == 'float' && parseFloat(value)){
                            this.data[key] = parseFloat(value)
                        } else if (fields[key].type == 'slug' && typeof value == 'string'){
                            this.data[key] = value.replace(/\s/g,'-').replace(/['",./\\()\[\]*&^%$£@!]/g,'').toLowerCase()
                        } else if (fields[key].type == 'boolean'){
                            this.data[key] = (value == 'true' || value === true)
                        } else if (fields[key].type == 'price' && parseFloat(value).toFixed(2)){
                            this.data[key] = parseFloat(value).toFixed(2)
                        } else if (fields[key].type == 'user_id' && typeof value == 'string' && value.match(/^(.*)\/[0-9]+$/)){
                            this.data[key] = value
                        } else if (fields[key].type == 'name'){

                            let name = value.split(' ')
                            if (name.length == 1){
                                name.push('')
                            }

                            this.data[key] = value
                            this.data.name = {
                                first: name[0],
                                last: name[name.length-1]
                            }

                        } else if (fields[key].type.match(/tel|phone/)){

                            if (value && !value.match(/^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/)){
                                this.error = 'Invalid phone number'
                                this.data[key] = ''
                            } else {
                                this.data[key] = value.replace(/\s/g,'')
                            }

                        } else if (fields[key].type == 'email'){

                            if (value && !value.match(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/)){
                                this.error = 'Invalid email address'
                                this.data[key] = ''
                            } else {
                                this.data[key] = value
                            }

                        } else if (fields[key].type == 'image'){

                            if (value.match(/base64/)){

                                let file_name = key
                                if (this.data.full_name){
                                    file_name = this.data.full_name.replace(/\s/g,'-').replace(/[.,!@£$%^&*()\[\]{}'"><?;:|\\/]/g,'').toLowerCase()
                                } else if (typeof this.data.name == 'string'){
                                    file_name = this.data.name.replace(/\s/g,'-').replace(/[.,!@£$%^&*()\[\]{}'"><?;:|\\/]/g,'').toLowerCase()
                                }

                                this.data[key] = await new Image(value,file_name,this.settings.collection).save()

                            } else if (!value.match(/(jpg|jpeg|tiff|psd|png|gif|svg|bmp)$/)){

                                this.error = view.functions.parseName(key)+' should be of type: image'
                                this.data[key] = ''

                            } else {
                                this.data[key] = value
                            }
                        } else if (fields[key].type == 'object' && typeof value == 'object'){
                            this.data[key] = value
                        } else if (!fields[key].type){ // don't validate if no type specified
                            this.data[key] = value
                        } else {
                            this.data[key] = ''
                            this.error = 'Invalid value for: '+view.functions.parseName(key)+'. Value is "'+value+'" for type '+fields[key].type
                            break
                        }

                    }

                }

            }

            return this

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
