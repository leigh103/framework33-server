
    var last_rotate = moment()

    class Log {

        constructor(user, method, document_id, message, ip_address, backup){

            this.data = {
                user: user,
                method: method,
                document_id: document_id,
                message: message,
                ip_address: ip_address
            }

            if (backup){

                if (Array.isArray(backup)){
                    backup = backup[0]
                }
                this.data.backup = backup
            }

            this.settings = {
                collection: 'log',
                fields: [
                    {name:'user', type:'string', required:false},
                    {name:'method', type:'string', required:false},
                    {name:'document_id',type:'string', required:false},
                    {name:'message',type:'string', required:false},
                    {name:'ip_address',type:'string', required:false}
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

        async save() {

            this.data = await DB.create(this.settings.collection,this.data)

            if (moment().diff(last_rotate,'days') > 1){
                let log_rotate_date = moment().subtract(config.modules.db.log_rotate, 'days').toISOString()
                DB.read(this.settings.collection).where(['_created < '+log_rotate_date]).delete()
                last_rotate = moment()
            }

            return this

        }

        search(str, sort) {

            if (!sort){
                sort = {
                    dir: 'DESC',
                    field: '_updated'
                }
            }

            if (str.length < 3){

                this.data = []// DB.read(this.settings.collection).limit(30).get()
                return this

            } else {

                let filter = []

                if (this.settings.search_fields){
                    for (var field of this.settings.search_fields){
                        filter.push(field+' like '+str)
                    }

                } else {
                    filter.push('name like '+str.toLowerCase())
                }

                this.data = DB.read(this.settings.collection).orWhere(filter).orderBy(sort.field, sort.dir).get()
                return this

            }

        }

    }

    module.exports = Log
