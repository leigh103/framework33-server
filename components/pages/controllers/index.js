//
// Pages Module
// Dashboard and frontend CMS
//


// vars

const express = require('express'),
    routes = express.Router(),
    util = require('util'),
    readFile = util.promisify(fs.readFile),
    // puppeteer = require('puppeteer'),

    settings = {
        default_route: 'root',
        views: 'pages/views',
        menu: {
            side_nav: [
                {link:'Pages',slug: '/dashboard/pages/website', protected_guards:['admin'], weight:7, icon:'<span class="icon screen"></span>', subitems:[
                    {link:'Pages Types',slug: '/dashboard/pages/categories', weight:1}
                ]}
            ]
        }
    },


// methods


    functions = {

        // launchPuppeteer: async () => {
        //     browser = await puppeteer.launch({
        //                         args: ['--no-sandbox'],
        //                         timeout: 10000,
        //                     });
        // },

        findForms: (pages_blocks) => {

            return new Promise( async (resolve, reject) => {

                let forms = {}

                for (let block of pages_blocks){
                    if (block.block == 'form'){

                        for (let field of block.fields){

                            if (field.field == 'form'){

                                let form = await new PagesForms().find(field.value)
                                if (form && form.data && form.data._key){
                                    forms[form.data._key] = form.data
                                }

                            }

                        }

                    }
                }

                resolve(forms)

            })

        },

        findFAQs: (pages_blocks) => {

            return new Promise( async (resolve, reject) => {

                let faqs = {}

                for (let block of pages_blocks){
                    if (block.block == 'FAQs'){

                        for (let field of block.fields){

                            if (field.field == 'form'){

                                let faq = await new PageFAQs().find(field.value)
                                if (faq && faq.data && faq.data._key){
                                    faqs[faq.data._key] = faq.data
                                }

                            }

                        }

                    }
                }

                resolve(faqs)

            })

        },

        parseStyle:(style, option) => {

            let str = ''

            if (!option || option && option != 'no-bg'){
                if (style.background){
                    if (style.background.color){
                        str += 'background: '+style.background.color+';'
                    }
                    if (style.background.image){
                        str += 'background-image: url('+style.background.image+');background-size:cover;background-repeat: no-repeat; background-position:center center;'
                    }
                }
            }

            if (style.text){
                if (style.text.color){
                    str += 'color: '+style.text.color+';'
                }
            }
            return str

        },

        parseBlocks:()=>{

            return new Promise( async (resolve, reject) => {

                var blocks = {}

                await glob(config.site.theme_path+'/templates/blocks/**/*.ejs', async (er, files) => {

                    for (let filepath of files){

                        let data = await readFile(filepath)
                        data = data+''

                        filepath = filepath.split('/')
                        let filename = filepath.pop(),
                            folder = filepath.pop()


                        block_name = filename.replace('.ejs','').replace(/\.[a-z]+$/,'').replace(/\s/g,'-')

                        blocks[block_name] = {}
                        blocks[block_name].folder = folder
                        blocks[block_name].html = data.replace(/\r|\n/g,'').replace(/app\-field\=['"]/g,'id="'+block_name+'-')
                        blocks[block_name].block = block_name
                        blocks[block_name].name = data.match(/app\-block\=['"](.*?)['"]/)
                        blocks[block_name].disable_styling = data.match(/app\-disable\-styling\=['"](.*?)['"]/)

                        if (blocks[block_name].name){
                            blocks[block_name].name = blocks[block_name].name[1].charAt(0).toUpperCase() + blocks[block_name].name[1].slice(1)
                        } else {
                            blocks[block_name].name = ''
                        }

                        blocks[block_name].description = data.match(/app\-block-description\=['"](.*?)['"]/)
                        if (blocks[block_name].description){
                            blocks[block_name].description = blocks[block_name].description[1]
                        } else {
                            blocks[block_name].description = ''
                        }

                        blocks[block_name].styling = {
                            background:{
                                image:'',
                                color:'',
                                class:''
                            },
                            text:{
                                color:''
                            },
                            container:{
                                class:''
                            },
                            carousel:false
                        }


                        blocks[block_name].inputs = data.match(/app\-input\=['"](.*?)['"]/g)
                        blocks[block_name].fields = data.match(/app\-field\=['"](.*?)['"]/g)
                        blocks[block_name].element_style = data.match(/app\-styling\=['"](.*?)['"]/g)
                        blocks[block_name].editor = []

                        if (blocks[block_name].inputs && blocks[block_name].fields){

                            for (var i in blocks[block_name].fields){

                                if (blocks[block_name].fields[i] && blocks[block_name].inputs[i]){

                                    let field_match = blocks[block_name].fields[i].match(/app\-field\=['"](.*?)['"]/)
                                    if (field_match && field_match[1]){
                                        blocks[block_name].fields[i] = field_match[1]
                                    }

                                    let input_match = blocks[block_name].inputs[i].match(/app\-input\=['"](.*?)['"]/)
                                    if (input_match && input_match[1]){
                                        blocks[block_name].inputs[i] = input_match[1]
                                    }

                                    blocks[block_name].editor[i] = {field:blocks[block_name].fields[i], input:blocks[block_name].inputs[i], value:''}

                                    if (blocks[block_name].element_style && blocks[block_name].element_style[i]){
                                        let styling_match = blocks[block_name].element_style[i].match(/app\-styling\=['"](.*?)['"]/)
                                        if (styling_match && styling_match[1]){
                                            blocks[block_name].editor[i].styling = 'true'
                                            blocks[block_name].editor[i].classes = ''
                                        }
                                    }

                                }

                            }

                        }

                    }

                    resolve(blocks)

                })

            })

        },

        getStylesheets: async () => {

            return new Promise( async (resolve, reject) => {

                await glob(config.site.theme_path+'/css/partials/*.styl', async (er, files) => {

                    files = files.map((file) => {
                        return file.split('/').pop()
                    })
                    resolve(files)

                })

            })

        },

        getStylesheet: async (path) => {

            return new Promise( async (resolve, reject) => {

                fs.readFile(config.site.theme_path+'/css/partials/'+path, 'utf-8', function(err, data){

                    resolve(data)

                })

            })

        },

        getRecent:async (type,key) => {

            let articles = await new PagesWebsite().all(['type == '+type]).get(),
                article_list = ''

            articles.forEach((article)=>{

                if (article._key != key){
                    article_list += '<a class="block" href="/'+article.type+'/'+article.slug+'">'+article.title+'</a>'
                }

            })

            return article_list

        }

    }


// routes

    var browser, render_pages

    let data = {
        shop: view.ecommerce.shop,
        meta: {},
        model: new PagesWebsite().settings,
        regular_tabs: [
            {href:'/dashboard/pages/website', text: 'Website'},
            {href:'/dashboard/pages/blog', text: 'Blog'},
            {href:'/dashboard/pages/elements', text: 'Elements'},
            {href:'/dashboard/pages/templates', text: 'Templates'},
            {href:'/dashboard/pages/categories', text: 'Categories'},
            {href:'/dashboard/pages/styling', text: 'CSS'}
        ],
        element_tabs: [
            {href:'/dashboard/pages/menus', text: 'Menus'},
            {href:'/dashboard/pages/forms', text: 'Forms'},
            {href:'/dashboard/pages/testimonials', text: 'Testimonials'},
            {href:'/dashboard/pages/faqs', text: 'FAQs'}
        ],
        action_buttons: [
            {href:'/dashboard/media-library',text:'Media'}
        ]
    },

    blocks = []

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/dashboard/pages', async(req, res) => {

        let url = '/dashboard/pages/website'
        res.redirect(url)

    })

    routes.get('/dashboard/:page(pages_*)', async(req, res) => {

        let url = '/dashboard/pages/'+req.params.page.replace(/pages_/,'')
        res.redirect(url)

    })

    routes.get('/', async (req, res, next) => {

        res.locals.functions = functions

        data.include_scripts = []

        if (typeof Cart == 'function'){
            data.include_scripts = [settings.views+'/scripts/script.ejs']
            data.cart = await new Cart().init(req)
        }

        let article = await new PagesWebsite().find(['slug == homepage','status == published'])

        if (!article.data || article.error){

            next()

        } else {


            data.blocks = blocks
            data.title = article.data.title
            data.table = 'pages'
            data.key = article.data._key
            data.date = article.data._updated
            data.meta = article.data.meta
            data.pages = article.data
            data.forms = await functions.findForms(article.data.blocks)
            data.faqs = await functions.findFAQs(article.data.blocks)

            res.render(settings.views+'/view.ejs',data)

        }

    })


    routes.post('/dashboard/pages/render', async (req, res) => {

        render_pages = req.body

        var options = {
            host: config.site.url.replace(/http(s)?\:\/\//,''),
            path: '/component-pages/render'
        }
        var request = http.request(options, function (response) {
            var data = '';
            response.on('data', function (chunk) {
                data += chunk;
            });
            response.on('end', function () {
                res.send(data)
            });
        });
        request.on('error', function (e) {
            res.send(e.message)
        });
        request.end();

    })

    routes.get('/component-pages/render/:external?', async (req, res) => {

        res.locals.functions = functions

        if (typeof render_pages == 'object'){

            data.include_styles = []
            data.include_scripts = []
            data.blocks = blocks
            data.title = render_pages.title
            data.table = 'pages'
            data.key = render_pages._key
            data.date = render_pages._updated
            data.meta = render_pages.meta
            data.pages = render_pages
            data.forms = await functions.findForms(render_pages.blocks)
            data.faqs = await functions.findFAQs(render_pages.blocks)

            if (req.params.external){
                res.render(settings.views+'/view.ejs',data)
            } else {
                res.render(settings.views+'/render.ejs',data)
            }


        } else {
            res.send('No render data available')
        }


    })

    routes.get('/dashboard/pages/get-blocks/:name?', (req, res) => {

        if (blocks[req.params.name]){
            functions.parseBlocks().then((blocks)=>{
                res.json(blocks[req.params.name])
            }).catch((err)=>{
                res.status(500).send(err)
            })
        } else {
            functions.parseBlocks().then((pages_blocks)=>{
                data.blocks = pages_blocks
                blocks = pages_blocks
                res.json(blocks)
            }).catch((err)=>{
                res.status(500).send(err)
            })
        }

    })

    routes.get('/dashboard/pages/styling', async(req, res) => {

        data.include_scripts = ['dashboard/views/scripts/script.ejs']
        view.current_view = 'pages'
        view.current_sub_view = 'CSS'
        data.title = 'Pages'
        data.table = false
        data.model = false

        data.table = 'stylesheet'
        data.edit_link = 'pages/settings/styling'

        data.links = await functions.getStylesheets()

        res.render(settings.views+'/dashboard/style_list.ejs',data)

    })

    routes.get('/dashboard/pages/styling/:path', async(req, res) => {

        data.include_scripts = ['dashboard/views/scripts/script.ejs','dashboard/views/scripts/editor.ejs', settings.views+'/dashboard/scripts/style_editor_script.ejs']
        data.include_styles = [ settings.views+'/dashboard/styles/style.ejs',settings.views+'/dashboard/styles/highlightjs.ejs']
        view.current_view = 'pages'
        data.links = ''
        data.path = req.params.path
        data.stylesheet = await functions.getStylesheet(data.path+'.styl')

        res.render(settings.views+'/dashboard/style_editor.ejs',data)

    })

    routes.post('/dashboard/pages/save-style', async(req, res) => {

        fs.writeFile(config.site.theme_path+'/css/partials/'+req.body.path+'.styl', req.body.code, function (err) {
            if (err) return res.json({saved:false, error:err});
            res.json({saved:true})
        })

    })

    routes.get('/dashboard/pages/elements', async (req, res) => {

        data.include_scripts = ['dashboard/views/scripts/script.ejs']
        data.query = ''
        view.current_view = 'pages'
        view.current_sub_view = 'elements'
        data.title = 'Pages'
        data.table = false
        data.model = false

        data.cards = [
            {link:'Menus',slug:'pages/menus', description:'Add or edit menus on your website', weight:2, button_text: 'Manage Menus', protected_guards:['admin']},
            {link:'Forms',slug:'pages/forms', description:'Add or edit forms to include on your website pages', weight:3, button_text: 'Manage Forms', protected_guards:['admin']},
            {link:'Testimonials',slug:'pages/testimonals', description:'Add or edit customer testimonials', button_text: 'Manage Testimonials', weight:4, protected_guards:['admin']},
            {link:'FAQs',slug:'pages/faqs', description:'Add or edit FAQs', weight:5, button_text: 'Manage FAQs', protected_guards:['admin']}
        ]

        res.render(settings.views+'/dashboard/elements.ejs',data)

    })

    routes.get('/dashboard/pages/:page/:key', async(req, res) => {

        data.include_scripts = ['dashboard/views/scripts/script.ejs']
        data.query = ''
        view.current_view = 'pages'

        let title_prefix = 'New'
        if (req.params.key != 'new'){
             title_prefix = 'Edit'
        }

        if (req.params.page == 'categories'){

            data.title = title_prefix+' Category'
            data.table = 'pages_categories'
            data.model = new PagesCategories()

        } else if (req.params.page == 'website'){

            data.title = title_prefix+' Page'
            data.table = 'pages_website'
            data.model = new PagesWebsite()
            data.edit_label = 'page'

            data.include_scripts = ['dashboard/views/scripts/script.ejs','dashboard/views/scripts/editor.ejs',settings.views+'/dashboard/scripts/script.ejs']
            data.include_styles = [settings.views+'/dashboard/styles/style.ejs']

            data.page_key = req.params.key
            data.fields = await data.model.parseEditFields()
            data.option_data = await new PagesCategories().allFields(['_key','name'])
            data.option_data = data.option_data.get()

            blocks = await functions.parseBlocks()
            data.blocks = blocks

            res.render(settings.views+'/dashboard/editor.ejs',data)
            return

        } else if (req.params.page == 'templates'){

            data.title = title_prefix+' Templates'
            data.table = 'pages_templates'
            data.model = new PagesTemplates()
            data.edit_label = 'template'

            data.include_scripts = ['dashboard/views/scripts/script.ejs','dashboard/views/scripts/editor.ejs',settings.views+'/dashboard/scripts/script.ejs']
            data.include_styles = [settings.views+'/dashboard/styles/style.ejs']

            data.page_key = req.params.key
            data.fields = await data.model.parseEditFields()
        //    data.option_data = await view.functions.getOptionData('page_types')

            blocks = await functions.parseBlocks()
            data.blocks = blocks

            res.render(settings.views+'/dashboard/editor.ejs',data)
            return

        } else if (req.params.page == 'blog'){

            data.title = title_prefix+' Blog'
            data.table = 'pages_blog'
            data.model = new PagesBlog()

        } else if (req.params.page == 'forms'){

            data.title = title_prefix+' Form'
            data.table = 'pages_forms'
            data.model = new PagesForms()

        } else if (req.params.page == 'menus'){

            data.title = title_prefix+' Menu'
            data.table = 'pages_menus'
            data.model = new PagesMenus()

        } else if (req.params.page == 'faqs'){

            data.title = title_prefix+' Frequently Asked Questions'
            data.table = 'pages_faqs'
            data.model = new PagesFaqs()

        } else if (req.params.page == 'testimonials'){

            data.tabs = data.element_tabs
            data.title = title_prefix+' Testimonial'
            data.table = 'pages_testimonials'
            data.model = new PagesTestimonials()

        }

        data.key = req.params.key
        data.fields = await data.model.parseEditFields()

        res.render(basedir+'/components/dashboard/views/edit.ejs',data)

    })

    routes.get('/dashboard/pages/:page?', async (req, res) => {

        data.meta = {
            title: config.site.name+' | '+req.params.page,
        }

        view.current_sub_view = req.params.page

        if (req.params.page){
            view.current_sub_view = req.params.page
        }

        data.title = 'Pages'
        view.current_view = 'pages'

        data.tabs = data.regular_tabs

        if (req.params.page == 'categories'){

            data.model = new PagesCategories()
            view.current_sub_view = 'Categories'
            data.table = 'pages_categories'
            data.edit_link = 'pages/categories'
            data.edit_label = 'Category'

        } else if (req.params.page == 'website'){

            data.model = new PagesWebsite()
            view.current_sub_view = 'Website'
            data.table = 'pages_website'
            data.edit_link = 'pages/website'
            data.edit_label = 'Page'

            data.context_menu = [
               {function: "viewPage",text:"View Page", icon:"eye"},
               {function: "createTemplateFromPage",text:"Create Template", icon:"edit"}
           ]

        } else if (req.params.page == 'templates'){

            data.model = new PagesTemplates()
            view.current_sub_view = 'Templates'
            data.table = 'pages_templates'
            data.edit_link = 'pages/templates'
            data.edit_label = 'Page Template'

            data.context_menu = [
               {function: "createPageFromTemplate",text:"Create Page", icon:"edit"}
           ]

        } else if (req.params.page == 'blog'){

            data.model = new PagesBlog()
            view.current_sub_view = 'Blog'
            data.table = 'pages_blog'
            data.edit_link = 'pages/blog'
            data.edit_label = 'Blog'

        } else if (req.params.page == 'forms'){

            data.tabs = data.element_tabs
            data.model = new PagesForms()
            view.current_sub_view = 'Forms'
            data.table = 'pages_forms'
            data.edit_link = 'pages/forms'
            data.edit_label = 'Form'

        } else if (req.params.page == 'menus'){

            data.tabs = data.element_tabs
            data.model = new PagesMenus()
            view.current_sub_view = 'Menus'
            data.table = 'pages_menus'
            data.edit_link = 'pages/menus'
            data.edit_label = 'Menu'

        } else if (req.params.page == 'faqs'){

            data.tabs = data.element_tabs
            data.model = new PagesFaqs()
            view.current_sub_view = 'FAQs'
            data.table = 'pages_faqs'
            data.edit_link = 'pages/faqs'
            data.edit_label = 'FAQ'

        } else if (req.params.page == 'testimonials'){

            data.tabs = data.element_tabs
            data.model = new PagesTestimonials()
            view.current_sub_view = 'Testimonials'
            data.table = 'pages_testimonials'
            data.edit_link = 'pages/testimonials'
            data.edit_label = 'Testimonial'

        } else {
            res.render(settings.views+'/dashboard/settings.ejs',data)
        }

        data.include_scripts = ['dashboard/views/scripts/script.ejs',settings.views+'/dashboard/scripts/dashboard_scripts.ejs']
        data.include_styles = [settings.views+'/dashboard/styles/style.ejs']

        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields
        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/:pages_type/:slug?', async (req, res, next) => {

        if (typeof Cart == 'function'){
            data.include_scripts = [settings.views+'/scripts/script.ejs']
            data.cart = await new Cart().init(req)
        }

        data.include_styles = []

        res.locals.functions = functions

        let pages_type = false,
            slug,
            pages

        if (req.params.slug){
            pages_type = await new PagesCategories().find(['slug == '+req.params.pages_type])
            slug = req.params.slug
        } else {
            slug = req.params.pages_type
        }

        if (typeof pages_type == 'object' && pages_type.data && pages_type.data._key){ // found pages type and find the article data

            let article

            try {
                article = await new PagesWebsite().find(['slug == '+slug,'type == '+pages_type.data._key, 'status == published'])
            }

            catch(err){
                console.log(err)
                article = {
                    data:''
                }
            }


            if (article.data.length == 0 || article.error){
                //console.log("article not found")
                next()
            } else {
            //    console.log("article found")
                data.include_scripts = []
                data.blocks = blocks
                data.title = article.data.title
                data.table = 'pages'
                data.key = article.data._key
                data.date = article.data._updated
                data.pages = article.data
                data.meta = article.data.meta
                data.pages_type = pages_type.data
                data.forms = await functions.findForms(article.data.blocks)
                data.faqs = await functions.findFAQs(article.data.blocks)
            //    data.recent = await functions.getRecent(pages_type,article._key)

                res.render(settings.views+'/view.ejs',data)

            }

        } else { // check pages types first, and then check for articles

            pages_category = await new PagesCategories().find(['slug == '+slug])

            if (typeof pages_category.data == 'object' && pages_category.data._key){ // show a list of articles from that pages type

                let articles = await new PagesWebsite().all(['type == '+pages_category.data._key, 'status == published'])

                data.pages_category = pages_category.data
                data.articles = articles.data
                data.meta = pages_category.data.meta
                res.render(config.site.theme_path+'/templates/pages/list.ejs',data)

            } else { // if it's not a pages type, check for page pages

                let article

                try {
                    article = await new PagesWebsite().find(['slug == '+slug, 'status == published'])
                }

                catch(err){
                    console.log(err)
                    article = {
                        data:''
                    }
                }

                if (Object.keys(article).length == 0 || article.error){

                    next()

                } else {

                    data.blocks = blocks
                    data.title = article.data.title
                    data.table = 'pages'
                    data.key = article.data._key
                    data.date = article.data._updated
                    data.pages = article.data
                    data.meta = article.data.meta
                    data.forms = await functions.findForms(article.data.blocks)
                    data.faqs = await functions.findFAQs(article.data.blocks)

                    res.render(settings.views+'/view.ejs',data)

                }

            }

        }

    })

    routes.get('/blog/:slug', async (req, res) => {

        view.current_view = 'blog'

        data.include_scripts = [settings.views+'/scripts/script.ejs']

        data.article = await new PagesBlog().all(['slug == '+req.params.slug])
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

        data.recent_articles = await new PagesBlog().getRecent(data.article._key)

        res.render(config.site.theme_path+'/templates/blog/view.ejs',data)

    })

    routes.get('/blog', async (req, res) => {

        view.current_view = 'blog'

        data.include_scripts = [settings.views+'/scripts/script.ejs']
        data.title = 'Blog Archive'
        data.articles = await new PagesBlog().all(['status == published'])
        data.articles = data.articles.get()

        data.articles.sort((a,b)=>{
            return b._created.localeCompare(a._created)
        })

        res.render(config.site.theme_path+'/templates/blog/list.ejs',data)

    })

    routes.post('/submit-form', async (req,res) => {

        if (req.session.submission && moment().diff(req.session.submission,'minutes') < 5){
            req.session.submission = moment()
            res.status(429).send('Your previous message has been sent, we will respond as soon as possible')
            return false
        }

        let content = 'You have a new message submitted via the website.<br><br>',
            contact,
            form_id = false

        req.body.map((field)=>{

            if (field.name == 'form_id'){
                form_id = field.value
            } else {
                content += '<b>'+field.name.replace(/_/g,' ').replace(/(^\w{1})|(\s{1}\w{1})/g, match => match.toUpperCase())+'</b>: '+field.value+'<br>'
            }

        })

        content += '<br><br>Sent from '+config.site.name

        if (form_id){

            let form_data = await new PagesForms().find(form_id)
            form_data = form_data.get()

            if (form_data && form_data.send_to_mailbox === true){
                contact = await new Notification().setContent('New Website Message',content).mailbox()
            }

            if (form_data && form_data.replies_to){
                contact = await new Notification(form_data.replies_to).setContent('New Website Message',content).email()
            }

        } else {

            if (config.site.form_settings && config.site.form_settings.method && config.site.form_settings.method == 'mailbox'){
                contact = await new Notification().setContent('New Website Message',content).mailbox()
            } else if (config.site.form_settings && config.site.form_settings.method && config.site.form_settings.method == 'sms'){
                contact = await new Notification(config.site.form_settings.to).setContent('New Website Message',content).sms()
            } else {
                contact = await new Notification(config.site.form_settings.to).setContent('New Website Message',content).email()
            }

        }

        req.session.submission = moment()
        res.send(contact)

    })

    functions.parseBlocks().then((pages_blocks)=>{
        blocks = pages_blocks
    })
    //
    // functions.launchPuppeteer()


// export




    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
