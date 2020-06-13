const Nexmo = require('nexmo'),
      notificationTemplate = require(global.basedir+'/modules/notifications/templates')

      nexmo = new Nexmo({
        apiKey: config.sms.apiKey,
        apiSecret: config.sms.apiSecret,
    });

const send = (content) => {

    return new Promise(function(resolve, reject) {
        nexmo.message.sendSms(config.sms.from, content.to, content.text, (data)=>{
            resolve(data)
        })
    })

}

const templates = (template, data) => {

    let msg

    if (template = 'complete_registration'){

        msg = {
            text: notificationTemplate.complete_registration.content
        }

    }

    return msg

}

module.exports.send = send
module.exports.templates = templates
