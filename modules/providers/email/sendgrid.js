
    const sendgrid = require('@sendgrid/mail'),
          notificationTemplate = require(global.basedir+'/modules/notifications/templates')

          sendgrid.setApiKey(config.email.api_key)

    const send = (msg) => {

        return new Promise((resolve, reject) => {

            if (!msg.from){
                if (config.email.from_address){
                    msg.from = config.email.from_address
                } else {
                    msg.from = config.admin.email
                }
            }

            sendgrid.send(msg).then((email_res) => {
                resolve(email_res)
            }).catch((error) => {
                log('Mail error: ',error)
                reject(error)
            })

        })

    }

    const templates = (template, data) => {

        let hash = db.hash('email-'+Date()),
            msg,
            content,
            subject

        if (template == 'complete_registration'){

            if (data && data.password_reset && data.guard){

                content = notificationTemplate.complete_registration.content
                subject = notificationTemplate.complete_registration.subject

                msg = {
                    subject: subject,
                    text: content,
                    html: content,
                    templateId: config.email.templates[0],
                    dynamic_template_data: {
                        body: content,
                        subject: subject,
                        title: subject,
                        link: {
                            text:'Complete Registration',
                            url: config.site.url+'/login/'+data.guard+'/'+data.password_reset
                        }
                    }
                }

            }

        } else if (template == 'activate_account'){


            if (data && data.password_reset){

                content = notificationTemplate.activate_account.content
                subject = notificationTemplate.activate_account.subject

                msg = {
                    subject: subject,
                    text: content,
                    html: content,
                    templateId: config.email.templates[0],
                    dynamic_template_data: {
                        body: content,
                        subject: subject,
                        title: subject,
                        link: {
                            text: subject,
                            url: config.site.url+'/login/activate/'+data.password_reset
                        }
                    }
                }

            }

        } else if (template == 'password_reset'){

            if (data && data.password_reset && data.guard){

                content = notificationTemplate.password_reset.content
                subject = notificationTemplate.password_reset.subject

                msg = {
                    subject: subject,
                    text: content,
                    html: content,
                    templateId: config.email.templates[0],
                    dynamic_template_data: {
                        body: content,
                        subject: subject,
                        title: subject,
                        link: {
                            text:'Reset Your Password',
                            url: config.site.url+'/login/'+data.guard+'/'+data.password_reset
                        }
                    }
                }

            }

        }

        return msg
    }

    module.exports = {}
    module.exports.send = send
    module.exports.templates = templates
