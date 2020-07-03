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
                {link:'Content',slug: '/dashboard/content', weight:1}
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

        }

    }


// routes


    let data = {
        include_scripts: [settings.views+'/dashboard/scripts/script.ejs'],
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


    routes.get('/dashboard/content/get-blocks/:name?', (req, res) => {

        if (blocks[req.params.name]){
            res.json(blocks[req.params.name])
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

    routes.get('/dashboard/content/:type?/:key?', async(req, res) => {

        if (req.params.key || req.params.key == '0'){

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

        let content_type, slug

        if (req.params.slug){
            content_type = req.params.content_type
            slug = req.params.slug
        } else {
            slug = req.params.content_type
        }

        let data = {
            user:req.session.user
        }

        let content = await new Content().find(['slug == '+slug])

        if (content.data.length == 0 || content.error){
            next()
        } else {
            data.blocks = blocks
            data.title = content.data.title
            data.date = content.data._updated
            data.content = content.data
            res.render(settings.views+'/view.ejs',data)
        }

    })

    functions.parseBlocks().then((content_blocks)=>{
        blocks = content_blocks
    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
