require('dotenv').config()

const path = require('path');
const GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, '/firebasefile.json');
const FIREBASE_SERVER_KEY = process.env.FIREBASE_SERVER_KEY
var admin = require("firebase-admin");
const request = require('request');
var serviceAccount = require(GOOGLE_APPLICATION_CREDENTIALS);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

module.exports = {
    oneUser: (req, res) => {


        const  { token, title, body } = req.body
        // This registration token comes from the client FCM SDKs.
        // var registrationToken = 'fDpS_u1IRoaYczlFT4RL7N:APA91bHwIqe4lbj8Mc-RiHsbJ4GPK48bI7-OVwWeKN00p8bVWCkeQDrpAcBEk_2VmsTDfb1cXHtaIGyKA8Kwq4Le7dy63NzoZYJqaEXGPuM07ZTHH1DQ8JjePOzXZYIKYhGB4wHx50-M';

        var message = {
            data: {
                title: title,
                body: body
            },
            to: token
        }
        // sendMessage(message)
        sendNotifications(message)

        res.status(200).json({
            "success" : 1,
        })
    },
    // multiUser: (req, res) => {


    //     const  { token, title, body } = req.body

    //         const data = {
    //             "data": {
    //                 "body": msg,
    //                 "title": title
    //             }
    //         }
        
    //         const folds = regIdArray.length % 1000
        
    //         for (let i = 0; i < folds; i++) {
    //             let start = i * 1000,
    //                 end = (i + 1) * 1000
        
    //             data['registration_ids'] = regIdArray.slice(start, end).map((item) => {
    //                 return item['token']
    //             })
        
    //             sendNotifications(data)
    //         }
        
    //         response.sendStatus(200)
    // },

}








function sendMessage(message) {
    // Send a message to the device corresponding to the provided
    // registration token.
    admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
}







const sendNotifications = (data) => {


    const headers = {
        'Authorization': `key=${FIREBASE_SERVER_KEY}`,
        'Content-Type': 'application/json'
    }

    const options = {
        uri: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: headers,
        json: data
    }

    request(options, function (err, res, body) {
        if (err) throw err
        else console.log(body)
    })
}