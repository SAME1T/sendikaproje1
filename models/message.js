const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['talep', 'sikayet', 'oneri']
    },
    category: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    privacy: {
        type: String,
        required: true,
        enum: ['public', 'private']
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'processing', 'solved']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    hedefSendika: {
        ad: String,
        kod: String,
        sehir: String
    },
    oncelik: {
        type: String,
        default: 'normal',
        enum: ['düşük', 'normal', 'yüksek', 'acil']
    },
    yanit: [{
        content: String,
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Yanıt eklemek için metod
messageSchema.methods.addYanit = async function(content, userId) {
    this.yanit.push({ content, userId });
    this.updatedAt = Date.now();
    return this.save();
};

// İleti durumunu güncellemek için metod
messageSchema.methods.updateStatus = async function(newStatus) {
    this.status = newStatus;
    this.updatedAt = Date.now();
    return this.save();
};

module.exports = mongoose.model('Message', messageSchema); 