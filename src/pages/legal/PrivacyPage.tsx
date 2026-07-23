import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 pt-8 pb-6 text-white">
        <button onClick={() => navigate('/')} className="text-purple-200 text-xs mb-2">← Ana Sayfa</button>
        <h1 className="text-xl font-bold">Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
        <p className="text-purple-200 text-xs mt-1">Son güncelleme: 17 Temmuz 2026</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6 text-sm text-slate-700 leading-relaxed">

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            Bu metin taslak niteliğindedir ve hizmet sağlayıcı bilgileri güncellendikçe revize edilecektir.
          </div>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">1. Veri Sorumlusu</h2>
            <p>6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla <strong>Hedefim LGS</strong> ("Platform") tarafından aşağıda açıklanan kapsamda işlenmektedir.</p>
            <p className="mt-2">İletişim: <strong>bilgi@hedefimlgs.com</strong> · Adres: Beykoz, İstanbul</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">2. İşlenen Kişisel Veriler</h2>
            <p><strong>Veli hesabı için:</strong> ad-soyad, e-posta adresi, ödeme/iban bilgileri, mail bildirim tercihleri.</p>
            <p className="mt-2"><strong>Öğrenci hesabı için:</strong> ad-soyad, e-posta adresi, sınav cevapları ve sonuçları, konu bazlı performans/zayıflık skorları, hedef okul bilgisi.</p>
            <p className="mt-2">Öğrenci hesapları 18 yaş altı kullanıcılara ait olabileceğinden, bu veriler <strong>veli hesabı üzerinden ve veli sorumluluğunda</strong> oluşturulur ve yönetilir.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">3. Kişisel Verilerin İşlenme Amaçları</h2>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Kişiselleştirilmiş sınav ve konu anlatımı içeriği üretmek</li>
              <li>Öğrenci performansını analiz edip veliye raporlamak</li>
              <li>Abonelik ve ödeme süreçlerini yürütmek</li>
              <li>Bildirim e-postaları (sınav sonucu, günlük/haftalık rapor, hatırlatma) göndermek</li>
              <li>Hizmet kalitesini ölçmek ve geliştirmek (kullanım istatistikleri)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">4. Hukuki Sebep ve Açık Rıza</h2>
            <p>Veriler, bir sözleşmenin (abonelik hizmeti) kurulması ve ifası için gerekli olması hukuki sebebine dayanarak işlenir. Öğrencinin performans verilerinin işlenmesine, hesabı oluşturan veli tarafından kayıt sırasında açık rıza verilir. Veli, bu rızayı istediği zaman geri çekebilir; ancak bu durumda hizmetin sunulmaya devam edilmesi mümkün olmayabilir.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">5. Verilerin Aktarıldığı Üçüncü Taraflar</h2>
            <p>Kişiselleştirilmiş içerik üretimi için soru metinleri ve performans verileri, yapay zeka servis sağlayıcısına (Anthropic, ABD merkezli) işlenmek üzere aktarılır. E-posta bildirimleri için Google (Gmail/Google Workspace altyapısı) kullanılmaktadır. Ödeme işlemleri için entegre ödeme kuruluşları (ör. Iyzico/PayTR) ile sınırlı ödeme bilgisi paylaşılabilir. Bu aktarımlar, hizmetin ifası için gerekli asgari veriyle sınırlıdır.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">6. Veri Saklama Süresi</h2>
            <p>Veriler, abonelik süresince ve abonelik sona erdikten sonra makul bir süre boyunca (yeniden aktivasyon ihtimaline karşı) saklanır. Veli, hesabın ve ilişkili verilerin tamamen silinmesini talep edebilir; bu durumda geri dönüşü olmayan bir silme işlemi gerçekleştirilir.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">7. Veri Sahibinin Hakları (KVKK m.11)</h2>
            <p>Veri sahibi (veli, öğrenci adına hareket ederek) aşağıdaki haklara sahiptir:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Kişisel veri işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik/yanlış işlenmişse düzeltilmesini isteme</li>
              <li>Silinmesini veya yok edilmesini isteme</li>
              <li>İşlemenin münhasıran otomatik sistemlerle analiz sonucu aleyhe bir sonuç doğurması hâlinde itiraz etme</li>
            </ul>
            <p className="mt-2">Bu haklar kapsamındaki talepler <strong>bilgi@hedefimlgs.com</strong> adresine yazılı olarak iletilebilir.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">8. Bildirim E-postaları</h2>
            <p>Platform, sınav sonuçları ve gelişim raporları gibi hizmet kapsamındaki bildirimleri e-posta yoluyla gönderir. Veli, hangi bildirim türlerini almak istediğini hesabındaki "Bildirimler" bölümünden dilediği zaman değiştirebilir.</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">9. Veri Güvenliği</h2>
            <p>Platform, kişisel verilerin hukuka aykırı erişime karşı korunması için şifreleme (parolaların bcrypt ile saklanması) ve erişim kontrolü gibi teknik tedbirleri uygular.</p>
          </section>

          <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">Bu metin genel bir taslak olup hukuki danışmanlık yerine geçmez.</p>
        </div>
      </div>
    </div>
  );
}
