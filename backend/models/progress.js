const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true
    },

    subject: {
        type: String,
        required: true
    },

    topic: {
        type: String,
        required: true
    },

    score: {
        type: Number,
        required: true
    },

    total: {
        type: Number,
        required: true
    },

    percentage: {
        type: Number,
        required: true
    },

    date: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Progress", progressSchema);