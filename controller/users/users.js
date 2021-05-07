
const User = require('../../models/user')


module.exports = {
    getalldata: (req, res) => {

        User.find({ type: { $ne: 'admin' }}, [ 'email', 'fname', 'lname', 'username', 'photos' ], (err, users) => {
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

        User.find({ _id: id }, (err, users) => {
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
                user: users[0]
            })
        })
    },
    update: (req, res) => {
        const { id, type, fname, lname, username, dob, gender, weight, height, token } = req.body

        if (id.substr(id.length - 3) == 'com') {
            var EMAIL = req.body.id
        } else if (id.substr(id.length - 2) == 'in') {
            var EMAIL = req.body.id
        } else {
            var ID = req.body.id
        }

        User.find({ $or: [{ _id: ID }, { email: EMAIL }] }, (err, users) => {
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

            const user = new User({
                type: type || users[0].type,
                fname: fname || users[0].fname,
                lname: lname || users[0].lname,
                username: username || users[0].username,
                dob: dob || users[0].dob,
                gender: gender || users[0].gender,
                weight: weight || users[0].weight,
                height: height || users[0].height,
                token: token || users[0].token,
            })

            // Convert the Model instance to a simple object using Model's 'toObject' function
            // to prevent weirdness like infinite looping...
            var upsertData = user.toObject();

            // Delete the _id property, otherwise Mongo will return a "Mod on _id not allowed" error
            delete upsertData._id;


            User.findOneAndUpdate({ $or: [{ _id: ID }, { email: EMAIL }] }, upsertData, (err, users) => {
                if (err) {
                    console.log(err);
                }

                if (users) {

                    User.find({ _id: users._id }, (err, users) => {
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

                        return res.status(202).json({
                            success: true,
                            status: 200,
                            message: "User updated successfuly ",
                            user: users
                        })
                    })
                }
            })
        })
    },
    emailverification: (req, res) =>{
        const {phone, email } = req.body

            User.findOne({ $or: [{ phone: phone }, { email: email }] }, (err, users) => {
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
                        message: "user Already exist"
                    })
                }

                return res.status(200).json({
                    success: true,
                    status: 200,
                    message: "New user",
                })
                
            })
                
    }
}

