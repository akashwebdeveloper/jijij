require('dotenv').config()

const User = require('../../models/user')


    module.exports = {
        signup(req, res) {
            const { phone } = req.body

            User.findOne({ phone: phone }, (err, users) => {
                // User.findOne({ email: email }, (err, users) => {
                if (err) {
                    return res.status(502).json({
                        success: false,
                        status: 502,
                        message: "err from database"
                    })
                }

                if (users) {
                    return res.status(202).json({
                        success: false,
                        status: 202,
                        message: "user Already exist",
                        user: users
                    })
                }

                const user = new User({
                    phone: phone || "",
                })
                // New User Save to database
                user.save().then(user => {
                    // login
                    return res.status(200).json({
                        success: 1,
                        status: 200,
                        message: "user save in to database",
                        user: user,
                    })
                }).catch(err => {
                    return res.status(503).json({
                        success: 0,
                        status: 503,
                        message: "err from database",
                        err
                    })
                })
            })
        },

    }