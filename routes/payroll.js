const express = require('express');
const router = express.Router();
const db = require('../models/sequelize');
const Payroll = db.Payroll;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// PDF upload ayarları
const uploadDir = path.join(__dirname, '../public/uploads/payrolls');
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

// Tüm bordroları getir (sendikacı için)
router.get('/', async (req, res) => {
  try {
    // Sadece sendikacı erişebilir
    if (!req.session.userId || req.session.userType !== 'sendikaci') {
      return res.status(403).json({ error: 'Yetkisiz erişim' });
    }
    const payrolls = await Payroll.findAll();
    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ error: 'Bordrolar alınamadı' });
  }
});

// Belirli kullanıcıya ait bordroları getir (işçi veya sendikacı)
router.get('/user/:userId', async (req, res) => {
  try {
    // İşçi ise sadece kendi bordrolarını görebilir
    if (req.session.userType === 'isci' && req.session.userId != req.params.userId) {
      return res.status(403).json({ error: 'Kendi bordrolarınızı görebilirsiniz' });
    }
    const payrolls = await Payroll.findAll({ where: { user_id: req.params.userId } });
    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ error: 'Bordrolar alınamadı' });
  }
});

// Yeni bordro oluştur (sendikacı için, PDF upload destekli)
router.post('/', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'sendikaci') {
      return res.status(403).json({ error: 'Yetkisiz erişim' });
    }
    const { user_id, payroll_date, amount, description } = req.body;
    let pdf_path = null;
    if (req.file) {
      pdf_path = '/uploads/payrolls/' + req.file.filename;
    }
    const payroll = await Payroll.create({ user_id, payroll_date, amount, description, pdf_path });
    res.status(201).json(payroll);
  } catch (error) {
    res.status(500).json({ error: 'Bordro eklenemedi' });
  }
});

module.exports = router; 