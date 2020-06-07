
    const sendgrid = require('@sendgrid/mail'),
          Nexmo = require('nexmo'),
          Twilio = require('twilio'),
          CronJob = require('cron').CronJob

      let smsSend

      if (config.sms && config.sms.provider){

          if (config.sms.provider == 'twilio'){

              const twilio_c = new Twilio(config.sms.apiKey, config.sms.apiSecret);

              smsSend = (to, body)=>{

                  return new Promise(function(resolve, reject) {

                      twilio_c.messages.create({
                          body: body,
                          to: to,  // Text this number
                          from: config.sms.from // From a valid Twilio number
                      })
                      .then((message) => {resolve(message)})
                      .catch((err) => {reject(err)})

                  })

              }

          }

          if (config.sms.provider == 'nexmo'){

              const nexmo = new Nexmo({
                  apiKey: config.sms.apiKey,
                  apiSecret: config.sms.apiSecret,
              });

              smsSend = (to, body)=>{

                  return new Promise(function(resolve, reject) {
                      nexmo.message.sendSms(config.sms.from, to, body, (data)=>{
                          resolve(data)
                      })
                  })

              }

          }
      }

    if (config.email.sendgrid_api_key){
        sendgrid.setApiKey(config.email.sendgrid_api_key);
    }


    var notification = {

        template:(type, data, date)=>{

            return new Promise(function(resolve, reject) {

                let msg

                if (type == 'complete_registration'){

                    msg = {
                        to: data.email,
                        subject: 'Complete Your Registration',
                        text: "Welcome to "+config.site.name+"! To complete your registration, please click the link below to activate to your account. "+config.site.url+'/login/'+data.guard+'/'+data.hash,
                        button_text: 'Complete Registration',
                        button_url: config.site.url+'/login/'+data.guard+'/'+data.hash
                    }

                } else if (type == 'activate_account'){

                    msg = {
                        to: data.email,
                        subject: 'Account Activation',
                        text: "Please click the following link to activate your account. "+config.site.url+'/login/activate/'+data.hash,
                        button_text: 'Activate your account',
                        button_url: config.site.url+'/login/activate/'+data.hash
                    }

                } else if (type == 'password_reset'){

                    msg = {
                        to: data.email,
                        subject: 'Password Reset',
                        text: "Please click the following link to reset your password. Your current password has not been changed, so if you didn't initiate this, you can ignore it. It could mean someone has attempted to access your account however, so please get in contact if you have concerns. "+config.site.url+'/login/'+data.guard+'/'+data.hash,
                        button_text: 'Reset Your Password',
                        button_url: config.site.url+'/login/'+data.guard+'/'+data.hash
                    }

                }

                notification.email(msg, date).then((data)=>{
                    resolve(data)
                }).catch((err)=>{
                    reject(err)
                })

            })

        },

        email:(data, date) => {

            return new Promise(async function(resolve, reject){

                if (!data){
                    reject()
                    return
                }

                if (!data.to){
                //    log('Email not sent: Enter a valid recipient')
                    reject(new Error("Enter a valid recipient"))
                    return
                }

                if (!data.subject){
                //    log('Email not sent: Enter a subject')
                    reject(new Error("Enter a subject"))
                    return
                }

                if (!data.text && !data.html){
                //    log('Email not sent: Enter a message body')
                    reject(new Error("Enter a message body"))
                    return
                }

                if (!data.text && data.html){
                    data.text = data.html.replace(/(<([^>]+)>)/ig,"")
                }

                if (data.text && !data.html){
                    data.html = data.text
                }

                if (typeof data.to == 'string' && data.to.match(/\@/)){

                    notification.sendEmail(data.to, data, date).then((email_res)=>{
                        resolve(email_res)
                    }).catch((err)=>{
                        reject(err)
                    })

                } else {

                    model.users.find(data.to).then((user)=>{

                        notification.sendEmail(user, data, date).then((email_res)=>{
                            resolve(email_res)
                        }).catch((err)=>{
                            reject(err)
                        })

                    }).catch((err)=>{
                        reject(err)
                    })

                }

            })

        },

        sendEmail: (user, data, date) => {

            return new Promise(function(resolve, reject){

                if (user.email && user.email.match(/^(.*?)@(.*?)\.(.*?)/) || user.match(/^(.*?)@(.*?)\.(.*?)/)){

                    let template_id = config.email.template_id
                    if (data.template && config.email.templates && config.email.templates[data.template]){
                        template_id = config.email.templates[data.template]
                    }

                    if (typeof user == 'object'){

                        var msg = {
                            to: user.email,
                            from: config.email.from_address,
                            subject: data.subject,
                            text: data.text,
                            html: data.html,
                            templateId: template_id,
                            dynamic_template_data: {
                                "body":data.text,
                                "subject":data.subject,
                                "title":data.subject
                            }
                        }

                    } else if (user.match(/^(.*?)@(.*?)\.(.*?)/)){

                        var msg = {
                            to: user,
                            from: config.email.from_address,
                            subject: data.subject,
                            text: data.text,
                            html: data.html,
                            templateId: template_id,
                            dynamic_template_data: {
                                "body":data.text,
                                "subject":data.subject,
                                "title":data.subject
                            }
                        }

                    } else {
                        reject('Invalid recipient')
                        return false
                    }

                    if (data.button_text && data.button_url){
                        msg.dynamic_template_data.link = {
                            text:data.button_text,
                            url: data.button_url
                        }
                    }

                    if (data.voucher){
                        msg.dynamic_template_data.voucher = data.voucher
                    }

                    if (data.attachments){
                        msg.attachments = data.attachments
                    }

                    if (data.dynamic_template_data){
                        msg.dynamic_template_data = Object.assign(msg.dynamic_template_data, data.dynamic_template_data)
                    }

                    if (date){

                        date = new Date(date)
                        const job = new CronJob(date, function() {
                            sendgrid.send(msg).then((email_res) => {
                                resolve(email_res)
                            }).catch((error) => {
                                console.log('error: ',error)
                                reject(error)
                            })
                        });

                        job.start();

                    } else {

                        sendgrid.send(msg).then((email_res) => {
                            resolve(email_res)
                        }).catch((error) => {
                            console.log('error: ',error)
                            reject(error)
                        })

                    }

                } else if (user.tel) {

                    let sms = {
                        from:config.sms.from,
                        to: user.tel,
                        msg:data.text
                    }

                    notification.sms(sms).then((sms_res) => {
                        resolve(sms_res)
                    }).catch((error) => {
                        reject(error)
                    })

                } else {
                    reject('not sent')
                }

            })

        },

        sms:(data, date) => {

            return new Promise(async function(resolve, reject){

                data.to = '+447936642915'

                if (data.to && data.to.match(/^(07|\+447)[0-9]{8,11}/)){

                    data.to = data.to.replace(/^0/,'44')

                    const to = data.to,
                          body = data.msg+' .';

                    if (date){

                        date = new Date(date)
                        const job = new CronJob(date, function() {
                            smsSend(to, body)
                                .then((sms_data)=>{resolve(sms_data)})
                                .catch((err)=>{reject(err)})
                        });

                        job.start();

                    } else {

                        smsSend(to, body)
                            .then((sms_data)=>{resolve(sms_data)})
                            .catch((err)=>{reject(err)})

                    }

                } else {
                    reject('not sent')
                }

            })

        },

        notifyUser:(user_id, msg) => {

            return new Promise(function(resolve, reject){

                let payload = {
                    _key: user_id,
                    msg: msg
                }

                model.user_notification.save(payload).then((data)=>{
                    resolve(data)
                }).catch((err)=>{
                    reject(err)
                })

            })

        },

        notifyAdmin:(user_id, msg) => {

            return new Promise(function(resolve, reject){

                let payload = {
                    _key: user_id,
                    msg: msg,
                    admin: true
                }

                model.user_notification.save(payload).then((data)=>{
                    resolve(data)
                }).catch((err)=>{
                    reject(err)
                })

            })

        },

        broadcastNotifyAdmins:(msg) => {

            return new Promise(function(resolve, reject){

                model.admins.all().then((admins)=>{

                    admins.forEach((admin)=>{
                        let payload = {
                            _key: admin._key,
                            msg: msg,
                            admin: true
                        }

                        model.user_notification.save(payload).then((data)=>{
                            resolve(data)
                        }).catch((err)=>{
                            reject(err)
                        })

                    })

                })

            })

        }



    }

    module.exports = notification
