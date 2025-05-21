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
const mediaUploadDir = path.join(__dirname, 'public/uploads/media');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(mediaUploadDir)) fs.mkdirSync(mediaUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const mediaStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, mediaUploadDir);
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

const mediaUpload = multer({ 
  storage: mediaStorage,
  fileFilter: (req, file, cb) => {
    // Sadece resim ve video dosyalarına izin ver
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim ve video dosyaları yükleyebilirsiniz!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const { aktiflikPuaniHesapla, sendikaUcretiHesapla } = require('./utils/aktiflikHesaplama');

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
    if (!req.session.userId || req.session.userType !== 'isci') {
        return res.redirect('/isci-giris');
    }

    try {
        // Aktiflik puanını hesapla
        const aktiflikPuani = await aktiflikPuaniHesapla(req.session.userId);
        // Sendika ücretini hesapla
        const ucretBilgisi = await sendikaUcretiHesapla(req.session.userId);
        // Toplam üye sayısını çek (rol=1 olanlar)
        const result = await pool.query(
            'SELECT COUNT(*) as count FROM users WHERE rol = 1'
        );
        const uyeSayisi = result.rows[0].count;
        // Tüm sendikacıları çek (kişiye özel paylaşım için)
        const sendikacilar = await pool.query('SELECT id, ad, soyad FROM users WHERE rol = 2');
        // Paylaşımları çek
        const paylasimlar = await getPaylasimlarForUser(req.session.userId);
        res.render('isci-dashboard', {
            user: req.session.user,
            aktiflikPuani: aktiflikPuani,
            saatlikMaas: ucretBilgisi.saatlikMaas,
            ucret: ucretBilgisi.ucret,
            uyeSayisi: uyeSayisi,
            kullanicilar: sendikacilar.rows, // kişiye özel paylaşım için
            paylasimlar: paylasimlar // paylaşım akışı
        });
    } catch (error) {
        console.error('Dashboard yükleme hatası:', error);
        res.status(500).send('Bir hata oluştu');
    }
});

// Sendikacı dashboard sayfası
app.get('/dashboard/sendikaci', async (req, res) => {
    if (!req.session.userId || req.session.userType !== 'sendikaci') {
        return res.redirect('/giris/sendikaci');
    }

    try {
        // Aktiflik puanını hesapla
        const aktiflikPuani = await aktiflikPuaniHesapla(req.session.userId);
        // Sendika ücretini hesapla
        const ucretBilgisi = await sendikaUcretiHesapla(req.session.userId);
        // Sendikacı (rol=2) toplam üye sayısını çek
        const result = await pool.query(
            'SELECT COUNT(*) as count FROM users WHERE rol = 2'
        );
        const uyeSayisi = result.rows[0].count;
        // Tüm işçileri ve sendikacıları çek (kişiye özel paylaşım için)
        const isciler = await pool.query('SELECT id, ad, soyad FROM users WHERE rol = 1');
        const sendikacilar = await pool.query('SELECT id, ad, soyad FROM users WHERE rol = 2');
        const kullanicilar = isciler.rows.concat(sendikacilar.rows);
        // Paylaşımları çek
        const paylasimlar = await getPaylasimlarForUser(req.session.userId);
        res.render('sendikaci-dashboard', {
            user: req.session.user,
            uyeSayisi: uyeSayisi,
            activeTab: 'dashboard',
            aktiflikPuani: aktiflikPuani,
            saatlikMaas: ucretBilgisi.saatlikMaas,
            ucret: ucretBilgisi.ucret,
            kullanicilar: kullanicilar, // kişiye özel paylaşım için
            paylasimlar: paylasimlar // paylaşım akışı
        });
    } catch (error) {
        console.error('Dashboard yükleme hatası:', error);
        res.status(500).send('Bir hata oluştu');
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

// Sendikacı toplantılar sayfası (liste ve ekleme)
app.get('/toplantilar', async (req, res) => {
    if (!req.session.userId || req.session.userType !== 'sendikaci') {
        return res.redirect('/giris/sendikaci');
    }
    const userId = req.session.userId;
    const result = await pool.query(`
        SELECT * FROM toplantilar 
        WHERE olusturan_id = $1 OR (katilimcilar IS NOT NULL AND (',' || katilimcilar || ',') LIKE '%,' || $1::text || ',%')
        ORDER BY tarih DESC, saat DESC`, [userId]);
    const sendikacilar = await pool.query('SELECT id, ad, soyad FROM users WHERE rol = 2');
    res.render('sendikaci-toplantilar', { user: req.session.user, toplantilar: result.rows, sendikacilar: sendikacilar.rows });
});

// Toplantı silme
app.post('/toplantilar/sil/:id', async (req, res) => {
    if (!req.session.userId || req.session.userType !== 'sendikaci') {
        return res.status(403).send('Yetkisiz erişim');
    }
    const id = req.params.id;
    // Sadece oluşturan kişi silebilir
    await pool.query('DELETE FROM toplantilar WHERE id = $1 AND olusturan_id = $2', [id, req.session.userId]);
    res.redirect('/toplantilar');
});

// Toplantı ekleme
app.post('/toplantilar/ekle', async (req, res) => {
    if (!req.session.userId || req.session.userType !== 'sendikaci') {
        return res.status(403).send('Yetkisiz erişim');
    }
    const { baslik, tarih, saat, yer, gundem, yapilacaklar, katilimcilar, katilimci } = req.body;
    let katilimciStr = Array.isArray(katilimcilar) ? katilimcilar.join(',') : katilimcil;
    await pool.query(
        'INSERT INTO toplantilar (baslik, tarih, saat, yer, gundem, yapilacaklar, olusturan_id, katilimcilar) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [baslik, tarih, saat, yer, gundem, yapilacaklar, req.session.userId, katilimciStr]
    );
    res.redirect('/toplantilar');
});

// Toplantı düzenleme (form ve güncelleme işlemi ileride eklenecek)

// Paylaşım ekleme (işçi ve sendikacı)
app.post('/paylasim-ekle', mediaUpload.single('media'), async (req, res) => {
    if (!req.session.userId) return res.status(403).send('Yetkisiz erişim');
    
    const { kategori, icerik, gizlilik, hedef_kullanici_id } = req.body;
    let media_path = null;
    
    if (req.file) {
        media_path = '/uploads/media/' + req.file.filename;
    }
    
    await pool.query(
        'INSERT INTO paylasimlar (user_id, kategori, icerik, gizlilik, hedef_kullanici_id, media_path) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.session.userId, kategori, icerik, gizlilik, hedef_kullanici_id || null, media_path]
    );
    res.redirect(req.headers.referer || '/');
});

// Beğeni ekle/kaldır (toggle)
app.post('/paylasim/:id/begen', async (req, res) => {
    if (!req.session.userId) return res.status(403).send('Yetkisiz erişim');
    const paylasim_id = req.params.id;
    const user_id = req.session.userId;
    try {
        // Beğeni var mı kontrol et
        const result = await pool.query('SELECT * FROM begeniler WHERE paylasim_id = $1 AND user_id = $2', [paylasim_id, user_id]);
        if (result.rows.length > 0) {
            // Varsa kaldır
            await pool.query('DELETE FROM begeniler WHERE paylasim_id = $1 AND user_id = $2', [paylasim_id, user_id]);
            return res.json({ liked: false });
        } else {
            // Yoksa ekle
            await pool.query('INSERT INTO begeniler (paylasim_id, user_id) VALUES ($1, $2)', [paylasim_id, user_id]);
            return res.json({ liked: true });
        }
    } catch (error) {
        console.error('Beğeni ekleme/kaldırma hatası:', error);
        res.status(500).json({ error: 'Beğeni işlemi sırasında hata oluştu' });
    }
});

// Bir paylaşımın beğeni sayısı ve kullanıcının beğenip beğenmediği
async function getBegenilerForPaylasim(paylasim_id, user_id) {
    const countResult = await pool.query('SELECT COUNT(*) FROM begeniler WHERE paylasim_id = $1', [paylasim_id]);
    const userResult = await pool.query('SELECT 1 FROM begeniler WHERE paylasim_id = $1 AND user_id = $2', [paylasim_id, user_id]);
    return {
        count: parseInt(countResult.rows[0].count, 10),
        liked: userResult.rows.length > 0
    };
}

// Paylaşım akışı (işçi ve sendikacı dashboardunda kullanılacak)
async function getPaylasimlarForUser(userId) {
    const result = await pool.query(
        `SELECT p.*, u.ad, u.soyad, u.rol FROM paylasimlar p
         JOIN users u ON u.id = p.user_id
         WHERE p.gizlilik = 'herkes' OR p.hedef_kullanici_id = $1 OR p.user_id = $1
         ORDER BY p.created_at DESC`,
        [userId]
    );
    // Her paylaşım için beğeni sayısı ve kullanıcının beğenip beğenmediği
    const paylasimlar = await Promise.all(result.rows.map(async (p) => {
        const begeni = await getBegenilerForPaylasim(p.id, userId);
        return { ...p, begeni_count: begeni.count, liked_by_user: begeni.liked };
    }));
    return paylasimlar;
}

// Yorum ekle
app.post('/paylasim/:id/yorum', async (req, res) => {
    if (!req.session.userId) return res.status(403).json({ error: 'Yetkisiz erişim' });
    const paylasim_id = req.params.id;
    const user_id = req.session.userId;
    const { icerik } = req.body;
    try {
        await pool.query('INSERT INTO yorumlar (paylasim_id, user_id, icerik) VALUES ($1, $2, $3)', [paylasim_id, user_id, icerik]);
        res.json({ success: true });
    } catch (error) {
        console.error('Yorum ekleme hatası:', error);
        res.status(500).json({ error: 'Yorum eklenirken hata oluştu' });
    }
});

// Bir paylaşımın yorumlarını getir
app.get('/paylasim/:id/yorumlar', async (req, res) => {
    const paylasim_id = req.params.id;
    try {
        const result = await pool.query(
            `SELECT y.*, u.ad, u.soyad FROM yorumlar y JOIN users u ON u.id = y.user_id WHERE y.paylasim_id = $1 ORDER BY y.created_at ASC`,
            [paylasim_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Yorumları çekme hatası:', error);
        res.status(500).json({ error: 'Yorumlar çekilirken hata oluştu' });
    }
});

// PAYLAŞIM SİLME
app.post('/paylasim/:id/sil', async (req, res) => {
    if (!req.session.userId) return res.status(403).json({ error: 'Yetkisiz erişim' });
    const paylasim_id = req.params.id;
    const user_id = req.session.userId;
    try {
        const result = await pool.query('SELECT * FROM paylasimlar WHERE id = $1', [paylasim_id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Paylaşım bulunamadı' });
        const paylasim = result.rows[0];
        if (paylasim.user_id !== user_id && req.session.userType !== 'sendikaci') {
            return res.status(403).json({ error: 'Sadece kendi paylaşımınızı silebilirsiniz.' });
        }
        await pool.query('DELETE FROM paylasimlar WHERE id = $1', [paylasim_id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Paylaşım silme hatası:', error);
        res.status(500).json({ error: 'Paylaşım silinirken bir hata oluştu' });
    }
});

// YORUM SİLME
app.post('/yorum/:id/sil', async (req, res) => {
    if (!req.session.userId) return res.status(403).json({ error: 'Yetkisiz erişim' });
    const yorum_id = req.params.id;
    const user_id = req.session.userId;
    try {
        const result = await pool.query('SELECT * FROM yorumlar WHERE id = $1', [yorum_id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Yorum bulunamadı' });
        const yorum = result.rows[0];
        if (yorum.user_id !== user_id && req.session.userType !== 'sendikaci') {
            return res.status(403).json({ error: 'Sadece kendi yorumunuzu silebilirsiniz.' });
        }
        await pool.query('DELETE FROM yorumlar WHERE id = $1', [yorum_id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Yorum silme hatası:', error);
        res.status(500).json({ error: 'Yorum silinirken bir hata oluştu' });
    }
});

// YORUM BEĞENME (TOGGLE)
app.post('/yorum/:id/begen', async (req, res) => {
    if (!req.session.userId) return res.status(403).json({ error: 'Yetkisiz erişim' });
    const yorum_id = req.params.id;
    const user_id = req.session.userId;
    try {
        const result = await pool.query('SELECT * FROM yorum_begeniler WHERE yorum_id = $1 AND user_id = $2', [yorum_id, user_id]);
        if (result.rows.length > 0) {
            await pool.query('DELETE FROM yorum_begeniler WHERE yorum_id = $1 AND user_id = $2', [yorum_id, user_id]);
            return res.json({ liked: false });
        } else {
            await pool.query('INSERT INTO yorum_begeniler (yorum_id, user_id) VALUES ($1, $2)', [yorum_id, user_id]);
            return res.json({ liked: true });
        }
    } catch (error) {
        console.error('Yorum beğenme hatası:', error);
        res.status(500).json({ error: 'Yorum beğenme işlemi sırasında hata oluştu' });
    }
});

// PAYLAŞIMI BEĞENENLERİ GETİR
app.get('/paylasim/:id/begenenler', async (req, res) => {
    const paylasim_id = req.params.id;
    try {
        const result = await pool.query('SELECT u.ad, u.soyad FROM begeniler b JOIN users u ON u.id = b.user_id WHERE b.paylasim_id = $1', [paylasim_id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Paylaşım beğenenleri çekme hatası:', error);
        res.status(500).json({ error: 'Paylaşım beğenenleri çekilirken bir hata oluştu' });
    }
});

// YORUMU BEĞENENLERİ GETİR
app.get('/yorum/:id/begenenler', async (req, res) => {
    const yorum_id = req.params.id;
    try {
        const result = await pool.query('SELECT u.ad, u.soyad FROM yorum_begeniler yb JOIN users u ON u.id = yb.user_id WHERE yb.yorum_id = $1', [yorum_id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Yorum beğenenleri çekme hatası:', error);
        res.status(500).json({ error: 'Yorum beğenenleri çekilirken bir hata oluştu' });
    }
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

// Ayarlar/profil düzenleme sayfası (GET)
app.get('/ayarlar', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const result = await pool.query('SELECT id, ad, soyad, email, telefon FROM users WHERE id = $1', [req.session.userId]);
    if (!result.rows.length) return res.redirect('/');
    res.render('ayarlar', { user: result.rows[0], mesaj: null, hata: null });
});

// Ayarlar/profil düzenleme (POST)
app.post('/ayarlar', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const { ad, soyad, email, telefon, sifre, sifre_tekrar } = req.body;
    let hata = null, mesaj = null;
    if (sifre && sifre !== sifre_tekrar) {
        hata = 'Şifreler eşleşmiyor!';
    } else {
        try {
            await pool.query('UPDATE users SET ad=$1, soyad=$2, email=$3, telefon=$4' + (sifre ? ', password=$5' : '') + ' WHERE id=$6',
                sifre ? [ad, soyad, email, telefon, sifre, req.session.userId] : [ad, soyad, email, telefon, req.session.userId]);
            mesaj = 'Profiliniz başarıyla güncellendi.';
        } catch (e) {
            hata = 'Bir hata oluştu.';
        }
    }
    // Güncel bilgileri tekrar çek
    const result = await pool.query('SELECT id, ad, soyad, email, telefon FROM users WHERE id = $1', [req.session.userId]);
    res.render('ayarlar', { user: result.rows[0], mesaj, hata });
});

// Grev Yönetimi & Kararları Route'ları
// İşçi: Grev Kararları
app.get('/isci/grev-kararlari', async (req, res) => {
    if (!req.session.userId || req.session.userType !== 'isci') {
        return res.redirect('/giris/isci');
    }
    try {
        // Tüm grevleri getir (oylamada olanlar ve sonuçlananlar)
        const grevler = await pool.query(
            'SELECT g.*, ' +
            '(SELECT COUNT(*) FROM grev_oylari WHERE grev_id = g.id AND oy = true) as evet, ' +
            '(SELECT COUNT(*) FROM grev_oylari WHERE grev_id = g.id AND oy = false) as hayir, ' +
            '(SELECT COUNT(*) FROM grev_oylari WHERE grev_id = g.id) as toplam_oy ' +
            'FROM grevler g ' +
            'WHERE g.hedef_rol = $1 ' + // Sadece işçilere yönelik grevler
            'ORDER BY CASE ' +
            "   WHEN g.durum = 'oylamada' THEN 1 " +
            "   WHEN g.durum = 'bekleme' THEN 2 " +
            "   WHEN g.durum = 'onaylandi' THEN 3 " +
            "   WHEN g.durum = 'reddedildi' THEN 4 " +
            'END, g.karar_tarihi DESC',
            [1] // rol=1 (işçiler)
        );

        // Oylama oranlarını hesapla
        const aktifGrevler = grevler.rows.map(grev => {
            const evet = parseInt(grev.evet) || 0;
            const hayir = parseInt(grev.hayir) || 0;
            const toplam = evet + hayir;
            return {
                ...grev,
                evet,
                hayir,
                evetOran: toplam > 0 ? Math.round((evet / toplam) * 100) : 0
            };
        });

        res.render('isci/grev-kararlari', { 
            user: req.session.user,
            aktifGrevler
        });
    } catch (err) {
        console.error('Grev kararları yükleme hatası:', err);
        res.status(500).send('Grev kararları yüklenemedi');
    }
});

// Sendikacı: Grev Yönetimi
app.get('/sendikaci/grev-yonetim', async (req, res) => {
    if (!req.session.userId || req.session.userType !== 'sendikaci') {
        return res.redirect('/giris/sendikaci');
    }
    try {
        // Tüm grevler (sendikacının oluşturdukları)
        const result = await pool.query(
            'SELECT g.*, ' +
            '(SELECT COUNT(*) FROM grev_oylari WHERE grev_id = g.id AND oy = true) as evet, ' +
            '(SELECT COUNT(*) FROM grev_oylari WHERE grev_id = g.id AND oy = false) as hayir, ' +
            '(SELECT COUNT(*) FROM grev_oylari WHERE grev_id = g.id) as toplam_oy, ' +
            '(SELECT COUNT(*) FROM users WHERE rol = g.hedef_rol) as hedef_katilimci ' +
            'FROM grevler g WHERE g.olusturan_id = $1 ' +
            'ORDER BY CASE ' +
            "   WHEN g.durum = 'oylamada' THEN 1 " +
            "   WHEN g.durum = 'bekleme' THEN 2 " +
            "   WHEN g.durum = 'onaylandi' THEN 3 " +
            "   WHEN g.durum = 'reddedildi' THEN 4 " +
            'END, g.karar_tarihi DESC',
            [req.session.userId]
        );

        // Oylama oranlarını hesapla
        const grevler = result.rows.map(grev => {
            const evet = parseInt(grev.evet) || 0;
            const hayir = parseInt(grev.hayir) || 0;
            const toplam = evet + hayir;
            const hedef_katilimci = parseInt(grev.hedef_katilimci) || 0;
            return {
                ...grev,
                evet,
                hayir,
                evetOran: toplam > 0 ? Math.round((evet / toplam) * 100) : 0,
                katilimOran: hedef_katilimci > 0 ? Math.round((toplam / hedef_katilimci) * 100) : 0
            };
        });

        // Sadece oylamada olanlar
        const aktifGrevler = grevler.filter(g => g.durum === 'oylamada');

        res.render('sendikaci/grev-yonetim', { 
            user: req.session.user,
            grevler,
            aktifGrevler
        });
    } catch (err) {
        console.error('Grev yönetimi yükleme hatası:', err);
        res.status(500).send('Grev yönetimi yüklenemedi');
    }
});

// Sendikacı: Grev ekle
app.post('/sendikaci/grev-yonetim/ekle', async (req, res) => {
    try {
        // Yetki kontrolü
        if (!req.session.userId || req.session.userType !== 'sendikaci') {
            return res.status(403).json({ error: 'Yetkisiz erişim' });
        }

        const { baslik, neden, karar_tarihi, baslangic_tarihi, bitis_tarihi } = req.body;
        
        // Hedef rol her zaman işçiler (1) olacak
        const hedef_rol = 1;

        // Toplam işçi sayısını hesapla
        const countResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE rol = $1', [hedef_rol]);
        const katilimci_sayisi = parseInt(countResult.rows[0].count);

        // Grevi ekle
        const grevResult = await pool.query(
            'INSERT INTO grevler (baslik, neden, karar_tarihi, baslangic_tarihi, bitis_tarihi, sendika_id, katilimci_sayisi, durum, olusturan_id, hedef_rol) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
            [baslik, neden, karar_tarihi, baslangic_tarihi, bitis_tarihi, req.session.userId, katilimci_sayisi, 'oylamada', req.session.userId, hedef_rol]
        );

        res.redirect('/sendikaci/grev-yonetim');
    } catch (err) {
        console.error('Grev ekleme hatası:', err);
        res.status(500).json({ error: 'Grev eklenemedi: ' + err.message });
    }
});

// Sendikacı: Grev sil
app.post('/sendikaci/grev-yonetim/sil/:id', async (req, res) => {
    if (!req.session.userId || req.session.userType !== 'sendikaci') return res.status(403).send('Yetkisiz erişim');
    const grev_id = req.params.id;
    try {
        await pool.query('DELETE FROM grevler WHERE id = $1 AND olusturan_id = $2', [grev_id, req.session.userId]);
        res.redirect('/sendikaci/grev-yonetim');
    } catch (err) {
        console.error('Grev silme hatası:', err);
        res.status(500).send('Grev silinemedi');
    }
});

// Oylama (işçi)
app.post('/grev/oyla/:grev_id', async (req, res) => {
    try {
        // Yetki kontrolü
        if (!req.session.userId || req.session.userType !== 'isci') {
            return res.status(403).json({ error: 'Yetkisiz erişim' });
        }

        const grev_id = req.params.grev_id;
        const { oy } = req.body;

        // Grevin durumunu kontrol et
        const grevDurum = await pool.query('SELECT durum FROM grevler WHERE id = $1', [grev_id]);
        if (!grevDurum.rows.length || grevDurum.rows[0].durum !== 'oylamada') {
            return res.status(400).json({ error: 'Bu grev oylamaya açık değil' });
        }

        // Daha önce oy kullanılmış mı kontrol et
        const kontrol = await pool.query(
            'SELECT 1 FROM grev_oylari WHERE grev_id = $1 AND user_id = $2',
            [grev_id, req.session.userId]
        );
        if (kontrol.rows.length > 0) {
            return res.status(400).json({ error: 'Bu greve zaten oy verdiniz' });
        }

        // Oyu kaydet
        await pool.query(
            'INSERT INTO grev_oylari (grev_id, user_id, oy) VALUES ($1, $2, $3)',
            [grev_id, req.session.userId, oy === 'evet']
        );

        // Toplam oy sayısını kontrol et
        const grevBilgisi = await pool.query(
            'SELECT g.katilimci_sayisi, COUNT(o.*) as toplam_oy FROM grevler g LEFT JOIN grev_oylari o ON o.grev_id = g.id WHERE g.id = $1 GROUP BY g.id, g.katilimci_sayisi',
            [grev_id]
        );

        // Tüm oylar kullanıldıysa durumu 'bekleme' yap
        if (parseInt(grevBilgisi.rows[0].toplam_oy) >= parseInt(grevBilgisi.rows[0].katilimci_sayisi)) {
            await pool.query(
                'UPDATE grevler SET durum = $1 WHERE id = $2',
                ['bekleme', grev_id]
            );
        }

        res.redirect('/isci/grev-kararlari');
    } catch (err) {
        console.error('Oylama hatası:', err);
        res.status(500).json({ error: 'Oylama kaydedilemedi: ' + err.message });
    }
});

// Sendikacı: Grev kararı (onay/red)
app.post('/sendikaci/grev-yonetim/karar/:id', async (req, res) => {
    try {
        // Yetki kontrolü
        if (!req.session.userId || req.session.userType !== 'sendikaci') {
            return res.status(403).json({ error: 'Yetkisiz erişim' });
        }

        const grev_id = req.params.id;
        const { karar } = req.body;

        // Grevin durumunu ve sahipliğini kontrol et
        const grevKontrol = await pool.query(
            'SELECT durum, olusturan_id FROM grevler WHERE id = $1',
            [grev_id]
        );

        if (!grevKontrol.rows.length) {
            return res.status(404).json({ error: 'Grev bulunamadı' });
        }

        if (grevKontrol.rows[0].olusturan_id !== req.session.userId) {
            return res.status(403).json({ error: 'Bu grev üzerinde yetkiniz yok' });
        }

        if (grevKontrol.rows[0].durum !== 'bekleme') {
            return res.status(400).json({ error: 'Bu grev için karar verilemez' });
        }

        // Kararı kaydet
        const yeniDurum = karar === 'onay' ? 'onaylandi' : 'reddedildi';
        await pool.query(
            'UPDATE grevler SET durum = $1 WHERE id = $2',
            [yeniDurum, grev_id]
        );

        res.redirect('/sendikaci/grev-yonetim');
    } catch (err) {
        console.error('Grev karar hatası:', err);
        res.status(500).json({ error: 'Karar kaydedilemedi: ' + err.message });
    }
}); 