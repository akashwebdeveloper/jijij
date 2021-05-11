require('dotenv').config()

const User = require('../../models/user')


    module.exports = {
        signup(req, res) {
            const { type, fname, lname, username, dob, countrycode, phone, email, gender, weight, height, token, photos } = req.body

            User.findOne({ $or: [{ phone: phone }, { email: email }] }, (err, users) => {
                // User.findOne({ email: email }, (err, users) => {
                if (err) {
                    return res.status(502).json({
                        success: false,
                        status: 502,
                        message: "err from database"
                    })
                }

                if (users) {
                    return res.status(202).json({
                        success: false,
                        status: 202,
                        message: "user Already exist",
                        user: [users]
                    })
                }
                const user = new User({
                    type: type || "",
                    fname: fname || "",
                    lname: lname || "",
                    username: username || "",
                    dob: dob || "",
                    gender: gender || "",
                    email: email || "",
                    photos: photos || "",
                    weight: weight || "",
                    height: height || "",
                    countrycode: countrycode || "",
                    phone: phone || "",
                    token: token || "",
                })
                // New User Save to database
                user.save().then(user => {
                    // login
                    return res.status(200).json({
                        success: 1,
                        status: 200,
                        message: "verfied data save in to database",
                        user: [user],
                    })
                }).catch(err => {
                    return res.status(503).json({
                        success: 0,
                        status: 503,
                        message: "err from database",
                        err
                    })
                })
            })
        },
        register(req, res) {
            // const { countryCode, phone } = req.body

            // // User.findOne({ $or: [{ phone: phone }, { email: email }] }, (err, users) => {
            // User.findOne({ phone: phone }, (err, users) => {
            //     if (err) {
            //         return res.status(502).json({
            //             success: false,
            //             status: 502,
            //             message: "err from database"
            //         })
            //     }

            //     if (users) {
            //         client
            //             .verify
            //             .services(serviceID)
            //             .verifications
            //             .create({
            //                 to: `+${countryCode}${phone}`,
            //                 channel: "sms"
            //             })
            //             .then((data) => {
            //                 return res.status(200).json({
            //                     success: true,
            //                     message: "please check your mobile Number for otp verification",
            //                     status: 200,
            //                     user: [users]
            //                 })
            //             }).catch((err) => {
            //                 res.status(503).json({
            //                     success: false,
            //                     message: "please Enter correct country code/ mobile number",
            //                     status: 503,
            //                     err
            //                 })
            //             })
            //     } else {
            //         return res.status(202).json({
            //             success: true,
            //             status: 202,
            //             message: "Mobile number is not registered",
            //         })
            //     }
            // })
        },
        phone(req, res) {
            // const { phone, country } = req.query

            // console.log(`+${country}${phone}`)
            // client
            //     .verify
            //     .services(serviceID)
            //     .verifications
            //     .create({
            //         to: `+${country}${phone}`,
            //         channel: "sms"
            //     })
            //     .then((data) => {
            //         res.status(200).json({
            //             success: true,
            //             message: "please check your mobile Number for otp verification",
            //             status: 200
            //         })
            //     }).catch((err) => {
            //         res.status(503).json({
            //             success: false,
            //             message: "please Enter correct country code/ mobile number",
            //             status: 503,
            //             err
            //         })
            //     })
        },
        verify(req, res) {

            // const { phone, country, code } = req.query

            // if (!code || code.length != '4') {
            //     return res.status(400).json({
            //         message: "can't go ahead without enter correct OTP and OTP should four digit",
            //         status: 400,
            //     })
            // }
            // client
            //     .verify
            //     .services(serviceID)
            //     .verificationChecks
            //     .create({
            //         to: `+${country}${phone}`,
            //         code: code
            //     })
            //     .then(verification_check => {
            //         if (verification_check.status === 'pending') {
            //             return res.status(500).json({
            //                 success: false,
            //                 status: 500,
            //                 message: "Code is wrong please Enter again"
            //             })
            //         }



            //         console.log(verification_check.status)

            //         User.find({ phone: phone }, (err, data) => {
            //             if (err) {
            //                 return res.status(502).json({
            //                     success: false,
            //                     status: 502,
            //                     message: "err from database"
            //                 })
            //             }

            //             if (data[0]) {
            //                 console.log(data);
                            
            //                 return res.status(200).json({
            //                     success: true,
            //                     status: 200,
            //                     message: "Number verified successfully",
            //                     countryCode: country,
            //                     phone,
            //                     user: data[0]
            //                 })
            //             }

            //             const user = new User({
            //                 phone: phone || ""
            //             })
            //             // New User Save to database
            //             user.save().then(user => {
            //                 // login
            //                 return res.status(200).json({
            //                     success: 1,
            //                     status: 200,
            //                     message: "New number verfied & data save in to database",
            //                     user: user
            //                 })
            //             }).catch(err => {
            //                 return res.status(503).json({
            //                     success: 0,
            //                     status: 503,
            //                     message: "err from database",
            //                     err
            //                 })
            //             })
            //         })
            //     }).catch((err) => {
            //         res.status(202).json({
            //             success: false,
            //             message: "wrong OTP please enter correct OTP",
            //             status: 202,
            //             err
            //         })
            //     })
        },
        resendotp(req, res) {
            // const { phone, country } = req.query

            // console.log(`+${country}${phone}`)
            // client
            //     .verify
            //     .services(serviceID)
            //     .verifications
            //     .create({
            //         to: `+${country}${phone}`,
            //         channel: "sms"
            //     })
            //     .then((data) => {
            //         res.status(200).json({
            //             success: true,
            //             message: "please check your mobile Number for otp verification",
            //             status: 200
            //         })
            //     }).catch((err) => {
            //         res.status(503).json({
            //             success: false,
            //             message: "please Enter correct country code/ mobile number",
            //             status: 503,
            //             err
            //         })
            //     })
        },
        register1(req, res) {
            // const { countryCode, phone } = req.body

            // // User.findOne({ $or: [{ phone: phone }, { email: email }] }, (err, users) => {
            // User.findOne({ phone: phone }, (err, users) => {
            //     if (err) {
            //         return res.status(502).json({
            //             success: false,
            //             status: 502,
            //             message: "err from database"
            //         })
            //     }

            //     if (users) {
            //         client
            //             .verify
            //             .services(serviceID)
            //             .verifications
            //             .create({
            //                 to: `+${countryCode}${phone}`,
            //                 channel: "sms"
            //             })
            //             .then((data) => {
            //                 return res.status(200).json({
            //                     success: true,
            //                     message: "please check your mobile Number for otp verification",
            //                     status: 200
            //                 })
            //             }).catch((err) => {
            //                 res.status(503).json({
            //                     success: false,
            //                     message: "please Enter correct country code/ mobile number",
            //                     status: 503,
            //                     err
            //                 })
            //             })
            //     } else {
            //         return res.status(202).json({
            //             success: true,
            //             status: 202,
            //             message: "Mobile number is not registered",
            //         })
            //     }
            // })
        }

    }