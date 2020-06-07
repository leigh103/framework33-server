
    const path = require('path')

    var view = {
        logo: config.site.logo,
        menus: {},
        dont_track: ["/login"],
        meta:{
            title: 'ReformedReality'
        },
        basedir: global.basedir,
        functions:{

            getPath:() => {
                return path.dirname(__filename)
            },

            isPlural:(input)=>{
                return input.match(/(s|ies)$/)
            },

            depluralise:(input)=>{

                let plural = view.functions.isPlural(input)

                if (plural){
                    let re = RegExp(plural[0]+'$')
                    return input.replace(re,'')
                } else {
                    return input
                }

            },

            parseName:(input, depluralise)=>{
                input = input.replace(/^_/,'').replace(/_/g,' ')
                input = view.functions.capitalise(input)

                if (depluralise){
                    return view.functions.depluralise(input)
                } else {
                    return input
                }
            },

            parseSnake:(input)=>{
                return input.replace(/\s/g,'_').toLowerCase
            },

            capitalise:(str, lower = false) => {
                return (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
            },

            parseDate:(date, format)=>{
                return moment(date).format(format)
            },

            getDay:(date)=>{

                var dayNames = {1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun'}
                date = new Date(date)
                return dayNames[date.getDay()]

            },

            getDate:(date)=>{

                date = new Date(date)
                return date.getDate()

            },

            getMonth:(date)=>{

                var months = ['January','Febuary','March','April','May','June','July','August','September','October','November','December']
                date = new Date(date)
                return months[date.getMonth()]+' '+date.getFullYear()

            },

            parseTime:(time)=>{

                time = time.toString().split("")

                if (time.length == 3){
                    return '0'+''+time[0]+':'+time[1]+''+time[2]
                } else {
                    return time[0]+''+time[1]+':'+time[2]+''+time[3]
                }

            }
        }
    }

    module.exports = view
