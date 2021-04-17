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
            side_nav: [
                {link:'Media Library',slug: '/dashboard/media-library', weight:20, icon:'<span class="icon screen"></span>'}
            ]
        }
    },


// methods


    functions = {



    }


// routes


    let data = {
        meta: {},
        tabs: [{href: '/dashboard/media-library', text:'Images'},{href: '/dashboard/media-library/videos', text:'Videos'},{href: '/dashboard/media-library/files', text:'Files'}]
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
        view.current_sub_view = req.params.key
        data.include_scripts = ['dashboard/views/scripts/script.ejs',settings.views+'/scripts/script.ejs']

        data.title = 'Media library'
        data.table = 'media_library'
        data.model = new MediaLibrary()
        data.grid_view = 'compact'
        data.query = '?type='+req.params.key

        // data.context_menu = [
        //     {function: "viewImg",text:"View Image", icon:"eye"}
        // ]

        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields
        res.render(basedir+'/components/dashboard/views/grid.ejs',data)

    })

    routes.get('/media-library', async (req, res) => {

        data.meta = {
            title: config.site.name+' | Media Library'
        }

        view.current_view = 'media_library'
        view.current_sub_view = 'images'
        data.include_scripts = ['dashboard/views/scripts/script.ejs',settings.views+'/scripts/script.ejs']

        data.title = 'Media library'
        data.table = 'media_library'
        data.model = new MediaLibrary()
        data.query = '?type=image'
        data.grid_view = 'compact'

        data.context_menu = [
            {function: "viewImg",text:"View Image", icon:"eye"}
        ]

        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields
        res.render(basedir+'/components/dashboard/views/grid.ejs',data)

    })
    // setTimeout(async () => {
    //
    //
    //     await glob(global.basedir+'/product_images/**/***/*.*', async (er, files) => {
    //
    //         for (let file of files){
    // console.log(file)
    //
    //             var file_data = false
    //             if (file.match(/png|jpg|jpeg|svg$/)){
    //
    //                 try {
    //                     file_data = await functions.readFile(file)
    //                 }
    //
    //                 catch(err){
    //                     file_data = false
    //                     console.log(err)
    //                     continue;
    //                 }
    //
    //                 if (!file_data){
    //                     console.log('no file data')
    //                     continue;
    //                 }
    //
    //                 let file_split = file.split('/'),
    //                     file_name = file_split[file_split.length-1]
    //
    //                 let file_ext = file_name.split('.').pop(),
    //                     tags = "products,"+file_split[file_split.length-2].toLowerCase()+","+file_split[file_split.length-3].toLowerCase()
    //
    //                 file_name = file_name.split('.')[0].toLowerCase()
    // console.log(file_ext,file_name, tags)
    //                 await new Image("data:image/"+file_ext+";base64,"+file_data, file_name, 'products', tags).resize(1000).save()
    //
    //
    //             }
    //
    //         }
    //         console.log('done')
    //     })
    //
    // },2000)


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
