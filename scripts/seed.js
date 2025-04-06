const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Isci = require('../models/isci');
const Sendikaci = require('../models/sendikaci');

// MongoDB bağlantısı
mongoose.connect('mongodb://localhost:27017/sendika_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch((err) => console.error('MongoDB bağlantı hatası:', err));

// Örnek işçi verileri
const isciler = [
    {
        tcno: '12345678901',
        ad: 'Ahmet',
        soyad: 'Yılmaz',
        sifre: '123456',
        sendika: { kod: 'SEN1', ad: 'Metal İşçileri Sendikası' },
        isyeri: 'A Şirketi',
        departman: 'Üretim'
    },
    {
        tcno: '23456789012',
        ad: 'Mehmet',
        soyad: 'Kaya',
        sifre: '123456',
        sendika: { kod: 'SEN1', ad: 'Metal İşçileri Sendikası' },
        isyeri: 'A Şirketi',
        departman: 'Kalite Kontrol'
    },
    {
        tcno: '34567890123',
        ad: 'Ayşe',
        soyad: 'Demir',
        sifre: '123456',
        sendika: { kod: 'SEN2', ad: 'Tekstil İşçileri Sendikası' },
        isyeri: 'B Şirketi',
        departman: 'Dikim'
    },
    {
        tcno: '45678901234',
        ad: 'Fatma',
        soyad: 'Çelik',
        sifre: '123456',
        sendika: { kod: 'SEN2', ad: 'Tekstil İşçileri Sendikası' },
        isyeri: 'B Şirketi',
        departman: 'Kesim'
    },
    {
        tcno: '56789012345',
        ad: 'Ali',
        soyad: 'Şahin',
        sifre: '123456',
        sendika: { kod: 'SEN3', ad: 'Gıda İşçileri Sendikası' },
        isyeri: 'C Şirketi',
        departman: 'Paketleme'
    }
];

// Örnek sendikacı verileri
const sendikacilar = [
    {
        tcno: '98765432101',
        ad: 'Mustafa',
        soyad: 'Öztürk',
        sifre: '123456',
        sendika: { kod: 'SEN1', ad: 'Metal İşçileri Sendikası' },
        pozisyon: 'Başkan'
    },
    {
        tcno: '87654321012',
        ad: 'Zeynep',
        soyad: 'Aydın',
        sifre: '123456',
        sendika: { kod: 'SEN1', ad: 'Metal İşçileri Sendikası' },
        pozisyon: 'Sekreter'
    },
    {
        tcno: '76543210923',
        ad: 'Kemal',
        soyad: 'Yıldız',
        sifre: '123456',
        sendika: { kod: 'SEN2', ad: 'Tekstil İşçileri Sendikası' },
        pozisyon: 'Başkan'
    },
    {
        tcno: '65432109834',
        ad: 'Selin',
        soyad: 'Kara',
        sifre: '123456',
        sendika: { kod: 'SEN2', ad: 'Tekstil İşçileri Sendikası' },
        pozisyon: 'Sekreter'
    },
    {
        tcno: '54321098745',
        ad: 'Burak',
        soyad: 'Arslan',
        sifre: '123456',
        sendika: { kod: 'SEN3', ad: 'Gıda İşçileri Sendikası' },
        pozisyon: 'Başkan'
    }
];

// Verileri ekle
async function seed() {
    try {
        // Önce mevcut verileri temizle
        await Isci.deleteMany({});
        await Sendikaci.deleteMany({});

        // Şifreleri hashle ve işçileri ekle
        for (let isci of isciler) {
            const hashedPassword = await bcrypt.hash(isci.sifre, 10);
            await Isci.create({
                ...isci,
                sifre: hashedPassword
            });
        }

        // Şifreleri hashle ve sendikacıları ekle
        for (let sendikaci of sendikacilar) {
            const hashedPassword = await bcrypt.hash(sendikaci.sifre, 10);
            await Sendikaci.create({
                ...sendikaci,
                sifre: hashedPassword
            });
        }

        console.log('Veriler başarıyla eklendi!');
        process.exit();
    } catch (error) {
        console.error('Veri ekleme hatası:', error);
        process.exit(1);
    }
}

seed(); 