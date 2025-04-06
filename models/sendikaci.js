const mongoose = require('mongoose');

const sendikaciSchema = new mongoose.Schema({
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
    pozisyon: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Sendikaci', sendikaciSchema); 