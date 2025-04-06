const mongoose = require('mongoose');

const isciSchema = new mongoose.Schema({
    tcno: {
        type: String,
        required: true,
        unique: true
    },
    ad: {
        type: String,
        required: true
    },
    soyad: {
        type: String,
        required: true
    },
    sifre: {
        type: String,
        required: true
    },
    sendika: {
        kod: String,
        ad: String
    },
    isyeri: {
        type: String,
        required: true
    },
    departman: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Isci', isciSchema); 