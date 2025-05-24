const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth');
const config = require('../config/api.config');
const db = require('../models/sequelize');
const { Op } = require('sequelize');
const payrollRouter = require('./payroll');
const SurveyAnswer = db.SurveyAnswer;

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { tcno, password, userType } = req.body;
    
    let user;
    if (userType === 'isci') {
      user = await db.Isci.findOne({ where: { tcno } });
    } else {
      user = await db.Sendikaci.findOne({ where: { tcno } });
    }

    if (!user) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı!'
      });
    }

    const passwordIsValid = await bcrypt.compare(password, user.sifre);
    if (!passwordIsValid) {
      return res.status(401).json({
        message: 'Geçersiz şifre!'
      });
    }

    const token = jwt.sign({ id: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiration
    });

    res.status(200).json({
      id: user.id,
      tcno: user.tcno,
      ad: user.ad,
      soyad: user.soyad,
      email: user.email,
      rol: user.rol,
      token: token
    });
  } catch (error) {
    res.status(500).json({
      message: 'Sunucu hatası!',
      error: error.message
    });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { tcno, ad, soyad, email, password, telefon, userType, isyeri, departman } = req.body;

    // TC no ve email kontrolü
    const existingUser = await (userType === 'isci' ? db.Isci : db.Sendikaci).findOne({
      where: {
        [Op.or]: [
          { tcno },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Bu TC No veya Email zaten kayıtlı!'
      });
    }

    // Şifre hash'leme
    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni kullanıcı oluşturma
    const userData = {
      tcno,
      ad,
      soyad,
      email,
      sifre: hashedPassword,
      telefon,
      rol: userType
    };

    if (userType === 'isci') {
      userData.isyeri = isyeri;
      userData.departman = departman;
    }

    const user = await (userType === 'isci' ? db.Isci : db.Sendikaci).create(userData);

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      userId: user.id
    });
  } catch (error) {
    res.status(500).json({
      message: 'Kayıt işlemi başarısız!',
      error: error.message
    });
  }
});

// Kullanıcı bilgilerini getir
router.get('/user/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const userType = req.query.type;

    const user = await (userType === 'isci' ? db.Isci : db.Sendikaci).findByPk(userId, {
      attributes: { exclude: ['sifre'] }
    });

    if (!user) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı!'
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Sunucu hatası!',
      error: error.message
    });
  }
});

router.use('/payrolls', payrollRouter);

// Anket oluşturma (sendikacı)
router.post('/surveys', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'sendikaci') {
      return res.status(403).json({ error: 'Yetkisiz erişim' });
    }
    const { title, description, questions } = req.body;
    // Önce anketi kaydet
    const survey = await db.Survey.create({ title, description, created_at: new Date(), created_by: req.session.userId, status: 'aktif' });
    // Soruları kaydet
    for (const q of questions) {
      await db.SurveyQuestion.create({
        survey_id: survey.id,
        question_text: q.questionText,
        type: q.type,
        options: q.type === 'multiple' ? q.options : null
      });
    }
    res.status(201).json({ success: true, surveyId: survey.id });
  } catch (error) {
    console.error('Anket oluşturma hatası:', error);
    res.status(500).json({ error: 'Anket oluşturulurken bir hata oluştu' });
  }
});

// Anket cevap kaydetme (işçi)
router.post('/survey-answers', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'isci') {
      return res.status(403).json({ error: 'Yetkisiz erişim' });
    }
    const { survey_id, answers } = req.body; // answers: [{question_id, answer}]
    // Aynı işçi aynı ankete birden fazla cevap veremesin
    const existing = await db.SurveyAnswer.findOne({ where: { survey_id, user_id: req.session.userId } });
    if (existing) {
      return res.status(400).json({ error: 'Bu anketi zaten cevapladınız.' });
    }
    for (const ans of answers) {
      await db.SurveyAnswer.create({
        survey_id,
        user_id: req.session.userId,
        question_id: ans.question_id,
        answer: ans.answer,
        created_at: new Date()
      });
    }
    // Anket katılımı tablosuna ekle
    const pool = require('../db');
    await pool.query('INSERT INTO anket_katilimlari (user_id, anket_id) VALUES ($1, $2)', [req.session.userId, survey_id]);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Cevap kaydetme hatası:', error);
    res.status(500).json({ error: 'Cevap kaydedilemedi' });
  }
});

// Anket sonuçlarını getir (sendikacı)
router.get('/survey-results/:surveyId', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'sendikaci') {
      return res.status(403).json({ error: 'Yetkisiz erişim' });
    }
    const surveyId = req.params.surveyId;
    const answers = await SurveyAnswer.findAll({ where: { survey_id: surveyId } });
    res.json(answers);
  } catch (error) {
    res.status(500).json({ error: 'Sonuçlar alınamadı' });
  }
});

// Anket silme (sendikacı)
router.delete('/surveys/:id', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'sendikaci') {
      return res.status(403).json({ error: 'Yetkisiz erişim' });
    }
    const surveyId = req.params.id;
    // Sadece kendi oluşturduğu anketi silebilsin
    const survey = await db.Survey.findOne({ where: { id: surveyId, created_by: req.session.userId } });
    if (!survey) {
      return res.status(404).json({ error: 'Anket bulunamadı veya silme yetkiniz yok.' });
    }
    // İlişkili soruları ve cevapları sil
    await db.SurveyQuestion.destroy({ where: { survey_id: surveyId } });
    await db.SurveyAnswer.destroy({ where: { survey_id: surveyId } });
    await db.Survey.destroy({ where: { id: surveyId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Anket silinemedi' });
  }
});

// Aktif anket sayısını getir
router.get('/active-survey-count', async (req, res) => {
  try {
    const count = await db.Survey.count({ where: { status: 'aktif' } });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Aktif anket sayısı alınamadı' });
  }
});

// Aktif ve geçmiş etkinlik sayılarını getir
router.get('/event-counts', async (req, res) => {
  try {
    const pool = require('../db');
    const currentResult = await pool.query("SELECT COUNT(*) FROM etkinlikler WHERE durum = 'aktif'");
    const pastResult = await pool.query("SELECT COUNT(*) FROM etkinlikler WHERE durum = 'gecmis'");
    res.json({
      current: parseInt(currentResult.rows[0].count, 10),
      past: parseInt(pastResult.rows[0].count, 10)
    });
  } catch (error) {
    res.status(500).json({ error: 'Etkinlik sayıları alınamadı' });
  }
});

module.exports = router; 