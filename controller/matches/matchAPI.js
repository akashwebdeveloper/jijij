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

            // * This API for getting time of match start
            options.url = host + `/rest/v2/match/${match_key}/?access_token=${ACCESS_TOKEN}&card_type=summary_card`

            request(options, function (error, response) {
                if (error) throw new Error(error)
                const teamCards = response.body.data.card;

                var time = "",
                    // ? creating model for Squad List
                    PlayerList = {
                        wk: [],
                        bat: [],
                        ar: [],
                        bowl: [],
                    },
                    players = []

                const matchStart = moment(teamCards.start_date.iso)
                const days = matchStart.diff(moment(), 'days')
                const hours = matchStart.diff(moment(), 'hours') - (24 * (days));
                const minutes = (matchStart.diff(moment(), 'minutes') - (1440 * (days))) - (60 * hours);
                // console.log(days);
                // console.log(hours);
                // console.log(minutes);

                // ? Remaining time to Start Match
                if (days > 0) {
                    time += `${days} Days ${hours} Hours`;
                } else {
                    time += `${hours} Hours ${minutes} Minutes `;
                }

                // * This API for getting All details Player name, player point, player credit
                options.url = host + `/rest/v3/fantasy-match-credits/${match_key}/?access_token=${ACCESS_TOKEN}`
                request(options, function (error, matchFullData) {

                    if (error) throw new Error(error)
                    if (matchFullData.body.data == null) {
                        return res.status(200).json({
                            success: false,
                            message: matchFullData.body.status_msg,
                            remaining: null,
                            PlayerList: matchFullData.body.data
                        })
                    }

                    const pointCredit = matchFullData.body.data.fantasy_points;
                    const teamInfo = matchFullData.body.data.teams;
                    const playerInfo = matchFullData.body.data.players;

                    // * Function for seperate all diffrent role player and makeing list of Squad
                    function PlayerDetails(teamPlayerList) {
                        teamPlayerList.forEach(playerData => {
                            let eachPlayer = playerInfo[playerData.player]
                            let eachPlayerRole = playerInfo[playerData.player].seasonal_role

                            var pushObj = {};
                            var pushTeamObj = {};
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

                                // ? pushing keeper into wk
                                PlayerList.wk.push(pushObj)
                            } else if (eachPlayerRole === "batsman") {

                                pushObj.playerId = playerData.player
                                pushObj.playerName = eachPlayer.name
                                pushObj.team = eachPlayer.team_key === 'a' ? teamInfo.a.short_name : teamInfo.b.short_name
                                pushObj.point = playerData.season_points
                                pushObj.credit = playerData.credit_value

                                // ? pushing batsman into bat
                                PlayerList.bat.push(pushObj)
                            } else if (eachPlayerRole === "allrounder") {

                                pushObj.playerId = playerData.player
                                pushObj.playerName = eachPlayer.name
                                pushObj.team = eachPlayer.team_key === 'a' ? teamInfo.a.short_name : teamInfo.b.short_name
                                pushObj.point = playerData.season_points
                                pushObj.credit = playerData.credit_value

                                // ? pushing allrounder into ar
                                PlayerList.ar.push(pushObj)
                            } else {

                                pushObj.playerId = playerData.player
                                pushObj.playerName = eachPlayer.name
                                pushObj.team = eachPlayer.team_key === 'a' ? teamInfo.a.short_name : teamInfo.b.short_name
                                pushObj.point = playerData.season_points
                                pushObj.credit = playerData.credit_value

                                // ? pushing bowler into bowl
                                PlayerList.bowl.push(pushObj)
                            }
                        });
                    }

                    PlayerDetails(pointCredit)

                    var newPlayers = players.filter(entry1 => !data.players.some(entry2 => entry1.playerId === entry2.playerId));

                    Admin.updateOne({ username: 'mpl' }, { $push: { players: newPlayers } }, (err) => {
                        if (err) throw err;

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


            matchData.data.forEach((eachMatch, index) => {
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

                matchData.data[index].remaingTime = time
            });

            const list = matchData.data.sort((a, b) => {
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
