
    const Model = require(basedir+'/modules/Models')

    class Users extends Model {

        constructor(data){

            super(data)

        }

        async findOrSave() {

            if (!this.data){
                this.error = 'No user data'
                return this
            }

            if (this.data.password_conf){
                delete this.data.password_conf
            }

            let existing = await new User().find(['email == '+this.data.email])

            if (existing && existing.data.email && this.data.email == existing.data.email){

                if (config.users.email_activation === true && !existing.data.activated){
                    existing.sendReset()
                }

                return existing // don't return 'this' here, it causes recursion 

            } else {

                await this.passwordValidation()

                if (this.error){ // most likely a new guest account

                    this.sendReset()
                    await this.save()
                    return this

                } else {

                    await this.save()

                    if (config.users.email_activation === true){
                        this.data.activated = false
                        this.sendReset()
                    } else {
                        this.data.activated = true
                    }

                    return this

                }

            }

        }

        async notificationFailure(type, to){

            if (!this.data.notification_failures){
                this.data.notification_failures = []
            }

            this.data.notification_failures.push({type:type, sent_to: to, date:moment().toISOString()})
            this.save()
            return this

        }

        async sanitize(){

            let fields = ['_key','_id','title','full_name','email','tel','activated','guard','avatar','shipping_address','billing_address']

            for (var [key,val] of Object.entries(this.data)){
                if (fields.indexOf(key) === -1){
                    delete this.data[key]
                }
            }

            return this

        }

        async preSave(){

        }

        async authenticate(attempt) {

            if (!this.data || this.data.blocked || !attempt || typeof attempt != 'object' || !attempt.password || !attempt.email){
                this.error = 'Email address and/or password incorrect'
                return this
            }

            attempt.password = await DB.hash(attempt.password)

            if (!this.data.activated && this.data.email){

                this.sendReset()
                this.error = 'Email address and/or password incorrect. Please check your email for confirmation'
                await this.sanitize()
                return this

            } else if (this.data.activated == true && this.data.password == attempt.password && this.data.email == attempt.email){

                this.data.guard = this.settings.collection
                await this.sanitize()
                return this.data

            } else {

                this.error = 'Email address and/or password incorrect'
                await this.sanitize()
                return this

            }

        }

        async resetPassword(password_reset) {

            if (this.data.blocked || typeof password_reset != 'object' || !password_reset.password_reset){
                this.error = 'Email address, password or reset token are incorrect'
                return this
            }

            password_reset.password_reset = DB.hash('password-reset'+password_reset.password_reset)

            if (password_reset.password != password_reset.password_confirmation || !password_reset.password){

                this.error = 'Passwords no not match'
                return this

            } else if (password_reset.password == password_reset.password_confirmation){

                let update_data = {
                    password: DB.hash(password_reset.password),
                    password_reset: false,
                    activated: true
                }

                this.data = await DB.read(this.settings.collection).where(['email == '+this.data.email, 'password_reset == '+password_reset.password_reset]).update(update_data).first()

                if (this.data){

                    return this.data

                } else {

                    this.error = 'Your password has not been saved. Please try again later'
                    return this

                }

            }

        }

        async activate(){

            if (!this.data.password_reset){
                this.error = 'Not found'
                return this
            } else {
                this.data.password_reset = false
                this.data.activated = true
                await this.save()
                return this
            }

        }

        async deleteReset(){

            if (this.data && this.data.password_reset){
                this.data.password_reset = false
                await this.save()
                return this
            } else {
                return this
            }

        }

        async sendReset() {

            let timestamp = Date.now(),
                hash = DB.hash('password-reset'+timestamp),
                filter = []

            if (this.data.email){
                filter.push('email == '+this.data.email)
            } else if (this.data._key){
                filter.push('_key == '+this.data._key)
            } else {
                this.error = 'Reset not sent - Not found'
                return this
            }

            this.data = await DB.read(this.settings.collection).orWhere(filter).update({password_reset:hash}).first()

            if (this.data && this.data.email){

                let msg,
                    notification_type

                if (!this.data.password){
                    notification_type = 'complete_registration'
                } else if (!this.data.activated && this.data.guard != 'admin'){
                    notification_type = 'activate_account'
                } else {
                    notification_type = 'password_reset'
                }

                this.data.timestamp = timestamp

                try {
                //    let email = new Notification(this.data).useEmailTemplate(notification_type).email()
                    this.data.link = config.site.url+'/login/'+this.settings.collection+'/'+this.data.timestamp
                    this.data.link_text = 'Reset Your Password'
                    await new Events(notification_type).trigger(this.data)
                } catch (error) {
                    console.log(error)
                    this.error = error
                }

                delete this.data.timestamp

                return this.data

            } else {
                this.error = 'Please check your email'
                return this
            }


        }

        async getMessages(){

            let mailbox = DB.read('messages').orWhere(['_user_id == '+this.data._id,'_user_id == '+this.data.guard]).get()
            return mailbox

        }

        async deleteMessage(date){

            if (this.data.mailbox){

                for (let key in this.data.mailbox){

                    if (this.data.mailbox[key].date == date){
                        this.data.mailbox.splice(key,1)
                    }
                }

                this.save()
                return this.data.mailbox

            } else {
                this.error = 'No messages'
                return this
            }


        }

        passwordValidation(){

            let error = false,
                error_msg = "Your password must include ",
                plural

            if (this.data && this.data.password){

                if (config.users.password_policy){

                    if (config.users.password_policy.min_length > 0){

                        if (this.data.password.length >= config.users.password_policy.min_length){

                        } else {

                            plural = ''
                            if (config.users.password_policy.min_length > 1){
                                plural = "s"
                            }
                            error_msg += "at least "+config.users.password_policy.min_length+" character"+plural+", "
                            error = true

                        }

                    }

                    if (config.users.password_policy.special_characters > 0){

                        let re = RegExp('[!@€#£$%^&*()_\\-=+]{'+config.users.password_policy.special_characters+',}')
                        if (this.data.password.match(re)){

                        } else {

                            plural = ''
                            if (config.users.password_policy.special_characters > 1){
                                plural = "s"
                            }
                            error_msg += "at least "+config.users.password_policy.special_characters+" special character"+plural+", "
                            error = true

                        }

                    }

                    if (config.users.password_policy.uppercase_characters > 0){

                        let re = RegExp('[A-Z]{'+config.users.password_policy.uppercase_characters+',}')
                        if (this.data.password.match(re)){

                        } else {

                            plural = ''
                            if (config.users.password_policy.uppercase_characters > 1){
                                plural = "s"
                            }
                            error_msg += "at least "+config.users.password_policy.uppercase_characters+" uppercase character"+plural+", "
                            error = true

                        }

                    }

                    if (config.users.password_policy.lowercase_characters > 0){

                        let re = RegExp('[a-z]{'+config.users.password_policy.lowercase_characters+',}')
                        if (this.data.password.match(re)){

                        } else {

                            plural = ''
                            if (config.users.password_policy.lowercase_characters > 1){
                                plural = "s"
                            }
                            error_msg += "at least "+config.users.password_policy.lowercase_characters+" lowercase character"+plural+", "
                            error = true

                        }

                    }

                    if (config.users.password_policy.numbers > 0){

                        let re = RegExp('[0-9]{'+config.users.password_policy.numbers+',}')
                        if (this.data.password.match(re)){

                        } else {

                            plural = ''
                            if (config.users.password_policy.numbers > 1){
                                plural = "s"
                            }
                            error_msg += "at least "+config.users.password_policy.numbers+" number"+plural+", "

                            error = true
                        }

                    }

                }

                if (error == true){
                    error_msg = error_msg.replace(/\,\s$/,'').replace(/(.+)(\,\s)(.+)$/,'$1 and $3')
                    this.error = error_msg
                }

                return this

            } else {
                this.error = 'No password specified'
                return this
            }

        }

    }

    module.exports = Users
