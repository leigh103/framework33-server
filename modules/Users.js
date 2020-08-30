
    const Model = require('../modules/Models')

    class Users extends Model {

        constructor(data){

            super(data)

        }

        authenticate(attempt) {

            if (this.data.blocked){
                this.error = 'Email address and/or password incorrect'
                return this
            }

            if (!this.data.activated && this.data.email){

                this.sendReset()
                this.error = 'Email address and/or password incorrect. Please check your email for confirmation'
                return this

            } else if (this.data.activated && this.data.password == DB.hash(attempt.password) && this.data.email == attempt.email){

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

        activate(){

            if (!this.password_reset){
                this.error = 'Not found'
                return this
            } else {
                this.user_data = DB.read(this.settings.collection).where(['password_reset == '+this.password_reset]).update({activated:true,password_reset:false}).first()
                return this.user_data
            }

        }

        async sendReset() {

            let hash = DB.hash('password-reset'+Date.now()),
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

                let email = new Notification(this.data).useEmailTemplate(notification_type).email()
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
