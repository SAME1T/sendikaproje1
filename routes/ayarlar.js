const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Multer ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/profiles';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir!'));
        }
    }
});

// Profil fotoğrafı yükleme
router.post('/profil-foto-yukle', auth, upload.single('profil_foto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Dosya yüklenemedi.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        // Eski profil fotoğrafını sil
        if (user.profil_foto) {
            const oldPhotoPath = path.join(__dirname, '..', user.profil_foto);
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
            }
        }

        // Yeni profil fotoğrafı yolunu kaydet
        user.profil_foto = '/uploads/profiles/' + req.file.filename;
        await user.save();

        res.json({
            success: true,
            foto_url: user.profil_foto
        });
    } catch (error) {
        console.error('Profil fotoğrafı yükleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Profil fotoğrafı yüklenirken bir hata oluştu.'
        });
    }
});

// Kapak fotoğrafı yükleme
router.post('/kapak-foto-yukle', auth, upload.single('kapak_foto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Dosya yüklenemedi.' });
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }
        // Eski kapak fotoğrafını sil
        if (user.kapak_foto) {
            const oldPhotoPath = path.join(__dirname, '..', user.kapak_foto);
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
            }
        }
        // Yeni kapak fotoğrafı yolunu kaydet
        user.kapak_foto = '/uploads/profiles/' + req.file.filename;
        await user.save();
        res.json({
            success: true,
            foto_url: user.kapak_foto
        });
    } catch (error) {
        console.error('Kapak fotoğrafı yükleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Kapak fotoğrafı yüklenirken bir hata oluştu.'
        });
    }
});

// Ayarlar sayfası
router.get('/ayarlar', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-sifre');
        const kullanicilar = await User.find().select('ad soyad');
        res.render('ayarlar', { user, kullanicilar });
    } catch (error) {
        console.error('Ayarlar sayfası hatası:', error);
        res.status(500).send('Sunucu hatası');
    }
});

// Ayarları güncelleme
router.post('/ayarlar', auth, async (req, res) => {
    try {
        const { ad, soyad, email, telefon, sifre, sifre_tekrar } = req.body;
        const user = await User.findById(req.user.id);

        // E-posta değişikliği kontrolü
        if (email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.render('ayarlar', {
                    user,
                    hata: 'Bu e-posta adresi zaten kullanılıyor.'
                });
            }
        }

        // Şifre değişikliği kontrolü
        if (sifre) {
            if (sifre !== sifre_tekrar) {
                return res.render('ayarlar', {
                    user,
                    hata: 'Şifreler eşleşmiyor.'
                });
            }
            user.sifre = await bcrypt.hash(sifre, 10);
        }

        // Diğer bilgileri güncelle
        user.ad = ad;
        user.soyad = soyad;
        user.email = email;
        user.telefon = telefon;

        await user.save();

        res.render('ayarlar', {
            user,
            mesaj: 'Bilgileriniz başarıyla güncellendi.'
        });
    } catch (error) {
        console.error('Ayarlar güncelleme hatası:', error);
        res.render('ayarlar', {
            user: req.user,
            hata: 'Bilgiler güncellenirken bir hata oluştu.'
        });
    }
});

// Bildirimler API
router.get('/api/bildirimler', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        // Kullanıcının paylaşımlarını bul
        const paylasimlar = await req.app.db.collection('paylasimlar').find({ user_id: userId }).toArray();
        const paylasimIdler = paylasimlar.map(p => p.id || p._id);
        // Yorum bildirimleri
        const yorumlar = await req.app.db.collection('yorumlar').find({ paylasim_id: { $in: paylasimIdler } }).sort({ created_at: -1 }).limit(20).toArray();
        // Beğeni bildirimleri
        const begeniler = await req.app.db.collection('begeniler').find({ paylasim_id: { $in: paylasimIdler } }).sort({ created_at: -1 }).limit(20).toArray();
        // Kullanıcıları çek
        const userIds = [...new Set([
            ...yorumlar.map(y => y.user_id),
            ...begeniler.map(b => b.user_id)
        ])];
        const users = await req.app.db.collection('users').find({ _id: { $in: userIds } }).toArray();
        const userMap = {};
        users.forEach(u => { userMap[u._id] = u; });
        // Bildirimleri birleştir
        const bildirimler = [
            ...yorumlar.map(y => ({
                tip: 'yorum',
                paylasim_id: y.paylasim_id,
                paylasim_icerik: (paylasimlar.find(p => (p.id || p._id).toString() === y.paylasim_id.toString()) || {}).icerik,
                bildiren_ad: userMap[y.user_id]?.ad || '',
                bildiren_soyad: userMap[y.user_id]?.soyad || '',
                tarih: y.created_at,
                yorum_icerik: y.icerik
            })),
            ...begeniler.map(b => ({
                tip: 'begeni',
                paylasim_id: b.paylasim_id,
                paylasim_icerik: (paylasimlar.find(p => (p.id || p._id).toString() === b.paylasim_id.toString()) || {}).icerik,
                bildiren_ad: userMap[b.user_id]?.ad || '',
                bildiren_soyad: userMap[b.user_id]?.soyad || '',
                tarih: b.created_at
            }))
        ];
        // Tarihe göre sırala, ilk 20'yi döndür
        bildirimler.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
        res.json(bildirimler.slice(0, 20));
    } catch (error) {
        console.error('Bildirimler API hatası:', error);
        res.status(500).json({ error: 'Bildirimler alınamadı.' });
    }
});

module.exports = router; 