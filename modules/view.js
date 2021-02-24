
    const path = require('path')

    var view = {
        logo: config.site.logo,
        websocket: config.websocket,
        menus: {},
        dont_track: ["/login"],
        meta:{
            title: config.site.name,
            description:config.site.meta_description,
            url: config.site.url,
            logo: config.site.logo
        },
        ecommerce:{
            shop:{
                name: 'Shop',
                slug: 'shop'
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

            pluralise:(input) => {

                if (typeof input != 'string'){
                    return
                }
                if (input.match(/y$/)){
                    return input.replace(/y$/,'ies')
                } else {
                    return input+'s'
                }

            },

            truncate:(input, length, chars) => {
                if (!length){
                    length = 10
                }
                if (chars){
                    return input.substring(0,length-3)+'...'
                } else {
                    return input.split(" ").splice(0,length).join(" ")
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

            getFirstName:(input) => {
                if (input.match(/\s/)){
                    return input.split(/\s/)[0]
                } else {
                    return input
                }
            },

            parseSnake:(input)=>{
                return input.replace(/\s/g,'_').toLowerCase()
            },

            capitalise:(str, lower = false) => {
                return (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
            },

            parseDate:(date, format)=>{
                return moment(date).format(format)
            },

            getOptionData: async (table)=>{

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
                    date = moment().format('H')
                } else {
                    date = moment(date).format('H')
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

            getMeta:(data) => {

                let meta = {}

                if (data.name){
                    meta.title = config.site.name+' | '+data.name
                }

                if (data.title){
                    meta.title = config.site.name+' | '+data.title
                }

                if (data.description){
                    if (data.description.length > 160){
                        meta.description = view.functions.truncate(data.description, 160, true)
                    } else {
                        meta.description = data.description
                    }

                }

                if (data.url){
                    if (data.url.match(/^http/)){
                        meta.url = data.url
                    } else {
                        meta.url = config.site.url+data.url
                    }
                }

                if (data.image){
                    meta.image = config.site.url+data.image
                }

                if (data._updated){
                    meta.updated_time = moment(data._updated).unix()
                }

                return meta

            },

            parseTime:(time)=>{

                time = time.toString().split("")

                if (time.length == 3){
                    return '0'+''+time[0]+':'+time[1]+''+time[2]
                } else {
                    return time[0]+''+time[1]+':'+time[2]+''+time[3]
                }

            },

            parseCurrency:(price)=>{
                if (!isNaN(price)){
                    price = price/100
                    return '£'+price.toFixed(2)
                } else {
                    return '£0.00'
                }
            },

            parseURL:(url)=>{
                return url.replace(/\//g,'%2F').replace(/\s/g,'%20')
            },

            stripStyle:(input) => {
                return input.replace(/style=\"|'(.*?)\"|'/g,'')
            },

            stripTags:(input) => {
                return input.replace(/<\/?[^>]+(>|$)/g, "")
            },

            parseSearchFields:(fields)=>{

                let output = ''
                fields.map((field,i)=>{

                    if (field.match(/\./)){
                        field = field.split('.').pop()
                    }

                    if (field == 'tel'){
                        field = 'mobile number'
                    }

                    if (field == 'postal_code'){
                        field = 'postcode'
                    }

                    if (field == 'full_name'){
                        field = 'name'
                    }

                    if (i == fields.length-1){
                        output += 'or '+field
                    } else if (i == fields.length-2){
                        output += field+' '
                    } else {
                        output += field+', '
                    }

                })
                return output.toLowerCase()
            },

        }
    }

    module.exports = view
