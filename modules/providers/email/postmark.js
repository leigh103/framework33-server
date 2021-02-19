
    const Pstmk = require("postmark"),
          notificationTemplate = require(global.basedir+'/modules/notifications/templates')

    const postmark = new Pstmk.ServerClient(config.email.api_key)

    const send = (to, msg) => {

        return new Promise((resolve, reject) => {

            if (!msg.from){
                if (config.email.from_address){
                    msg.from = config.email.from_address
                } else {
                    msg.from = config.admin.email
                }
            }

            let payload = {
                "From": msg.from,
                "To": to,
                "Subject": msg.subject,
                "TextBody": msg.text,
                "HtmlBody": msg.html
            }

            if (msg.TemplateAlias && msg.TemplateModel){

                payload.TemplateAlias = msg.TemplateAlias
                payload.TemplateModel = msg.TemplateModel

                delete payload.HtmlBody
                delete payload.TextBody
                delete payload.Subject

                postmark.sendEmailWithTemplate(payload, function(error, email_res) {
                    if(error) {
                        log('Mail error: '+JSON.stringify(error))
                        reject(error)
                        return
                    }
                    resolve(email_res)
                })

            } else {

                postmark.sendEmail(payload, function(error, email_res) {
                    if(error) {
                        log('Mail error: '+JSON.stringify(error))
                        reject(error)
                        return
                    }
                    resolve(email_res)
                })

            }

        })

    }

    const templates = (data) => {


        if (typeof data != 'object'){
            return ''
        }

        let msg = {}

        if (data.template && data.template == 'password-reset'){

            if (data && data.timestamp && data.guard){

                if (!data.subject){
                    data.subject = 'Password Reset'
                }

                msg = {
                    "subject": data.subject,
                    "text": data.content,
                    "html": data.content,
                    "TemplateModel": {
                        "subject": data.subject,
                        "content": data.content,
                        "company_name":config.site.name,
                        "button":{
                            "url": config.site.url+'/login/'+data.guard+'/'+data.timestamp,
                            "text":"Reset Password"
                        },
                        "link":{
                            "url": config.site.url+'/login/'+data.guard+'/'+data.timestamp
                        }
                    },
                    "TemplateAlias":"password-reset"
                }

            }

        } else {

            if (!data.subject){
                data.subject = config.site.name
            }

            msg = {
                "subject": data.subject,
                "text": data.content,
                "html": data.content,
                "TemplateModel": {
                    "subject": data.subject,
                    "content": data.content,
                    "company_name":config.site.name
                },
                "TemplateAlias":"general"
            }

            if (data.items && data.total && data.sub_total){
                msg.TemplateModel.transactions = {
                    items: data.items,
                    sub_total: data.sub_total,
                    tax: data.tax,
                    total: data.total
                }
            }

            if (data.link){
                msg.TemplateModel.link = {
                    url: data.link
                }
                msg.TemplateModel.button = {
                    url: data.link,
                    text: data.link_text
                }
            }

        }

        return msg
    }

    module.exports = {}
    module.exports.send = send
    module.exports.templates = templates
