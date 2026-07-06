import { useNavigate } from 'react-router-dom';

export default function PlacementDonePage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-slate-50">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-xs w-full">
        <div className="text-6xl mb-4">📊</div>
        <h1 className="font-black text-slate-800 text-2xl mb-2">Seviye Tespiti Tamamlandı!</h1>
        <p className="text-slate-500 text-sm mb-4">
          Kişisel çalışma planın oluşturuldu. Artık sana özel sorularla çalışmaya başlayabilirsin.
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-5">
          <p className="text-xs text-purple-700 font-medium">
            📧 Sonuçlar velinin e-postasına gönderildi.
          </p>
          <p className="text-xs text-purple-500 mt-1">
            Veli detaylı raporu panel üzerinden de görebilir.
          </p>
        </div>
        <button onClick={() => navigate('/')} className="w-full bg-purple-500 text-white font-bold py-3 rounded-xl hover:bg-purple-600 active:scale-95 transition-all">
          Çalışmaya Başla →
        </button>
      </div>
    </div>
  );
}
