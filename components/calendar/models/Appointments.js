
    const Models = require(basedir+'/modules/Models')

    class Appointments extends Models {

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
                    {name:'start_date',input_type:'datetime', type:'date', required:true},
                    {name:'end_date',input_type:'datetime', type:'date', required:true},
                    {name:'status', input_type:'select', type:'string', options: this.statuses, required: true},
                    {name:'color', input_type:'select', type:'string', options: this.colors, required: false},
                    {name:'provider', input_type:'select', option_data: config.calendar.models, placeholder: 'Provider', type: 'string', required:true},
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

        async postSave(){

            if (this.data.create_automation === true && !this.data.linked_automation){

                this.createReminder()

            } else if (this.data.create_automation === true && this.data.linked_automation){

                let automation = await new Automations().find(this.data.linked_automation)

                if (automation && automation.data && automation.data._key){

                    let reminder_datetime = moment(this.data.start_date).utc()

                    if (this.data.automation_delay){
                        reminder_datetime.subtract(this.data.automation_delay, 'minutes')
                    }

                    reminder_datetime = reminder_datetime.toISOString()

                    automation.data.schedule = reminder_datetime
                    automation.save()

                } else {

                    this.createReminder()

                }

            } else if (this.data.create_automation === false && this.data.linked_automation){

                let automation = await new Automations().find(this.data.linked_automation)
                automation.delete()

            }

        }

        async createReminder(){

            let reminder_datetime = moment(this.data.start_date).utc(),
                reminder_date_str = reminder_datetime.format('[at] h:mma')

            if (this.data.automation_delay){
                reminder_datetime.subtract(this.data.automation_delay, 'minutes')

                if (this.data.automation_delay >= 1440){
                    reminder_date_str = reminder_datetime.format('[at] h:mma [tomorrow]')
                }
            }

            if (reminder_datetime.isAfter(moment())){

                reminder_datetime = reminder_datetime.toISOString()

                let reminder = {
                  "name": "Reminder for appointment "+this.data._key,
                  "trigger": "appointment_"+this.data._key,
                  "description": this.data.description,
                  "linked": this.data._id,
                  "schedule": reminder_datetime,
                  "delete_after_trigger":true,
                  "query": {
                    "collection": this.settings.collection,
                    "filter":["_key == "+this.data._key]
                  },
                  "actions": [
                    {
                      "method": "email",
                      "to": "{{admin_email}}",
                      "enabled": true,
                      "subject": "Appointment Reminder",
                      "content": "This is a reminder for your appointment <a href='"+config.site.url+"/dashboard/appointments/{{_key}}'>here</a>",
                      "_key": 1613660198773
                    }
                  ],
                  "type":"appointments"
                }

                let automation = await new Automations(reminder).save()

                if (automation && automation.data && automation.data._key){
                    this.data.linked_automation = automation.data._key
                    this.save()
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
