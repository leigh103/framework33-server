
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

                if (error && error.response.body.errors){
                    error = error.response.body.errors
                } else if (error && error.response.body){
                    error = error.response.body
                } else if (error && error.response){
                    error = error.response
                }

                log('Mail error: '+JSON.stringify(error))
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

        if (config.email && config.email.templates && config.email.templates[0]){
            msg.templateId = config.email.templates[0]
        } else if (msg.dynamic_template_data && msg.dynamic_template_data.link && msg.dynamic_template_data.link.url) {
            msg.text = msg.text+'\n'+msg.dynamic_template_data.link.url
            msg.html = msg.html+'<br><br><a href="'+msg.dynamic_template_data.link.url+'">'+msg.dynamic_template_data.link.url+'</a>'
        }

        return msg
    }

    module.exports = {}
    module.exports.send = send
    module.exports.templates = templates
