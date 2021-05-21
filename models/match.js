const mongoose = require('mongoose')
const Schema = mongoose.Schema

const matchSchema = new Schema ({
    month: {type: String},
    data: {type: Array},
    playing_11: {type: Array},
});


module.exports = mongoose.model('match', matchSchema)