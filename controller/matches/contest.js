require('dotenv').config()
const Contest = require('../../models/contest')
const User = require('../../models/user')
const Subcontest = require('../../models//sub_contest')
const { v4: uuidv4 } = require('uuid');
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
                message: "Upcoming Match Contest Available",
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
    },
    createTeam: (req, res) => {
        const { match_key, player_id, role, captain, vc_captain, user_id } = req.body
        PlayerList = {
            teamId: uuidv4(),
            wk: [],
            bat: [],
            ar: [],
            bowl: [],
            captain,
            vc_captain
        }
        const finalObject = {}

        role.forEach((eachPlayerRole, index) => {
            const pushObj = {};

            if (eachPlayerRole === "wk") {

                PlayerList.wk.push(player_id[index])
            } else if (eachPlayerRole === "bat") {

                PlayerList.bat.push(player_id[index])
            } else if (eachPlayerRole === "ar") {

                PlayerList.ar.push(player_id[index])
            } else {
                PlayerList.bowl.push(player_id[index])
            }
        });

        finalObject.match_key = match_key
        finalObject.data = [PlayerList]

        User.findById(user_id, ['created_teams'], (err,result)=>{
            const found = result.created_teams.some(el => el.match_key === match_key);
            if (found) {
                User.findOneAndUpdate({_id:user_id, "created_teams.match_key" : match_key}, {$push : { "created_teams.$.data":  PlayerList} }, (err,result1)=>{
                    if (err) throw err;
                    
                    return res.status(200).json({
                        success: true,
                        message: "one more team is created for this match",
                    })
                })
            } else {
                User.findByIdAndUpdate(user_id, {$push : {created_teams: finalObject}}, (err,result1)=>{
                    if (err) throw err;
                    
                    return res.status(200).json({
                        success: true,
                        message: "first team is created for this match",
                    })
                })
            }
        })
        



    }
}
