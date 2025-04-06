const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    questions: [{
        questionText: {
            type: String,
            required: true
        },
        options: [{
            type: String,
            required: true
        }]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sendika: {
        kod: String,
        ad: String
    }
});

module.exports = mongoose.model('Survey', surveySchema); 