const getTemplateData = function (req, res, next) {

    if (req.session && req.session.user && req.session.user.guard){
        view.user = req.session.user
    } else {
        view.user = {}
    }

    view.current_url = req.originalUrl

    if (view.current_url.match(/^\/dashboard\//)){
        view.current_dashboard_url = view.current_url.replace(/^\/dashboard\//,'')
    } else {
        view.current_dashboard_url = view.current_url
    }

    next()

}
module.exports = getTemplateData
