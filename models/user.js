const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    userType: {
        type: String,
        required: true,
        enum: ['sendikaci', 'isci']
    },
    email: {
        type: String,
        unique: true,
        sparse: true // sendikacı için gerekli, işçi için değil
    },
    tcno: {
        type: String,
        unique: true,
        sparse: true // işçi için gerekli, sendikacı için değil
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    sendika: {
        ad: {
            type: String,
            required: true
        },
        kod: {
            type: String,
            required: true
        },
        sehir: {
            type: String,
            required: true
        }
    },
    pozisyon: {
        type: String,
        required: function() {
            return this.userType === 'sendikaci';
        },
        enum: ['başkan', 'yönetici', 'temsilci', 'uzman']
    },
    isyeri: {
        type: String,
        required: function() {
            return this.userType === 'isci';
        }
    },
    departman: {
        type: String,
        required: function() {
            return this.userType === 'isci';
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'aktif',
        enum: ['aktif', 'pasif', 'askıda']
    }
});

// Şifre hashleme middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Şifre doğrulama metodu
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Sendika bilgilerini getiren metod
userSchema.methods.getSendikaInfo = function() {
    return {
        ad: this.sendika.ad,
        kod: this.sendika.kod,
        sehir: this.sendika.sehir,
        pozisyon: this.userType === 'sendikaci' ? this.pozisyon : undefined,
        isyeri: this.userType === 'isci' ? this.isyeri : undefined,
        departman: this.userType === 'isci' ? this.departman : undefined
    };
};

module.exports = mongoose.model('User', userSchema); 