
    const CronJob = require('cron').CronJob,
          provider = {
              sms: require('../providers/sms/'+config.providers.sms),
              email: require('../providers/email/'+config.providers.email)
          }

    class Notification {

        constructor(to){

            this.class = false

            if (typeof to == 'object'){

                if (to.data){ // if user model is provided
                    this.to = to.data
                    this.class = to
                } else { // if user data is provided
                    this.to = to
                }

            } else if (typeof to == 'string' && to.match(/@/)){ // if email address is provided
                this.to = {}
                this.to.email = to
            } else if (typeof to == 'string' && to.match(/^(07|\+447|\+4407)/)){ // if tel is provided
                this.to = {}
                this.to.tel = to.replace(/\s/g,'').replace(/^\+4407/,'+447')
            } else { // else meh...
                this.to = to
            }

            this.content = {}
            this.result = ''
            this.error = ''

        }

        useEmailTemplate(template){

            this.content = provider.email.templates(template, this.to)
            if (!this.content){
                this.error = "Insufficient template data"
            }
            return this

        }

        useSMSTemplate(template){

            this.content = provider.sms.templates(template, this.to)
            if (!this.content){
                this.error = "Insufficient template data"
            }
            return this

        }

        setContent(subject, text){

            this.content = {
                subject: subject,
                text: text,
                html: text,
                date: moment().toISOString()
            }
            return this

        }

        sms(){

            if (this.to && this.to.tel && !this.to.tel.match(/^(07|\+447|\+4407)/)){
                this.error = 'Invalid mobile number'
            }

            if (!this.to || !this.to.tel){
                this.error = 'No recipient specified'
            }

            if (!provider.sms){
                this.error = 'No SMS provider set'
            }

            if (this.error){
                return this
            }

            this.content.to = this.to.tel
            this.result = provider.sms.send(this.content)

            return this.result

        }

        email(){

            if (!this.to || !this.to.email){
                this.error = 'No recipient specified'
            }

            if (!provider.email){
                this.error = 'No email provider set'
            }

            if (this.error){
                return this
            }

            this.content.to = this.to.email
            this.result = provider.email.send(this.content)

            return this.result

        }

        mailbox(sender){

        //    if (this.class && this.class.data){

                if (sender){
                    this.content.from = {
                        _id: sender._id,
                        name: sender.full_name,
                        guard: sender.guard,
                        avatar: sender.avatar
                    }
                } else {
                    this.content.from = {
                        name: 'System Notification',
                        avatar: '/images/logo.svg'
                    }
                }

                if (this.class && this.class.data && this.class.data._id){
                    this.content._user_id = this.class.data._id
                } else {
                    this.content._user_id = 'admin'
                }


                // this.class.data.mailbox.push(this.content)
                // this.class.save()

                new Message(this.content).save()

                if (this.class && this.class.data && this.class.data.ws_id){
                    new WebsocketClient(this.class.data._id).send(this.content)
                } else if (this.content._user_id == 'admin'){
                    new WebsocketClient().adminBroadcast(this.content)
                }

                this.result = {
                    sent:'Message sent'
                }
                return this.result

            // } else {
            //     this.error = 'Recipient data must be a model'
            //     return this
            // }

        }

    }



    module.exports = Notification
