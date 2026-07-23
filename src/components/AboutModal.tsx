import { useEffect } from 'react';
import { LogoMark } from './Logo';

export default function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-[popIn_0.2s_cubic-bezier(0.2,0.9,0.3,1.1)]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
        >
          ✕
        </button>

        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-t-3xl px-7 pt-8 pb-6 text-center">
          <div className="flex justify-center text-white mb-3">
            <LogoMark size={40} />
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }} className="text-2xl text-white">
            Hedefim LGS Nedir?
          </h2>
        </div>

        <div className="px-7 py-6 space-y-6 text-left">
          <p className="text-sm leading-relaxed text-slate-600">
            <strong className="text-slate-800">Hedefim LGS</strong>, LGS'ye (Liseye Geçiş Sistemi) hazırlanan öğrenciler ve onların velileri için geliştirilmiş, yapay zeka destekli bir sınav hazırlık platformudur.
          </p>

          <div>
            <h3 className="text-sm font-bold text-purple-700 mb-2">Ne Yapıyor?</h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Sistem, her öğrenci için <strong className="text-slate-800">kişiye özel sorular</strong> üretir — herkese aynı soru gitmez. Matematik, Türkçe, Fen Bilimleri, Sosyal Bilgiler, Din Kültürü ve Ahlak Bilgisi ile İngilizce derslerinde, öğrencinin daha önce yanlış yaptığı veya boş bıraktığı konulara ağırlık vererek AI (Claude) ile günlük sorular oluşturur. Yanlış yapılan her soruda, sadece doğru cevabı değil, <strong className="text-slate-800">adım adım çözümü</strong> de gösterir; zayıf olunan konularda kısa, öğretici bir AI konu özeti sunar.
            </p>
            <p className="text-sm leading-relaxed text-slate-600 mt-3">
              Öğrenci ilerledikçe sistem, konu bazlı zayıflık skorları tutarak sürekli kendini güncelleyen bir öğrenme haritası oluşturur. İki haftada bir gerçek LGS formatında (90 soru, 135 dakika) online deneme sınavı yapılır ve sonuçlar zaman içindeki <strong className="text-slate-800">puan trendini</strong> gösteren bir grafikle karşılaştırılır.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-purple-700 mb-2">Veliye Ne Sunuyor?</h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Ürünün en güçlü farkı, veliyi hiçbir şey takip etmek zorunda bırakmaması: her akşam <strong className="text-slate-800">günlük özet</strong>, her hafta <strong className="text-slate-800">gelişim raporu</strong>, her deneme sınavından önce <strong className="text-slate-800">hatırlatma</strong> maili otomatik olarak gönderilir. Veli, hangi bildirim türünü almak istediğini kendi panelinden seçebilir. Deneme sınavı sonrası yanlış/boş yapılan her soru, çözümüyle birlikte veli panelinden de incelenebilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
