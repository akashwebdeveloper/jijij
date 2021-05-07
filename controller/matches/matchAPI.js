require('dotenv').config()
const User = require('../../models/user')
const Admin = require('../../models/admin')
const moment = require('moment');
const request = require('request')
var ACCESS_TOKEN = '';



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
schedule.scheduleJob('0 0 0 * * *', function () {
    request(options, function (error, response) {
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




module.exports = {
    testing: (req, res) => {
        request(authToken, function (error, response) {
            if (error) throw new Error(error)
            // console.log(response.body)
            if (response.body.status_code === 200) {
                Admin.updateOne({ username: 'mpl' }, { $set: { auth_token: response.body.auth.access_token } }, (err, data) => {
                    if (err) throw err;
                    return res.status(200).json({
                        message: "auth_token updated successfully"
                    })
                });
            }
        })
    },
    Squad: (req, res) => {
        const { match_key } = req.body

        Admin.findOne({ username: 'mpl' }, ['auth_token'], (err, data) => {
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
                    }

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
                    const pointCredit = matchFullData.body.data.fantasy_points;
                    const teamInfo = matchFullData.body.data.teams;
                    const playerInfo = matchFullData.body.data.players;

                    // * Function for seperate all diffrent role player and makeing list of Squad
                    function PlayerDetails(teamPlayerList) {
                        teamPlayerList.forEach(playerData => {
                            let eachPlayer = playerInfo[playerData.player]
                            let eachPlayerRole = playerInfo[playerData.player].seasonal_role
                            
                            var pushObj = {};
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

                    return res.status(200).json({
                        success: true,
                        message: "Upcoming Match data Available",
                        remaining: time,
                        PlayerList
                    })
                })
            });
        });
    },
    upcoming: (req, res) => {

        Admin.findOne({ username: 'mpl' }, ['auth_token'], (err, data) => {
            if (err) throw err;
            ACCESS_TOKEN = data.auth_token

            var list = [];
            options.url = host + `/rest/v2/schedule/?access_token=${ACCESS_TOKEN}`

            request(options, function (error, response) {
                if (error) throw new Error(error)
                for (let index = moment().format('DD'); index <= moment().daysInMonth(); index++) {

                    response.body.data.months[0].days[index - 1].matches.forEach(match => {

                        var sendMatch = {};
                        sendMatch.key = match.key
                        sendMatch.seriesName = match.season.name
                        sendMatch.matchName = match.short_name
                        sendMatch.team1_id = match.teams.a.match.season_team_key
                        sendMatch.team1 = match.teams.a.key.toUpperCase();
                        sendMatch.team2_id = match.teams.b.match.season_team_key
                        sendMatch.team2 = match.teams.b.key.toUpperCase();
                        // sendMatch.team1_logo = responseTwo.data.data.image_path
                        // sendMatch.team2_logo = responesThree.data.data.image_path

                        const matchStart = moment(match.start_date.iso)

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

                        // console.log(time);
                        sendMatch.remaingTime = time
                        sendMatch.doNotUse = match.start_date.iso

                        list.push(sendMatch)
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Upcoming Match data Available",
                    list: list
                })
            })
        });
    },
}