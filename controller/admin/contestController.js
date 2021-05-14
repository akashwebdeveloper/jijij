const Admin = require('../../models/admin');
const { mapReduce } = require('../../models/contest');
const Contest = require('../../models/contest')
const Subcontest = require('../../models/sub_contest')

const multer = require('multer');
fs = require('fs')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/players');
    },
    filename: function (req, file, cb) {

        cb(null, req.body.id + '.' + file.originalname.split(".")[1]);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }
});


module.exports = {
    createContest: (req, res) => {
        return res.render('contestForm', { page_name: 'form' })
    },
    addContest: (req, res) => {
        var { prize_pool, spot, entry_fee, entry_limit, from, to, ammount, rules, notes } = req.body

        Array.isArray(from) ? from : from = [from], to = [to], ammount = [ammount]
        Array.isArray(rules) ? rules : rules = [rules]
        Array.isArray(notes) ? notes : notes = [notes]

        var winner = [];

        for (let i = 0; i < from.length; i++) {
            var pushObj = {
                from: from[i],
                to: to[i],
                ammount: ammount[i]
            };
            winner.push(pushObj)
        }


        const contest = new Contest({
            prizePool: prize_pool,
            spot: spot,
            winner,
            entryFee: entry_fee,
            entryLimit: entry_limit,
            rules: rules,
            notes: notes,
        })

        contest.save().then(user => {

            // save Contest
            return res.redirect('/admin/create_contest')
        }).catch(err => {
            return res.status(503).json({
                success: 0,
                status: 503,
                message: "err from database",
                err
            })
        })
    },
    contestList: (req, res) => {
        Contest.find({}, (err, contests) => {
            if (err) throw err;
            return res.render('contestTable', { contests: contests })
        })
    },
    teamImage: (req, res) => {
        Admin.find({}, (err, admin) => {
            if (err) throw err;
            return res.render('teamImage', { admin: admin[0] })
        })
    },
    playerImage: (req, res) => {
        Admin.find({}, ['players'], (err, admin) => {
            if (err) throw err;
            return res.render('playerImage', { admin: admin[0] })
        })
    },
    picUpload: (req, res) => {
        const { id, cat, name } = req.query

        return res.render('uploadImage', { id, cat, name })

    },
    postPicUpload: (req, res) => {

        const { id, cat } = req.body
        const extention = req.file.originalname.split('.').pop();
        const fileName = `${id}.${extention}`;

        Admin.find({}, function (err, result1) {
            if (cat === 'Team') {
                Admin.updateOne({ _id: result1[0]._id, "teams.teamId": id }, { $set: { "teams.$.picFileName": fileName } }, function (err, result) {
                    if (err) {
                        console.log(err);
                        return res.status(202).json({
                            success: false,
                            status: 202,
                            message: "err from database",
                            error: err
                        });
                    }
                });
            }



            if (cat === 'Player') {
                Admin.updateOne({ _id: result1[0]._id, "players.playerId": id }, { $set: { "players.$.picFileName": fileName } }, function (err, result) {
                    if (err) {
                        console.log(err);
                        return res.status(202).json({
                            success: false,
                            status: 202,
                            message: "err from database",
                            error: err
                        });
                    }
                });
            }
        });
    },
    upload
}