
    const Models = require(basedir+'/modules/Models')

    class PageTestimonials extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'page_testimonials',
                fields: [
                    {name:'name',input_type:'text',placeholder:'Author', type:'string', required:true},
                    {name:'description',input_type:'text',placeholder:'Author Description', type:'string', required:false},
                    {name:'quote',input_type:'textarea',placeholder:'Quote', type:'string', required:true},
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

    module.exports = PageTestimonials
