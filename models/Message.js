
    const Models = require('../modules/Models')

    class Message extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'messages',
                fields: [
                    {name:'subject',input_type:'string',placeholder:'Subject', type:'string', required:false},
                    {name:'text',input_type:'string',placeholder:'Message', type:'string', required:true},
                    {name:'_user_id',input_type:'hidden',value:'user_id', type:'user_id', required:true}
                ]
            }

            this.routes = {
                public: { // unauth'd routes

                },
                private: { // auth'd routes
                    get: {
                        search:['self'],
                        find:['self']
                    },
                    post: {
                        save:['self']
                    },
                    put: {
                        save:['self']
                    },
                    delete: {
                        delete:['self']
                    }
                }
            }

        }


    }

    module.exports = Message
