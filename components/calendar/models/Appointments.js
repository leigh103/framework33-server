
    const Models = require(basedir+'/modules/Models')

    class Appointments extends Models {

        constructor(data){

            super(data)

            this.statuses = [
                {text:'Unconfirmed', value:'unconfirmed'},
                {text:'Confirmed', value:'confirmed'},
                {text:'Complete', value:'complete'},
                {text:'Cancelled', value:'cancelled'},
                {text:'Cancel Requested', value:'cancel_requested'},
                {text:'Reschedule Requested', value:'reschedule_requested'}
            ]

            this.settings = {
                collection: 'appointments',
                fields: [
                    {name:'start_date',input_type:'datetime', type:'date', required:true},
                    {name:'end_date',input_type:'datetime', type:'date', required:true},
                    {name:'status', input_type:'select', type:'string', options: this.statuses, required: true},
                    {name:'provider', input_type:'select', option_data: config.calendar.models, placeholder: 'Provider', type: 'string', required:true},
                    {name:'subject',input_type:'text',placeholder:'Enter Appointment Subject', type:'string', required:false},
                    {name:'description',input_type:'textarea', placeholder:'Enter Appointment Subject', type:'string', required:false},

                    {name:'items', tab:'items',input_type:'array',placeholder:'Items', type: 'array', required:false, subitems:[
                        {name:'id',input_type:'search_select', type:'string', required:false, option_data: config.calendar.appointments.items}
                    ]},
                    {name:'users', tab:'users',input_type:'array',placeholder:'Users', type: 'array', required:false, subitems:[
                        {name:'id',input_type:'search_select', text_field:'full_name', type:'string', required:false, option_data: config.calendar.appointments.users}
                    ]}
                ],
                search_fields:['start_date','subject']
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
                        save:['admin'],
                        findByDate:['admin']
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

        async findByDate(data){

            let end_date = moment(data.date).set({hours:23,minutes:59,seconds:59}).toISOString(),
                appointments

            if (data.provider){
                appointments  = await DB.read(this.settings.collection).where(['start_date <= '+end_date, 'end_date >= '+data.date, 'provider == '+data.provider]).get()
            } else {
                appointments = await DB.read(this.settings.collection).where(['start_date <= '+end_date, 'end_date >= '+data.date]).get()
            }

            return appointments

        }

    }

    module.exports = Appointments
