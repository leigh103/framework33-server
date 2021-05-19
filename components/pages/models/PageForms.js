
    const Models = require(basedir+'/modules/Models')

    class PageForms extends Models {

        constructor(data){

            super(data)

            this.input_types = [
                {text:"Text",value:"text"},
                {text:"Textarea",value:"textarea"},
                {text:"Select",value:"select"},
                {text:"Checkbox",value:"checkbox"},
                {text:"Tel",value:"tel"},
                {text:"Email",value:"email"},
            ]

            this.settings = {
                collection: 'page_forms',
                fields: [
                    {name:'name',input_type:'text',placeholder:'Enter form name', type:'string', required:true},
                    {name:'fields',input_type:'array',placeholder:'Form Fields', type:'array', required:false, subitems:[
                        {name:'label',input_type:'text',placeholder:'Field Label', type:'string', required:true},
                        {name:'input_type',input_type:'select',options:this.input_types, placeholder:'Field Type', type:'string', required:true},
                        {name:'required',input_type:'checkbox',placeholder:'This field is required', type:'boolean', required:false}
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

    module.exports = PageForms
