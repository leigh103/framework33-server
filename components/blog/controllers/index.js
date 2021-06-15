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
        model: new BlogPost(),
        tabs: [{href: '/dashboard/blog', text:'Articles'}]
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/dashboard/blog_post/:key?', async(req, res) => {
        let url = '/dashboard/blog'
        if (req.params.key){
            url += '/'+req.params.key
        }
        res.redirect(url)
    })

    routes.get('/blog/:slug', async (req, res) => {

        view.current_view = 'blog'

        data.include_scripts = [settings.views+'/scripts/script.ejs']

        data.article = await new BlogPost().all(['slug == '+req.params.slug])
        data.article = data.article.first()

        if (data.article.status != 'published'){
            return res.render(basedir+'/components/default_routes/views/404')
        }

        data.meta = {
            title: data.article.meta_title,
            description: data.article.meta_description,
            image: config.site.url+data.article.image,
            type: 'article',
            updated_time: data.article._updated,
            url: config.site.url+'blog/'+req.params.slug
        }

        data.recent_articles = await new BlogPost().getRecent(data.article._key)

        res.render(config.site.theme_path+'/templates/blog/view.ejs',data)

    })
    routes.get('/blog', async (req, res) => {

        view.current_view = 'blog'

        data.include_scripts = [settings.views+'/scripts/script.ejs']
        data.title = 'Blog Archive'
        data.articles = await new BlogPost().all(['status == published'])
        data.articles = data.articles.get()

        data.articles.sort((a,b)=>{
            return b._created.localeCompare(a._created)
        })

        res.render(config.site.theme_path+'/templates/blog/list.ejs',data)

    })

    routes.get('/dashboard/blog/:key', async (req, res) => {

        view.current_view = 'blog'
        view.current_sub_view = 'blog'
        data.title = 'Blog'
        data.table = 'blog_post'
        data.meta = undefined

        data.include_scripts = [settings.dashboard_views+'/scripts/script.ejs',settings.dashboard_views+'/scripts/editor.ejs']

        data.key = req.params.key
        view.current_sub_view = 'details'
        data.fields = await data.model.parseEditFields()

        res.render(basedir+'/components/dashboard/views/edit.ejs',data)


    })

    routes.get('/dashboard/blog', async (req, res) => {

        view.current_view = 'blog'
        view.current_sub_view = 'blog'

        data.title = 'Blog'
        data.table = 'blog_post'
        data.include_scripts = [settings.dashboard_views+'/scripts/script.ejs',settings.dashboard_views+'/scripts/editor.ejs']
        data.meta = undefined
        data.fields = data.model.settings.fields

        res.render(settings.dashboard_views+'/table.ejs',data)

    })


// export

    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
