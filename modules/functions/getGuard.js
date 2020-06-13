
const getGuard = (req) => {

    if (req.session && req.session.user && req.session.user.guard){
        return req.session.user.guard
    } else {
        return false
    }

}

module.exports = getGuard
