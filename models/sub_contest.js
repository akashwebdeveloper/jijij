const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types
const Schema = mongoose.Schema

const subContestSchema = new Schema ({
    contestId: {type: ObjectId},
    matchKey: {type: String},
    joined_user_team: [],
    isFull: {type: Boolean, default: false},
    // winner: {type: Array},
    // entryFee: {type: Number},
    // entryLimit: {type: Number},
});


module.exports = mongoose.model('subcontest', subContestSchema)