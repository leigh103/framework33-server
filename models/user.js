
    class Users {

        constructor(data){

            this.settings = {
                collection: 'user',
                fields: [
                    {name:'avatar',input_type:'image',placeholder:'Profile Picture', type:'image'},
                    {name:'full_name',input_type:'text',placeholder:'Full name', type:'string'},
                    {name:'email',input_type:'email',placeholder:'Email address', type:'string'},
                    {name:'tel',input_type:'text',placeholder:'Telephone Number', type:'string'},
                    {name:'activated',input_type:'select',options:[{text:'Yes',value:true},{text:'No',value:false}], type:'boolean'},
                    {name:'blocked',input_type:'select',options:[{text:'Yes',value:true},{text:'No',value:false}], type:'boolean'}
                ]
            }

            this.routes = {
                login: '/login',
                logged_in: '/'
            }

            this.data = data
            this.error = ''
            this.sucess = ''

        }

        find(key) {

            if (key){

                let field

                if (typeof key == 'object'){

                    if (key._key){

                        key = key._key
                        field = '_key'

                    } else if (key.email){

                        key = key.email
                        field = 'email'

                    } else if (key.password_reset){

                        key = key.password_reset
                        field = 'password_reset'

                    }

                } else {

                    if (typeof key == 'string' && key.match(/^[0-9]*$/)){

                        if (key._key){
                            key = key._key
                        }

                        field = '_key'

                    } else if (typeof key == 'string' && key.match(/@/)){

                        if (key.email){
                            key = key.email
                        }

                        field = 'email'

                    } else if (key){

                        field = 'password_reset'

                    }

                }

                this.data = db.read(this.settings.collection)
                                    .where([field+' == '+key])
                                    .first(['password','password_reset'])

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

        all() {

            this.data = db.read(this.settings.collection).orderBy('full_name','asc').get(['password','password_reset'])
            return this.data

        }

        async findOrSave() {

            if (!this.data){
                this.error = 'No user data'
                return this
            }
            if (!this.data.email && !this.data.username && !this.data.tel){
                this.error = 'Please add a valid email address, username or telephone number'
                return this
            }
            if (!this.data.email){
                this.data.email = ''
            }
            if (!this.data.tel){
                this.data.tel = ''
            } else {
                this.data.tel = this.data.tel.replace(/\s/g,'')
            }
            if (!this.data.username){
                this.data.username = ''
            }

            if (this.data.password && this.data.password_conf && this.data.password != this.data.password_conf){
                this.error = 'Passwords are not the same, please try again'
                return this
            }

            if (!this.data.guard){
                this.data.guard = this.settings.collection
            }

            let existing = db.read(this.settings.collection).where(['email == '+this.data.email]).get()

            if (existing.length > 0){

                if (config.users.email_activation === true && !this.data.activated){
                    new Auth(this.data).sendReset()
                }

                this.data = existing
                return this

            } else {

                await this.save()

                if (config.users.email_activation === true){
                    this.data.activated = false
                    new Auth(this.data).sendReset()
                } else {
                    this.data.activated = true
                }

                return this

            }

        }

        search(search) {

            if (search.str.length < 3){

                this.data = db.read(this.settings.collection).limit(30).get()
                return this.data

            } else {

                let filter = []

                filter.push('full_name like '+search.str)
                filter.push('email like '+search.str)
                filter.push('full_name like '+search.str)

                this.data = db.read(this.settings.collection).orWhere(filter).get()
                return this.data

            }

        }

        save() {

            if (this.data.tel){
                this.data.tel = this.data.tel.replace(/\s/g,'')
            }

            if (typeof this.data.full_name == 'string'){
                let name = this.data.full_name.split(" ")
                this.data.name = {}
                this.data.name.first = view.functions.capitalise(name[0])
                this.data.name.last = view.functions.capitalise(name[name.length-1])
                this.data.full_name = view.functions.capitalise(this.data.full_name)
            } else if (this.data.name) {
                this.data.full_name = view.functions.capitalise(this.data.name.first+' '+this.data.name.last)
            }

            if (this.data.name && this.data.name.first && this.data.name.last){
                images.saveAll(data,this.data.name.first+'-'+this.data.name.last,'avatars').then((new_data)=>{
                    data = new_data
                })
            }

            if (this.data.password && this.data.password_conf && this.data.password == this.data.password_conf){

                this.data.password = db.hash(this.data.password)
                delete this.data.password_conf

            } else if (this.data.password && this.data.password_conf && this.data.password == this.data.password_conf){

                return 'Passwords do not match'

            } else {

                delete this.data.password

            }

        //    this.data = db.parseDataTypes(this.settings.collection, this.data)

            if (this.data._id){

                this.data = db.read(this.settings.collection).where(['_id == '+this.data._id]).update(this.data).first()

            } else {

                // if (typeof this.data.activated == 'undefined' || this.data.activated == true){
                //     if (config.users.email_activation === true){
                //         this.data.activated = false
                //         this.sendReset(this.data)
                //     } else {
                //         this.data.activated = true
                //     }
                // }

                this.data = db.create(this.settings.collection,this.data).first()

            }

            return this.data

        }

        delete(){

            this.data = db.read(this.settings.collection).where(['_key == '+this.data._key]).delete()
            if (this.data.length > 0){
                this.error = 'Not deleted'
            } else {
                return this.data
            }

        }



    }

    module.exports = Users
