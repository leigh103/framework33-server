
    const Models = require(basedir+'/modules/Models'),
        image = new Image()

    class MediaLibrary extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'media_library',
                fields: [
                    {name:'name',input_type:'text',placeholder:'Media Title',type:'string', required:true},
                    {name:'upload',input_type:'file',placeholder:'Upload',type:'media',required:true},
                    {name:'url',type:'string', required:false},
                    {name:'full_path', type:'string', required:false},
                    {name:'type', type:'string', required:false},
                    {name:'file_type', type:'string', required:false},
                    {name:'tags',input_type:'text',placeholder:'Tags', type:'string', required:false}
                ],
                search_fields:['url','tags','type', 'file_type'],
            }

            this.routes = {
                public: { // unauth'd routes

                },
                private: { // auth'd routes
                    get: {
                        all:['admin'],
                        search:['admin'],
                        find:['admin']
                    },
                    post: {
                        save:['admin'],
                        delete:['admin']
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

        async preDelete(){

            if (this.data && this.data.url){
                await image.delete(this.data.url)
            }

            return this

        }


    }

    DB.createCollection('media_library')

    module.exports = MediaLibrary
