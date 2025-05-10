const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth');
const config = require('../config/api.config');
const db = require('../models/sequelize');
const { Op } = require('sequelize');
const payrollRouter = require('./payroll');

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

module.exports = router; 