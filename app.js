const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const apiConfig = require('./config/api.config');
require('dotenv').config();
const { Pool } = require('pg');
const db = require('./models/sequelize');
const Message = db.Message;
const Survey = db.Survey;
const Sendikaci = db.Sendikaci;
const Isci = db.Isci;
const Payroll = db.Payroll;
const multer = require('multer');
const fs = require('fs');
const uploadDir = path.join(__dirname, 'public/uploads/payrolls');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage, fileFilter: (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Sadece PDF dosyası yükleyebilirsiniz!'));
  }
  cb(null, true);
}});

const app = express();

// PostgreSQL bağlantı ayarları
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sendikaprojesi',
    password: 'Samet6380.',
    port: 5432,
});

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

// İşçi giriş işlemi
app.post('/isci-giris', async (req, res) => {
    const { tc, sifre } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE tc_no = $1 AND password = $2 AND rol = 1',
            [tc, sifre]
        );
        
        if (result.rows.length > 0) {
            // Session'a kullanıcı bilgilerini kaydet
            req.session.userId = result.rows[0].id;
            req.session.userType = 'isci';
            req.session.user = result.rows[0];
            
            res.redirect('/dashboard/isci');
        } else {
            res.render('isci-giris', { error: 'TC veya şifre hatalı!' });
        }
    } catch (err) {
        console.error(err);
        res.render('isci-giris', { error: 'Bir hata oluştu!' });
    }
});

// Sendikacı giriş işlemi
app.post('/sendikaci-giris', async (req, res) => {
    const { tc, sifre } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE tc_no = $1 AND password = $2 AND rol = 2',
            [tc, sifre]
        );
        
        if (result.rows.length > 0) {
            // Session'a kullanıcı bilgilerini kaydet
            req.session.userId = result.rows[0].id;
            req.session.userType = 'sendikaci';
            req.session.user = result.rows[0];
            
            res.redirect('/dashboard/sendikaci');
        } else {
            res.render('sendikaci-giris', { error: 'TC veya şifre hatalı!' });
        }
    } catch (err) {
        console.error(err);
        res.render('sendikaci-giris', { error: 'Bir hata oluştu!' });
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
        if (!req.session.userId || !req.session.userType) {
            return res.redirect('/giris/' + (req.session.userType === 'isci' ? 'isci' : 'sendikaci'));
        }
        const user = req.session.user;
        const userType = req.session.userType;
        let surveys = [];
        let answers = [];
        if (userType === 'isci') {
            // Sadece aktif anketleri çek
            surveys = await db.Survey.findAll({
                where: { status: 'aktif' },
                order: [['created_at', 'DESC']],
                include: [{ model: db.SurveyQuestion, as: 'questions' }]
            });
            // İşçi için: kendi cevapladığı anket cevaplarını çek
            answers = await db.SurveyAnswer.findAll({ where: { user_id: req.session.userId } });
        } else if (userType === 'sendikaci') {
            // Sendikacı için: tüm anketler ve cevaplar
            surveys = await db.Survey.findAll({
                order: [['created_at', 'DESC']],
                include: [{ model: db.SurveyQuestion, as: 'questions' }]
            });
            answers = await db.SurveyAnswer.findAll();
        }
        res.render('anketler', { user, userType, surveys, answers });
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

// İşçi dashboard sayfası
app.get('/dashboard/isci', async (req, res) => {
    try {
        if (!req.session.userId || req.session.userType !== 'isci') {
            return res.redirect('/giris/isci');
        }

        // İşçi (rol=1) toplam üye sayısını çek
        const result = await pool.query(
            'SELECT COUNT(*) as count FROM users WHERE rol = 1'
        );
        const uyeSayisi = result.rows[0].count;

        // Dashboard sayfasını render et
        res.render('isci-dashboard', { 
            user: req.session.user,
            uyeSayisi: uyeSayisi,
            activeTab: 'dashboard'
        });
    } catch (error) {
        console.error('Dashboard hatası:', error);
        res.status(500).render('error', { error: 'Bir hata oluştu' });
    }
});

// Sendikacı dashboard sayfası
app.get('/dashboard/sendikaci', async (req, res) => {
    try {
        if (!req.session.userId || req.session.userType !== 'sendikaci') {
            return res.redirect('/giris/sendikaci');
        }

        // Sendikacı (rol=2) toplam üye sayısını çek
        const result = await pool.query(
            'SELECT COUNT(*) as count FROM users WHERE rol = 2'
        );
        const uyeSayisi = result.rows[0].count;

        // Dashboard sayfasını render et
        res.render('sendikaci-dashboard', { 
            user: req.session.user,
            uyeSayisi: uyeSayisi,
            activeTab: 'dashboard'
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
        // TC ve e-posta kontrolü
        const existingUser = await pool.query('SELECT * FROM users WHERE tc_no = $1 OR email = $2', [tcno, email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Bu TC kimlik numarası veya e-posta zaten kayıtlı!' });
        }
        // Rol değerini belirle (1: işçi, 2: sendikacı)
        const rol = userType === 'isci' ? 1 : 2;
        // Yeni kullanıcıyı ekle
        await pool.query(
            'INSERT INTO users (tc_no, ad, soyad, telefon, email, password, rol) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [tcno, ad, soyad, telefon, email, sifre, rol]
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

// Bordrolarım (işçi)
app.get('/bordrolarim', async (req, res) => {
    if (!req.session.userId || req.session.userType !== 'isci') {
        return res.redirect('/giris/isci');
    }
    // İşçinin bordrolarını çek
    const payrolls = await db.Payroll.findAll({ where: { user_id: req.session.userId }, order: [['payroll_date', 'DESC']] });
    // Toplam bordro sayısı
    const toplamBordro = payrolls.length;
    // Son bordro tarihi
    let sonBordro = '-';
    if (payrolls.length > 0) {
        const tarih = payrolls[0].payroll_date;
        if (tarih) {
            const dateObj = new Date(tarih);
            const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            sonBordro = dateObj.getFullYear() + ' ' + aylar[dateObj.getMonth()];
        }
    }
    // Yıllık toplam (bu yılın bordroları)
    const buYil = new Date().getFullYear();
    const yillikToplam = payrolls.filter(p => p.payroll_date && new Date(p.payroll_date).getFullYear() === buYil)
        .reduce((sum, p) => sum + Number(p.amount), 0);
    res.render('bordrolarim', { user: req.session.user, payrolls, toplamBordro, sonBordro, yillikToplam });
});

// Bordro Yönetim (sendikacı)
app.get('/bordro-yonetim', async (req, res) => {
    if (!req.session.userId || req.session.userType !== 'sendikaci') {
        return res.redirect('/giris/sendikaci');
    }
    // Tüm işçileri users tablosundan çek
    const isciler = await pool.query('SELECT id, ad, soyad, tc_no FROM users WHERE rol = 1');
    const payrolls = await db.Payroll.findAll({ order: [['created_at', 'DESC']] });
    // Toplam bordro sayısı
    const toplamBordro = payrolls.length;
    // Son gönderim tarihi
    let sonGonderim = '-';
    if (payrolls.length > 0) {
        const tarih = payrolls[0].payroll_date;
        if (tarih) {
            const dateObj = new Date(tarih);
            const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            sonGonderim = dateObj.getFullYear() + ' ' + aylar[dateObj.getMonth()];
        }
    }
    // Bekleyen bordro sayısı (örnek: description veya pdf_path eksik olanlar bekliyor kabul edilsin)
    const bekleyenBordro = payrolls.filter(p => !p.pdf_path).length;
    res.render('bordro-yonetim', { user: req.session.user, isciler: isciler.rows, payrolls, toplamBordro, sonGonderim, bekleyenBordro });
});

// Anket Yönetimi (sendikacı)
app.get('/anket-yonetim', async (req, res) => {
    try {
        if (!req.session.userId || req.session.userType !== 'sendikaci') {
            return res.redirect('/giris/sendikaci');
        }
        // Sadece bu sendikacının oluşturduğu anketleri çekmek isterseniz:
        // const surveys = await db.Survey.findAll({ where: { created_by: req.session.userId }, ... });
        // Şimdilik tüm anketleri çekiyoruz:
        const surveys = await db.Survey.findAll({
            order: [['created_at', 'DESC']],
            include: [{ model: db.SurveyQuestion, as: 'questions' }]
        });
        res.render('anket-yonetim', { user: req.session.user, surveys });
    } catch (error) {
        console.error('Anket yönetimi hatası:', error);
        res.status(500).render('error', { error: 'Anket yönetimi yüklenirken bir hata oluştu' });
    }
});

// Bordro gönderme formu için POST route
app.post('/bordro-yonetim', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'sendikaci') {
      return res.redirect('/giris/sendikaci');
    }
    const { user_id, payroll_date, amount, description } = req.body;
    let pdf_path = null;
    if (req.file) {
      pdf_path = '/uploads/payrolls/' + req.file.filename;
    }
    await db.Payroll.create({ user_id, payroll_date, amount, description, pdf_path });
    res.redirect('/bordro-yonetim');
  } catch (error) {
    console.error(error);
    res.redirect('/bordro-yonetim');
    }
});

// İletişim sayfası
app.get('/iletisim', (req, res) => {
    res.render('iletisim');
});

// API routes
app.use('/api', require('./routes/api'));

// Sequelize bağlantı testi
(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Sequelize ile veritabanı bağlantısı başarılı!');
  } catch (error) {
    console.error('Sequelize bağlantı hatası:', error);
  }
})();

// Server başlatma
const PORT = apiConfig.apiPort;
app.listen(PORT, () => {
  console.log(`API Sunucusu port ${PORT} üzerinde çalışıyor`);
}); 