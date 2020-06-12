const Nexmo = require('nexmo'),
      nexmo = new Nexmo({
        apiKey: config.sms.apiKey,
        apiSecret: config.sms.apiSecret,
    });

send = (to, body)=>{

    return new Promise(function(resolve, reject) {
        nexmo.message.sendSms(config.sms.from, to, body, (data)=>{
            resolve(data)
        })
    })

}
module.exports.send = send
