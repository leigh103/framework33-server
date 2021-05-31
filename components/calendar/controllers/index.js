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
                {link:'Calendar',slug: '/dashboard/calendar', icon:'<span class="icon calendar"></span>', protected_guards:['admin'], weight:2}
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

        if (!status.value.match(/^(none|complete|confirmed)$/)){
            data.tabs.push({text: status.text, href: '/dashboard/appointments/status/'+status.value})
        }

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

        data.include_scripts = ['dashboard/views/scripts/script.ejs','calendar/views/scripts/dashboard/calendar.ejs']

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
        data.include_scripts = ['dashboard/views/scripts/script.ejs','calendar/views/scripts/dashboard/appointments.ejs']

        data.title = 'Add New Appointment'
        data.table = 'appointments'

        if (req.query.date){

            let start = moment(req.query.date),
                remainder = 15 - (start.minute() % 15);
                data.selected_date = moment(start).add(remainder, "minutes").subtract(15, 'minutes')

            if (!data.selected_date.isDST()){
                data.selected_date = data.selected_date.subtract(1,'hour')
            }

            data.selected_date = data.selected_date.toISOString()

        } else {

            let start = moment(),
                remainder = 15 - (start.minute() % 15);
                data.selected_date = moment(start).add(remainder, "minutes").subtract(15, 'minutes').toISOString()

        }

        if (req.query.provider){
            data.selected_provider = req.query.provider
        } else {
            data.selected_provider = ''
        }

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

        data.date = req.params.date

        view.current_sub_view = 'Calendar'

        view.current_view = 'calendar'
        data.include_scripts = ['dashboard/views/scripts/script.ejs','calendar/views/scripts/dashboard/calendar.ejs']

        data.x_axis = await new global[config.calendar.models]().allFields(['_key','name'])
        data.x_axis = data.x_axis.get()

        data.title = 'Calendar'
        data.table = 'appointments'

        if (data.date){

            if (data.date == 'today'){
                data.query = moment().toISOString()
            } else {
                data.query = moment(data.date,'YYYY-MM-DD').toISOString()
            }
            req.session.date = data.query
            data.part_iso = data.query.split('T')[0]
            res.render(settings.views+'/calendar.ejs',data)

        } else {

            if (req.session.date){
                data.query = moment(req.session.date,'YYYY-MM-DD').toISOString()
            } else {
                data.query = moment().toISOString()
            }

            data.part_iso = data.query.split('T')[0]

            res.render(settings.views+'/calendar.ejs',data)

        }

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
