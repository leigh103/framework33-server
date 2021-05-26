
    const provider = {
              sms: require('../providers/sms/'+config.providers.sms),
              email: require('../providers/email/'+config.providers.email)
          }

    const WebsocketClient = require('../WebsocketClient.js'),
          ws = new WebsocketClient()

    class Notification {

        constructor(recipient){

            this.class = false

            if (Array.isArray(recipient)){

                this.recipient = 'bulk'
                this.recipients = recipient

            } else if (typeof recipient == 'object'){ // find relevant data to process the notification

                if (recipient.data){ // if user model is provided
                    this.recipient = recipient.data
                    this.class = recipient
                } else if (recipient.method && recipient.to){
                    this.recipient = {}
                    this.recipient[recipient.method] = recipient.to
                } else { // if user data is provided
                    this.recipient = recipient
                }

            } else if (typeof recipient == 'string' && recipient.match(/@/)){ // if email address is provided
                this.recipient = {}
                this.recipient.email = recipient
            } else if (typeof recipient == 'string' && recipient.match(/^(07|\+447|\+4407)/)){ // if tel is provided
                this.recipient = {}
                this.recipient.tel = recipient.replace(/\s/g,'').replace(/^\+4407/,'+447')
            } else { // else meh...
                this.recipient = recipient
            }

            this.content = {}
            this.result = ''
            this.error = ''

        }

        useEmailTemplate(template_data){

            this.content = provider.email.templates(template_data)
            return this

        }

        useSMSTemplate(template){

            this.content = provider.sms.templates(template, this.recipient)
            if (!this.content){
                this.error = "Insufficient template data"
            }
            return this

        }

        setContent(subject, text){

            if (!text){
                text = subject
                subject = ''
            }

            this.content = {
                subject: subject,
                text: text.replace(/\<br\>/g,'\n').replace(/(<([^>]+)>)/gi, ""),
                html: text,
                date: moment().toISOString()
            }
            return this

        }

        sms(){

            if (this.recipient && this.recipient.sms){
                this.recipient.tel = this.recipient.sms
            }

            if (this.recipient && this.recipient.tel && !this.recipient.tel.match(/^(07|\+447|\+4407)/)){
                this.error = 'Invalid mobile number'
            }

            if (!this.recipient || !this.recipient.tel){
                this.error = 'No recipient specified'
            }

            if (!provider.sms){
                this.error = 'No SMS provider set'
            }

            if (this.error){
                return this
            }

            this.result = provider.sms.send(this.recipient.tel, this.content)

            return this.result

        }

        email(){

            if (!this.recipient || this.recipient != 'bulk' && !this.recipient.email){
                this.error = 'No recipient specified'
            }

            if (!provider.email){
                this.error = 'No email provider set'
            }

            if (this.error){
                return this
            }

            if (this.recipient == 'bulk'){
                this.result = provider.email.sendBulk(this.recipients, this.content)
            } else {
                this.result = provider.email.send(this.recipient.email, this.content)
            }


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
                        avatar: config.site.logo
                    }
                }

                if (this.class && this.class.data && this.class.data._id){
                    this.content._user_id = this.class.data._id
                } else {
                    this.content._user_id = 'admin/0'
                }


                // this.class.data.mailbox.push(this.content)
                // this.class.save()

                new Mailbox(this.content).save()

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

        notify(){
            ws.broadcast(this.content)
            this.result = {
                sent:'Message sent'
            }
            return this.result
        }

    }



    module.exports = Notification
