interface Props { onSelect: (mode: 'exam' | 'score' | 'nets') => void }

const OPTIONS: { mode: 'exam' | 'score' | 'nets'; icon: string; title: string; desc: string; recommended?: boolean }[] = [
  {
    mode: 'exam',
    icon: '📝',
    title: 'Deneme sınavı yapacağım',
    desc: 'Sana özel bir seviye tespit sınavı çözersin, sonucuna göre seviyeni belirleriz.',
    recommended: true,
  },
  {
    mode: 'score',
    icon: '✍️',
    title: 'Son deneme sınavı sonucumu kendim gireceğim',
    desc: 'Daha önce yaptığın bir deneme sınavının puanını ve sıralamasını gir.',
  },
  {
    mode: 'nets',
    icon: '🧮',
    title: 'Ders ders net sayımı gireceğim, tahmini puanımı sen hesapla',
    desc: 'Derslere göre net sayılarını gir, tahmini puanını biz hesaplayalım.',
  },
];

export default function PlacementChoicePage({ onSelect }: Props) {
  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-50 pb-10">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 pt-12 pb-8 text-white">
        <div className="text-4xl mb-3">👋</div>
        <h1 className="text-xl font-bold">Hoş geldin! Önce seviyeni belirleyelim</h1>
        <p className="text-purple-100 text-sm mt-1">Aşağıdaki üç yoldan birini seç, hemen başlayalım.</p>
      </div>

      <div className="px-4 mt-5 space-y-3">
        {OPTIONS.map(o => (
          <button
            key={o.mode}
            onClick={() => onSelect(o.mode)}
            className={`w-full text-left bg-white rounded-2xl p-4 flex items-start gap-3 transition-all ${
              o.recommended
                ? 'shadow-md ring-2 ring-purple-400 hover:ring-purple-500'
                : 'shadow-sm hover:shadow-md hover:ring-2 hover:ring-purple-300'
            }`}
          >
            <span className="text-3xl">{o.icon}</span>
            <div className="flex-1">
              {o.recommended && (
                <span className="inline-block bg-purple-600 text-white text-[10px] font-bold tracking-wide uppercase rounded-full px-2 py-0.5 mb-1.5">
                  ⭐ HedefimLGS Önerisi
                </span>
              )}
              <div className="font-semibold text-slate-700">{o.title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{o.desc}</div>
            </div>
            <span className="text-slate-300 text-xl self-center">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
