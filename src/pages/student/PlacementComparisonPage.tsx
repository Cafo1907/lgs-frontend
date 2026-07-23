interface SectionResult { subjectId: number; name: string; icon: string; code: string; net: number }
interface Props {
  examScore: number;
  examSections: SectionResult[];
  manualScore: number | null;
  manualRanking: number | null;
  manualNets: Record<string, number>;
  onDone: () => void;
}

export default function PlacementComparisonPage({ examScore, examSections, manualScore, manualRanking, manualNets, onDone }: Props) {
  const scoreDiff = manualScore !== null ? examScore - manualScore : null;

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-50 pb-10">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 pt-10 pb-8 text-white">
        <div className="flex items-center gap-2 text-purple-200 text-xs mb-4">
          <span className="bg-purple-400 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">✓</span>
          <span className="text-purple-200">Geçmiş</span>
          <span className="mx-1">→</span>
          <span className="bg-purple-400 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">✓</span>
          <span className="text-purple-200">Seviye Sınavı</span>
          <span className="mx-1">→</span>
          <span className="bg-white text-purple-700 rounded-full w-5 h-5 flex items-center justify-center font-bold">3</span>
          <span className="text-white font-semibold">Karşılaştırma</span>
        </div>
        <div className="text-4xl mb-2">🎯</div>
        <h1 className="text-xl font-bold">Seviye Tespiti Tamamlandı</h1>
        <p className="text-purple-100 text-sm mt-1">Sınav sonuçların ve geçmiş bilgilerin karşılaştırması.</p>
      </div>

      <div className="px-4 mt-5 space-y-4">
        {/* Puan karşılaştırma */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-slate-700 mb-3">Puan Karşılaştırması</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <div className="text-xs text-purple-600 font-medium mb-1">Seviye Sınavın</div>
              <div className="text-3xl font-black text-purple-700">{examScore}</div>
            </div>
            <div className={`rounded-xl p-3 text-center ${manualScore ? 'bg-slate-50' : 'bg-slate-50 opacity-50'}`}>
              <div className="text-xs text-slate-500 font-medium mb-1">Geçmiş Sınavın</div>
              <div className="text-3xl font-black text-slate-600">{manualScore ?? '–'}</div>
            </div>
          </div>
          {scoreDiff !== null && (
            <div className={`mt-3 rounded-xl p-3 text-center text-sm font-semibold ${scoreDiff >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {scoreDiff >= 0 ? `+${scoreDiff} puan daha yüksek performans gösterdin 🎉` : `${scoreDiff} puan fark var, çalışmaya devam!`}
            </div>
          )}
          {manualRanking && (
            <div className="mt-2 text-center text-xs text-slate-500">Geçmiş sıralaman: <span className="font-bold">{manualRanking.toLocaleString('tr-TR')}</span></div>
          )}
        </div>

        {/* Ders bazlı net karşılaştırması */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-slate-700 mb-3">Ders Bazlı Net Karşılaştırması</h2>
          <div className="space-y-3">
            {examSections.map(s => {
              const manualNet = manualNets[s.code] ?? null;
              const diff = manualNet !== null ? s.net - manualNet : null;
              return (
                <div key={s.subjectId} className="flex items-center gap-3">
                  <span className="text-xl">{s.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-600 mb-1">{s.name}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-purple-500 transition-all" style={{ width: `${Math.min(100, (s.net / 20) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-purple-700 w-10 text-right">{s.net}</span>
                      {manualNet !== null && (
                        <span className={`text-xs font-semibold w-12 text-right ${diff! >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {diff! >= 0 ? '+' : ''}{diff!.toFixed(2)}
                        </span>
                      )}
                      {manualNet !== null && (
                        <span className="text-xs text-slate-400 w-8">(önceki: {manualNet})</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {Object.keys(manualNets).length === 0 && (
            <p className="text-xs text-slate-400 text-center mt-2">Geçmiş net bilgisi girilmediği için karşılaştırma yapılamıyor.</p>
          )}
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-700">
          <p className="font-semibold mb-1">Sonraki adım 🚀</p>
          <p>Konu bazlı zayıf alanların belirlendi. Artık her ders için kişiselleştirilmiş sorular çözebilirsin.</p>
        </div>

        <button onClick={onDone}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all">
          Ana Sayfaya Git →
        </button>
      </div>
    </div>
  );
}
