const mongoose = require('mongoose')

const stockSchema = new mongoose.Schema({
    name : {type: String, required: true, unique: true},
    cost : {type: Number, required: true},
    amount : {type: Number, required: false, default: 0}
}, {collection : 'stock'});

module.exports = stockSchema;