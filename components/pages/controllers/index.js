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
                {link:'Pages',slug: '/dashboard/pages', protected_guards:['admin'], weight:2, icon:'<span class="icon screen"></span>', subitems:[
                    {link:'Pages Types',slug: '/dashboard/pages/pages-types', weight:1}
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

        findForms: (page_blocks) => {

            return new Promise( async (resolve, reject) => {

                let forms = {}

                for (let block of page_blocks){
                    if (block.block == 'form'){

                        for (let field of block.fields){

                            if (field.field == 'form'){

                                let form = await new PageForms().find(field.value)
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

        getRecent:async (type,key) => {

            let articles = await new Pages().all(['type == '+type]).get(),
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
        model: new Pages().settings,
        tabs: [
            {href:'/dashboard/pages', text: 'Pages'},
            {href:'/dashboard/pages/settings/page-types', text: 'Page Types'},
            {href:'/dashboard/pages/settings/forms', text: 'Forms'},
            {href:'/dashboard/pages/settings/menus', text: 'Menus'},
            {href:'/dashboard/pages/settings/testimonials', text: 'Testimonials'},
            {href:'/dashboard/pages/settings/faqs', text: 'FAQs'}
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

    routes.get('/dashboard/:page(page_*)', async(req, res) => {

        let url = '/dashboard/pages/settings/'+req.params.page.replace(/page_/,'')
        res.redirect(url)

    })

    routes.get('/', async (req, res, next) => {

        res.locals.functions = functions

        data.include_scripts = []

        if (typeof Cart == 'function'){
            data.include_scripts = [settings.views+'/scripts/script.ejs']
            data.cart = await new Cart().init(req)
        }

        let article = await new Pages().find(['slug == homepage','status == published'])

        if (!article.data || article.error){

            next()

        } else {


            data.blocks = blocks
            data.title = article.data.title
            data.date = article.data._updated
            data.meta = article.data.meta
            data.pages = article.data
            data.forms = await functions.findForms(article.data.blocks)

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
            data.date = render_pages._updated
            data.meta = render_pages.meta
            data.pages = render_pages
            data.forms = await functions.findForms(render_pages.blocks)

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

    routes.get('/dashboard/pages/settings/:page/:key', async(req, res) => {

        data.include_scripts = ['dashboard/views/scripts/script.ejs']
        data.query = ''
        view.current_view = 'pages'

        let title_prefix = 'New'
        if (req.params.key != 'new'){
             title_prefix = 'Edit'
        }

        if (req.params.page == 'page-types'){

            data.title = title_prefix+' Page Types'
            data.table = 'page_types'
            data.model = new PageTypes()
            data.key = req.params.key
            data.fields = await data.model.parseEditFields()

        } else if (req.params.page == 'forms'){

            data.title = title_prefix+' Forms'
            data.table = 'page_forms'
            data.model = new PageForms()
            data.key = req.params.key
            data.fields = await data.model.parseEditFields()

        } else if (req.params.page == 'menus'){

            data.title = title_prefix+' Menus'
            data.table = 'page_menus'
            data.model = new PageMenus()
            data.key = req.params.key
            data.fields = await data.model.parseEditFields()

        } else if (req.params.page == 'faqs'){

            data.title = title_prefix+' Frequently Asked Questions'
            data.table = 'page_faqs'
            data.model = new PageFaqs()
            data.key = req.params.key
            data.fields = await data.model.parseEditFields()

        } else if (req.params.page == 'testimonials'){

            data.title = title_prefix+' Testimonial'
            data.table = 'page_testimonials'
            data.model = new PageTestimonials()
            data.key = req.params.key
            data.fields = await data.model.parseEditFields()

        }

        res.render(basedir+'/components/dashboard/views/edit.ejs',data)

    })

    routes.get('/dashboard/pages/settings/:page?', async (req, res) => {

        data.meta = {
            title: config.site.name+' | Page Settings',
        }

        view.current_sub_view = req.params.page

        if (req.params.page){
            view.current_sub_view = req.params.page
        }

        view.current_view = 'pages'

        if (req.params.page == 'page-types'){

            data.title = 'Page Types'
            data.model = new PageTypes().settings
            data.include_scripts = ['dashboard/views/scripts/script.ejs','dashboard/views/scripts/editor.ejs']
            data.include_styles = [settings.views+'/dashboard/styles/style.ejs']
            view.current_sub_view = 'Page Types'
            data.table = 'page_types'
            data.edit_link = 'pages/settings/page-types'
            data.fields = data.model.fields
            data.search_fields = data.model.search_fields
            res.render(basedir+'/components/dashboard/views/table.ejs',data)

        } else if (req.params.page == 'forms'){

            data.title = 'Forms'
            data.model = new PageForms().settings
            data.include_scripts = ['dashboard/views/scripts/script.ejs','dashboard/views/scripts/editor.ejs']
            data.include_styles = [settings.views+'/dashboard/styles/style.ejs']
            view.current_sub_view = 'Forms'
            data.table = 'page_forms'
            data.edit_link = 'pages/settings/forms'
            data.fields = data.model.fields
            data.search_fields = data.model.search_fields
            res.render(basedir+'/components/dashboard/views/table.ejs',data)

        } else if (req.params.page == 'menus'){

            data.title = 'Menus'
            data.model = new PageMenus().settings
            data.include_scripts = ['dashboard/views/scripts/script.ejs','dashboard/views/scripts/editor.ejs']
            data.include_styles = [settings.views+'/dashboard/styles/style.ejs']
            view.current_sub_view = 'Menus'
            data.table = 'page_menus'
            data.edit_link = 'pages/settings/menus'
            data.fields = data.model.fields
            data.search_fields = data.model.search_fields
            res.render(basedir+'/components/dashboard/views/table.ejs',data)

        } else if (req.params.page == 'faqs'){

            data.title = 'Frequently Asked Questions'
            data.model = new PageFaqs().settings
            data.include_scripts = ['dashboard/views/scripts/script.ejs','dashboard/views/scripts/editor.ejs']
            data.include_styles = [settings.views+'/dashboard/styles/style.ejs']
            view.current_sub_view = 'FAQs'
            data.table = 'page_faqs'
            data.edit_link = 'pages/settings/faqs'
            data.fields = data.model.fields
            data.search_fields = data.model.search_fields
            res.render(basedir+'/components/dashboard/views/table.ejs',data)

        } else if (req.params.page == 'testimonials'){

            data.title = 'Testimonials'
            data.model = new PageTestimonials().settings
            data.include_scripts = ['dashboard/views/scripts/script.ejs','dashboard/views/scripts/editor.ejs']
            data.include_styles = [settings.views+'/dashboard/styles/style.ejs']
            view.current_sub_view = 'Testimonials'
            data.table = 'page_testimonials'
            data.fields = data.model.fields
            data.edit_link = 'pages/settings/testimonials'
            data.search_fields = data.model.search_fields
            res.render(basedir+'/components/dashboard/views/table.ejs',data)

        } else {
            res.render(settings.views+'/dashboard/settings.ejs',data)
        }

    })

    routes.get('/dashboard/pages/:key', async(req, res) => {

        data.include_scripts = ['dashboard/views/scripts/script.ejs','dashboard/views/scripts/editor.ejs',settings.views+'/dashboard/scripts/script.ejs']
        data.include_styles = [settings.views+'/dashboard/styles/style.ejs']

        data.meta = {
            title: config.site.name+' | Pages',
        }

        view.current_view = 'pages'
        view.current_sub_view = 'pages'
        data.title = 'Pages'
        data.table = 'pages'
        data.page_key = req.params.key
        data.model = new Pages()
        data.fields = await data.model.parseEditFields()
    //    data.option_data = await view.functions.getOptionData('page_types')

        blocks = await functions.parseBlocks()
        data.blocks = blocks

        res.render(settings.views+'/dashboard/editor.ejs',data)

    })

    routes.get('/dashboard/pages', async(req, res) => {

        data.include_scripts = ['dashboard/views/scripts/script.ejs',settings.views+'/dashboard/scripts/dashboard_scripts.ejs']

        data.meta = {
            title: config.site.name+' | Pages',
        }

        delete data.edit_link

        view.current_view = 'pages'
        view.current_sub_view = 'pages'
        data.title = 'Pages'
        data.table = 'pages'
        data.pages_type = req.params.type
        data.fields = new Pages().settings
        data.search_fields = data.fields.search_fields
        data.fields = data.fields.fields

        data.context_menu = [
            {function: "viewPage",text:"View Page", icon:"eye"}
        ]

        data.option_data = await view.functions.getOptionData('page_types')

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
            pages_type = await new PageTypes().find(['slug == '+req.params.pages_type])
            slug = req.params.slug
        } else {
            slug = req.params.pages_type
        }

        if (typeof pages_type == 'object' && pages_type.data && pages_type.data._key){ // found pages type and find the article data

            let article

            try {
                article = await new Pages().find(['slug == '+slug,'type == '+pages_type.data._key, 'status == published'])
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
                data.date = article.data._updated
                data.pages = article.data
                data.meta = article.data.meta
                data.pages_type = pages_type.data
                data.forms = await functions.findForms(article.data.blocks)
            //    data.recent = await functions.getRecent(pages_type,article._key)

                res.render(settings.views+'/view.ejs',data)

            }

        } else { // check pages types first, and then check for articles

            pages_type = await new PageTypes().find(['slug == '+slug])

            if (typeof pages_type.data == 'object' && pages_type.data._key){ // show a list of articles from that pages type

                let articles = await new Pages().all(['type == '+pages_type.data._key, 'status == published'])

                data.pages_type = pages_type.data
                data.articles = articles.data
                data.meta = pages_type.data.meta
                res.render(config.site.theme_path+'/templates/pages/list.ejs',data)

            } else { // if it's not a pages type, check for page pages

                let article

                try {
                    article = await new Pages().find(['slug == '+slug, 'status == published'])
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
                    data.date = article.data._updated
                    data.pages = article.data
                    data.meta = article.data.meta
                    data.forms = await functions.findForms(article.data.blocks)

                    res.render(settings.views+'/view.ejs',data)

                }

            }

        }

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

            let form_data = await new PageForms().find(form_id)
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
