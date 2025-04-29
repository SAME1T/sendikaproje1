const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Model importları
const User = require('./models/user');
const Message = require('./models/message');
const Survey = require('./models/survey');
const Sendikaci = require('./models/sendikaci');
const Isci = require('./models/isci');

// Anonim veri modeli
const anonymousDataSchema = new mongoose.Schema({
    sendika: {
        type: String,
        required: true
    },
    isyeri: {
        type: String,
        required: true
    },
    departman: {
        type: String,
        required: true
    },
    mesaj: {
        type: String,
        required: true
    },
    tarih: {
        type: Date,
        default: Date.now
    }
});

const AnonymousData = mongoose.model('AnonymousData', anonymousDataSchema);

const app = express();

// MongoDB bağlantısı
mongoose.connect('mongodb://localhost:27017/sendika_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch((err) => console.error('MongoDB bağlantı hatası:', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'sendika-secret-key',
    resave: false,
    saveUninitialized: true
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { error: 'Bir hata oluştu' });
});

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// Giriş sayfaları
app.get('/giris/sendikaci', (req, res) => {
    res.render('sendikaci-giris');
});

app.get('/giris/isci', (req, res) => {
    res.render('isci-giris');
});

// Giriş işlemleri
app.post('/giris/sendikaci', async (req, res) => {
    try {
        const { tcno, sifre } = req.body;
        const sendikaci = await Sendikaci.findOne({ tcno });

        if (!sendikaci || !(await bcrypt.compare(sifre, sendikaci.sifre))) {
            return res.status(401).json({ error: 'Geçersiz TC kimlik numarası veya şifre' });
        }

        req.session.user = {
            id: sendikaci._id,
            tcno: sendikaci.tcno,
            ad: sendikaci.ad,
            soyad: sendikaci.soyad,
            type: 'sendikaci'
        };

        res.json({ redirect: '/dashboard/sendikaci' });
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({ error: 'Giriş yapılırken bir hata oluştu' });
    }
});

app.post('/giris/isci', async (req, res) => {
    try {
        const { tcno, sifre } = req.body;
        const isci = await Isci.findOne({ tcno });

        if (!isci || !(await bcrypt.compare(sifre, isci.sifre))) {
            return res.status(401).json({ error: 'Geçersiz TC kimlik numarası veya şifre' });
        }

        req.session.user = {
            id: isci._id,
            tcno: isci.tcno,
            ad: isci.ad,
            soyad: isci.soyad,
            type: 'isci'
        };

        res.json({ redirect: '/dashboard/isci' });
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({ error: 'Giriş yapılırken bir hata oluştu' });
    }
});

// Çıkış işlemi
app.get('/cikis', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// İletiler sayfası route'u
app.get('/iletiler', async (req, res, next) => {
    try {
        const messages = await Message.find()
            .populate('userId', 'name surname')
            .sort({ createdAt: -1 });
        res.render('messages', { messages });
    } catch (error) {
        next(error);
    }
});

// Anketler sayfası route'u
app.get('/anketler', async (req, res) => {
    try {
        const surveys = await Survey.find()
            .populate('createdBy', 'name surname')
            .sort({ createdAt: -1 });
        res.render('anketler', { surveys });
    } catch (error) {
        console.error('Anketleri getirme hatası:', error);
        res.status(500).render('error', { error: 'Anketler yüklenirken bir hata oluştu' });
    }
});

// İleti oluşturma API endpoint'i
app.post('/api/messages', async (req, res) => {
    try {
        const { type, category, content, privacy, hedefSendika, oncelik } = req.body;
        
        // Kullanıcı bilgilerini al
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
        }

        const message = new Message({
            type,
            category,
            content,
            privacy,
            oncelik,
            userId: user._id,
            sendika: user.sendika,
            hedefSendika: hedefSendika
        });
        
        const savedMessage = await message.save();
        const populatedMessage = await Message.findById(savedMessage._id)
            .populate('userId', 'name surname sendika pozisyon isyeri departman')
            .populate('yanit.userId', 'name surname sendika pozisyon');
            
        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('İleti oluşturma hatası:', error);
        res.status(500).json({ error: 'İleti oluşturulurken bir hata oluştu' });
    }
});

// İletileri listeleme API endpoint'i
app.get('/api/messages', async (req, res) => {
    try {
        const { type, status, privacy, sendikaKod, oncelik } = req.query;
        const query = {};
        
        // Kullanıcı bilgilerini al
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
        }

        // Temel filtreler
        if (type) query.type = type;
        if (status) query.status = status;
        if (privacy) query.privacy = privacy;
        if (oncelik) query.oncelik = oncelik;

        // Sendika bazlı filtreleme
        if (sendikaKod) {
            query['sendika.kod'] = sendikaKod;
        } else {
            // Kullanıcının kendi sendikasına ait iletileri getir
            query['sendika.kod'] = user.sendika.kod;
        }
        
        const messages = await Message.find(query)
            .populate('userId', 'name surname sendika pozisyon isyeri departman')
            .populate('yanit.userId', 'name surname sendika pozisyon')
            .sort({ createdAt: -1 });
            
        res.json(messages);
    } catch (error) {
        console.error('İletileri listeleme hatası:', error);
        res.status(500).json({ error: 'İletiler listelenirken bir hata oluştu' });
    }
});

// İletiye yanıt ekleme endpoint'i
app.post('/api/messages/:messageId/yanit', async (req, res) => {
    try {
        const { content } = req.body;
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'İleti bulunamadı' });
        }

        await message.addYanit(content, req.session.userId);
        
        const updatedMessage = await Message.findById(messageId)
            .populate('userId', 'name surname sendika pozisyon isyeri departman')
            .populate('yanit.userId', 'name surname sendika pozisyon');

        res.json(updatedMessage);
    } catch (error) {
        console.error('Yanıt ekleme hatası:', error);
        res.status(500).json({ error: 'Yanıt eklenirken bir hata oluştu' });
    }
});

// İleti durumunu güncelleme endpoint'i
app.patch('/api/messages/:messageId/status', async (req, res) => {
    try {
        const { status } = req.body;
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'İleti bulunamadı' });
        }

        await message.updateStatus(status);
        
        const updatedMessage = await Message.findById(messageId)
            .populate('userId', 'name surname sendika pozisyon isyeri departman')
            .populate('yanit.userId', 'name surname sendika pozisyon');

        res.json(updatedMessage);
    } catch (error) {
        console.error('Durum güncelleme hatası:', error);
        res.status(500).json({ error: 'Durum güncellenirken bir hata oluştu' });
    }
});

// Anonim veri ekleme endpoint'i
app.post('/api/anonymous-data', async (req, res) => {
    try {
        const { sendika, isyeri, departman, mesaj } = req.body;
        
        const yeniVeri = new AnonymousData({
            sendika,
            isyeri,
            departman,
            mesaj
        });
        
        await yeniVeri.save();
        
        res.status(201).json({ message: 'Veri başarıyla kaydedildi' });
    } catch (error) {
        console.error('Veri kaydetme hatası:', error);
        res.status(500).json({ error: 'Veri kaydedilemedi' });
    }
});

// Anket oluşturma API endpoint'i
app.post('/api/surveys', async (req, res) => {
    try {
        const { title, questions } = req.body;
        
        // Kullanıcı bilgilerini al
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
        }

        const survey = new Survey({
            title,
            questions,
            createdBy: user._id,
            sendika: user.sendika
        });
        
        const savedSurvey = await survey.save();
        const populatedSurvey = await Survey.findById(savedSurvey._id)
            .populate('createdBy', 'name surname');
            
        res.status(201).json(populatedSurvey);
    } catch (error) {
        console.error('Anket oluşturma hatası:', error);
        res.status(500).json({ error: 'Anket oluşturulurken bir hata oluştu' });
    }
});

// Anketleri listeleme API endpoint'i
app.get('/api/surveys', async (req, res) => {
    try {
        const surveys = await Survey.find()
            .populate('createdBy', 'name surname')
            .sort({ createdAt: -1 });
            
        res.json(surveys);
    } catch (error) {
        console.error('Anketleri listeleme hatası:', error);
        res.status(500).json({ error: 'Anketler listelenirken bir hata oluştu' });
    }
});

// Dashboard sayfası rotası
app.get('/dashboard/sendikaci', async (req, res) => {
    try {
        if (!req.session.userId || req.session.userType !== 'sendikaci') {
            return res.redirect('/giris/sendikaci');
        }

        const sendikaci = await Sendikaci.findById(req.session.userId);
        if (!sendikaci) {
            return res.redirect('/giris/sendikaci');
        }

        res.render('sendikaci-dashboard', { sendikaci });
    } catch (error) {
        console.error('Dashboard hatası:', error);
        res.status(500).render('error', { error: 'Bir hata oluştu' });
    }
});

// İşçi dashboard sayfası rotası
app.get('/dashboard/isci', async (req, res) => {
    try {
        if (!req.session.userId || req.session.userType !== 'isci') {
            return res.redirect('/giris/isci');
        }

        const isci = await Isci.findById(req.session.userId);
        if (!isci) {
            return res.redirect('/giris/isci');
        }

        res.render('isci-dashboard', { isci });
    } catch (error) {
        console.error('Dashboard hatası:', error);
        res.status(500).render('error', { error: 'Bir hata oluştu' });
    }
});

// Port
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
}); 