require('dotenv').config()
const Match = require('../../models/match')
const Admin = require('../../models/admin')
const moment = require('moment');
const request = require('request');
const axios = require('axios');
var ACCESS_TOKEN = '';
console.log(`${moment().format()}`.rainbow);


var APP_ID = process.env.APP_ID, // get it from .env
    ACCESS_KEY = process.env.ACCESS_KEY,
    SECRET_KEY = process.env.SECRET_KEY,
    DEVICE_ID = process.env.DEVICE_ID,
    host = 'https://rest.cricketapi.com',

    authToken = {
        url: host + '/rest/v2/auth/',
        method: 'POST',
        json: true,
        gzip: true,
        form: {
            app_id: APP_ID,
            access_key: ACCESS_KEY,
            secret_key: SECRET_KEY,
            device_id: DEVICE_ID
        }
    }


options = {
    url: host + '/rest/v2/auth/',
    method: 'GET',
    json: true,
    gzip: true,
}


const schedule = require('node-schedule');
const { json } = require('body-parser');
const { response } = require('express');
schedule.scheduleJob('0 0 0/12 * * *', function () {
    request(authToken, function (error, response) {
        if (error) throw new Error(error)
        // console.log(response.body)
        if (response.body.status_code === 200) {
            Admin.updateOne({ username: 'mpl' }, { $set: { auth_token: response.body.auth.access_token } }, (err, data) => {
                if (err) throw err;
                console.log('auth_token updated successfully');
            });
        }
    })
});

schedule.scheduleJob('5 0 1 * *', function () {
    Admin.findOne({ username: 'mpl' }, ['auth_token'], (err, data) => {
        if (err) throw err;
        ACCESS_TOKEN = data.auth_token


        var list = [];

        async function schedule(apiData) {
            for (let index = moment().format('DD'); index <= moment().daysInMonth(); index++) {

                apiData.forEach(eachData => {

                    const currentMonth = eachData.data.months.filter(month => month.current_month === true);

                    if (currentMonth[0].days[index - 1].matches.length) {

                        const notStartedMatch = eachData.data.months[0].days[index - 1].matches.filter(match => match.status === 'notstarted');
                        notStartedMatch.forEach(match => {

                            var sendMatch = {};
                            sendMatch.key = match.key
                            sendMatch.seriesName = match.season.name
                            sendMatch.matchName = match.short_name
                            sendMatch.team1_id = match.teams.a.match.season_team_key
                            sendMatch.team1 = match.teams.a.short_name;
                            sendMatch.team1_logo = ''
                            sendMatch.team2_id = match.teams.b.match.season_team_key
                            sendMatch.team2 = match.teams.b.short_name;
                            sendMatch.team2_logo = ''
                            sendMatch.startingTime = match.start_date.iso
                            sendMatch.remaingTime = ''

                            list.push(sendMatch)
                        });
                    }
                });
            }

            const match = new Match({
                month: moment().format('YYYY-MM'),
                data: list
            })

            // New month upcoming match Save in to database
            match.save().then(match => {
                console.log('New month upcoming match Save in to database')
            }).catch(err => {
                console.log(err)
            })
            return res.json(list);
        }

        axios.get(host + `/rest/v4/coverage/?access_token=${ACCESS_TOKEN}`).then(responses => {

            const boardKeys = responses.data.data.boards

            async function seasonKeys(keys) {
                var seasonKey = [];
                var matchKey = [];
                for (let i = 0; i < keys.length; i++) {
                    const board = keys[i];
                    try {
                        const requestSeason = await axios.get(host + `/rest/v4/board/${board.key}/schedule/?access_token=${ACCESS_TOKEN}`);
                        seasonKey.push(requestSeason.data)
                        if (requestSeason.data.data.seasons.length) {
                            requestSeason.data.data.seasons.forEach(season => {
                                matchKey.push(season.key)
                            });
                        }
                    } catch (error) {
                        console.log(error);

                    }
                }
                // console.log(seasonKey);
                // console.log(matchKey);

                var data = [];
                for (let i = 0; i < matchKey.length; i++) {
                    const key = matchKey[i];
                    try {
                        const requestSeason = await axios.get(host + `/rest/v4/season/${key}/schedule/?access_token=${ACCESS_TOKEN}&month=2021-05`);
                        data.push(requestSeason.data)

                    } catch (error) {
                        console.log(error);
                    }
                }
                schedule(data)
            }

            seasonKeys(boardKeys, schedule)

        }).catch(errors => {
            console.log(errors);
        })
    })
});




module.exports = {
    testing: (req, res) => {
        request(authToken, function (error, response) {
            if (error) throw new Error(error)
            // console.log(response.body)
            if (response.body.status_code === 200) {
                Admin.updateOne({ username: 'mpl' }, { $set: { auth_token: response.body.auth.access_token } }, (err, data) => {
                    if (err) throw err;
                    return res.status(200).json({
                        message: "auth_token updated successfully",
                        response, data
                    })
                });
            }
        })
    },
    Squad: (req, res) => {
        const { match_key } = req.body

        Admin.findOne({ username: 'mpl' }, ['auth_token', 'players'], (err, data) => {
            if (err) throw err;
            ACCESS_TOKEN = data.auth_token

            Match.findOne({ month: moment().format('YYYY-MM'), "data.key": match_key }, ['data.$', 'playing_11'], (err, result) => {
                if (err) throw err;

                const isPlaying_11 = result.playing_11.filter(matches => matches.key === match_key);

                var time = "",
                    // ? creating model for Squad List
                    PlayerList = {
                        wk: [],
                        bat: [],
                        ar: [],
                        bowl: [],
                    },
                    players = []

                const matchStart = moment(result.data[0].startingTime)
                const days = matchStart.diff(moment(), 'days')
                const hours = matchStart.diff(moment(), 'hours') - (24 * (days));
                const minutes = (matchStart.diff(moment(), 'minutes') - (1440 * (days))) - (60 * hours);
                // ! console.log(days);
                // ! console.log(hours);
                // ! console.log(minutes);

                // ? Remaining time to Start Match
                if (days > 0) {
                    time += `${days} Days ${hours} Hours`;
                } else {
                    time += `${hours} Hours ${minutes} Minutes `;
                }

                // * This API for getting All details Player name, player point, player credit
                options.url = host + `/rest/v3/fantasy-match-credits/${match_key}/?access_token=${ACCESS_TOKEN}`
                request(options, async function (error, matchFullData) {

                    if (error) throw new Error(error)
                    if (matchFullData.body.data == null) {
                        return res.status(400).json({
                            success: false,
                            message: matchFullData.body.status_msg,
                            remaining: null,
                            PlayerList: matchFullData.body.data
                        })
                    }
                    // ! console.log(result.data[0].lineups_out);

                    var bothPlaying_11 = {};
                    if (hours <= 0 && minutes < 45 && result.data[0].lineups_out === false) {
                        try {
                            const matchDatas = await axios.get(host + `/rest/v4/match/${match_key}/?access_token=${ACCESS_TOKEN}&card_type=metric_101`);
                            bothPlaying_11 = matchDatas.data.data.card.teams
                            if (matchDatas.data.data.card.teams.a.match.playing_xi.length) {
                                var pushObj = {
                                    key: match_key,
                                    playing: {
                                        a: { match: { playing_xi: bothPlaying_11.a.match.playing_xi } },
                                        b: { match: { playing_xi: bothPlaying_11.b.match.playing_xi } }
                                    }
                                }
                                Match.updateOne({ month: moment().format('YYYY-MM'), "data.key": match_key }, { $set: { "data.$.lineups_out": true }, $push: { playing_11: pushObj } }, (err, result) => {
                                    if (err) throw err;
                                    console.log('yes lineups out');
                                })
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    } else if (result.data[0].lineups_out === true) {
                        bothPlaying_11 = isPlaying_11[0].playing
                    }
                    // ! console.log(bothPlaying_11);

                    const pointCredit = matchFullData.body.data.fantasy_points;
                    const teamInfo = matchFullData.body.data.teams;
                    const playerInfo = matchFullData.body.data.players;

                    // * Function for seperate all diffrent role player and makeing list of Squad
                    function PlayerDetails(teamPlayerList) {
                        teamPlayerList.forEach(playerData => {
                            let eachPlayer = playerInfo[playerData.player]
                            let eachPlayerRole = playerInfo[playerData.player].seasonal_role

                            var pushObj = {},
                                pushTeamObj = {},
                                playing = false;
                            pushTeamObj.playerId = playerData.player
                            pushTeamObj.playerName = eachPlayer.name
                            pushTeamObj.picFileName = false
                            pushTeamObj.country = eachPlayer.nationality
                            players.push(pushTeamObj)
                            if (eachPlayerRole === "keeper") {

                                pushObj.playerId = playerData.player
                                pushObj.playerName = eachPlayer.name
                                pushObj.team = eachPlayer.team_key === 'a' ? teamInfo.a.short_name : teamInfo.b.short_name
                                pushObj.point = playerData.season_points
                                pushObj.credit = playerData.credit_value

                                if (bothPlaying_11[eachPlayer.team_key]) {
                                    bothPlaying_11[eachPlayer.team_key].match.playing_xi.length ? playing = bothPlaying_11[eachPlayer.team_key].match.playing_xi.some(player_id => player_id === playerData.player) : playing = false
                                }
                                pushObj.playing = playing

                                // ? pushing keeper into wk
                                PlayerList.wk.push(pushObj)
                            } else if (eachPlayerRole === "batsman") {

                                pushObj.playerId = playerData.player
                                pushObj.playerName = eachPlayer.name
                                pushObj.team = eachPlayer.team_key === 'a' ? teamInfo.a.short_name : teamInfo.b.short_name
                                pushObj.point = playerData.season_points
                                pushObj.credit = playerData.credit_value

                                if (bothPlaying_11[eachPlayer.team_key]) {
                                    bothPlaying_11[eachPlayer.team_key].match.playing_xi.length ? playing = bothPlaying_11[eachPlayer.team_key].match.playing_xi.some(player_id => player_id === playerData.player) : playing = false
                                }
                                pushObj.playing = playing
                                // ? pushing batsman into bat
                                PlayerList.bat.push(pushObj)
                            } else if (eachPlayerRole === "allrounder") {

                                pushObj.playerId = playerData.player
                                pushObj.playerName = eachPlayer.name
                                pushObj.team = eachPlayer.team_key === 'a' ? teamInfo.a.short_name : teamInfo.b.short_name
                                pushObj.point = playerData.season_points
                                pushObj.credit = playerData.credit_value

                                if (bothPlaying_11[eachPlayer.team_key]) {
                                    bothPlaying_11[eachPlayer.team_key].match.playing_xi.length ? playing = bothPlaying_11[eachPlayer.team_key].match.playing_xi.some(player_id => player_id === playerData.player) : playing = false
                                }
                                pushObj.playing = playing
                                // ? pushing allrounder into ar
                                PlayerList.ar.push(pushObj)
                            } else {

                                pushObj.playerId = playerData.player
                                pushObj.playerName = eachPlayer.name
                                pushObj.team = eachPlayer.team_key === 'a' ? teamInfo.a.short_name : teamInfo.b.short_name
                                pushObj.point = playerData.season_points
                                pushObj.credit = playerData.credit_value

                                if (bothPlaying_11[eachPlayer.team_key]) {
                                    bothPlaying_11[eachPlayer.team_key].match.playing_xi.length ? playing = bothPlaying_11[eachPlayer.team_key].match.playing_xi.some(player_id => player_id === playerData.player) : playing = false
                                }
                                pushObj.playing = playing
                                // ? pushing bowler into bowl
                                PlayerList.bowl.push(pushObj)
                            }
                        });
                    }

                    PlayerDetails(pointCredit)

                    var newPlayers = players.filter(entry1 => !data.players.some(entry2 => entry1.playerId === entry2.playerId));

                    Admin.updateOne({ username: 'mpl' }, { $push: { players: newPlayers } }, (err) => {
                        if (err) throw err;

                        if (moment(result.data[0].startingTime) < moment()) {
                            return res.status(400).json({
                                success: false,
                                message: 'match has been started',
                                remaining: 0,
                                PlayerList: PlayerList
                            })
                        }

                        return res.status(200).json({
                            success: true,
                            message: "Upcoming Match data Available",
                            remaining: time,
                            PlayerList
                        })
                    })
                })
            });
        });
    },
    upcoming: (req, res) => {
        Match.findOne({ month: moment().format('YYYY-MM') }, ['data'], (err, matchData) => {
            if (err) throw err;
            var upcomingMatch = matchData.data.filter(eachMatch => moment(eachMatch.startingTime) >= moment());


            upcomingMatch.forEach((eachMatch, index) => {
                const matchStart = moment(eachMatch.startingTime)

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

                // checking that lineups out or not
                if (hours === 0 && minutes < 45 && eachMatch.lineups_out === false) {
                    Admin.findOne({ username: 'mpl' }, ['auth_token'], async (err, data) => {
                        if (err) throw err;
                        ACCESS_TOKEN = data.auth_token

                        try {
                            const matchDatas = await axios.get(host + `/rest/v4/match/${eachMatch.key}/?access_token=${ACCESS_TOKEN}&card_type=metric_101`);

                            if (matchDatas.data.data.card.teams.a.match.playing_xi.length) {
                                var pushObj = {
                                    key: match_key,
                                    playing: {
                                        a: { match: { playing_xi: bothPlaying_11.a.match.playing_xi } },
                                        b: { match: { playing_xi: bothPlaying_11.b.match.playing_xi } }
                                    }
                                }
                                Match.updateOne({ month: moment().format('YYYY-MM'), "data.key": eachMatch.key }, { $set: { "data.$.lineups_out": true }, $push: { playing_11: pushObj } }, (err, result) => {
                                    if (err) throw err;
                                    console.log('yes lineups out');
                                })
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    })
                }
                upcomingMatch[index].remaingTime = time
            });

            const list = upcomingMatch.sort((a, b) => {
                return moment(a.startingTime).diff(b.startingTime);
            });
            return res.status(200).json({
                success: true,
                message: "Upcoming Match data Available",
                list
            })
        })
    },
    upcome: (req, res) => {

    }
}
