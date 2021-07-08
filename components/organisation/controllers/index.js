//
// Organisation Component
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard',
        views: 'organisation/views',
        menu: {
            side_nav: [
                {link:'Organisation', protected_guards:['admin'],slug: '/dashboard/organisation/'+config.organisation.labels.staff, icon:'<span class="icon organisation"></span>', weight:5}
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
            // {href:'/dashboard/organisation', text: config.organisation.labels.organisation},
            {href:'/dashboard/organisation/'+config.organisation.labels.staff, text: config.organisation.labels.staff},
            {href:'/dashboard/organisation/'+config.organisation.labels.locations, text: config.organisation.labels.locations},
            {href:'/dashboard/organisation/'+config.organisation.labels.equipment, text: config.organisation.labels.equipment}
        ]
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/organisation/:page/:key', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Organisation',
            edit_link: false
        }

        view.current_view = 'organisation'
        view.current_sub_view = req.params.page

        data.include_scripts = ['dashboard/views/scripts/script.ejs','dashboard/views/scripts/editor.ejs']
        data.include_styles = [settings.views+'/dashboard/styles/style.ejs']

        if (req.params.page == config.organisation.labels.items){

            data.title = 'Organisation'
            data.edit_label = config.organisation.labels.items
            data.model = new OrganisationEvents()
            data.table = 'organisation_items'

        } else if (req.params.page == config.organisation.labels.equipment){

            data.title = 'Organisation'
            data.edit_label = config.organisation.labels.equipment
            data.model = new OrganisationEquipment()
            data.table = 'organisation_equipment'

        } else if (req.params.page == config.organisation.labels.locations){

            data.title = 'Organisation'
            data.edit_label = config.organisation.labels.locations
            data.model = new OrganisationLocations()
            data.table = 'organisation_locations'

        } else if (req.params.page == config.organisation.labels.staff){

            data.title = 'Organisation'
            data.edit_label = config.organisation.labels.staff
            data.model = new OrganisationStaff()
            data.table = 'organisation_staff'

        }

        data.key = req.params.key
        data.fields = await data.model.parseEditFields()

        res.render(basedir+'/components/dashboard/views/edit.ejs',data)

    })

    routes.get('/organisation/:page', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Organisation',
        }

        view.current_view = 'organisation'
        view.current_sub_view = req.params.page

        data.edit_link = 'organisation/'+req.params.page

        data.include_scripts = ['dashboard/views/scripts/script.ejs','dashboard/views/scripts/editor.ejs']
        data.include_styles = [settings.views+'/dashboard/styles/style.ejs']

        if (req.params.page == config.organisation.labels.items){

            data.title = 'Organisation'
            data.edit_label = config.organisation.labels.items
            data.model = new OrganisationEvents()
            data.table = 'organisation_items'

        } else if (req.params.page == config.organisation.labels.equipment){

            data.title = 'Organisation'
            data.edit_label = config.organisation.labels.equipment
            data.model = new OrganisationEquipment()
            data.table = 'organisation_equipment'

        } else if (req.params.page == config.organisation.labels.locations){

            data.title = 'Organisation'
            data.edit_label = config.organisation.labels.locations
            data.model = new OrganisationLocations()
            data.table = 'organisation_locations'

        } else if (req.params.page == config.organisation.labels.staff){

            data.title = 'Organisation'
            data.edit_label = config.organisation.labels.staff
            data.model = new OrganisationStaff()
            data.table = 'organisation_staff'

        }

        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields
        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/organisation', async(req, res) => {

        data.title = 'Organisation'
        view.current_sub_view = 'organisation'
        res.render(settings.views+'/index.ejs',data)

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
