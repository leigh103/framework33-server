const Models = require(basedir+'/modules/Models')

class CalendarEvents extends Models {

    constructor(data){

        super(data)

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

        let start_date, end_date, appointments

        if (data.date){
            end_date = moment(data.date).set({hours:0,minutes:0,seconds:0})
            start_date = moment(data.date).set({hours:23,minutes:59,seconds:59})
        } else if (data.from && data.to){
            end_date = moment(data.from).set({hours:0,minutes:0,seconds:0})
            start_date = moment(data.to).set({hours:23,minutes:59,seconds:59})
        } else {
            return []
        }

        if (data.provider){
            appointments  = await DB.read(this.settings.collection).where(['start_date <= '+start_date.toISOString(), 'end_date >= '+end_date.toISOString(), 'provider == '+data.provider]).get()
        } else {
            appointments = await DB.read(this.settings.collection).where(['start_date <= '+start_date.toISOString(), 'end_date >= '+end_date.toISOString()]).get()
        }

        let clones = []

        if (start_date.diff(end_date,'days') > 0){

            for (var appt of appointments){

                let appt_start_date = moment(appt.start_date).set({hours:0,minutes:0,seconds:0}),
                    appt_end_date = moment(appt.end_date).set({hours:23,minutes:59,seconds:59})

                let days = appt_end_date.diff(appt_start_date,'days'),
                    day_arr = [...Array(days).keys()]

                if (days > 0){

                    for (var i of day_arr){

                        let clone = JSON.parse(JSON.stringify(appt))
                        clone.start_date = appt_start_date.add(1,'day').set({hours:0,minutes:0,seconds:0}).toISOString()
                        console.log(appt_start_date)
                        clone.end_date = appt.end_date
                        clone._key = appt._key+'-'+i

                        clones.push(clone)
                    }

                }

            }

        }



        if (clones.length > 0){
            appointments = appointments.concat(clones)
        }


        return appointments

    }


}

module.exports = CalendarEvents
