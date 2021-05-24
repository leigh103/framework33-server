//
// Admin Dashboard Module
// Admin user functions
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'root',
        views: 'blog/views',
        dashboard_views: 'dashboard/views',
        menu: {
            side_nav:[
                {link:'Blog',slug: '/dashboard/blog', icon:'<span class="icon edit"></span>', weight: 8, protected_guard:['admin']}
            ]
        }
    },


// methods

    functions = {


    }


// routes

    let data = {
        model: new Blog()
    }

    routes.get('/blog/:slug', async (req, res) => {

        view.current_view = 'blog'

        data.include_scripts = [settings.views+'/scripts/script.ejs']

        data.blog = await new Blog().all(['slug == '+req.params.slug])
        data.blog = data.blog.first()
        data.meta = {
            title: data.blog.meta_title,
            description: data.blog.meta_description
        }

        res.render(config.site.theme_path+'/templates/blog/view.ejs',data)

    })
    routes.get('/blog', async (req, res) => {

        view.current_view = 'blog'

        data.include_scripts = [settings.views+'/scripts/script.ejs']
        data.title = 'Blog Archive'
        data.blogs = await new Blog().all()
        data.blogs = data.blogs.get()

        data.blogs.sort((a,b)=>{
            return b._created.localeCompare(a._created)
        })

        res.render(config.site.theme_path+'/templates/blog/list.ejs',data)

    })

    routes.get('/dashboard/blog/:key', async (req, res) => {

        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            res.redirect('/login/admin')
        }

        view.current_view = 'blog'

        data.title = 'Blog'
        data.table = 'blog'
        data.include_scripts = [settings.dashboard_views+'/scripts/script.ejs',settings.dashboard_views+'/scripts/editor.ejs',settings.views+'/scripts/script.ejs']
        data.meta = undefined

        data.key = req.params.key
        view.current_sub_view = 'details'
        data.option_data = await view.functions.getOptionData('product_categories')
        data.fields = data.model.parseEditFields()
        res.render(basedir+'/components/dashboard/views/edit.ejs',data)


    })

    routes.get('/dashboard/blog', async (req, res) => {

        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            res.redirect('/login/admin')
        }

        view.current_view = 'blog'

        data.title = 'Blog'
        data.table = 'blog'
        data.include_scripts = [settings.dashboard_views+'/scripts/script.ejs',settings.dashboard_views+'/scripts/editor.ejs',settings.views+'/scripts/script.ejs']
        data.meta = undefined
        data.fields = new Blog().settings.fields

        res.render(settings.dashboard_views+'/table.ejs',data)

    })


// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
