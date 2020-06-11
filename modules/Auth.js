
    const Model = require('../modules/Models')

    class Auth extends Model {

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

            } else if (this.data.activated && this.data.password == db.hash(attempt.password) && this.data.email == attempt.email){

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
                    password: db.hash(password_reset.password),
                    password_reset: false,
                    activated: true
                }

                this.data = await db.read(this.settings.collection).where(['email == '+this.data.email, 'password_reset == '+password_reset.password_reset]).update(update_data).first()

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
                this.user_data = db.read(this.settings.collection).where(['password_reset == '+this.password_reset]).update({activated:true,password_reset:false}).first()
                return this.user_data
            }

        }

        sendReset() {

            let hash = db.hash('password-reset'+Date.now()),
                filter = []

            if (this.data.email){
                filter.push('email == '+this.data.email)
            } else if (this.data._key){
                filter.push('_key == '+this.data._key)
            } else {
                this.error = 'Reset not sent - Not found'
                return this
            }

            db.read(this.settings.collection).orWhere(filter).update({password_reset:hash}).first()

            if (this.data && this.data.email){

                let msg,
                    notification_type

                if (!this.password){
                    notification_type = 'complete_registration'
                } else if (!this.activated){
                    notification_type = 'activate_account'
                } else {
                    notification_type = 'password_reset'
                }

                let email_data = {
                    hash: hash,
                    guard: this.settings.collection,
                    email: this.data.email
                }

                notification.template(notification_type,email_data) //.then((email_data)=>{
                    return this.data
                // }).catch((err)=>{
                //     this.error = 'Unfortunately we could not send the password reset to your registered email address'
                //     return this
                // })

            } else {
                this.error = 'Please check your email'
                return this
            }


        }

    }

    module.exports = Auth
