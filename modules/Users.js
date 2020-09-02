
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

            if (existing.data && existing.data.email && this.data.email == existing.data.email){

                if (config.users.email_activation === true && !this.data.activated){
                    existing.sendReset()
                }

                this.data = existing
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

        async preSave(){

        }

        search(search) {

            if (search.str.length < 3){

                this.data = DB.read(this.settings.collection).limit(30).get()
                return this.data

            } else {

                let filter = []

                filter.push('full_name like '+search.str)
                filter.push('email like '+search.str)
                filter.push('full_name like '+search.str)

                this.data = DB.read(this.settings.collection).orWhere(filter).get()
                return this.data

            }

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
                return this

            } else if (this.data.activated == true && this.data.password == attempt.password && this.data.email == attempt.email){

                this.data.guard = this.settings.collection
                return this.data

            } else {

                this.error = 'Email address and/or password incorrect'
                return this

            }

        }

        async resetPassword(password_reset) {

            if (this.data.blocked){
                this.error = 'Email address and/or password incorrect'
                return this
            }

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

                let email = new Notification(this.data).useEmailTemplate(notification_type).email()

                delete this.data.timestamp

                return this.data

            } else {
                this.error = 'Please check your email'
                return this
            }


        }

        async getMessages(){

            let mailbox = DB.read('messages').where(['_user_id == '+this.data._id]).get()
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

    }

    module.exports = Users
