
    const Models = require(basedir+'/modules/Models')

    class PageMenus extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'page_menus',

                fields: [
                    {name:'name',input_type:'text',placeholder:'Enter menu name', type:'string', required:true},
                    {name:'fields',input_type:'array',placeholder:'Form Fields', type:'array', required:false, subitems:[
                        {name:'text',input_type:'text',placeholder:'Menu item link text', type:'string', required:true},
                        {name:'url',input_type:'text',placeholder:'Menu item URL', type:'string', required:true},
                        {name:'icon',input_type:'image',placeholder:'Menu item icon', type:'image', required:false}
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

    }

    module.exports = PageMenus
