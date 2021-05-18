
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
        site: {
            name: config.site.name,
            url: config.site.url,
            logo: config.site.logo
        },
        contact: {
            tel: config.site.tel,
            email: config.site.form_settings.to
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

            getModelBackLink: () => {
                view.current_back_link = view.current_url.split('/')
                view.current_back_link.pop()
                return view.current_back_link.join('/')
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

            parseCamelCase:(input) => {
                return input.match(/[A-Z][a-z]+/g).join(' ')
            },

            capitalise:(str, lower = false) => {
                return (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
            },

            parseDate:(date, format)=>{
                return moment(date).format(format)
            },

            getOptionData: async (field)=>{

                let data = []
                if (field.option_data && global[field.option_data] && typeof global[field.option_data] == 'function'){
                    data = await new global[field.option_data]().allFields(['_key','name'])
                }
                return data

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

            getPrice: (item, parse) => {

                if (item.adjustment){

                    if (item.original_price){
                        item.price = item.original_price
                    }

                    if (typeof item.adjustment == 'string' && item.adjustment.match(/%/)){

                        item.adjustment_value = item.adjustment.replace(/\$|\£|\#|p/,'')

                        item.adjustment_value = parseInt(item.adjustment_value.replace(/%/,''))
                        item.adjustment_value = (item.price/100)*item.adjustment_value
                        item.original_price = item.price
                        item.price = parseInt(item.price)+item.adjustment_value

                        item.adjustment_value = item.adjustment

                    } else {

                        item.original_price = item.price
                        item.adjustment_value = parseInt(item.adjustment)
                        item.price = parseInt(item.price)+parseInt(item.adjustment)

                        if (item.adjustment_value < 0){
                            item.adjustment_value = Math.abs(item.adjustment_value)
                        }

                        item.adjustment_value = (item.adjustment_value/100).toFixed(2)

                    }



                }

                if (parse){
                    return view.functions.parseCurrency(item.price)
                } else {
                    return parseInt(item.price)
                }


            },

            parseCurrency:(price)=>{
                let price_int = parseInt(price)
                if (price_int){
                    return '£'+(price_int/100).toFixed(2)
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

                fields = fields.map((field,i)=>{

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

                    let re = RegExp(field)

                    return field
                        // if (fields.length == 1){
                        //     output += field
                        // } else if (i == fields.length-1){
                        //     output += 'or '+field
                        // } else if (i == fields.length-2){
                        //     output += field+' '
                        // } else {
                        //     output += field+', '
                        // }

                }).filter((v, i, a) => a.indexOf(v) === i)

                fields = fields.join(', ').toLowerCase()
                return fields.replace(/,(?=[^,]*$)/, ' or')
            },

            gradient:(startColor, endColor, steps) => {
                 var start = {
                         'Hex'   : startColor,
                         'R'     : parseInt(startColor.slice(1,3), 16),
                         'G'     : parseInt(startColor.slice(3,5), 16),
                         'B'     : parseInt(startColor.slice(5,7), 16)
                 }
                 var end = {
                         'Hex'   : endColor,
                         'R'     : parseInt(endColor.slice(1,3), 16),
                         'G'     : parseInt(endColor.slice(3,5), 16),
                         'B'     : parseInt(endColor.slice(5,7), 16)
                 }
                 diffR = end['R'] - start['R'];
                 diffG = end['G'] - start['G'];
                 diffB = end['B'] - start['B'];

                 stepsHex  = new Array();
                 stepsR    = new Array();
                 stepsG    = new Array();
                 stepsB    = new Array();

                 for(var i = 0; i <= steps; i++) {
                         stepsR[i] = start['R'] + ((diffR / steps) * i);
                         stepsG[i] = start['G'] + ((diffG / steps) * i);
                         stepsB[i] = start['B'] + ((diffB / steps) * i);
                         stepsHex[i] = '#' + Math.round(stepsR[i]).toString(16) + '' + Math.round(stepsG[i]).toString(16) + '' + Math.round(stepsB[i]).toString(16);
                 }
                 return stepsHex;

             },

             findMedian:(values) => {
                if(values.length ===0) return 0;

                values.sort(function(a,b){
                return a-b;
                });

                var half = Math.floor(values.length / 2);

                if (values.length % 2)
                return values[half];

                return (values[half - 1] + values[half]) / 2.0;
            }

        }
    }

    module.exports = view
