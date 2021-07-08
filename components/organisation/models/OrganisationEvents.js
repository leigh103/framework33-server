
    const CalendarEvents = require(basedir+'/modules/CalendarEvents')

    class OrganisationEvents extends CalendarEvents {

        constructor(data){

            super(data)

            this.statuses = [
                {text:'None', value:'none'},
                {text:'Unconfirmed', value:'unconfirmed'},
                {text:'Confirmed', value:'confirmed'},
                {text:'Cancelled', value:'cancelled'}
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
                collection: 'organisation_events',
                fields: [
                    {name:'start_date',input_type:'datetime', type:'date', required:true},
                    {name:'end_date',input_type:'datetime', type:'date', required:true},
                    {name:'status', input_type:'select', type:'string', options: this.statuses, required: true},
                    {name:'color', input_type:'select', type:'string', options: this.colors, required: false},
                    {name:'provider', input_type:'select', option_data: 'OrganisationStaff', placeholder: 'Provider', type: 'string', required:true},
                    {name:'subject',input_type:'text',placeholder:'Enter Appointment Subject', type:'string', required:true},
                    {name:'description',input_type:'textarea', placeholder:'Enter Appointment Subject', type:'string', required:false},
                    {name:'create_automation', input_type:'checkbox', placeholder:'Set Reminder', type:'boolean', required: false},
                    {name:'automation_delay', input_type:'select', type:'string', placeholder:'Reminder Time', options: this.delay, required: false},
                    {name:'pupils', tab:'pupils',input_type:'array',placeholder:'Pupils', type: 'array', required:false, subitems:[
                        {name:'id',input_type:'search_select', text_field:'full_name', type:'string', required:false, option_data: 'ClientUsers'}
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

    module.exports = OrganisationEvents
