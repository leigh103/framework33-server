
    const path = require('path')

    var view = {
        logo: config.site.logo,
        websocket: config.websocket,
        menus: {},
        dont_track: ["/login"],
        meta:{
            title: config.site.name,
            description:"A NodeJS based backend and frontend platform",
            url: config.site.url,
            logo: config.site.logo
        },
        ecommerce:{
            shop:{
                name: 'Framework-33 Shop',
                slug: 'shop',
                sub_title: 'Showcase of the products module for Framework-33',
                description: 'Lorem ipsum dolor sit amet, eos duis intellegam ex, ne quas probo aliquando est. Has habemus percipit iudicabit no. Neglegentur concludaturque in ius, nec te quot doming quaeque, cum mundi laudem temporibus ad. Vim vidit everti eu, has te nulla accusam. Amet vituperata an mea. Vim cu utinam everti saperet, ius in mundi vivendo omittantur, sale decore at qui.'
            },
            cart_name: 'cart'
        },
        users: config.users,
        basedir: global.basedir,
        functions:{

            getPath:() => {
                return path.dirname(__filename)
            },

            isPlural:(input)=>{
                if (input && typeof input == 'string'){
                    return input.match(/(s|ies)$/)
                } else {
                    return input
                }
            },

            depluralise:(input)=>{

                let plural = view.functions.isPlural(input)

                if (plural && input && typeof input == 'string'){
                    let re = RegExp(plural[0]+'$')

                    if (input.match(/ies/)){
                        return input.replace('ies','y')
                    } else {
                        return input.replace(re,'')
                    }

                } else {
                    return input
                }

            },

            truncate:(input, words) => {
                if (!words){
                    words = 10
                }
                return input.split(" ").splice(0,words).join(" ")
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

            getOptionData:(table)=>{

                table = parseClassName(table)

                if (table && global[table] && typeof global[table] == 'function'){
                    let data = new global[table]().all().get()
                    return data
                } else {
                    return []
                }

            },

            getDay:(date)=>{

                var dayNames = {1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun'}
                date = new Date(date)
                return dayNames[date.getDay()]

            },

            getTimeOfDay:(date)=>{

                if (!date){
                    date = moment().format('HH')
                } else {
                    date = moment(date).format('HH')
                }

                if (date < 12){
                    return 'Morning'
                } else if (date >= 12 && date < 17){
                    return 'Afternoon'
                } else {
                    return 'Evening'
                }

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
