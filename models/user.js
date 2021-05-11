const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types
const Schema = mongoose.Schema

const userSchema = new Schema ({
    phone: {type: Number},
    cash: {type: Array, default: {
        title: 'Welcome bonus',
        description: 'Credited To Bonus Cash Balance',
        ammount: 10,
        added: true,
        wallet: 'bonus',
        Date: new Date()
    }},
    photos: {type: String ,default: ''},
    bio: {type: String, default: 'I am Player'},
    followers:[{type:ObjectId, ref:"User"}],
    following:[{type:ObjectId, ref:"User"}],
    created_teams: {type: Array},
}, { timestamps: true });


module.exports = mongoose.model('user', userSchema)