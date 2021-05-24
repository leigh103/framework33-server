//
// Marketing Component
// Dashboard and frontend CMS
//


// vars

const express = require('express'),
    routes = express.Router(),
    Pstmk = require("postmark"),

    settings = {
        default_route: 'dashboard',
        views: 'marketing/views',
        menu: {
            side_nav: [
                {link:'Marketing',slug: '/dashboard/marketing', icon:'<span class="icon megaphone"></span>', weight:7}
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

    routes.get('/marketing/:page?', async(req, res) => {

        data.meta = {
            title: config.site.name+' | marketing'
        }

        view.current_sub_view = 'Email'

        if (req.params.page){
            view.current_sub_view = req.params.page
        }

        data.tabs = [
            {href:'/dashboard/marketing', text: 'Email'},
            {href:'/dashboard/marketing/sms', text: 'SMS'},
            {href:'/dashboard/marketing/social-media', text: 'Social Media'}
        ]

        view.current_view = 'marketing'
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Marketing'
        data.table = 'marketing'

        data.fields = new Marketing().settings.fields

        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
