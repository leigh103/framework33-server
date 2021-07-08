
    const Models = require(basedir+'/modules/Models')

    class PagesFaqs extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'pages_faqs',
                fields: [
                    {name:'question',input_type:'text',placeholder:'Question', type:'string', required:true},
                    {name:'answer',input_type:'textarea',placeholder:'Answer', type:'string', required:true},
                    {name:'type',input_type:'select',options:config.site.testimonial_types, type:'string', required:true}
                ],
                search_fields: ['question', 'answer','type']
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
                        getTypes:['admin']
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

        getTypes(){

            return config.site.faq_types

        }

    }

    module.exports = PagesFaqs
