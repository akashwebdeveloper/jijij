const mongoose = require('mongoose')
const Schema = mongoose.Schema

const adminSchema = new Schema ({
    username: {type: String},
    country: {type: String},
    phone: {type: String},
    password: {type: String},
    profile: {type: String},
    fname: {type: String},
    lname: {type: String},
    auth_token: { type: String }
});


module.exports = mongoose.model('admin', adminSchema);