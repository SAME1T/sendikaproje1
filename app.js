const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const apiConfig = require('./config/api.config');
require('dotenv').config();

// Model importları
// const User = require('./models/user'); // Eğer kullanılmıyorsa kaldırılabilir
// const Message = require('./models/message'); // KALDIRILDI
// const Survey = require('./models/survey'); // KALDIRILDI
// const Sendikaci = require('./models/sendikaci'); // KALDIRILDI
// const Isci = require('./models/isci'); // KALDIRILDI
const db = require('./models/sequelize');
const Message = db.Message;
const Survey = db.Survey;
const Sendikaci = db.Sendikaci;
const Isci = db.Isci;

const app = express();

// CORS ayarları
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || apiConfig.allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // her IP için maksimum istek sayısı
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'sendika-secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use('/api', limiter);

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

// Giriş sayfaları rotaları
app.get('/giris/sendikaci', (req, res) => {
    res.render('sendikaci-giris');
});

app.get('/giris/isci', (req, res) => {
    res.render('isci-giris');
});

app.post('/giris/sendikaci', async (req, res) => {
    try {
        const { tcno, sifre } = req.body;
        console.log('Sendikacı girişi denemesi:', { tcno, sifre });

        const users = await db.sequelize.query(
            'SELECT * FROM users WHERE tc_no = ? AND rol = 2',
            {
                replacements: [tcno],
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        const user = users[0];
        console.log('Bulunan kullanıcı:', user);

        if (!user) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı veya yetkiniz yok!' });
        }

        // Şifre kontrolü
        if (sifre === user.password) { // Şimdilik düz metin karşılaştırması yapıyoruz
            // Session'a kullanıcı bilgilerini kaydet
            req.session.userId = user.id;
            req.session.userType = 'sendikaci';
            req.session.user = {
                id: user.id,
                tcno: user.tc_no,
                ad: user.ad,
                soyad: user.soyad,
                email: user.email
            };
            
            return res.json({ success: true, redirect: '/dashboard/sendikaci' });
        } else {
            return res.status(401).json({ error: 'Hatalı şifre!' });
        }
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({ error: 'Giriş yapılırken bir hata oluştu' });
    }
});

app.post('/giris/isci', async (req, res) => {
    try {
        const { tcno, sifre } = req.body;
        console.log('İşçi girişi denemesi:', { tcno, sifre });

        const users = await db.sequelize.query(
            'SELECT * FROM users WHERE tc_no = ? AND rol = 1',
            {
                replacements: [tcno],
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        const user = users[0];
        console.log('Bulunan kullanıcı:', user);

        if (!user) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı veya yetkiniz yok!' });
        }

        // Şifre kontrolü
        if (sifre === user.password) { // Şimdilik düz metin karşılaştırması yapıyoruz
            // Session'a kullanıcı bilgilerini kaydet
            req.session.userId = user.id;
            req.session.userType = 'isci';
            req.session.user = {
                id: user.id,
                tcno: user.tc_no,
                ad: user.ad,
                soyad: user.soyad,
                email: user.email
            };
            
            return res.json({ success: true, redirect: '/dashboard/isci' });
        } else {
            return res.status(401).json({ error: 'Hatalı şifre!' });
        }
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

        // Session'dan kullanıcı bilgilerini al
        const user = req.session.user;
        if (!user) {
            return res.redirect('/giris/sendikaci');
        }

        // Dashboard sayfasını render et
        res.render('sendikaci-dashboard', { 
            user: user,
            activeTab: 'dashboard',
            stats: {
                messageCount: 0,
                surveyCount: 0,
                announcementCount: 0
            }
        });
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

        // Session'dan kullanıcı bilgilerini al
        const user = req.session.user;
        if (!user) {
            return res.redirect('/giris/isci');
        }

        // Dashboard sayfasını render et
        res.render('isci-dashboard', { 
            user: user,
            activeTab: 'dashboard',
            stats: {
                messageCount: 0,
                surveyCount: 0,
                announcementCount: 0
            }
        });
    } catch (error) {
        console.error('Dashboard hatası:', error);
        res.status(500).render('error', { error: 'Bir hata oluştu' });
    }
});

// Üye olma sayfası
app.get('/uye-ol', (req, res) => {
    res.render('uye-ol');
});

// Üye olma işlemi
app.post('/uye-ol', async (req, res) => {
    try {
        const { tcno, ad, soyad, telefon, email, sifre, userType } = req.body;
        console.log('Üye olma denemesi:', { tcno, ad, soyad, telefon, email, userType });

        // TC kimlik numarası kontrolü
        const existingUsers = await db.sequelize.query(
            'SELECT * FROM users WHERE tc_no = ?',
            {
                replacements: [tcno],
                type: db.Sequelize.QueryTypes.SELECT
            }
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Bu TC kimlik numarası zaten kayıtlı!' });
        }

        // E-posta kontrolü
        const existingEmails = await db.sequelize.query(
            'SELECT * FROM users WHERE email = ?',
            {
                replacements: [email],
                type: db.Sequelize.QueryTypes.SELECT
            }
        );
        
        if (existingEmails.length > 0) {
            return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı!' });
        }

        // Rol değerini belirle (1: işçi, 2: sendikacı)
        const rol = userType === 'isci' ? 1 : 2;

        // Yeni kullanıcı oluştur
        const result = await db.sequelize.query(
            'INSERT INTO users (tc_no, ad, soyad, telefon, email, password, rol, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            {
                replacements: [tcno, ad, soyad, telefon, email, sifre, rol],
                type: db.Sequelize.QueryTypes.INSERT
            }
        );

        // Başarılı kayıt sonrası ilgili giriş sayfasına yönlendir
        const redirectUrl = rol === 1 ? '/giris/isci' : '/giris/sendikaci';
        res.json({ 
            success: true, 
            message: 'Kayıt başarıyla tamamlandı! Giriş sayfasına yönlendiriliyorsunuz.',
            redirect: redirectUrl 
        });
    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({ error: 'Kayıt yapılırken bir hata oluştu' });
    }
});

// Şifremi unuttum sayfası
app.get('/sifremi-unuttum', (req, res) => {
    res.render('sifremi-unuttum');
});

// Şifremi unuttum formu POST
app.post('/sifremi-unuttum', async (req, res) => {
    const { email } = req.body;
    // Burada e-posta ile kullanıcıyı bulup, şifre sıfırlama maili gönderebilirsiniz
    // Şimdilik sadece simülasyon ve bilgi mesajı
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ error: 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.' });
    }
    // Burada gerçek uygulamada şifre sıfırlama tokenı ve e-posta gönderimi yapılır
    return res.json({ message: 'Şifre yenileme bağlantısı e-posta adresinize gönderildi.' });
});

// API routes
app.use('/api', require('./routes/api'));

// Veritabanı bağlantı testi
db.sequelize.authenticate()
  .then(() => {
    console.log('Veritabanı bağlantısı başarılı.');
    // Test sorgusu
    return db.sequelize.query('SELECT COUNT(*) FROM users', { type: db.Sequelize.QueryTypes.SELECT });
  })
  .then(result => {
    console.log('Users tablosunda toplam kayıt sayısı:', result[0].count);
  })
  .catch(err => {
    console.error('Veritabanı bağlantı hatası:', err);
  });

// Server başlatma
const PORT = apiConfig.apiPort;
app.listen(PORT, () => {
  console.log(`API Sunucusu port ${PORT} üzerinde çalışıyor`);
}); 