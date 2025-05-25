# 🏢 Sendika İletişim Merkezi - Web Uygulaması

## 📱 Proje Hakkında
Sendika İletişim Merkezi, işçiler ve sendikacılar için geliştirilmiş kapsamlı bir web uygulaması. Uygulama, sendika üyeleri arasında iletişimi kolaylaştırmak, işçi haklarını desteklemek ve sendika yönetimini dijitalleştirmek amacıyla tasarlanmıştır.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## ✨ Ana Özellikler

### 🔐 Kimlik Doğrulama Sistemi
- **Çift Rol Sistemi**: İşçi (Üye) ve Sendikacı (Yönetici) rolleri
- **Güvenli Giriş**: TC Kimlik No ve şifre ile giriş
- **Üye Kayıt Sistemi**: Yeni üyelerin sisteme kaydolması
- **Profil Yönetimi**: Kullanıcı bilgilerini güncelleme
- **Session Güvenliği**: Güvenli oturum yönetimi

### 👥 İşçi (Üye) Özellikleri
- **Ana Dashboard**: Kişiselleştirilmiş hoş geldin ekranı
- **Aktiflik Puanı Sistemi**: Kullanıcı aktivitelerine göre puan hesaplama
- **Sendika Ücreti Hesaplama**: Aktiflik puanına göre dinamik ücret
- **Sosyal Feed**: Instagram benzeri paylaşım yapma, beğenme, yorum yazma
- **Anket Sistemi**: Sendikacılar tarafından oluşturulan anketlere katılım
- **Grev Kararları**: Grev duyurularını görüntüleme ve oylama
- **Etkinlik Takvimi**: Sendika etkinliklerini takip etme
- **Bordro Yönetimi**: Kişisel bordroları görüntüleme ve PDF indirme
- **İletişim**: Sendika iletişim bilgileri ve harita entegrasyonu

### 🏢 Sendikacı (Yönetici) Özellikleri
- **Yönetici Dashboard**: Kapsamlı yönetim paneli ve istatistikler
- **Anket Yönetimi**: Anket oluşturma, düzenleme, sonuçları görme
- **Grev Yönetimi**: Grev kararları oluşturma ve oylama yönetimi
- **Toplantı Yönetimi**: Toplantı planlama ve katılımcı yönetimi
- **Etkinlik Yönetimi**: Sendika etkinliklerini organize etme
- **Bordro Yönetimi**: Üye bordrolarını yükleme ve yönetme
- **Sosyal Feed Yönetimi**: Tüm paylaşımları moderasyon
- **Üye İstatistikleri**: Detaylı üye analitikleri

### 💬 Sosyal Özellikler
- **Instagram Benzeri Feed**: Modern sosyal medya deneyimi
- **Paylaşım Sistemi**: Metin, resim ve video paylaşımı (10MB'a kadar)
- **Etkileşim**: Beğeni, yorum ve yanıt sistemi
- **Gizlilik Seçenekleri**: Herkese açık veya kişisel paylaşımlar
- **Hedefli Paylaşım**: Belirli kullanıcılara özel mesajlar
- **Gerçek Zamanlı Güncellemeler**: AJAX tabanlı dinamik içerik
- **Medya Lightbox**: Resim ve video büyütme özelliği

### 📰 Haber ve Duyuru Sistemi
- **Otomatik Haber Çekme**: sendika.org'dan güncel haberler
- **Dinamik Ana Sayfa**: Gerçek zamanlı haber güncellemeleri
- **Kategori Filtreleme**: Haber türlerine göre filtreleme
- **Arşiv Sistemi**: Geçmiş duyuru ve haberlere erişim
- **RSS Desteği**: Harici haber kaynaklarından besleme

### 🤖 Akıllı ChatBot (SENDİKACI AI)
- **7/24 Destek**: Sürekli kullanıcı desteği
- **Akıllı Yanıtlar**: Sık sorulan sorulara otomatik cevaplar
- **Hızlı Erişim Butonları**: Sık kullanılan işlevlere anında erişim
- **Yönlendirme**: İlgili sayfalara akıllı yönlendirme
- **Türkçe Doğal Dil İşleme**: Gelişmiş dil anlama

## 🛠️ Teknoloji Stack'i

### Backend (Web Sunucusu)
- **Node.js v18+**: JavaScript runtime environment
- **Express.js v4.18.2**: Web application framework
- **PostgreSQL v14+**: İlişkisel veritabanı
- **Sequelize v6.37.7**: ORM (Object-Relational Mapping)
- **Multer v1.4.5**: Dosya yükleme middleware'i
- **Bcrypt**: Şifre hashleme ve güvenlik
- **Express-Session**: Oturum yönetimi
- **CORS**: Cross-origin resource sharing
- **Express-Rate-Limit**: API hız sınırlaması
- **Helmet.js**: HTTP header güvenliği

### Frontend (Web Arayüzü)
- **EJS v3.1.9**: Server-side template engine
- **Bootstrap 5.3.0**: CSS framework ve responsive tasarım
- **Font Awesome 6.0.0**: İkon kütüphanesi
- **Vanilla JavaScript ES6+**: Modern JavaScript
- **Fetch API**: HTTP istemci işlemleri
- **Custom CSS Animations**: Özel animasyonlar
- **Mobile-First Design**: Mobil öncelikli tasarım

### Web Scraping ve Haber Sistemi
- **Axios v1.6.0**: HTTP istemci kütüphanesi
- **Cheerio v1.0.0**: Server-side HTML parsing
- **News Service**: Otomatik haber çekme servisi

### Veritabanı Yapısı
```sql
-- Ana tablolar
users (id, tc_no, ad, soyad, email, password, rol, created_at)
paylasimlar (id, user_id, kategori, icerik, media_path, gizlilik)
begeniler (id, paylasim_id, user_id, created_at)
yorumlar (id, paylasim_id, user_id, icerik, created_at)
yorum_begeniler (id, yorum_id, user_id, created_at)
surveys (id, title, description, status, created_by, created_at)
survey_questions (id, survey_id, question_text, question_type)
survey_answers (id, survey_id, user_id, question_id, answer_text)
toplantilar (id, baslik, tarih, saat, yer, katilimcilar, olusturan_id)
etkinlikler (id, baslik, aciklama, tarih, konum, tur, durum)
grevler (id, baslik, neden, durum, katilimci_sayisi, olusturan_id)
grev_oylari (id, grev_id, user_id, oy, created_at)
payrolls (id, user_id, amount, payroll_date, pdf_path, description)
```

## 📁 Proje Yapısı
```
sendikaproje1-main/
├── app.js                        # Ana sunucu dosyası (1189 satır)
├── db.js                         # Veritabanı bağlantısı
├── package.json                  # Proje bağımlılıkları
├── config/                       # Yapılandırma dosyaları
│   └── api.config.js            # API ayarları
├── models/                       # Sequelize modelleri
│   └── sequelize.js             # Veritabanı modelleri
├── services/                     # İş servisleri
│   └── newsService.js           # Haber çekme servisi
├── utils/                        # Yardımcı fonksiyonlar
│   └── aktiflikHesaplama.js     # Aktiflik puanı hesaplama
├── middleware/                   # Ara yazılımlar
├── routes/                       # API rotaları
│   └── api.js                   # Ana API rotaları
├── views/                        # EJS şablonları
│   ├── index.ejs                # Ana sayfa (900+ satır)
│   ├── isci-dashboard.ejs       # İşçi paneli
│   ├── sendikaci-dashboard.ejs  # Sendikacı paneli (1031 satır)
│   ├── isci-giris.ejs          # İşçi giriş sayfası
│   ├── sendikaci-giris.ejs     # Sendikacı giriş sayfası
│   ├── uye-ol.ejs              # Üye kayıt sayfası
│   ├── anketler.ejs            # Anket sayfası
│   ├── anket-yonetim.ejs       # Anket yönetimi
│   ├── isci/                   # İşçi özel sayfalar
│   │   └── grev-kararlari.ejs  # Grev kararları
│   ├── sendikaci/              # Sendikacı özel sayfalar
│   │   ├── grev-yonetim.ejs    # Grev yönetimi
│   │   └── etkinlik-yonetim.ejs # Etkinlik yönetimi
│   ├── bordrolarim.ejs         # Bordro görüntüleme
│   ├── bordro-yonetim.ejs      # Bordro yönetimi
│   ├── sendikaci-toplantilar.ejs # Toplantı yönetimi
│   ├── isci-etkinlikler.ejs    # Etkinlik görüntüleme
│   ├── iletisim.ejs            # İletişim sayfası
│   ├── ayarlar.ejs             # Profil ayarları
│   └── error.ejs               # Hata sayfası
├── public/                       # Statik dosyalar
│   ├── css/                     # Stil dosyaları
│   ├── js/                      # JavaScript dosyaları
│   ├── images/                  # Resim dosyaları
│   └── uploads/                 # Yüklenen dosyalar
│       ├── payrolls/            # Bordro PDF'leri
│       └── media/               # Paylaşım medyaları
├── migrations/                   # Veritabanı migration'ları
├── seeders/                     # Test verileri
├── sql/                         # SQL dosyaları
└── scripts/                     # Yardımcı scriptler
```

## 🚀 Kurulum ve Çalıştırma

### Ön Gereksinimler
- **Node.js**: v16.0.0 veya üzeri
- **PostgreSQL**: v12.0 veya üzeri
- **npm**: v8.0.0 veya üzeri
- **RAM**: Minimum 2GB
- **Disk**: 1GB boş alan

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/SAME1T/sendikaproje1.git
cd sendikaproje1-main
```

### 2. Backend Kurulumu
```bash
# Bağımlılıkları yükleyin
npm install

# Çevre değişkenlerini ayarlayın
cp .env.example .env
# .env dosyasını düzenleyin
```

### 3. Veritabanı Konfigürasyonu
```javascript
// db.js
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sendikaprojesi',
    password: 'your_password',
    port: 5432,
});
```

### 4. Veritabanını Oluşturun
```bash
# PostgreSQL'de veritabanı oluşturun
createdb sendikaprojesi

# Tabloları oluşturun (SQL dosyalarını çalıştırın)
psql -d sendikaprojesi -f sql/schema.sql
```

### 5. Uygulamayı Başlatın
```bash
# Geliştirme modu
npm run dev

# Üretim modu
npm start
```

### 6. Tarayıcıda Açın
```
http://localhost:3000
```

## 📊 Aktiflik Puanı Sistemi

### Puan Kazanma Yöntemleri
- **Giriş Yapma**: +5 puan (günlük)
- **Paylaşım Yapma**: +10 puan
- **Yorum Yazma**: +3 puan
- **Beğeni**: +1 puan
- **Anket Katılımı**: +15 puan
- **Toplantı Katılımı**: +20 puan
- **Grev Oylaması**: +25 puan

### Sendika Ücreti Hesaplama
```javascript
// Aktiflik puanına göre dinamik ücret
const sendikaUcreti = Math.max(50, 200 - (aktiflikPuani * 2));
// Minimum 50 TL, maksimum 200 TL
```

## 🎨 Tasarım Özellikleri

### Renk Paleti
- **Ana Renk**: #6a11cb → #2575fc (Gradient)
- **Vurgu Rengi**: #43e97b → #38f9d7 (Gradient)
- **Hata Rengi**: #ff3b30 (Kırmızı)
- **Başarı Rengi**: #34c759 (Yeşil)
- **Arkaplan**: #f8f9fa (Açık Gri)

### UI/UX Özellikleri
- **Modern Kartlar**: Gölgeli ve yuvarlatılmış köşeler
- **Animasyonlu Arkaplan**: Gradient geçişler ve hareket
- **Responsive Tasarım**: Tüm ekran boyutlarına uyumlu
- **Hover Efektleri**: Etkileşimli buton animasyonları
- **Instagram Benzeri Feed**: Modern sosyal medya tasarımı
- **Lightbox Modal**: Medya görüntüleme sistemi

## 🔧 API Endpoints

### Kimlik Doğrulama
- `POST /isci-giris` - İşçi girişi
- `POST /sendikaci-giris` - Sendikacı girişi
- `POST /uye-ol` - Yeni üye kaydı
- `GET /cikis` - Çıkış yapma

### Dashboard Rotaları
- `GET /dashboard/isci` - İşçi ana sayfası
- `GET /dashboard/sendikaci` - Sendikacı ana sayfası
- `GET /ayarlar` - Profil ayarları
- `POST /ayarlar` - Profil güncelleme

### Sosyal İşlemler
- `POST /paylasim-ekle` - Yeni paylaşım
- `POST /paylasim/:id/begen` - Beğeni/beğenmeme
- `POST /paylasim/:id/yorum` - Yorum yapma
- `POST /paylasim/:id/sil` - Paylaşım silme
- `GET /paylasim/:id/begenenler` - Beğenenleri görüntüle

### Anket İşlemleri
- `GET /anketler` - Anket listesi
- `GET /anket-yonetim` - Anket yönetimi (sendikacı)
- `POST /api/surveys` - Yeni anket oluşturma
- `POST /api/surveys/:id/answer` - Anket cevaplama

### Grev İşlemleri
- `GET /isci/grev-kararlari` - Grev kararları (işçi)
- `GET /sendikaci/grev-yonetim` - Grev yönetimi (sendikacı)
- `POST /sendikaci/grev-yonetim/ekle` - Yeni grev oluştur
- `POST /grev/oyla/:grev_id` - Grev oylaması

### Toplantı İşlemleri
- `GET /toplantilar` - Toplantı listesi
- `POST /toplantilar/ekle` - Yeni toplantı
- `POST /toplantilar/sil/:id` - Toplantı silme

### Etkinlik İşlemleri
- `GET /isci/etkinlikler` - Etkinlik görüntüleme (işçi)
- `GET /sendikaci/etkinlik-yonetim` - Etkinlik yönetimi (sendikacı)
- `POST /sendikaci/etkinlik-yonetim` - Yeni etkinlik
- `POST /sendikaci/etkinlik-sil/:id` - Etkinlik silme

### Bordro İşlemleri
- `GET /bordrolarim` - Bordro görüntüleme (işçi)
- `GET /bordro-yonetim` - Bordro yönetimi (sendikacı)
- `POST /bordro-yonetim` - Bordro yükleme
- `POST /bordro-sil/:id` - Bordro silme

### Haber Sistemi
- `GET /` - Ana sayfa (otomatik haber çekme)
- News Service: sendika.org'dan otomatik haber çekme

## 📈 Performans Optimizasyonları

### Frontend
- **Lazy Loading**: Sayfa bazlı kod bölme
- **Image Optimization**: Otomatik resim sıkıştırma
- **AJAX Loading**: Dinamik içerik yükleme
- **Caching**: Tarayıcı önbellekleme
- **Minification**: CSS/JS dosya küçültme

### Backend
- **Connection Pooling**: PostgreSQL bağlantı havuzu
- **Query Optimization**: Optimize edilmiş SQL sorguları
- **File Upload Limits**: Dosya boyutu sınırlamaları (10MB)
- **Error Handling**: Kapsamlı hata yönetimi
- **Rate Limiting**: API hız sınırlaması

## 🔒 Güvenlik Özellikleri

### Kimlik Doğrulama
- **TC Kimlik No Validasyonu**: 11 haneli TC kontrolü
- **Şifre Güvenliği**: Bcrypt ile hashleme
- **Session Yönetimi**: Güvenli oturum kontrolü
- **Role-Based Access**: Rol tabanlı erişim kontrolü

### Veri Güvenliği
- **SQL Injection Koruması**: Parametreli sorgular
- **XSS Koruması**: Input sanitizasyonu
- **CORS Konfigürasyonu**: Güvenli cross-origin istekleri
- **File Upload Security**: Dosya tipi ve boyut kontrolü
- **CSRF Protection**: Cross-site request forgery önleme

### Network Güvenliği
- **Helmet.js**: HTTP header güvenliği
- **Rate Limiting**: API isteklerinde hız sınırlaması
- **HTTPS Enforcement**: SSL/TLS şifreleme desteği

## 📱 Desteklenen Platformlar
- **Desktop**: Windows, macOS, Linux
- **Web Tarayıcıları**: 
  - ✅ Chrome 90+
  - ✅ Firefox 88+
  - ✅ Safari 14+
  - ✅ Edge 90+
- **Mobil Tarayıcılar**: 
  - ✅ Mobile Safari
  - ✅ Chrome Mobile
  - ✅ Samsung Internet


## 🤝 Katkıda Bulunma

### Geliştirme Süreci
1. **Fork** edin
2. **Feature branch** oluşturun (`git checkout -b feature/amazing-feature`)
3. **Commit** edin (`git commit -m 'feat: Add amazing feature'`)
4. **Push** edin (`git push origin feature/amazing-feature`)
5. **Pull Request** oluşturun

### Kod Standartları
- **ESLint**: JavaScript kod standartları
- **Prettier**: Kod formatlama
- **Conventional Commits**: Commit mesaj formatı
- **JSDoc**: Kod dokümantasyonu



## 📄 Lisans
Bu proje **MIT Lisansı** altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 Ekip

### Geliştirici
- **Samet ÇİFTCİ** - *Full Stack Developer* - [@SAME1T](https://github.com/SAME1T)



## 📞 İletişim ve Destek

### İletişim Kanalları
- **GitHub Issues**: [Proje Issues](https://github.com/SAME1T/sendikaproje1/issues)
- **Email**: sc962857@gmail.com
- **GitHub Profile**: [@SAME1T](https://github.com/SAME1T)

### Destek
- 📖 **Dokümantasyon**: [Wiki sayfası](https://github.com/SAME1T/sendikaproje1/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/SAME1T/sendikaproje1/discussions)
- 🐛 **Bug Reports**: [Issue Tracker](https://github.com/SAME1T/sendikaproje1/issues)

---

<div align="center">

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın! ⭐**

**Not**: Bu proje aktif geliştirme aşamasındadır. Yeni özellikler ve iyileştirmeler düzenli olarak eklenmektedir.

Made with ❤️ by [Samet ÇİFTCİ](https://github.com/SAME1T)

</div>

