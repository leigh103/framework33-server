
    const Models = require(basedir+'/modules/Models')

    class PageMenus extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'page_menus',

                fields: [
                    {name:'name',input_type:'text',placeholder:'Enter menu name', type:'string', required:true},
                    {name:'items',input_type:'menu', type:'array', required:false, subitems:[
                        {name:'link',input_type:'text',placeholder:'Menu item link text', type:'string', required:true},
                        {name:'slug',input_type:'text',placeholder:'Menu item URL', type:'string', required:true},
                        {name:'weight',input_type:'text',placeholder:'Menu item icon', type:'string', required:false}
                    ]}
                ]
            }

            this.routes = {
                public: { // unauth'd routes
                    get: {
                        all:[],
                        search:[],
                        find:[]
                    },
                },
                private: { // auth'd routes
                    get: {

                    },
                    post: {
                        save:['admin']
                    },
                    put: {
                        save:['admin']
                    },
                    delete: {
                        delete:['admin']
                    }
                }
            }

        }

        async registerMenus(){

            let menus = await DB.read(this.settings.collection).get(),
                parsed = {
                    menu:{}
                }

            for (let menu of menus){
                parsed.menu[menu.location] = menu.items
            }

            global.addMenu(parsed)

        }

        postSave(){
            this.registerMenus()
        }

    }

    module.exports = PageMenus
