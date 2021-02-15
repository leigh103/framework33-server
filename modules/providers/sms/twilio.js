
const Twilio = require('twilio'),
      notificationTemplate = require(global.basedir+'/modules/notifications/templates')

      if (config.sms && config.sms.api_key && config.sms.api_secret){
          twilio_c = new Twilio(config.sms.api_key, config.sms.api_secret)
      } else {
          twilio_c = false
      }

const send = (content)=>{

        return new Promise(function(resolve, reject) {

            if (twilio_c === false){
                let err = 'Unable to send SMS: no Twilio API settings. Please add to modules/config.js and restart the server'
                log(err)
                reject(err)
                return
            }

            if (content.to.match(/^0/)){
                content.to = content.to.replace(/^0/,'+44')
            }

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
