//
// Calendar Component
// Dashboard and frontend CMS
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard',
        views: 'calendar/views',
        menu: {
            side_nav: [
                {link:'Calendar',slug: '/dashboard/calendar', icon:'<span class="icon calendar"></span>', weight:2}
            ]
        }
    }


// methods


const functions = {


    }


// routes


    let data = {
        meta: {},
        tabs: [
            {href:'/dashboard/calendar', text: 'Calendar'}
        ]
    }

    let appointment_statuses = new Appointments().statuses

    appointment_statuses.map((status)=>{
        data.tabs.push({text: status.text, href: '/dashboard/appointments/status/'+status.value})
    })

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/appointments', async(req, res) => {
        let url = '/dashboard/calendar'
        res.redirect(url)
    })

    routes.get('/appointments/status/:status', async(req, res) => {

        view.current_sub_view = view.functions.capitalise(view.functions.parseName(req.params.status))

        data.meta = {
            title: config.site.name+' | '+view.current_sub_view+' Appointments'
        }

        view.current_view = 'calendar'

        data.include_scripts = ['dashboard/views/scripts/script.ejs','calendar/views/scripts/dashboard/script.ejs']

        data.title = view.current_sub_view+' Appointments'
        data.table = 'appointments'

        data.query = '?status='+req.params.status

        data.model = new Appointments()

        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields
        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/appointments/:id', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Add New Appointment'
        }

        view.current_view = 'calendar'
        view.current_sub_view = ''
        data.include_scripts = ['dashboard/views/scripts/script.ejs','calendar/views/scripts/dashboard/script.ejs']

        data.title = 'Add New Appointment'
        data.table = 'appointments'

        data.query = '?limit=30'

        data.model = new Appointments()

        data.key = req.params.id
    //    data.option_data = await view.functions.getOptionData('product_categories')
        data.fields = await data.model.parseEditFields()

        res.render(basedir+'/components/dashboard/views/edit.ejs',data)

    })

    routes.get('/calendar/:date?', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Calendar'
        }

        view.current_sub_view = 'Calendar'

        if (req.params.page){
            view.current_sub_view = req.params.page
        }

        view.current_view = 'calendar'
        data.include_scripts = ['dashboard/views/scripts/script.ejs','calendar/views/scripts/dashboard/script.ejs']

        data.x_axis = await new global[config.calendar.models]().allFields(['_key','name'])
        data.x_axis = data.x_axis.get()

        if (req.params.date){

            data.title = 'Calendar'
            data.table = 'appointments'
            data.query = moment(req.params.date,'YYYY-MM-DD').toISOString()
            data.fields = new Appointments().settings.fields
            res.render(settings.views+'/calendar.ejs',data)

        } else {

            data.title = 'Calendar'
            data.table = 'appointments'
            data.query = moment().toISOString()
            data.fields = new Appointments().settings.fields
            res.render(settings.views+'/calendar.ejs',data)

        }



    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
