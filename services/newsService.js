const axios = require('axios');
const cheerio = require('cheerio');

class NewsService {
    constructor() {
        this.baseUrl = 'https://sendika.org';
    }

    async getLatestNews(limit = 10) {
        try {
            const response = await axios.get(this.baseUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            const news = [];

            // Sendika.org'un haber yapısına göre seçicileri ayarlayın
            $('.haber-item, .news-item, article, .post').each((index, element) => {
                if (index >= limit) return false;

                const $element = $(element);
                const title = $element.find('h1, h2, h3, .title, .baslik').first().text().trim();
                const summary = $element.find('p, .summary, .ozet').first().text().trim();
                const link = $element.find('a').first().attr('href');
                const image = $element.find('img').first().attr('src');
                const date = $element.find('.date, .tarih, time').first().text().trim();

                if (title && title.length > 0) {
                    news.push({
                        title: title,
                        summary: summary || title.substring(0, 150) + '...',
                        link: link ? (link.startsWith('http') ? link : this.baseUrl + link) : '#',
                        image: image ? (image.startsWith('http') ? image : this.baseUrl + image) : 'https://picsum.photos/400/300',
                        date: date || new Date().toLocaleDateString('tr-TR'),
                        source: 'sendika.org'
                    });
                }
            });

            // Eğer yukarıdaki seçiciler çalışmazsa alternatif deneme
            if (news.length === 0) {
                $('a').each((index, element) => {
                    if (index >= limit) return false;

                    const $element = $(element);
                    const href = $element.attr('href');
                    const text = $element.text().trim();

                    // Haber linklerini filtrele
                    if (href && text && text.length > 20 && 
                        (href.includes('haber') || href.includes('news') || href.includes('makale'))) {
                        news.push({
                            title: text,
                            summary: text.substring(0, 150) + '...',
                            link: href.startsWith('http') ? href : this.baseUrl + href,
                            image: 'https://picsum.photos/400/300',
                            date: new Date().toLocaleDateString('tr-TR'),
                            source: 'sendika.org'
                        });
                    }
                });
            }

            return news.slice(0, limit);

        } catch (error) {
            console.error('Haber çekme hatası:', error.message);
            
            // Hata durumunda örnek haberler döndür
            return this.getFallbackNews();
        }
    }

    getFallbackNews() {
        return [
            {
                title: "1 Mayıs 2025'e Doğru: İşçi Sınıfının Birlik, Mücadele ve Dayanışma Günü",
                summary: "Tüm işçi ve emekçilerin katılımıyla gerçekleşecek 1 Mayıs etkinlikleri için hazırlıklar devam ediyor.",
                link: "https://sendika.org",
                image: "https://picsum.photos/800/400",
                date: new Date().toLocaleDateString('tr-TR'),
                source: "sendika.org",
                category: "Öne Çıkan"
            },
            {
                title: "Sendikalardan Ortak Açıklama",
                summary: "İşçi hakları ve çalışma koşulları hakkında önemli gelişmeler...",
                link: "https://sendika.org",
                image: "https://picsum.photos/400/200",
                date: new Date().toLocaleDateString('tr-TR'),
                source: "sendika.org",
                category: "Gündem"
            },
            {
                title: "İşçi Hakları Zaferi",
                summary: "Yargıtay'dan emsal karar: İşçi hakları genişletildi...",
                link: "https://sendika.org",
                image: "https://picsum.photos/400/201",
                date: new Date().toLocaleDateString('tr-TR'),
                source: "sendika.org",
                category: "Emek"
            },
            {
                title: "Soma maden katliamı davasında karar: 'Adalet yerini bulmadı'",
                summary: "Soma maden faciası davası sonuçlandı. Aileler ve sendikalar kararı eleştirdi.",
                link: "https://sendika.org",
                image: "https://picsum.photos/400/300",
                date: new Date().toLocaleDateString('tr-TR'),
                source: "sendika.org",
                category: "Önemli"
            },
            {
                title: "1 Mayıs 2025'e giderken sosyalist hareket ne düşünüyor?",
                summary: "1 Mayıs öncesi sosyalist hareketin değerlendirmeleri ve beklentileri...",
                link: "https://sendika.org",
                image: "https://picsum.photos/400/201",
                date: new Date().toLocaleDateString('tr-TR'),
                source: "sendika.org",
                category: "1 Mayıs"
            },
            {
                title: "DİSK, KESK, TMMOB, TTB 1 Mayıs 1977'de yaşamını yitirenleri andı",
                summary: "Konfederasyonlar 1 Mayıs 1977'de yaşamını yitiren işçileri anma etkinliği düzenledi.",
                link: "https://sendika.org",
                image: "https://picsum.photos/400/202",
                date: new Date().toLocaleDateString('tr-TR'),
                source: "sendika.org",
                category: "Eylem"
            }
        ];
    }

    async getNewsByCategory(category, limit = 5) {
        try {
            const allNews = await this.getLatestNews(20);
            return allNews.filter(news => 
                news.title.toLowerCase().includes(category.toLowerCase()) ||
                news.summary.toLowerCase().includes(category.toLowerCase())
            ).slice(0, limit);
        } catch (error) {
            console.error('Kategori haberleri çekme hatası:', error);
            return [];
        }
    }
}

module.exports = new NewsService(); 