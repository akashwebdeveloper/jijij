
const User = require('../../models/user')


module.exports = {
    getalldata: (req, res) => {

        User.find({}, (err, users) => {
            if (err) {
                return res.status(502).json({
                    success: false,
                    status: 502,
                    message: "err from database"
                })
            }

            if (!users[0]) {
                return res.status(202).json({
                    success: false,
                    status: 202,
                    message: "user doesn't exist"
                })
            }
            return res.status(200).json({
                success: true,
                status: 200,
                message: "user data Available",
                user: users
            })
        })
    },
    getdata: (req, res) => {
        const { id } = req.body

        User.findOne({ _id: id }, (err, users) => {
            if (err) {
                return res.status(502).json({
                    success: false,
                    status: 502,
                    message: "err from database"
                })
            }

            if (!users) {
                return res.status(202).json({
                    success: false,
                    status: 202,
                    message: "user doesn't exist"
                })
            }
            return res.status(200).json({
                success: true,
                status: 200,
                message: "user data Available",
                user: users
            })
        })
    },
    update: (req, res) => {
        const { id, bio } = req.body

        User.findByIdAndUpdate(id, { $set: { bio: bio } }, { new: true }, (err, users) => {
            if (err) throw err;

            if (!users) {
                return res.status(202).json({
                    success: false,
                    status: 202,
                    message: "user doesn't exist"
                })
            }

            return res.status(202).json({
                success: true,
                status: 200,
                message: "User updated successfuly ",
                user: users
            })
        })
    }
}

