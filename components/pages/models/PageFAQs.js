
    const Models = require(basedir+'/modules/Models')

    class PageFAQs extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'page_faqs',
                fields: [
                    {name:'question',input_type:'text',placeholder:'Question', type:'string', required:true},
                    {name:'answer',input_type:'textarea',placeholder:'Answer', type:'string', required:true},
                    {name:'type',input_type:'select',options:config.site.testimonial_types, type:'string', required:true}
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

    module.exports = PageFAQs
