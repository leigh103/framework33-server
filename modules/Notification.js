
    const CronJob = require('cron').CronJob,
          provider = {
              sms: require('./providers/sms/'+config.providers.sms),
              email: require('./providers/email/'+config.providers.email)
          }

    class Notification {

        constructor(to){

            if (typeof to == 'object'){
                this.to = to
            } else if (typeof to == 'string' && to.match(/@/)){
                this.to = {}
                this.to.email = to
            } else if (typeof to == 'string' && to.match(/^(07|\+447|\+4407)/)){
                this.to = {}
                this.to.tel = to.replace(/\s/g,'').replace(/^\+4407/,'+447')
            } else {
                this.to = to.split('/')
                this.to = new global[parseClassName(this.to[0])]().find(this.to[1])
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
                text: text
            }
            return this

        }

        sms(){

            if (!this.to.tel.match(/^(07|\+447|\+4407)/)){
                this.error = 'Invalid mobile number'
            }

            if (!this.to.tel){
                this.error = 'No recipient specified'
            }

            if (this.error){
                return this
            }

            this.content.to = this.to.tel
            this.result = provider.sms.send(this.content)

            return this.result

        }

        email(){

            if (!this.to.email){
                this.error = 'No recipient specified'
            }

            if (this.error){
                return this
            }

            this.content.to = this.to.email
            this.result = provider.email.send(this.content)

            return this.result

        }

        mailbox(){

        }

    }



    module.exports = Notification
