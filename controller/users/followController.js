const User = require('../../models/user')


module.exports = {
    follow: (req, res) => {
        const { userid, followid } = req.body

        User.find({ _id: followid }, ['followers'], (err, result) => {
            if (err) throw err

            if (result[0].followers.indexOf(userid) !== -1) {
                return res.status(202).json({
                    success: false,
                    status: 202,
                    message: "You have already followed this user",
                    data: result[0].bookmarks
                })
            } else {

                User.findByIdAndUpdate(followid, {
                    $push: { followers: userid }
                }, {
                    new: true
                }, (err, result) => {
                    if (err) {
                        return res.status(502).json({
                            success: false,
                            status: 502,
                            message: "err from database",
                            error: err
                        })
                    }
                    User.findByIdAndUpdate(userid, {
                        $push: { following: followid }
                    }, { new: true }).select({ "followers": 1, "following": 1, "_id": 0 }).then(result => {
                        return res.status(200).json({
                            success: true,
                            status: 200,
                            message: `followed successfully this user`,
                            data: result
                        })
                    }).catch(err => {
                        return res.status(502).json({
                            success: false,
                            status: 502,
                            message: "err from database",
                            error: err
                        })
                    })
                })
            }
        })
    },
    unfollow: (req, res) => {
        const { userid, unfollowid } = req.body

        User.findByIdAndUpdate(unfollowid, {
            $pull: { followers: userid }
        }, {
            new: true
        }, (err, result) => {
            if (err) {
                return res.status(502).json({
                    success: false,
                    status: 502,
                    message: "err from database",
                    error: err
                })
            }
            User.findByIdAndUpdate(userid, {
                $pull: { following: unfollowid }
            }, { new: true }).select({ "followers": 1, "following": 1, "_id": 0 }).then(result => {
                return res.status(200).json({
                    success: true,
                    status: 200,
                    message: `unfollowed successfully this user`,
                    data: result
                })
            }).catch(err => {
                return res.status(502).json({
                    success: false,
                    status: 502,
                    message: "err from database",
                    error: err
                })
            })
        })
    }
}
