
    const Pstmk = require("postmark"),
          notificationTemplate = require(global.basedir+'/modules/notifications/templates')

    const postmark = new Pstmk.ServerClient(config.email.api_key)

    var last_send = {
        to: '',
        date: Date.now(),
        count:0
    }

    const send = (to, msg) => {

        return new Promise( async (resolve, reject) => {

            try {
                await throttle(to)
            }

            catch(err){
                log(err)
                reject(err)
                return
            }

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

                postmark.sendEmailWithTemplate(payload, async (error, email_res) => {
                    if(error) {
                        log('Mail error: '+JSON.stringify(error))
                        let user = await new Customers().find({email: payload.To})
                        if (user.data && user.data.email){
                            user.notificationFailure('email', payload.To)
                        }
                        reject(error)
                        return
                    }
                    resolve(email_res)
                })

                resolve()

            } else {

                postmark.sendEmail(payload, async (error, email_res) => {
                    if(error) {
                        log('Mail error: '+JSON.stringify(error))
                        let user = await new Customers().find({email: payload.To})
                        if (user.data && user.data.email){
                            user.notificationFailure('email', payload.To)
                        }
                        reject(error)
                        return
                    }
                    resolve(email_res)
                })
                resolve()

            }

        })

    }

    const throttle = (to) => {

        return new Promise( async (resolve, reject) => {

            if (last_send.to == to){

                if (Date.now() - last_send.date < 500 && last_send.count > 5){
                    last_send.to = to
                    last_send.date = Date.now()
                    last_send.count++

                    if (last_send.count == 10){
                        let payload = {
                            "From": config.email.from_address,
                            "To": config.admin.email,
                            "Subject": "Recursive events firing on "+config.site.name,
                            "TextBody": "Over 10 events have fired to the same recipient within a very short space of time. The notifications are being blocked, but the loop is still going. Please log onto the server to stop it.",
                            "HtmlBody": "Over 10 events have fired to the same recipient within a very short space of time. The notifications are being blocked, but the loop is still going. Please log onto the server to stop it."
                        }
                        postmark.sendEmail(payload, async (error, email_res) => {})

                    }

                    log('Mail error: Notification throttled - too many requests')
                    reject('Too many requests')
                    return

                }

                last_send.count++

            } else {
                last_send.count = 0
            }

            last_send.to = to
            last_send.date = Date.now()

            resolve()

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
                "html": data.content.replace(/\r\n|\r|\n/g,"<br />"),
                "TemplateModel": {
                    "subject": data.subject,
                    "content": data.content.replace(/\r\n|\r|\n/g,"<br />"),
                    "company_name":config.site.name
                },
                "TemplateAlias":"general"
            }

            if (data.items && data.total && data.sub_total){

                data.items = data.items.map((item)=>{
                    item.price = (item.price/100).toFixed(2)
                    return item
                })

                msg.TemplateModel.transactions = {
                    items: data.items,
                    shipping_method: data.shipping_method,
                    shipping_total: '0.00',
                    sub_total: (data.sub_total/100).toFixed(2),
                    tax: (data.tax/100).toFixed(2),
                    total: (data.total/100).toFixed(2)
                }

                if (data.shipping_total > 0){
                    msg.TemplateModel.transactions.shipping_total = (data.shipping_total/100).toFixed(2)
                }

            //    console.log(msg)

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
