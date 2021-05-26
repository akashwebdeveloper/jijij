require('dotenv').config()
const moment = require('moment');
const Contest = require('../../models/contest')
const User = require('../../models/user')
const Admin = require('../../models/admin')
const Subcontest = require('../../models//sub_contest')
const Match = require('../../models/match')
const { v4: uuidv4 } = require('uuid');
var mongoose = require('mongoose');
const base_url = process.env.BASE_URL




function convertToRemainingTime(starting_time) {
    const matchStart = moment(starting_time)

    const days = matchStart.diff(moment(), 'days')
    const hours = matchStart.diff(moment(), 'hours') - (24 * (days));
    const minutes = (matchStart.diff(moment(), 'minutes') - (1440 * (days))) - (60 * hours);
    // console.log(days);
    // console.log(hours);
    // console.log(minutes);

    var time = "";
    if (days > 0) {
        time += `${days} Days ${hours} Hours`;
    } else {
        time += `${hours} Hours ${minutes} Minutes `;
    }
    return time;
}

module.exports = {
    openContestList: (req, res) => {
        const { user_id, match_key } = req.body

        // Function for making contest list by using contest and sub contest model
        function contestListMaking(contest, subcontest, created_team, joined_contest) {
            var contestList = [];
            contest.forEach(cont => {
                subcontest.forEach(subcont => {
                    if (String(cont._id) === String(subcont.contestId)) {

                        var pushObj = {
                            contestId: subcont._id,
                            match_key: match_key,
                            prizePool: cont.prizePool,
                            spot: cont.spot,
                            spotLeft: (cont.spot - subcont.joined_user_team.length),
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
                list: contestList,
                created_team,
                joined_contest
            })
        }


        Contest.find({}, (err, contest) => {
            if (err) throw err;
            Subcontest.find({ $and: [{ matchKey: match_key }, { isFull: false }] }, (err, subcon) => {
                if (err) throw err;
                User.findOne({ _id: user_id, "created_teams.match_key": match_key }, ['created_teams'], (err, user) => {
                    if (err) throw err;
                    Subcontest.find({ $and: [{ matchKey: match_key }, { "joined_user_team.User": user_id }] }, (err, joinedcontest) => {
                        if (err) throw err;

                        // * Checking  that how much team creted by user for current much
                        var created_team = 0;
                        if (user) {
                            user.created_teams.forEach(match => {
                                if (match.match_key === match_key) {
                                    created_team = match.data.length
                                }
                            });
                        }

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
                                    contestListMaking(contest, subcontest, created_team, joinedcontest.length)
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
                                    contestListMaking(contest, subcon, created_team, joinedcontest.length)
                                )
                                .catch(function (err) {
                                    return res.status(500).send(err);
                                });
                        } else {
                            contestListMaking(contest, subcon, created_team, joinedcontest.length)
                        }
                    })
                })
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
                    Contest.findById(subcontests.contestId, ['entryFee', 'entryLimit'], (err, contest) => {
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
                        var use_bonus = 0

                        if (bonus > Math.round((entryFee * 4) / 100)) {
                            entryFee = entryFee - Math.round((entryFee * 4) / 100)
                            use_bonus = Math.round((entryFee * 4) / 100)
                        } else {
                            entryFee = entryFee - bonus
                            use_bonus = bonus
                        }

                        if (deposit + winning >= entryFee) {
                            enough_cash = true
                        } else {
                            entryFee = entryFee - (deposit + winning);
                        }


                        return res.status(200).json({
                            success: true,
                            message: `you have created ${result.created_teams[0].data.length} ${(result.created_teams[0].data.length > 1 ? 'teams' : 'team')} for this match`,
                            data: {
                                teamList,
                                entryFee: contest.entryFee,
                                enough_cash,
                                use_bonus,
                                max_team: entryLimit
                            }
                        })
                    })
                })
            })
        })
    },
    updateTeam: (req, res) => {
        const { match_key, player_id, role, captain, vc_captain, user_id, team_id } = req.body
        PlayerList = {
            teamId: team_id,
            wk: [],
            bat: [],
            ar: [],
            bowl: [],
            captain,
            vc_captain
        }
        const finalObject = {}

        role.forEach((eachPlayerRole, index) => {

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

        User.findOneAndUpdate({ _id: user_id, "created_teams.match_key": match_key }, { $pull: { "created_teams.$.data": { "teamId": team_id } } }, (err, result1) => {
            if (err) throw err;

            User.findOneAndUpdate({ _id: user_id, "created_teams.match_key": match_key }, { $push: { "created_teams.$.data": PlayerList } }, (err, result2) => {
                if (err) throw err;

                return res.status(200).json({
                    success: true,
                    message: "team Updated successfully",
                })
            })
        })
    },
    joinContest: (req, res) => {
        var { user_id, contest_id, teams_id } = req.body


        User.findById(user_id, ['cash'], (err, result) => {
            if (err) throw err;
            Subcontest.findOne({ $and: [{ _id: contest_id }, { isFull: false }] }, ['contestId', 'joined_user_team'], (err, subcontests) => {
                if (err) throw err;

                // * Checking that contest is full or not
                if (!subcontests) {
                    return res.status(400).json({
                        success: false,
                        message: `Contest is Fulled please join another One`,
                        data: {
                            entryFee: '',
                            enough_cash: '',
                            use_winning_deposit: '',
                            use_bonus: '',
                            add_more: ''
                        }
                    })
                }

                Contest.findById(subcontests.contestId, ['entryFee', 'entryLimit', 'spot'], (err, contest) => {
                    if (err) throw err;

                    var entryFee = contest.entryFee,
                        contestEntryFee = contest.entryFee,
                        winning = 0,
                        deposit = 0,
                        bonus = 0;

                    Array.isArray(teams_id) ? (entryFee *= teams_id.length, contestEntryFee *= teams_id.length, teams_id) : (entryFee, contestEntryFee, teams_id = [teams_id])

                    //  *If any team already joined this Contest
                    let alreadyJoined = subcontests.joined_user_team.filter(o1 => teams_id.some(o2 => o1.Team === o2));
                    if (alreadyJoined.length) {
                        return res.status(400).json({
                            success: false,
                            message: `you can't join same team in same contest please createAnother Team`,
                            data: {
                                entryFee: contestEntryFee,
                                enough_cash: '',
                                use_winning_deposit: '',
                                use_bonus: '',
                                add_more: ''
                            }
                        })
                    }


                    // * Checking that team joining doesn't cross spot limit
                    if (subcontests.joined_user_team + teams_id.length > contest.spot) {
                        return res.status(400).json({
                            success: false,
                            message: `Contest is Fulled please join another One`,
                            data: {
                                entryFee: contestEntryFee,
                                enough_cash: '',
                                use_winning_deposit: '',
                                use_bonus: '',
                                add_more: ''
                            }
                        })
                    }

                    // How much team User Already joined in this contest
                    var teamJoinedThisContest = subcontests.joined_user_team.filter(o1 => o1.User === user_id);
                    var enough_limit = teamJoinedThisContest.length + teams_id.length;

                    // * If User is trying to join more than entryLimit teams
                    if (enough_limit > contest.entryLimit) {
                        return res.status(400).json({
                            success: false,
                            message: `you can't join this contest with more than ${contest.entryLimit} teams`,
                            data: {
                                entryFee: contestEntryFee,
                                enough_cash: '',
                                use_winning_deposit: '',
                                use_bonus: '',
                                add_more: ''
                            }
                        })
                    }

                    //  * Getting winning, deposit, bonus cash from transaction list
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
                    var use_bonus = 0

                    if (bonus > Math.round((entryFee * 4) / 100)) {
                        entryFee = entryFee - Math.round((entryFee * 4) / 100)
                        use_bonus = Math.round((entryFee * 4) / 100)
                    } else {
                        entryFee = entryFee - bonus
                        use_bonus = bonus
                    }

                    // * Checking that enough cash is available or not for join contest
                    if (deposit + winning >= entryFee) {
                        enough_cash = true
                    } else {
                        entryFee = entryFee - (deposit + winning);
                    }

                    if (!enough_cash) {
                        return res.status(200).json({
                            success: true,
                            message: `you have to add more money to join the contest`,
                            data: {
                                entryFee: contestEntryFee,
                                enough_cash,
                                use_winning_deposit: deposit + winning,
                                use_bonus,
                                add_more: entryFee
                            }
                        })
                    } else {
                        var transaction = [];
                        var pushArray = [];
                        teams_id.forEach(id => {
                            var pushTeam = {};
                            pushTeam.User = user_id
                            pushTeam.Team = id
                            pushArray.push(pushTeam)
                        });


                        // * Checking that contest is full or not
                        var full = subcontests.joined_user_team.length >= contest.spot - 1 ? true : false
                        // Debited from bonus
                        var pushBonusObj = {
                            title: 'Joined A Contest',
                            description: 'Debited from Bonus Cash Balance',
                            ammount: use_bonus,
                            added: false,
                            wallet: 'bonus',
                            Date: new Date()
                        }
                        use_bonus ? transaction.push(pushBonusObj) : transaction;

                        // Debited from deposit
                        var pushDepositObj = {
                            title: 'Joined A Contest',
                            description: 'Debited from Deposit Cash Balance',
                            ammount: deposit > contestEntryFee - use_bonus ? contestEntryFee : deposit,
                            added: false,
                            wallet: 'deposit',
                            Date: new Date()
                        }
                        deposit ? transaction.push(pushDepositObj) : transaction;

                        // Debited from winning
                        var pushWinningObj = {
                            title: 'Joined A Contest',
                            description: 'Debited from Winning Cash Balance',
                            ammount: contestEntryFee - (deposit + use_bonus),
                            added: false,
                            wallet: 'winning',
                            Date: new Date()
                        }
                        deposit < (contestEntryFee - use_bonus) ? transaction.push(pushWinningObj) : transaction;

                        // Pushing team in the contest
                        Subcontest.updateMany({ $and: [{ _id: contest_id }, { isFull: false }] }, { $push: { joined_user_team: pushArray }, $set: { isFull: full }, }, (err, subcont) => {
                            if (err) throw err;

                            // * Checking that contest is fulled or not
                            if (!subcont) {
                                return res.status(400).json({
                                    success: false,
                                    message: `Contest is Fulled please join another One`,
                                    data: {
                                        entryFee: contestEntryFee,
                                        enough_cash: '',
                                        use_winning_deposit: '',
                                        use_bonus: '',
                                        add_more: ''
                                    }
                                })
                            }

                            //  * Updating Cash Deduction
                            User.findByIdAndUpdate(user_id, { $push: { cash: transaction } }, (err) => {
                                if (err) throw err;

                                return res.status(200).json({
                                    success: true,
                                    message: `you have Successfully joined this contest`,
                                    data: {
                                        entryFee: contestEntryFee,
                                        enough_cash,
                                        use_winning_deposit: pushDepositObj.ammount + pushWinningObj.ammount,
                                        use_bonus,
                                        add_more: ''
                                    }
                                })
                            })
                        })
                    }
                })
            })
        })
    },
    contestDetails: (req, res) => {
        const { user_id, contest_id } = req.body;

        var details = {}, leaderBoard = {};

        Subcontest.findById(contest_id, ['contestId', 'joined_user_team'], (err, subcontests) => {
            if (err) throw err;
            Contest.findById(subcontests.contestId, ['entryFee', 'entryLimit', 'spot', 'notes', 'winner', 'entryLimit'], (err, contest) => {
                if (err) throw err;


                var userJoinedTeam = subcontests.joined_user_team.filter(person => person.User === user_id);

                var usersList = [];
                subcontests.joined_user_team.forEach(joiner => {
                    var pushObj = {};
                    var alreadyInList = usersList.filter(person => person.user === joiner.User);
                    if (alreadyInList.length) {
                        //Find index of specific object using findIndex method.    
                        objIndex = usersList.findIndex((obj => obj.user === joiner.User));
                        usersList[objIndex].team += 1;
                    } else {
                        pushObj.user = joiner.User
                        pushObj.team = 1
                        usersList.push(pushObj);
                    }
                });

                let objectIdArray = usersList.map(s => new mongoose.Types.ObjectId(s.user));

                User.find({ _id: { $in: objectIdArray } }, ['photos', 'userName'], (err, data) => {
                    if (err) throw err;

                    data.forEach(user => {
                        objIndex = usersList.findIndex((obj => obj.user === String(user._id)));
                        usersList[objIndex].username = user.userName
                        usersList[objIndex].photo = `${base_url}/images/users/${user.photos}`
                    });


                    details.prizePool = contest.prizePool;
                    details.spotFull, leaderBoard.spotFull = subcontests.joined_user_team.length;
                    details.spotSize, leaderBoard.spot = contest.spot;
                    details.userJoinedTeam = userJoinedTeam.length;
                    details.totalWinner = contest.winner[contest.winner.length - 1].to;
                    details.entryFee = contest.entryFee;
                    details.winnerBreakup = contest.winner;
                    details.note = contest.notes;
                    details.maxTeam = contest.entryLimit;
                    leaderBoard.joinedUserList = usersList


                    return res.status(200).json({
                        success: true,
                        message: `contest all details`,
                        data: {
                            details,
                            leaderBoard
                        }
                    })
                })
            })
        })
    },
    joinedContest: (req, res) => {
        const { user_id, match_key } = req.body

        Subcontest.find({ matchKey: match_key, "joined_user_team.User": user_id }, (err, subcontests) => {
            if (err) throw err;

            var contestIdList = [];
            subcontests.forEach(contest => {
                contestIdList.push(contest.contestId);
            });

            let uniqueContestList = [...new Set(contestIdList)];
            if (!uniqueContestList) {
                return res.status(400).json({
                    success: false,
                    message: `User did't Joined any contest till now`,
                    list: []
                })
            }


            Contest.find({ _id: { $in: uniqueContestList } }, (err, contests) => {
                if (err) throw err;

                var contestList = [];
                subcontests.forEach(subcontest => {
                    contests.forEach(contest => {
                        if (String(subcontest.contestId) === String(contest._id)) {

                            var pushObj = {
                                contestId: subcontest._id,
                                match_key: match_key,
                                prizePool: contest.prizePool,
                                spot: contest.spot,
                                spotLeft: (contest.spot - subcontest.joined_user_team.length),
                                winner: contest.winner,
                                entryFee: contest.entryFee,
                                entryLimit: contest.entryLimit,
                            };
                            contestList.push(pushObj)
                        }
                    });
                });


                return res.status(200).json({
                    success: true,
                    message: "joined Contest By User",
                    list: contestList,
                    joinedContest: contestList.length
                })

            })
        })
    },
    joinedMatches: (req, res) => {
        const { user_id } = req.body

        Subcontest.find({ "joined_user_team.User": user_id }, (err, subcontests) => {
            if (err) throw err;

            var match_key_list = [];
            subcontests.forEach(subcontest => {
                match_key_list.push(subcontest.matchKey)
            });

            let uniqueMatchKeyList = [...new Set(match_key_list)];
            var joinedMatches = {
                upcoming: [],
                live: [],
                result: []
            };

            if (!uniqueMatchKeyList) {
                return res.status(400).json({
                    success: false,
                    message: `User did't Joined any match till now`,
                    list: joinedMatches
                })
            }


            Match.find({}, ['data'], async (err, matchData) => {
                if (err) throw err;

                await matchData.forEach(async eachmonth => {
                    let result = await eachmonth.data.filter(o1 => uniqueMatchKeyList.some(o2 => o1.key === o2));

                    let joinedContest;
                    result.forEach(joinedmatch => {
                        if (joinedmatch.status === 'not started') {
                            joinedContest = match_key_list.filter(joinedcont => joinedcont === joinedmatch.key);
                            joinedmatch.remaingTime = convertToRemainingTime(joinedmatch.startingTime)
                            joinedmatch.joinedContest = joinedContest.length
                            joinedMatches.upcoming.push(joinedmatch)
                        } else if (joinedmatch.status === 'completed') {
                            joinedmatch.remaingTime = moment(joinedmatch.startingTime).format('MMM, D')
                            joinedContest = match_key_list.filter(joinedcont => joinedcont === joinedmatch.key);
                            joinedmatch.joinedContest = joinedContest.length
                            joinedMatches.result.push(joinedmatch)
                        } else {
                            joinedmatch.remaingTime = moment(joinedmatch.startingTime).format('MMM, D')
                            joinedContest = match_key_list.filter(joinedcont => joinedcont === joinedmatch.key);
                            joinedmatch.joinedContest = joinedContest.length
                            joinedMatches.live.push(joinedmatch)
                        }
                    });

                    return res.status(200).json({
                        success: true,
                        message: "completed Matches By User",
                        list: joinedMatches,
                    })
                });
            })
        })
    }
}
