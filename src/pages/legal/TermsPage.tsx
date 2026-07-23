import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 pt-8 pb-6 text-white">
        <button onClick={() => navigate('/')} className="text-purple-200 text-xs mb-2">← Ana Sayfa</button>
        <h1 className="text-xl font-bold">Kullanım Şartları ve Mesafeli Satış Sözleşmesi</h1>
        <p className="text-purple-200 text-xs mt-1">Son güncelleme: 17 Temmuz 2026</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6 text-sm text-slate-700 leading-relaxed">

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            Bu metin taslak niteliğindedir ve hizmet sağlayıcı bilgileri güncellendikçe revize edilecektir.
          </div>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">1. Taraflar ve Tanımlar</h2>
            <p>Bu sözleşme, "Hedefim LGS" platformunu ("Hizmet Sağlayıcı", "Platform") işleten <strong>Hedefim LGS</strong> ("Satıcı") ile Platform üzerinden hesap oluşturan veli/kullanıcı ("Alıcı") arasında akdedilmiştir.</p>
            <p className="mt-2">İletişim: <strong>bilgi@hedefimlgs.com</strong> · Adres: Beykoz, İstanbul</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">2. Hizmetin Tanımı</h2>
            <p>Platform, LGS (Liselere Geçiş Sistemi) sınavına hazırlanan öğrenciler için yapay zeka destekli, kişiselleştirilmiş soru üretimi, sınav simülasyonu, konu anlatımı ve veli raporlama hizmetleri sunar. Hizmet, aylık abonelik esasına göre sunulur.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">3. Abonelik, Ücretlendirme ve Ödeme</h2>
            <p>Güncel abonelik ücreti Platform üzerinde ilan edilir. Yeni kayıt olan kullanıcılara belirli bir süre ücretsiz deneme imkânı tanınabilir. Ücretsiz deneme süresinin sonunda hizmete devam edilmesi, abonelik bedelinin ödenmesine bağlıdır. Ödeme, Platform üzerinde belirtilen yöntemlerle (banka havalesi/EFT veya entegre ödeme sağlayıcıları aracılığıyla kredi/banka kartı) yapılır.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">4. Cayma Hakkı</h2>
            <p>6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, Alıcı, sözleşmenin kurulduğu tarihten itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin cayma hakkına sahiptir. Ancak, Alıcı'nın açık onayı ile hizmetin ücretsiz deneme süresi içinde fiilen kullanılmaya (sınav çözme, rapor üretme vb.) başlanması ve hizmetin elektronik ortamda anında ifa edilen bir hizmet niteliği taşıması hâlinde, ilgili mevzuat kapsamında cayma hakkı kullanılamayabilir. Cayma talepleri için <strong>bilgi@hedefimlgs.com</strong> adresine yazılı başvuru yapılması yeterlidir.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">5. Aboneliğin İptali ve Sona Ermesi</h2>
            <p>Alıcı, aboneliğini dilediği zaman iptal edebilir. Abonelik iptal edildiğinde ya da süresi dolduğunda, öğrenci hesabına erişim kısıtlanır ancak geçmiş veriler (sınav sonuçları, performans kayıtları) makul bir süre boyunca saklanmaya devam eder; abonelik yenilendiğinde erişim kaldığı yerden devam eder. Verilerin kalıcı silinmesi talep edilirse, KVKK Aydınlatma Metni'nde belirtilen usulle talepte bulunulabilir.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">6. Yapay Zeka Destekli İçerik Hakkında</h2>
            <p>Platform'da sunulan sorular, çözüm açıklamaları ve konu özetleri yapay zeka tarafından üretilmektedir. Hizmet Sağlayıcı, içeriklerin doğruluğunu artırmak için makul özeni gösterse de, yapay zeka çıktılarında zaman zaman hata veya eksiklik bulunabileceğini kabul eder ve bu içeriklerin resmî MEB müfredatının yerine geçmediğini, tamamlayıcı bir çalışma materyali olduğunu beyan eder. Alıcı, bu doğrultuda içerikleri değerlendirmeyi kabul eder.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">7. Kullanıcı Yükümlülükleri</h2>
            <p>Alıcı, hesap bilgilerinin güvenliğinden sorumludur, Platform'u yalnızca kendi ailesi/öğrencisi için kullanmayı ve hesabını üçüncü kişilerle paylaşmamayı kabul eder.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">8. Fikri Mülkiyet</h2>
            <p>Platform'daki yazılım, tasarım ve marka unsurları Hizmet Sağlayıcı'ya aittir. Üretilen sorular ve içerikler yalnızca kişisel eğitim amacıyla kullanılabilir, çoğaltılamaz veya ticari amaçla dağıtılamaz.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">9. Hizmet Kesintileri</h2>
            <p>Hizmet Sağlayıcı, bakım, güncelleme veya mücbir sebepler nedeniyle Platform'da geçici kesintiler yaşanabileceğini, bu kesintilerden dolayı sorumluluk kabul etmeyeceğini beyan eder.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">10. Uyuşmazlıkların Çözümü</h2>
            <p>İşbu sözleşmeden doğan uyuşmazlıklarda İstanbul Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p>
          </section>

          <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">Bu metin genel bir taslak olup hukuki danışmanlık yerine geçmez.</p>
        </div>
      </div>
    </div>
  );
}
