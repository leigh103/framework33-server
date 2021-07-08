
    const Models = require(basedir+'/modules/Models')

    class PagesTemplates extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'pages_templates',
                fields: [
                    {name:'title',input_type:'text',placeholder:'Page Title', type:'string', required:true},
                    {name:'notification',placeholder:'Page Notificaton', type:'string', required:false, truncate:400},
                    {name:'blocks',type:'object',required:false},
                    {name:'type',input_type:'select',option_data:'pages_categories', type:'string', required:false},
                    {name:'secondary_theme',placeholder:'Secondary theme', type:'boolean', required:false},
                    {name:'hide_top_nav',placeholder:'Hide site nav', type:'boolean', required:false}
                ],
                search_fields:['title']
            }

            this.routes = {
                public: { // unauth'd routes
                    get: {
                        find:[],
                        search:[],
                        all:[]
                    }
                },
                private: { // auth'd routes
                    get: {
                    },
                    post: {
                        save:['admin'],
                        duplicate: ['admin']
                    },
                    put: {
                        save:['admin']
                    },
                    delete: {
                        delete:['admin']
                    }
                }
            }

            this.page_types = []

        }

        async preSave(){

            if (typeof this.data._id == 'string' && this.data._id.match(/pages\_website/)){

                delete this.data._id
                delete this.data._key
                delete this.data._rev
                delete this.data._created
                delete this.data._updated
                delete this.data.status
                delete this.data.publish_on
                delete this.data.unpublish_on
                delete this.data.guard
                delete this.data.slug

                this.data.notification = ''
                this.data.title = this.data.title+' Template'

                this.data.blocks = this.data.blocks.map((block) => {

                    block.fields = block.fields.map((field) => {
                        field.value = 'This is the '+field.field
                        return field
                    })

                    return block

                })

            }

            return this

        }

        async registerMenus(){

            // let menus = {
            //     menu: {
            //         dashboard: [
            //             {link:'Add a new page template',slug:'pages/templates/new', weight:10, protected_guards:['admin']}
            //         ]
            //     }
            // }
            //
            // global.addMenu(menus)
            // return this

        }


    }

    module.exports = PagesTemplates
