
    const CalendarEvents = require(basedir+'/modules/CalendarEvents')

    class Appointments extends CalendarEvents {

        constructor(data){

            super(data)

            this.statuses = [
                {text:'None', value:'none'},
                {text:'Unconfirmed', value:'unconfirmed'},
                {text:'Confirmed', value:'confirmed'},
                {text:'Complete', value:'complete'},
                {text:'Cancelled', value:'cancelled'},
                {text:'Cancel Requested', value:'cancel_requested'},
                {text:'Reschedule Requested', value:'reschedule_requested'},
                {text:'Staff Appointment', value:'staff_appointment'}
            ]

            this.colors = [
                {text:'Use status colour', value:''},
                {text:'Red', value:'red'},
                {text:'Green', value:'green'},
                {text:'Blue', value:'blue'},
                {text:'Grey', value:'grey'}
            ]

            this.delay = [
                {text:'At time of appointment', value:'0'},
                {text:'10 minutes before', value:'10'},
                {text:'30 minutes before', value:'30'},
                {text:'1 hour before', value:'60'},
                {text:'2 hours before', value:'120'},
                {text:'1 day before', value:'1440'}
            ]

            this.settings = {
                collection: 'appointments',
                fields: [
                    {name:'start_date',input_type:'datetime', type:'date', required:true, format:'ddd Do MMMM YYYY h:mma'},
                    {name:'end_date',input_type:'datetime', type:'date', required:true, format:'ddd Do MMMM YYYY h:mma'},
                    {name:'status', input_type:'select', type:'string', options: this.statuses, required: true},
                    {name:'color', input_type:'select', type:'string', options: this.colors, required: false},
                    {name:'provider', input_type:'select', option_data: config.calendar.models.provider, placeholder: 'Provider', type: 'string', required:true},
                    {name:'subject',input_type:'text',placeholder:'Enter Appointment Subject', type:'string', required:true},
                    {name:'description',input_type:'textarea', placeholder:'Enter Appointment Subject', type:'string', required:false},
                    {name:'create_automation', input_type:'checkbox', placeholder:'Set Reminder', type:'boolean', required: false},
                    {name:'automation_delay', input_type:'select', type:'string', placeholder:'Reminder Time', options: this.delay, required: false},
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


    }

    module.exports = Appointments
