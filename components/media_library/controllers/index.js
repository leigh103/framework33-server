//
// Products Component
// Dashboard and frontend CMS
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard',
        views: 'media_library/views',
        menu: {

        }
    },


// methods


    functions = {



    }


// routes


    let data = {
        meta: {},
        tabs: [{href: '/dashboard/media-library/images', text:'Images'},{href: '/dashboard/media-library/images', text:'Videos'}]
    }

    routes.get('*', async (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }

        next()
    })

    routes.get('/media_library/:key?', async(req, res) => {
        let url = '/dashboard/media-library'
        if (req.params.key){
            url += '/'+req.params.key
        }
        res.redirect(url)
    })

    routes.get('/media-library/:key', async (req, res) => {

        data.meta = {
            title: config.site.name+' | Media Library'
        }

        view.current_view = 'media_library'
        view.current_sub_view = ''
        data.include_scripts = ['media_library/views/scripts/script.ejs']

        data.title = 'Media library'
        data.table = 'media_library'
        data.model = new MediaLibrary()

        data.key = req.params.key
        data.fields = data.model.parseEditFields()
        res.render(basedir+'/components/dashboard/views/edit.ejs',data)

    })

    routes.get('/media-library', async (req, res) => {

        data.meta = {
            title: config.site.name+' | Media Library'
        }

        view.current_view = 'media_library'
        view.current_sub_view = ''
        data.include_scripts = ['dashboard/views/scripts/script.ejs',settings.views+'/scripts/script.ejs']

        data.title = 'Media library'
        data.table = 'media_library'
        data.model = new MediaLibrary()
        data.grid_view = 'compact'

        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields
        res.render(basedir+'/components/dashboard/views/grid.ejs',data)

    })



// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
