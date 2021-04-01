const savePageHistory = (req, table, filter)=>{
    if (req && req.session && !req.session.page_history){
        req.session.page_history = {}
    }
    req.session.page_history[table] = filter
}

module.exports = savePageHistory
