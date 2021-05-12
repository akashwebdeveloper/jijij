require('dotenv').config()
const Contest = require('../../models/contest')
const User = require('../../models/user')
const Admin = require('../../models/admin')
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

        User.findById(user_id, ['created_teams'], (err, result) => {
            const found = result.created_teams.some(el => el.match_key === match_key);
            if (found) {
                User.findOneAndUpdate({ _id: user_id, "created_teams.match_key": match_key }, { $push: { "created_teams.$.data": PlayerList } }, (err, result1) => {
                    if (err) throw err;

                    return res.status(200).json({
                        success: true,
                        message: "team created successfully",
                    })
                })
            } else {
                User.findByIdAndUpdate(user_id, { $push: { created_teams: finalObject } }, (err, result1) => {
                    if (err) throw err;

                    return res.status(200).json({
                        success: true,
                        message: "team created successfully",
                    })
                })
            }
        })
    },
    teamList: (req, res) => {
        const { user_id, match_key, contest_id } = req.body

        User.findOne({ _id: user_id, "created_teams.match_key": match_key }, ['created_teams.$', 'cash'], (err, result) => {
            if (err) throw err;

            Admin.find({}, ['players'], (err, data) => {
                if (err) throw err;

                var playerData = data[0].players;
                const teamList = [];


                result.created_teams[0].data.forEach(team => {
                    var captain = playerData.find(obj => obj.playerId == team.captain)
                    var vc_captain = playerData.find(obj => obj.playerId == team.vc_captain)
                    var pushObj = {};

                    pushObj.team_id = team.teamId
                    pushObj.wk = team.wk.length
                    pushObj.bat = team.bat.length
                    pushObj.ar = team.ar.length
                    pushObj.bow = team.bowl.length
                    pushObj.captain = `${captain.playerName.substring(0, 1)} ${captain.playerName.split(' ').slice(-1)}`
                    pushObj.vc_captain = `${vc_captain.playerName.substring(0, 1)} ${vc_captain.playerName.split(' ').slice(-1)}`

                    teamList.push(pushObj);
                });

                Subcontest.findById(contest_id, ['contestId'], (err, subcontests) => {
                    if (err) throw err;
                    Contest.findById(subcontests.contestId, ['entryFee'], (err, contest) => {
                        if (err) throw err;

                        var entryFee = contest.entryFee,
                        winning = 0,
                        deposit = 0,
                        bonus = 0;

                        result.cash.forEach(each => {
                            if (each.wallet === 'winning') {
                                each.added ? winning += each.ammount : winning -= each.ammount
                            } else if (each.wallet === 'deposit') {
                                each.added ? deposit += each.ammount : deposit -= each.ammount
                            } else if (each.wallet === 'bonus') {
                                each.added ? bonus += each.ammount : bonus -= each.ammount
                            }
                        });

                        var enough_cash = false

                        if (bonus > Math.round((entryFee * 4)/100)) {
                            entryFee = entryFee - Math.round((entryFee * 4)/100)
                        }else {
                            entryFee = entryFee - bonus
                        }

                        if (deposit+winning >= entryFee) {
                            enough_cash = true
                        }else {
                            entryFee = entryFee - (deposit+winning);
                        }


                        return res.status(200).json({
                            success: true,
                            message:`you have created ${result.created_teams[0].data.length} ${(result.created_teams[0].data.length > 1 ? 'teams' :'team')} for this match`,
                            data: {
                                teamList,
                                entryFee: contest.entryFee,
                                enough_cash,
                                add_more: enough_cash ? '' : entryFee
                            }
                        })
                    })
                })
            })
        })
    }
}
