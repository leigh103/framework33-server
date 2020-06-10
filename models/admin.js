
    class Admin {

        constructor(data){

            this.data = data

            this.settings = {
                collection: 'admin',
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
                login: '/login/admin',
                logged_in: '/dashboard'
            }

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

        get(){
            return this.data
        }

        first(){
            return this.data[0]
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

        async setDefault() {

            let admin_count = db.count(this.settings.collection)

            if (!admin_count && config.admin.email){

                console.log('Creating new default admin')
                let default_admin = {
                    email: config.admin.email,
                    password:'',
                    full_name: 'Admin',
                    guard:this.settings.collection
                }

                await db.create(this.settings.collection, default_admin)
                new Auth(default_admin).sendReset()

            } else if (!config.admin.email){
                console.log('Please set admin email address in modules/config.js')
            }

        }

    }

    let new_admin = new Admin().setDefault()

    module.exports = Admin
