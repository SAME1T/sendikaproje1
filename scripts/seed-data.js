const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

mongoose.connect('mongodb://localhost:27017/sendika_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const sendikalar = [
    { ad: 'Metal İşçileri Sendikası', kod: 'MIS', sehir: 'İstanbul' },
    { ad: 'Tekstil İşçileri Sendikası', kod: 'TIS', sehir: 'Bursa' },
    { ad: 'Maden İşçileri Sendikası', kod: 'MDS', sehir: 'Zonguldak' }
];

const sendikaci_verileri = [
    {
        tcno: '12345678901',
        password: '123456',
        name: 'Ahmet',
        surname: 'Yılmaz',
        userType: 'sendikaci',
        pozisyon: 'başkan',
        sendika: sendikalar[0]
    },
    {
        tcno: '12345678902',
        password: '123456',
        name: 'Mehmet',
        surname: 'Demir',
        userType: 'sendikaci',
        pozisyon: 'yönetici',
        sendika: sendikalar[1]
    },
    {
        tcno: '12345678903',
        password: '123456',
        name: 'Ayşe',
        surname: 'Çelik',
        userType: 'sendikaci',
        pozisyon: 'temsilci',
        sendika: sendikalar[2]
    }
];

const isci_verileri = [
    {
        tcno: '12345678904',
        password: '123456',
        name: 'Ali',
        surname: 'Kaya',
        userType: 'isci',
        isyeri: 'Demir Çelik A.Ş.',
        departman: 'Üretim',
        sendika: sendikalar[0]
    },
    {
        tcno: '12345678905',
        password: '123456',
        name: 'Fatma',
        surname: 'Şahin',
        userType: 'isci',
        isyeri: 'Tekstil Ltd.',
        departman: 'Dokuma',
        sendika: sendikalar[1]
    },
    {
        tcno: '12345678906',
        password: '123456',
        name: 'Mustafa',
        surname: 'Arslan',
        userType: 'isci',
        isyeri: 'Maden A.Ş.',
        departman: 'Kazı',
        sendika: sendikalar[2]
    },
    {
        tcno: '12345678907',
        password: '123456',
        name: 'Zeynep',
        surname: 'Yıldız',
        userType: 'isci',
        isyeri: 'Demir Çelik A.Ş.',
        departman: 'Montaj',
        sendika: sendikalar[0]
    },
    {
        tcno: '12345678908',
        password: '123456',
        name: 'Hasan',
        surname: 'Aydın',
        userType: 'isci',
        isyeri: 'Tekstil Ltd.',
        departman: 'Kalite',
        sendika: sendikalar[1]
    },
    {
        tcno: '12345678909',
        password: '123456',
        name: 'Ayşe',
        surname: 'Özdemir',
        userType: 'isci',
        isyeri: 'Maden A.Ş.',
        departman: 'Güvenlik',
        sendika: sendikalar[2]
    },
    {
        tcno: '12345678910',
        password: '123456',
        name: 'Murat',
        surname: 'Güneş',
        userType: 'isci',
        isyeri: 'Demir Çelik A.Ş.',
        departman: 'Bakım',
        sendika: sendikalar[0]
    }
];

async function seedData() {
    try {
        // Mevcut verileri temizle
        await User.deleteMany({});

        // Şifreleri hashle ve verileri ekle
        for (const data of [...sendikaci_verileri, ...isci_verileri]) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);
            
            await User.create({
                ...data,
                password: hashedPassword
            });
        }

        console.log('Örnek veriler başarıyla eklendi!');
        process.exit(0);
    } catch (error) {
        console.error('Veri ekleme hatası:', error);
        process.exit(1);
    }
}

seedData(); 