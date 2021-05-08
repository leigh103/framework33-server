
    const Models = require(basedir+'/modules/Models')

    class Mailbox extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'mailbox',
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
                        all:['admin','self'],
                        search:['admin','self'],
                        find:['admin','self'],
                        open:['admin','self']
                    },
                    post: {
                        save:['admin','self']
                    },
                    put: {
                        save:['admin','self']
                    },
                    delete: {
                        delete:['admin','self']
                    }
                }
            }

        }

        open(){

            this.data.read = true
            this.save()
            return this.data

        }

        async registerMenus(){

            let menus = {
                menu: {
                    dashboard: [
                        {link:'Mailbox',slug:'mailbox', weight:1, query:'/dashboard/stats'}
                    ]
                }
            }

            global.addMenu(menus)
            return this

        }


    }

    module.exports = Mailbox
