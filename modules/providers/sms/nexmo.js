

const Vonage = require('@vonage/server-sdk')

const vonage = new Vonage({
              apiKey: config.sms.api_key,
              apiSecret: config.sms.api_secret
            })

const send = (to, msg) => {

    return new Promise(function(resolve, reject) {

        to += ''

        if (to.match(/^\+/)){
            to = to.replace(/\+/,'')
        }

        if (to.match(/^0/)){
            to = to.replace(/^0/,'44')
        }

        // nexmo.message.sendSms(config.sms.from, to, msg.text, (data)=>{
        //     resolve(data)
        // })

        vonage.message.sendSms(config.sms.from, to, msg.text, (err, responseData) => {
            if (err) {
                reject(err)
            } else {
                if(responseData.messages[0]['status'] === "0") {
                    resolve(responseData)
                } else {
                    reject(responseData.messages[0]['error-text'])
                    console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
                }
            }
        })

    })

}

const templates = (template, data) => {

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
