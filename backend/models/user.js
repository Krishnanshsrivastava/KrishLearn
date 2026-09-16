const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    // STUDY PROFILE
    education: {
        type: String,
        default: ""
    },

    course: {
        type: String,
        default: ""
    },

    subjects: {
        type: [String],
        default: []
    },

    studyTime: {
        type: String,
        default: ""
    },

    studyGoal: {
        type: String,
        default: ""
    },

    // QUIZ PROGRESS
    quizAttempts: {
        type: Number,
        default: 0
    },

    totalQuestions: {
        type: Number,
        default: 0
    },

    correctAnswers: {
        type: Number,
        default: 0
    },

    averageScore: {
        type: Number,
        default: 0
    }

});

module.exports = mongoose.model("User", userSchema);