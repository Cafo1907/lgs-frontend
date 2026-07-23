interface Props { onStart: () => void; onBack: () => void }

const SUBJECT_COUNTS = [
  { icon: '📖', name: 'Türkçe', count: 20 },
  { icon: '🔢', name: 'Matematik', count: 20 },
  { icon: '🔬', name: 'Fen Bilimleri', count: 20 },
  { icon: '🌍', name: 'Sosyal Bilgiler', count: 10 },
  { icon: '📿', name: 'Din Kültürü', count: 10 },
  { icon: '🌐', name: 'İngilizce', count: 10 },
];

export default function PlacementExamInfoPage({ onStart, onBack }: Props) {
  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-50 pb-10">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 pt-12 pb-8 text-white">
        <button onClick={onBack} className="text-purple-200 text-sm mb-4 hover:text-white transition-colors">← Geri Dön</button>
        <div className="text-4xl mb-3">📝</div>
        <h1 className="text-xl font-bold">Seviye Tespit Sınavı</h1>
        <p className="text-purple-100 text-sm mt-1">Başlamadan önce sınavın ne işe yaradığını okuyalım.</p>
      </div>

      <div className="px-4 mt-5 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-slate-700 mb-2">🎯 Bu sınav ne işe yarıyor?</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Bu sınav, gerçek bir LGS denemesi gibi 6 dersten soru içerir ve şu anki seviyeni gerçekçi şekilde ölçer.
            Sonuçlar sisteme kaydedilir; hangi konularda güçlü, hangilerinde zayıf olduğunu belirleriz ve sana
            özel soru ve tekrar planı bu sonuca göre şekillenir.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-slate-700 mb-2">🏫 Hedef lise için referans</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Bu sınavdan çıkan puan, hedeflediğin liseye olan mesafeni gösteren ilk referans noktası olarak kullanılır.
            İlerledikçe yeni denemelerle bu referans güncellenir.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-slate-700 mb-2">🧭 Yönlendirme nasıl çalışıyor?</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Hangi konularda kaç net yaptığına bakarak zayıf olduğun konuları tespit ediyoruz ve sana günlük olarak
            önce o konulardan sorular yönlendiriyoruz. Yani net sayıların, senin için hazırlanan çalışma planını
            doğrudan şekillendiriyor.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-slate-700 mb-2">📊 Sınav Detayları</h2>
          <div className="space-y-2">
            {SUBJECT_COUNTS.map(s => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-2"><span>{s.icon}</span>{s.name}</span>
                <span className="font-semibold text-slate-700">{s.count} soru</span>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-2 mt-2 flex items-center justify-between text-sm font-bold text-purple-700">
              <span>Toplam</span>
              <span>90 soru · 135 dakika</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 text-sm text-amber-700">
          ⚠️ Sınav başladıktan sonra geri dönemezsin. Sakin bir ortamda ve zamanın olduğunda başlamanı öneririz.
        </div>

        <button onClick={onStart}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all">
          Sınava Başla →
        </button>
      </div>
    </div>
  );
}
