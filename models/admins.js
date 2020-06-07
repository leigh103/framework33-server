
    const collection = 'admins',
          fs = require('fs')

    // db.createCollection(collection)
    //
    class admins {

        constructor(){

            this.settings = {
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

            this.data

        }

        async find(key) {

            if (key || key == 0){

                this.data = await db.read(collection)
                                    .where(['_key == '+key])
                                    .first(['password'])

                return this.data

            } else {
                throw new Error("No key provided")
            }

        }

        async all() {

            this.data = await db.read(collection).orderBy('full_name','asc').get(['password'])
            return this.data

        }

        search(search) {

            return new Promise(async (resolve, reject) => {

                if (search.str.length < 3){

                    let result = await db.read(collection).orWhere(filter).limit(30).get()
                    resolve(result)

                } else {

                    let filter = []

                    filter.push('full_name like '+search.str)
                    filter.push('email like '+search.str)
                    filter.push('full_name like '+search.str)

                    let result = await db.read(collection).orWhere(filter).get()
                    resolve(result)

                }

            })

        }

        async save(data) {

            if (data.tel){
                data.tel = data.tel.replace(/\s/g,'')
            }

            if (typeof data.full_name == 'string'){
                let name = data.full_name.split(" ")
                data.name = {}
                data.name.first = view.functions.capitalise(name[0])
                data.name.last = view.functions.capitalise(name[name.length-1])
                data.full_name = view.functions.capitalise(data.full_name)
            } else {
                data.full_name = view.functions.capitalise(data.name.first+' '+data.name.last)
            }

            if (data.name && data.name.first && data.name.last){
                await images.saveAll(data,data.name.first+'-'+data.name.last,'avatars').then((new_data)=>{
                    data = new_data
                })
            }

            if (data.password && data.password_conf && data.password == data.password_conf){

                data.password = db.hash(data.password)
                delete data.password_conf

            } else if (data.password && data.password_conf && data.password == data.password_conf){

                reject('Passwords do not match')
                return false

            } else {

                delete data.password

            }

            let result

            data = await db.parseDataTypes(collection, data)

            if (data._id){
                result = await db.read(collection).where(['_id == '+data._id]).update(data).first()
            } else {

                if (typeof data.activated == 'undefined' || data.activated == true){
                    if (config.users.email_activation === true){
                        data.activated = false
                        this.sendReset(data)
                    } else {
                        data.activated = true
                    }
                }

                result = await db.create(collection,data).first()

            }

            return result

        }

        delete (key){

            return new Promise(async (resolve, reject) => {

                let admin_count = await db.count(collection)

                if (admin_count > 1){
                    let admin_data = await db.read(collection).where(['_key == '+key]).delete()
                    resolve(admin_data)
                } else {
                    reject('At least 1 admin account must be registered')
                }

            })

        }

        authenticate(data) {

            let self = this

            return new Promise(function(resolve, reject){

                let admin_data = db.read(collection).where(['email == '+data.email]).first(),
                    hash = db.hash(data.password)

                if (admin_data && admin_data._id && admin_data.activated && admin_data.password == hash && !admin_data.blocked){

                    admin_data.guard = 'admin'
                    resolve(admin_data)

                } else if (admin_data && admin_data._id && !admin_data.activated  && !admin_data.blocked || admin_data && admin_data._id && !admin_data.password && !admin_data.blocked){

                    self.sendReset(admin_data).then(()=>{
                        reject('Email address and or password incorrect. Please check your email for confirmation.')
                    }).catch((err)=>{
                        console.log(err)
                        reject('Email address and or password incorrect.')
                    })

                } else {

                    reject('Email address and or password incorrect')

                }

            })

        }

        resetPassword(data) {

            return new Promise(async (resolve, reject) => {

                if (data.password != data.password_conf || !data.password){
                    reject("Passwords don't match")
                } else {

                    let update_data = {
                        password: db.hash(data.password),
                        password_reset: false
                    }

                    let admin_data = await db.read(collection).where(['email == '+data.email, 'password_reset == '+data.hash]).update(update_data).first()

                    if (admin_data && admin_data._id){
                        resolve(admin_data)
                    } else {
                        reject('Your password has not been saved. Please try again later')
                    }

                }

            })

        }

        sendReset(data) {

            return new Promise(async (resolve, reject) => {

                let hash = db.hash('password-reset'+Date.now()),
                    filter = []

                if (data.email){
                    filter.push('email == '+data.email)
                } else if (data.key){
                    filter.push('_key == '+data._key)
                } else {
                    reject('Invalid data')
                    return false
                }

                let admin_data = await db.read(collection).orWhere(filter).update({password_reset:hash}).first()

                if (admin_data._id){

                    let msg

                    if (!admin_data.activated || !admin_data.password){

                        let email_data = {
                            hash: hash,
                            guard:'admin',
                            email: admin_data.email
                        }
                        notification.template('complete_registration',email_data).then((email_data)=>{
                            resolve(admin_data)
                        }).catch((err)=>{
                            reject('Unfortunately we could not send the password reset to your registered email address')
                        })

                    } else {

                        let email_data = {
                            hash: hash,
                            guard:'admin',
                            email: admin_data.email
                        }
                        notification.template('password_reset',email_data).then((email_data)=>{
                            resolve(admin_data)
                        }).catch((err)=>{
                            reject('Unfortunately we could not send the password reset to your registered email address')
                        })

                    }

                } else {
                    reject('Please check your email')
                }

            })

        }

        setDefault() {

            let admin_count = db.count(collection)

            if (!admin_length){

                console.log('Creating new default admin')
                let default_admin = {
                    email: config.admin.email,
                    password:'',
                    full_name: 'Admin'
                }

                db.create(collection, default_admin)
            }

        }

    }
    //
    // this.setDefault()
    //
    module.exports = admins
