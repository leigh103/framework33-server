const getPageHistory = (req, table)=>{
    if (req && req.session && req.session.page_history && req.session.page_history[table]){
        return req.session.page_history[table]
    } else {
        return ''
    }
}

module.exports = getPageHistory
