
    class Auth {

        constructor(user_data, posted_data){

            if (!user_data){
                this.error = 'Not found'
                return this
            }

            if (user_data.data){
                user_data = user_data.data
            }

            this.collection = user_data.guard
            this.email = user_data.email
            this.activated = user_data.activated
            this.blocked = user_data.blocked
            this.password = user_data.password
            this.user_data = user_data

            if (user_data.password_reset){
                this.password_reset = user_data.password_reset
            }

            this.error = ''
            this.success = ''

            if (posted_data){

                if (posted_data.email){
                    this.email = posted_data.email
                }

                if (posted_data.password){
                    this.password_check = db.hash(posted_data.password)
                }

                if (posted_data.password_confirmation){
                    this.password_confirmation = db.hash(posted_data.password_confirmation)
                }

                if (posted_data.password_reset){
                    this.password_reset = posted_data.password_reset
                }

            }


        }

        authenticate() {

            if (!this.collection || this.blocked){
                this.error = 'Email address and/or password incorrect'
                return this
            }

            if (!this.activated && this.email){

                this.sendReset()
                this.error = 'Email address and/or password incorrect. Please check your email for confirmation'
                return this

            } else if (this.activated && this.password == this.password_check){

                this.user_data.guard = this.collection
                return this.user_data

            } else {

                this.error = 'Email address and/or password incorrect'
                return this

            }

        }

        async resetPassword() {

            if (!this.collection || this.blocked){
                this.error = 'Email address and/or password incorrect'
                return this
            }

            if (this.password_check != this.password_confirmation || !this.password_check){

                this.error = 'Passwords no not match'
                return this

            } else if (this.password_check == this.password_confirmation){

                let update_data = {
                    password: this.password_check,
                    password_reset: false,
                    activated: true
                }

                this.user_data = await db.read(this.collection).where(['email == '+this.email, 'password_reset == '+this.password_reset]).update(update_data).first()

                if (this.user_data && this.user_data._id){

                    return this.user_data

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
                this.user_data = db.read(this.collection).where(['password_reset == '+this.password_reset]).update({activated:true,password_reset:false}).first()
                return this.user_data
            }

        }

        sendReset() {

            let hash = db.hash('password-reset'+Date.now()),
                filter = []

            if (this.email){
                filter.push('email == '+this.email)
            } else if (this.user_data._key){
                filter.push('_key == '+this.user_data._key)
            } else {
                this.error = 'Reset not sent - Not found'
                return this
            }

            db.read(this.collection).orWhere(filter).update({password_reset:hash}).first()

            if (this.user_data && this.user_data.email){

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
                    guard: this.collection,
                    email: this.user_data.email
                }

                notification.template(notification_type,email_data) //.then((email_data)=>{
                    return this.user_data
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
