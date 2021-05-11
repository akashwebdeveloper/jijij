const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types
const Schema = mongoose.Schema

const userSchema = new Schema ({
    phone: {type: Number},
    cash: {winning: {type: Number, default:0 }, deposit: {type: Number, default:0}, bonus: {type: Number, default:0}},
    photos: {type: String},
    bio: {type: String},
    followers:[{type:ObjectId, ref:"User"}],
    following:[{type:ObjectId, ref:"User"}],
    created_teams: {type: Array},
}, { timestamps: true });


module.exports = mongoose.model('user', userSchema)