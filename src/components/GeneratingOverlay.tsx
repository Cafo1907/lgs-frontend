import { useEffect, useState } from 'react';

interface Props {
  icon: string;
  title: string;
}

const TIPS = [
  'Senin zayıf olduğun konulara ağırlık veriliyor...',
  'Sorular MEB müfredatına uygun hazırlanıyor...',
  'Zorluk seviyesi geçmiş performansına göre ayarlanıyor...',
  'Neredeyse hazır, biraz daha sabret...',
  'Bilgi kalıcı olur, tekrar unutulmaz derler!',
];

export default function GeneratingOverlay({ icon, title }: Props) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-purple-600 to-purple-800 flex flex-col items-center justify-center px-8 text-center">
      <div className="text-7xl mb-6 animate-bounce">{icon}</div>
      <h2 className="text-white text-xl font-bold mb-2">{title}</h2>
      <p className="text-purple-100 text-sm mb-8">Yapay zeka senin için sorular hazırlıyor</p>

      <div className="flex items-center gap-2 mb-8">
        <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" />
      </div>

      <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3 max-w-xs">
        <p key={tipIndex} className="text-purple-50 text-xs">{TIPS[tipIndex]}</p>
      </div>
    </div>
  );
}
