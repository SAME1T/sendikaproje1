const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    ad: {
        type: String,
        required: true,
        trim: true
    },
    soyad: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    sifre: {
        type: String,
        required: true
    },
    tc: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    telefon: {
        type: String,
        trim: true
    },
    rol: {
        type: Number,
        default: 1, // 1: Üye, 2: Sendikacı, 3: Admin
        required: true
    },
    profil_foto: {
        type: String,
        default: null
    },
    kapak_foto: {
        type: String,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema); 