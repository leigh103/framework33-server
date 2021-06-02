
    const Models = require(basedir+'/modules/Models')

    class Reports extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'reports',
                fields: [
                    {name:'name',input_type:'text',placeholder:'Name', type:'string', required:true},
                    {name:'description',input_type:'textarea',placeholder:'Description', type:'string', required:false},
                    {name:'view',input_type:'text',placeholder:'View', type:'string', required:false},
                    {name:'model',input_type:'text',placeholder:'Model', type:'string', required:true},
                    {name:'date_from',input_type:'date',placeholder:'Date from', type:'string', required:false},
                    {name:'date_to',input_type:'date',placeholder:'Date to', type:'string', required:false},
                    {name:'data',input_type:'hidden', required:false, type:''}
                ],
                allow_new: false
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

        async toCSV(){

            if (!this.data || !this.data.result){
                this.error = "No data for CSV conversion"
                return this
            }

            this.csv = '"Report","'+this.data.name+'"\r\n"'

            if (this.data.date_from && this.data.date_to){
                this.csv += '"From","'+moment(this.data.date_from).format('Do MMMM YYYY h:mma')+'"\r\n"To","'+moment(this.data.date_to).format('Do MMMM YYYY h:mma')+'"\r\n\r\n'
            }

            for (let row of this.data.result){

                if (row.type == 'chart'){

                    this.csv += '\r\n'

                    this.csv += '""'

                    for (var i of row.data.labels){
                        this.csv += ',"'+i+'"'
                    }
                    this.csv += '\r\n"'+row.label+'"'
                    for (var ii of row.data.values){
                        this.csv += ',"'+ii+'"'
                    }

                    this.csv += '\r\n\r\n'


                } else {
                    this.csv += '"'+row.label+'","'+row.data+'"\r\n'
                }

            }

            return this.csv

        }

    }

    module.exports = Reports
