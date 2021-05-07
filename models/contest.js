const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types
const Schema = mongoose.Schema

const contestSchema = new Schema ({
    prizePool: {type: Number},
    spot: {type: Number},
    winner: {type: Array},
    entryFee: {type: Number},
    entryLimit: {type: Number},
});


module.exports = mongoose.model('contest', contestSchema)