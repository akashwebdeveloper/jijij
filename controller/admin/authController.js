const Admin = require('../../models/admin')
const bcrypt = require('bcrypt')
const passport = require('passport')


const _getRedirectUrl = (req) => {
    return req.user.username === 'mpl' ? '/admin' : '/error'
}
module.exports = {
    login: (req, res) => {
        res.render('auth/login')
    },
    postLogin: (req, res, next) => {
        const { email, password } = req.body
        
        // Validate request 

        if (!email || !password) {
            req.flash('error', 'All fields are required')
            return res.redirect('/admin/login')
            
        }
        passport.authenticate('local', (err, user, info) => {
            
            
            if (err) {
                req.flash('error', info.message)
                return next(err)
            }
            if (!user) {
                req.flash('error', info.message)
                return res.redirect('/admin/login')
            }
            req.logIn(user, (err) => {
                if (err) {
                    req.flash('error', info.message)
                    return next(err)
                }
                return res.redirect(_getRedirectUrl(req))
            })
        })(req, res, next)
    },
            logout(req, res) {
              req.logout()
              return res.redirect('/admin/login')  
            }
    //     }
    // }
}
