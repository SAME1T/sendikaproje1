# Sendika İletişim Merkezi

Modern ve kullanıcı dostu bir sendika yönetim ve iletişim platformu.

## 🌟 Özellikler

### 👥 Üyelik ve Yetkilendirme
- Çok seviyeli kullanıcı yönetimi (Üye, Sendikacı, Admin)
- Güvenli kimlik doğrulama sistemi
- Profil yönetimi ve ayarlar
- TC Kimlik doğrulaması

### 📱 Sosyal Geri Bildirim Sistemi
- Instagram benzeri modern paylaşım akışı
- Kategori bazlı paylaşımlar (Dilek, Şikayet, İstek, Görüş, Öneri, Teşekkür)
- Medya desteği (Fotoğraf ve Video)
- Gizlilik seçenekleri (Herkese Açık/Özel)
- Beğeni ve yorum sistemi
- Beğenenleri görüntüleme
- Yorum beğenme özelliği

### 📊 Anket ve Toplantı Yönetimi
- Anket oluşturma ve yönetme
- Toplantı planlama ve takibi
- Katılımcı yönetimi
- Sonuç analizi

### 💼 Bordro ve İşlem Yönetimi
- Bordro görüntüleme
- İşlem geçmişi
- Belge yönetimi

### 📢 Duyuru ve İletişim
- Duyuru yayınlama
- Toplu bildirim sistemi
- İletişim formu
- Etkinlik takvimi

## 🚀 Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- MongoDB
- npm veya yarn

### Adımlar

1. Projeyi klonlayın:
```bash
git clone [proje-url]
cd sendikaproje1
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Çevre değişkenlerini ayarlayın:
```bash
cp .env.example .env
```
`.env` dosyasını düzenleyin ve gerekli değişkenleri ayarlayın.

4. Veritabanını kurun:
```bash
npm run db:setup
```

5. Uygulamayı başlatın:
```bash
# Geliştirme modu
npm run dev

# Üretim modu
npm start
```

## 🛠 Teknolojiler

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JWT Authentication
- Multer (Dosya yükleme)

### Frontend
- EJS Template Engine
- Bootstrap 5
- Font Awesome
- Custom CSS/JS

### Güvenlik
- Helmet.js
- Express Rate Limit
- CORS
- XSS Protection

## 📁 Proje Yapısı

```
sendikaproje1/
├── config/             # Yapılandırma dosyaları
├── controllers/        # Route controller'ları
├── middleware/         # Middleware fonksiyonları
├── models/            # Veritabanı modelleri
├── public/            # Statik dosyalar
├── routes/            # API rotaları
├── uploads/           # Yüklenen dosyalar
└── views/             # EJS şablonları
```

## 🔒 Güvenlik Özellikleri

- JWT tabanlı kimlik doğrulama
- Şifre hashleme (bcrypt)
- Rate limiting
- XSS koruması
- CSRF koruması
- Güvenli dosya yükleme
- Input validasyonu

## 📱 Responsive Tasarım

- Mobil uyumlu arayüz
- Bootstrap grid sistemi
- Özel medya sorguları
- Touch-friendly etkileşimler

## 🤝 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

Proje Sahibi - [@thecoderfarmer](https://github.com/thecoderfarmer)

Proje Linki: [https://github.com/thecoderfarmer/sendikaproje1](https://github.com/thecoderfarmer/sendikaproje1) 