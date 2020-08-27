//
// Content Module
// Dashboard and frontend CMS
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'root',
        views: 'content/views',
        menu: {
            side_nav: [
                {link:'Content',slug: '/dashboard/content', weight:3}
            ]
        }
    },


// methods


    functions = {

        parseStyle:(style) => {

            let str = ''

            if (style.background){
                if (style.background.color){
                    str += 'background-color: '+style.background.color+';'
                }
                if (style.background.image){
                    str += 'background-image: url('+style.background.image+');background-size:cover;background-repeat: no-repeat; background-position:center center;'
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

            return new Promise(function(resolve, reject) {

                var blocks = {}
                fs.readdir(basedir+'/components/content/templates/blocks', (err, files) => {

                    if (err){
                        reject(err)
                    } else {

                        files.forEach(async (file, index) => {

                            await fs.readFile(basedir+'/components/content/templates/blocks/'+file, function read(err, data) {
                                if (err) {
                                    throw err;
                                }
                                data = data+''
                                block_name = file.replace(/\.[a-z]+$/,'').replace(/\s/g,'-')
                                blocks[block_name] = {}
                                blocks[block_name].html = data.replace(/\r|\n/g,'').replace(/app\-field\=['"]/g,'id="'+block_name+'-')
                                blocks[block_name].block = block_name
                                blocks[block_name].name = data.match(/app\-block\=['"](.*?)['"]/)
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
                                    }
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

                                if (index >= files.length-1){
                                    resolve(blocks)
                                }

                            });

                        })

                    }

                })

            })

        },

        getRecent:async (type,key) => {

            let articles = await new Content().all(['type == '+type]).get(),
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


    let data = {
        include_scripts: [settings.views+'/dashboard/scripts/script.ejs','dashboard/views/scripts/editor.ejs'],
        include_styles: [settings.views+'/dashboard/styles/style.ejs']
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

    routes.get('/', async (req, res, next) => {

        res.locals.functions = functions

        let article = await new Content().find(['slug == homepage','status == published'])

        if (article.data.length == 0 || article.error){

            next()

        } else {

            data.blocks = blocks
            data.title = article.data.title
            data.date = article.data._updated
            data.meta = article.data.meta
            data.content = article.data

            res.render(settings.views+'/view.ejs',data)

        }

    })

    routes.get('/dashboard/content/get-blocks/:name?', (req, res) => {

        if (blocks[req.params.name]){
            functions.parseBlocks().then((blocks)=>{
                res.json(blocks[req.params.name])
            }).catch((err)=>{
                res.status(500).send(err)
            })
        } else {
            functions.parseBlocks().then((content_blocks)=>{
                data.blocks = content_blocks
                blocks = content_blocks
                res.json(blocks)
            }).catch((err)=>{
                res.status(500).send(err)
            })
        }

    })

    routes.get('/dashboard/content/:type?/:edit?/:key?', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Content'
        }

        if (req.params.edit == 'new' || req.params.key || req.params.key == '0'){

            if (req.params.key == 'context._key'){
                res.redirect('/dashoard/content/page/edit/0')
            }

            view.current_view = 'content'
            data.title = 'Content'
            data.table = 'content'
            data.content_type = req.params.type
            data.content_key = req.params.key
            data.fields = new Content().settings.fields

            functions.parseBlocks().then((content_blocks)=>{
                data.blocks = content_blocks
                blocks = content_blocks
                res.render(settings.views+'/dashboard/editor.ejs',data)
            })

        } else if (req.params.type){

            view.current_view = 'content'
            data.title = 'Content'
            data.table = 'content'
            data.content_type = req.params.type
            data.fields = new Content().settings.fields
            res.render(settings.views+'/dashboard/content.ejs',data)

        } else {

            view.current_view = 'content'
            data.title = 'Content'
            data.table = 'content_types'
            data.fields = new ContentTypes().settings.fields
            res.render(settings.views+'/dashboard/content_types.ejs',data)

        }

    })

    routes.get('/:content_type/:slug?', async (req, res, next) => {

        res.locals.functions = functions

        let content_type = false,
            slug,
            content

        if (req.params.slug){
            content_type = req.params.content_type
            slug = req.params.slug
        } else {
            slug = req.params.content_type
        }

        if (content_type){ // get the article data
            // console.log('getting article with ct', slug, content_type)
            let article = await new Content().find(['slug == '+slug,'type == '+content_type])

            if (article.data.length == 0 || article.error){
                //console.log("article not found")
                next()
            } else {
            //    console.log("article found")
                data.blocks = blocks
                data.title = article.data.title
                data.date = article.data._updated
                data.content = article.data
                data.meta = article.data.meta
                data.content_type = content_type
                data.recent = await functions.getRecent(content_type,article._key)

                res.render(settings.views+'/view.ejs',data)

            }

        } else { // check content types first, and then check for articles

            content = await new ContentTypes().find(['slug == '+slug])

            if (content.data.length == 0 || content.error){ // if it's not a content type, check for page content

                let article = await new Content().find(['slug == '+slug,'type == page'])

                if (article.data.length == 0 || article.error){

                    next()

                } else {

                    data.blocks = blocks
                    data.title = article.data.title
                    data.date = article.data._updated
                    data.content = article.data
                    data.meta = article.data.meta
                    data.recent = await functions.getRecent(content_type,article._key)

                    res.render(settings.views+'/view.ejs',data)

                }

            } else { // show a list of articles from that content type

                let articles = await new Content().all(['type == '+slug])

                data.content_type = content.data
                data.articles = articles.data
                data.meta = content.data.meta
                res.render(settings.views+'/list.ejs',data)

            }

        }

    })

    routes.post('/submit-form', async (req,res) => {

        if (req.session.submission && moment().diff(req.session.submission,'minutes') < 5){
            req.session.submission = moment()
            res.status(429).send('Too many requests, please try later')
            return false
        }

        let content = 'You have a new message submitted via the website.<br><br>'
        req.body.map((field)=>{
            content += '<b>'+field.name.replace(/(^\w{1})|(\s{1}\w{1})/g, match => match.toUpperCase())+'</b>: '+field.value+'<br>'
        })
        content += '<br><br>Sent from '+config.site.name

        let email = await new Notification(config.admin.email).setContent('New Website Message',content).email()
        req.session.submission = moment()
        res.send(email)

    })

    functions.parseBlocks().then((content_blocks)=>{
        blocks = content_blocks
    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
