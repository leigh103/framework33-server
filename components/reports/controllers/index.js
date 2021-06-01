//
// Report Component
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'dashboard/reports',
        views: 'reports/views',
        menu: {
            side_nav: [
                {link:'Reports',slug: '/dashboard/reports', icon:'<span class="icon piechart"></span>', protected_guards:['admin'], weight:4}
            ]
        }
    },


// methods


    functions = {

    }


// routes


    let data = {
        tabs: [{href: '/dashboard/reports', text:'Reports'},{href: '/dashboard/reports/results', text:'Results'}],
        include_scripts: ['dashboard/views/scripts/script.ejs', settings.views+'/scripts/script.ejs'],
        model: new Reports()
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/', async(req, res) => {

        data.title = 'Reports'
        view.current_view = 'reports'
        view.current_sub_view = 'reports'
        res.render(settings.views+'/reports.ejs', data)

    })

    routes.get('/results/:key/download', async(req, res) => {

        data.report = await new Reports().find(req.params.key)
        await data.report.toCSV()

        res.status(200).attachment(data.report.data.name+'_'+moment(data.report.data._created).format('DD-MM-YYYY-HH-MM')+'.csv').send(data.report.csv)

    })

    routes.get('/results/:key', async(req, res) => {

        data.report = await new Reports().find(req.params.key)
        data.report = data.report.data

        data.title = 'Report Results: '+data.report.name
        view.current_view = 'reports'
        view.current_sub_view = 'results'
        data.table = 'reports'
        data.key = data.report._key

        res.render(settings.views+'/report_view.ejs', data)

    })

    routes.get('/results', async(req, res) => {

        data.title = 'Report Results'
        view.current_view = 'reports'
        view.current_sub_view = 'results'
        data.table = 'reports'
        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields
        data.query = '?sort=_created'
        res.render('dashboard/views/table.ejs', data)

    })

    routes.get('/:key', async(req, res) => {

        data.report = await new Reports().find(req.params.key)
        data.report = data.report.data

        data.title = 'Report Results: '+data.report.name
        view.current_view = 'reports'
        view.current_sub_view = 'results'
        data.table = 'reports'
        data.key = data.report._key

        res.render(settings.views+'/report_view.ejs', data)

    })

    routes.get('/run/:model/:report', async (req, res) => {

        let model_name = parseClassName(req.params.model),
            report_name = parseCamelCase(req.params.report),
            model,
            report

        if (global.model[model_name] && typeof global.model[model_name][report_name] == 'function'){
            model = await new global[model_name]()
            report = model[report_name](req.query) // don't await so it runs in the background
            res.json({report:true})
        } else {
            res.status(404).json({status:404, message:'Not found'})
        }

    })



// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
