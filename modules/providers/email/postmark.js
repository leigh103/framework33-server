
    const Pstmk = require("postmark"),
          notificationTemplate = require(global.basedir+'/modules/notifications/templates')

    const postmark = new Pstmk.ServerClient(config.email.api_key)

    const send = (msg) => {

        return new Promise((resolve, reject) => {

            if (!msg.From){
                if (config.email.from_address){
                    msg.From = config.email.from_address
                } else {
                    msg.From = config.admin.email
                }
            }

            postmark.sendEmail({
                "From": msg.from,
                "To": msg.to,
                "Subject": msg.subject,
                "TextBody": msg.text,
                "HtmlBody": msg.html
            }, function(error, email_res) {
                if(error) {
                    log('Mail error: '+JSON.stringify(error))
                    reject(error)
                    return
                }
                resolve(email_res)
            })


        })

    }

    const templates = (template, data) => {

        let hash = DB.hash('email-'+Date()),
            msg,
            content,
            subject

        if (template == 'complete_registration'){

            if (data && data.timestamp && data.guard){

                content = notificationTemplate.complete_registration.content
                subject = notificationTemplate.complete_registration.subject

                msg = {
                    "Subject": subject,
                    "TextBody": content,
                    "HtmlBody": content,
                    "TemplateModel": {
                        "company_name":config.site.name,
                        "action_url": config.site.url+'/login/'+data.guard+'/'+data.timestamp
                    }
                }

            }

        } else if (template == 'activate_account'){

            if (data && data.timestamp){

                content = notificationTemplate.activate_account.content
                subject = notificationTemplate.activate_account.subject

                msg = {
                    "Subject": subject,
                    "TextBody": content,
                    "HtmlBody": content,
                    "TemplateModel": {
                        "company_name":config.site.name,
                        "action_url": config.site.url+'/login/activate/'+data.timestamp
                    }
                }


            }

        } else if (template == 'password_reset'){

            if (data && data.timestamp && data.guard){

                content = notificationTemplate.password_reset.content
                subject = notificationTemplate.password_reset.subject

                msg = {
                    "Subject": subject,
                    "TextBody": content,
                    "HtmlBody": content,
                    "TemplateModel": {
                        "company_name":config.site.name,
                        "action_url": config.site.url+'/login/'+data.guard+'/'+data.timestamp
                    }
                }

            }

        }

        if (config.email && config.email.templates && config.email.templates[0]){
            msg.TemplateId = config.email.templates[0]
        }

        return msg
    }

    module.exports = {}
    module.exports.send = send
    module.exports.templates = templates
