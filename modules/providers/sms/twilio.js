
const Twilio = require('twilio'),
      notificationTemplate = require(global.basedir+'/modules/notification_templates')
      twilio_c = new Twilio(config.sms.api_key, config.sms.api_secret);

const send = (content)=>{

        return new Promise(function(resolve, reject) {

            twilio_c.messages.create({
                body: content.text,
                to: content.to,  // Text this number
                from: config.sms.from // From a valid Twilio number
            })
            .then((message) => {resolve(message)})
            .catch((err) => {reject(err)})

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
