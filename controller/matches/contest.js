require('dotenv').config()
const Contest = require('../../models/contest')
const Subcontest = require('../../models//sub_contest')
var ACCESS_TOKEN = '';



module.exports = {
    openContestList: (req, res) => {
        const { match_key } = req.body
        var contestList = [];

        // Function for making contest list by using contest and sub contest model
        function contestListMaking(contest, subcontest) {
            contest.forEach(cont => {
                subcontest.forEach(subcont => {
                    if (String(cont._id) === String(subcont.contestId)) {

                        var pushObj = {
                            contestId: subcont._id,
                            match_key: match_key,
                            prizePool: cont.prizePool,
                            spot: cont.spot,
                            spotLeft: (cont.spot - subcont.joinedUser.length),
                            winner: cont.winner,
                            entryFee: cont.entryFee,
                            entryLimit: cont.entryLimit,
                        };
                        contestList.push(pushObj)
                    }
                });
            });
            return res.status(200).json({
                success: true,
                message: "Upcoming Match data Available",
                list: contestList
            })
        }


        Contest.find({}, (err, contest) => {
            Subcontest.find({ $and: [{ matchKey: match_key }, { isFull: false }] }, (err, subcon) => {
                if (err) throw err;
                var insertArray = [];
                var newContests = contest.filter(entry1 => !subcon.some(entry2 => String(entry1._id) === String(entry2.contestId)));

                // Checking that this is first time userchecking contact list for this match
                if (!subcon.length) {
                    contest.forEach(con => {
                        var pushObj = {
                            contestId: con._id,
                            matchKey: match_key
                        };
                        insertArray.push(pushObj);
                    });

                    Subcontest.insertMany(insertArray)
                        .then(function (subcontest) {
                            contestListMaking(contest, subcontest)
                        })
                        .catch(function (err) {
                            return res.status(500).send(err);
                        });
                } else if (newContests.length) {
                    var insertArray = [];
                    newContests.forEach(con => {
                        var pushObj = {
                            contestId: con._id,
                            matchKey: match_key,
                        };
                        insertArray.push(pushObj);
                    });
                    Subcontest.insertMany(insertArray)
                        .then(
                            contestListMaking(contest, subcon)
                        )
                        .catch(function (err) {
                            return res.status(500).send(err);
                        });
                } else {
                    contestListMaking(contest, subcon)
                }
            })
        })
    }
}
