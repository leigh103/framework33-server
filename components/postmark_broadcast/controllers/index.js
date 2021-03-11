//
// Products Component
// Dashboard and frontend CMS
//


// vars

const express = require('express'),
    routes = express.Router(),
    CronJob = require('cron').CronJob,
    Pstmk = require("postmark"),

    settings = {
        default_route: 'dashboard',
        views: 'postmark_broadcast/views',
        menu: {
            side_nav: [
                {link:'Promotional Email',slug: '/dashboard/promotional-email', icon:'<span class="icon envelope"></span>', weight:1}
            ]
        }
    }

const postmark = new Pstmk.ServerClient(config.email.api_key)


// methods


const functions = {

        initSend: () => {



        },

        getBatch:() => {



        },

        sendBatch: (recipients, stream, template_id) => {

            if (!recipients){
                recipients = ['lee@reformedreality.com','lee@marimo.co','leeanderson60@gmail.com']
            }

            if (!stream){
                stream = 'Promotions'
            }

            if (!template_id){
                template_id = 21184908
            }

            let base_payload = {
                "From": config.email.from_address,
                "TemplateID": template_id,
                "MessageStream": stream,
                "TemplateModel": {}
            }

            let payload = recipients.map((recipient) => {
                let result = base_payload
                result.To = recipient
                return result
            })

            postmark.sendEmailBatchWithTemplates(payload, function(error, email_res) {
                if(error) {
                    log('Mail error: '+JSON.stringify(error))
                    reject(error)
                    return
                }
            })

        }

    }


// routes


    let data = {
        meta: {}
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/promotional-email', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Promotional Email'
        }

        view.current_view = 'promotional-email'
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Promotional Emails'
        data.table = 'bulk_message'

        data.fields = new BulkMessage().settings.fields

        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
