module.exports = {
    auth: (req, res, next)=> {
        if(req.isAuthenticated() && req.user.username === 'mpl') {
            return next()
        }
        return res.redirect('/admin/login')
    }
}