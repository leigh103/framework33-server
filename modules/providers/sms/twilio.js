
    const Twilio = require('twilio'),
          notificationTemplate = require(global.basedir+'/modules/notifications/templates')

          if (config.sms && config.sms.api_key && config.sms.api_secret){
              twilio_c = new Twilio(config.sms.api_key, config.sms.api_secret)
          } else {
              twilio_c = false
          }

          var last_send = {
              to: '',
              date: Date.now(),
              count:0
          }

    const send = (to, msg)=>{

            return new Promise(async(resolve, reject) => {

                try {
                    await throttle(to)
                }

                catch(err){
                    log(err)
                    reject(err)
                    return
                }

                if (twilio_c === false){
                    let err = 'Unable to send SMS: no Twilio API settings. Please add to modules/config.js and restart the server'
                    log(err)
                    reject(err)
                    return
                }

                if (to.match(/^0/)){
                    to = to.replace(/^0/,'+44')
                }

                twilio_c.messages.create({
                    body: msg.text,
                    to: to,  // Text this number
                    from: config.sms.from // From a valid Twilio number
                })
                .then((message) => {resolve(message)})
                .catch((err) => {reject(err)})

            })

        }

    const throttle = (to) => {

        return new Promise( async (resolve, reject) => {

            if (last_send.to == to){

                if (Date.now() - last_send.date < 500 && last_send.count > 2){
                    last_send.to = to
                    last_send.date = Date.now()
                    last_send.count++
                    log('SMS error: Notification throttled - too many requests')
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

        let msg = {
            text: data.content
        }

        if (data.subject){
            msg.text = data.subject+'. '+msg.text
        }

        return msg

    }

    module.exports.send = send
    module.exports.templates = templates
