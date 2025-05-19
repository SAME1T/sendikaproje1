const pool = require('../db');

// Aktiflik puanı hesaplama fonksiyonu
async function aktiflikPuaniHesapla(userId) {
    try {
        // Kullanıcının rolünü al
        const userResult = await pool.query('SELECT rol FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) throw new Error('Kullanıcı bulunamadı');
        const rol = userResult.rows[0].rol;

        // Sadece işçiler için puan hesapla
        let aktiflikPuani = 0;
        if (rol === 1) { // İşçi
            // Geri bildirim sayısı
            const geriBildirimSayisi = await pool.query(
                'SELECT COUNT(*) FROM geri_bildirimler WHERE user_id = $1',
                [userId]
            );
            // Anket katılım sayısı
            const anketKatilimSayisi = await pool.query(
                'SELECT COUNT(*) FROM anket_katilimlari WHERE user_id = $1',
                [userId]
            );
            aktiflikPuani += Number(geriBildirimSayisi.rows[0].count) * 1;
            aktiflikPuani += Number(anketKatilimSayisi.rows[0].count) * 2;
        }
        // Maksimum 100 puan
        aktiflikPuani = Math.min(aktiflikPuani, 100);

        // Aktiflik puanını güncelle
        await pool.query(
            'INSERT INTO aktiflik_puanlari (user_id, aktiflik_puani) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET aktiflik_puani = $2, son_guncelleme = CURRENT_TIMESTAMP',
            [userId, aktiflikPuani]
        );

        return aktiflikPuani;
    } catch (error) {
        console.error('Aktiflik puanı hesaplama hatası:', error);
        throw error;
    }
}

// Sendika ücreti hesaplama fonksiyonu
async function sendikaUcretiHesapla(userId) {
    try {
        // Kullanıcının en son bordrosundan saatlik ücreti al
        const payrollResult = await pool.query(
            'SELECT amount FROM payrolls WHERE user_id = $1 ORDER BY payroll_date DESC, id DESC LIMIT 1',
            [userId]
        );
        let saatlikMaas = 0;
        if (payrollResult.rows.length > 0) {
            const aylikMaas = Number(payrollResult.rows[0].amount) || 0;
            saatlikMaas = aylikMaas / 30 / 8;
        }

        // Aktiflik puanını al
        const aktiflikResult = await pool.query(
            'SELECT aktiflik_puani FROM aktiflik_puanlari WHERE user_id = $1',
            [userId]
        );
        const aktiflikPuani = aktiflikResult.rows.length > 0 ? aktiflikResult.rows[0].aktiflik_puani : 0;

        // Ücreti hesapla: Ucret = SaatlikMaas × 30 × 8 × 0.005 × (1 - AktiflikPuani/100)
        const aylikBrut = saatlikMaas * 30 * 8;
        const ucret = aylikBrut * 0.005 * (1 - aktiflikPuani/100);

        return {
            ucret: Math.round(ucret * 100) / 100, // 2 ondalık basamağa yuvarla
            aktiflikPuani: aktiflikPuani,
            saatlikMaas: saatlikMaas
        };
    } catch (error) {
        console.error('Sendika ücreti hesaplama hatası:', error);
        throw error;
    }
}

module.exports = {
    aktiflikPuaniHesapla,
    sendikaUcretiHesapla
}; 