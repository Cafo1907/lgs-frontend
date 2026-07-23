import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Explanation from '../components/Explanation';
import Logo from '../components/Logo';
import TrialRequestForm from '../components/TrialRequestForm';
import ContactForm from '../components/ContactForm';
import ChatbotWidget from '../components/ChatbotWidget';
import AboutModal from '../components/AboutModal';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
}

interface DemoQuestion {
  id: number | string;
  subjectName: string;
  subjectIcon: string;
  text: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
  correctAnswer: string;
  explanation: string;
}

const PACKAGES = [
  {
    name: 'Aylık Paket', price: '599₺', period: '/ay',
    features: [
      'Tüm derslerde günlük kişiselleştirilmiş sınavlar',
      'Yanlış/boş sorularda otomatik konu tekrarı',
      '2 haftada bir tam kapsamlı deneme sınavı',
      'Zayıf konu analizi ve veli raporu',
      'Veli paneli ile anlık takip',
    ],
  },
];

// DB'de henüz o dersten açıklamalı soru yoksa gösterilecek sabit yedek sorular.
// Backend'den o ders için gerçek bir soru geldiğinde bu yedek otomatik devre dışı kalır.
const FALLBACK_QUESTIONS: Record<string, DemoQuestion> = {
  'Matematik': {
    id: 'fallback-mat', subjectName: 'Matematik', subjectIcon: '🔢',
    text: 'Bir sayının 3 katının 5 fazlası 26 ise bu sayı kaçtır?',
    optionA: '5', optionB: '6', optionC: '7', optionD: '8', correctAnswer: 'C',
    explanation: '3x + 5 = 26 → 3x = 21 → x = 7. Doğru cevap C şıkkıdır.',
  },
  'Türkçe': {
    id: 'fallback-tur', subjectName: 'Türkçe', subjectIcon: '📖',
    text: '"Kitap okumak, insanın ufkunu genişletir." cümlesinde altı çizili sözcüğün türü nedir? (ufkunu)',
    optionA: 'Fiil', optionB: 'İsim', optionC: 'Sıfat', optionD: 'Zarf', correctAnswer: 'B',
    explanation: '"Ufkunu" sözcüğü bir varlığı/kavramı karşıladığı için isimdir (ad).',
  },
  'Fen Bilimleri': {
    id: 'fallback-fen', subjectName: 'Fen Bilimleri', subjectIcon: '🔬',
    text: 'Aşağıdakilerden hangisi kimyasal bir değişimdir?',
    optionA: 'Suyun donması', optionB: 'Kağıdın yanması', optionC: 'Buzun erimesi', optionD: 'Suyun buharlaşması', correctAnswer: 'B',
    explanation: 'Yanma sonucunda yeni maddeler (kül, gaz) oluşur; bu yüzden kimyasal bir değişimdir. Diğerleri hal değişimidir (fiziksel).',
  },
  'Sosyal Bilgiler': {
    id: 'fallback-sos', subjectName: 'Sosyal Bilgiler', subjectIcon: '🌍',
    text: 'Türkiye Büyük Millet Meclisi hangi tarihte açılmıştır?',
    optionA: '23 Nisan 1920', optionB: '29 Ekim 1923', optionC: '19 Mayıs 1919', optionD: '30 Ağustos 1922', correctAnswer: 'A',
    explanation: 'TBMM, 23 Nisan 1920 tarihinde Ankara\'da açılmıştır. Bu tarih aynı zamanda Ulusal Egemenlik ve Çocuk Bayramı olarak kutlanır.',
  },
  'Din Kültürü ve Ahlak Bilgisi': {
    id: 'fallback-din', subjectName: 'Din Kültürü ve Ahlak Bilgisi', subjectIcon: '☪️',
    text: 'Sadaka ile zekât arasındaki temel fark nedir?',
    optionA: 'Zekât dini bir zorunluluk, sadaka gönüllülük esaslıdır.', optionB: 'Sadaka daha fazla verilir.',
    optionC: 'İkisi tamamen aynıdır.', optionD: 'Zekât nakit, sadaka eşya olarak verilir.', correctAnswer: 'A',
    explanation: 'Zekât, belli şartları taşıyan Müslümanlar için dini bir zorunluluktur (farzdır). Sadaka ise tamamen gönüllülük esasına dayanır, miktarı ve zamanı kişiye bağlıdır.',
  },
  'İngilizce': {
    id: 'fallback-ing', subjectName: 'İngilizce', subjectIcon: '🌐',
    text: 'Choose the correct sentence: "She ___ her homework every day."',
    optionA: 'does', optionB: 'do', optionC: 'doing', optionD: 'done', correctAnswer: 'A',
    explanation: 'Özne "she" (tekil 3. şahıs) olduğu için geniş zamanda fiile "-s/-es" ya da "does" eklenir.',
  },
};

const SUBJECT_ORDER = ['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'Din Kültürü ve Ahlak Bilgisi', 'İngilizce'];

const SUBJECT_COLORS: Record<string, string> = {
  'Matematik': '#EF4444', 'Türkçe': '#3B82F6', 'Fen Bilimleri': '#10B981',
  'Sosyal Bilgiler': '#F59E0B', 'Din Kültürü ve Ahlak Bilgisi': '#8B5CF6', 'İngilizce': '#EC4899',
};

const FAQ_GROUPS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: '👨‍👩‍👧 Veli ve Öğrenci',
    items: [
      { q: 'Sorular gerçekten her seferinde farklı mı, yoksa hazır bir havuzdan mı geliyor?', a: 'Yapay zeka, her sınavda o an gerçek zamanlı olarak yeni sorular üretir — sabit bir soru bankası değildir. Öğrenci aynı soruyu iki kez görmez.' },
      { q: 'Deneme sınavı gerçek LGS formatında mı, kaç soru, ne kadar sürüyor?', a: '90 soru, gerçek LGS formatında, 2 haftada bir açılır. Adil olması için aynı dönemde aynı kurumun (ya da bireysel ailelerin ortak havuzunun) tüm öğrencileri birebir aynı soruları görür.' },
      { q: 'Çocuğumun verileri güvende mi, başka kimse görebiliyor mu?', a: 'Verileriniz KVKK uyumlu şekilde saklanır, üçüncü taraflarla paylaşılmaz. Veli sadece kendi çocuğunun, öğretmen sadece kendi şubesindeki öğrencilerin verisini görür.' },
      { q: 'İnternet kesilirse veya bir sorun çıkarsa ilerleme kaybolur mu?', a: 'Sınav sırasında bir sorun yaşarsanız verileriniz kaybolmaz; destek ekibimizle iletişime geçtiğinizde durumu birlikte çözeriz.' },
      { q: 'Hangi derslerde/konularda soru üretiliyor, MEB müfredatına uygun mu?', a: 'Türkçe, Matematik, Fen Bilimleri, Sosyal Bilgiler, Din Kültürü ve Ahlak Bilgisi, İngilizce — her soru ilgili MEB kazanım koduna bağlı üretilir.' },
      { q: 'Öğrenci hesabını kimler görebilir — veli, öğretmen, kurum neyi görüyor neyi görmüyor?', a: 'Veli çocuğunun ilerlemesini ve raporlarını, bağlıysa öğretmeni kendi şubesindeki öğrencilerin genel durumunu görür. Soru bazlı cevaplar sadece ilgili aile ve öğretmenle sınırlıdır.' },
      { q: 'Ücretsiz deneme var mı, nasıl başlarım?', a: '3 gün, kart bilgisi istenmeden ücretsiz deneyebilirsiniz. Aşağıdaki "3 Gün Ücretsiz Dene" butonundan başvurabilirsiniz.' },
      { q: 'Ödeme nasıl yapılıyor, iptal edersem ne olur?', a: 'Ödeme ve abonelik detayları için bizimle iletişime geçebilirsiniz; istediğiniz zaman aboneliğinizi sonlandırabilirsiniz.' },
    ],
  },
  {
    title: '🏢 Dershane ve Kurumlar',
    items: [
      { q: 'Kendi logomuzu/markamızı kullanabiliyor muyuz?', a: 'Evet. Kurum admin panelinden kendi logonuzu, sloganınızı ve marka renginizi yükleyebilirsiniz — hem panellerde hem gönderilen maillerde kurumunuzun kimliğiyle görünür.' },
      { q: 'Öğretmenlerimiz neyi görebiliyor, neyi göremiyor?', a: 'Öğretmenler kendi şubesindeki öğrencilerin ilerlemesini ve zayıf konularını görür; başka şube/kurum verisine veya hesap yönetimine erişemez.' },
      { q: 'Mevcut sistemimizden nasıl geçiş yaparız — öğrenci/veli bilgilerini biz mi giriyoruz?', a: 'Kurum panelinden tekli ya da CSV ile toplu öğrenci/aile kaydı yapılabilir. Mevcut listenizi iletirseniz kurulumda size yardımcı oluruz.' },
      { q: 'Kaç şube/öğretmen/öğrenci ekleyebiliriz, bir sınır var mı?', a: 'Standart kurumsal pakette sayı sınırı yoktur. Demo sürümünde şube/öğretmen/öğrenci sayısı ve süre önceden birlikte belirlenir.' },
      { q: 'Demo nasıl çalışıyor, demo bitince verilerimiz kaybolur mu?', a: 'Demo süresi ve limitleri sizinle birlikte belirlenir, tamamen ücretsizdir. Süre dolunca sadece erişim kapanır — hiçbir veri silinmez. Tam sürüme geçtiğinizde kaldığınız yerden devam edersiniz.' },
      { q: 'Fiyatlandırma nasıl, öğrenci sayımız değişirse ne olur?', a: 'Kurum büyüklüğünüze göre size özel bir teklif hazırlıyoruz. Öğrenci sayınız değiştikçe planınızı birlikte güncelleriz.' },
    ],
  },
  {
    title: '⚙️ Teknik ve Güven',
    items: [
      { q: 'Yapay zeka soruları hatalı/yanlış üretirse ne olur?', a: 'Öğrenci, sınav sırasında sorunlu bulduğu soruyu tek tıkla "Hatalı Soru Bildir" ile işaretleyebilir; ekibimiz her bildirimi inceler.' },
      { q: 'Hangi cihazlarda çalışıyor?', a: 'Tamamen tarayıcı üzerinden çalışır — telefon, tablet ya da bilgisayardan, ek bir kurulum gerekmeden erişebilirsiniz.' },
    ],
  },
];

function FaqSection() {
  return (
    <div id="sss" className="max-w-2xl mx-auto px-6 mt-10 scroll-mt-6">
      <h2 className="text-lg font-bold text-slate-800 text-center mb-1">❓ Sık Sorulan Sorular</h2>
      <p className="text-sm text-slate-500 text-center mb-6">Aklınıza takılan bir şey varsa önce buraya göz atın.</p>
      <div className="space-y-5">
        {FAQ_GROUPS.map(group => (
          <div key={group.title}>
            <h3 className="text-sm font-bold text-purple-700 mb-2">{group.title}</h3>
            <div className="space-y-2">
              {group.items.map(item => (
                <details key={item.q} className="bg-white rounded-xl shadow-sm border border-slate-100 group">
                  <summary className="list-none cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800 flex justify-between items-center gap-3">
                    {item.q}
                    <span className="text-purple-400 group-open:rotate-45 transition-transform text-lg leading-none shrink-0">+</span>
                  </summary>
                  <p className="px-4 pb-3 text-sm text-slate-600 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactSection() {
  return (
    <div id="iletisim" className="max-w-md mx-auto px-6 mt-10 scroll-mt-6">
      <h2 className="text-lg font-bold text-slate-800 text-center mb-1">✉️ İletişim</h2>
      <p className="text-sm text-slate-500 text-center mb-6">Sorularınız için bize yazın, size dönüş yapalım.</p>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <ContactForm />
      </div>
    </div>
  );
}

const STEPS = [
  { icon: '📝', title: 'Sınavı Çöz', desc: 'Yapay zeka, çocuğunuzun seviyesine uygun günlük sorular hazırlar.' },
  { icon: '🎯', title: 'Zayıf Konuları Gör', desc: 'Yanlış ve boş sorular analiz edilir, eksik konular otomatik belirlenir.' },
  { icon: '📈', title: 'Gelişimi Takip Et', desc: 'Deneme sınavı trendleri ve haftalık raporlarla ilerleme netleşir.' },
];

const FEATURES = [
  { icon: '🎯', title: 'Kişiye Özel Sorular', desc: 'Herkese aynı soru değil, zayıf olduğu konulara göre üretilen sorular.' },
  { icon: '📖', title: 'Yanlışın Nedenini Öğrenir', desc: 'Sadece doğru cevap değil, adım adım çözüm gösterilir.' },
  { icon: '📅', title: 'Her Akşam Otomatik Özet', desc: 'O gün ne çalıştığı her akşam 21:00\'da mailinize gelir.' },
  { icon: '📈', title: 'Haftalık Gelişim Raporu', desc: 'Hangi konuda başarılı, hangisinde eksik — haftalık özetle görün.' },
  { icon: '⏰', title: 'Deneme Sınavı + Trend', desc: '2 haftada bir deneme sınavı, sonuçlar grafikle karşılaştırılır.' },
  { icon: '🧠', title: 'AI Konu Anlatımı', desc: 'Zayıf olduğu konuda kısa, öğretici bir özet — ek kaynağa gerek yok.' },
  { icon: '🎁', title: '3 Gün Ücretsiz Dene', desc: 'Kart bilgisi istemeden gerçek sorularla önce deneyin.' },
  { icon: '✉️', title: 'Bildirim Tercihleri Sizde', desc: 'Hangi maili almak istediğinize siz karar verirsiniz.' },
  { icon: '📚', title: 'MEB Kazanımlarına Uygun', desc: 'Her soru ilgili MEB kazanım koduna bağlı üretilir, konudan sapmaz.' },
  { icon: '🔒', title: 'KVKK Uyumlu, Veri Güvenliği', desc: 'Verileriniz üçüncü taraflarla paylaşılmaz, yalnızca sizin için kullanılır.' },
  { icon: '🚩', title: 'Hatalı Soruyu Bildirin', desc: 'Sınav sırasında sorunlu bulduğu soruyu öğrenciniz tek tıkla bildirebilir.' },
];

// Video dosyası eklendiğinde /public/intro-video.mp4 altına koymak yeterli — otomatik devreye girer.
// Dosya yoksa (404/hata) zarif bir "yakında" kartı gösterir.
function IntroVideo() {
  const [available, setAvailable] = useState(true);

  if (!available) {
    return (
      <div className="bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200 rounded-2xl p-10 text-center">
        <div className="text-4xl mb-2">🎬</div>
        <p className="text-sm font-semibold text-purple-700">Tanıtım videomuz çok yakında burada!</p>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-2xl overflow-hidden shadow-lg">
      <video
        controls
        preload="metadata"
        className="w-full aspect-video"
        src={`${import.meta.env.BASE_URL}intro-video.mp4`}
        onError={(e) => {
          console.error('Video yüklenemedi:', e.currentTarget.error);
          setAvailable(false);
        }}
      />
    </div>
  );
}

function DemoQuestionCard({ q }: { q: DemoQuestion }) {
  const [selected, setSelected] = useState<string | null>(null);
  const options: [string, string][] = [
    ['A', q.optionA], ['B', q.optionB], ['C', q.optionC], ['D', q.optionD],
  ];

  const accent = SUBJECT_COLORS[q.subjectName] ?? '#8B5CF6';

  return (
    <div className="border border-slate-200 rounded-xl p-4 border-l-4" style={{ borderLeftColor: accent }}>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        {q.subjectIcon} {q.subjectName}
      </span>
      <p className="text-sm text-slate-700 mt-1 mb-3">{q.text}</p>
      <div className="grid grid-cols-1 gap-2">
        {options.map(([key, val]) => {
          let cls = 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100';
          if (selected) {
            if (key === q.correctAnswer) cls = 'bg-green-50 border-green-400 text-green-700 font-semibold';
            else if (key === selected) cls = 'bg-red-50 border-red-400 text-red-700 font-semibold';
            else cls = 'bg-slate-50 border-slate-200 text-slate-400';
          }
          return (
            <button
              key={key}
              disabled={!!selected}
              onClick={() => setSelected(key)}
              className={`text-left text-sm rounded-lg px-3 py-2 border transition-colors ${cls}`}
            >
              {key}) {val}
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="mt-3">
          <p className={`text-sm font-semibold mb-2 ${selected === q.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
            {selected === q.correctAnswer ? '✓ Doğru cevap!' : '✗ Yanlış cevap.'}
          </p>
          <div className="bg-purple-50 rounded-lg px-4 py-3 text-sm text-purple-900">
            <p className="text-xs font-semibold text-purple-700 mb-1">Çözüm</p>
            <Explanation text={q.explanation} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandingPage({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoQuestions, setDemoQuestions] = useState<DemoQuestion[] | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    axios.get('/api/demo/questions').then(r => {
      const bySubject = new Map<string, DemoQuestion>(r.data.map((q: DemoQuestion) => [q.subjectName, q]));
      const merged = SUBJECT_ORDER.map(name => bySubject.get(name) ?? FALLBACK_QUESTIONS[name]);
      setDemoQuestions(merged);
    }).catch(() => {
      setDemoQuestions(SUBJECT_ORDER.map(name => FALLBACK_QUESTIONS[name]));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await onLogin(email.trim(), password);
    } catch (err: any) {
      const serverError = err?.response?.data?.error;
      if (serverError === 'subscription_expired') {
        setError('Aboneliğiniz tanımlı değil veya süresi dolmuş. Lütfen yöneticinizle iletişime geçin.');
      } else if (serverError && serverError !== 'E-posta veya şifre hatalı') {
        setError(serverError);
      } else {
        setError('E-posta veya şifre hatalı.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-slate-500 font-medium">E-posta</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="ornek@email.com"
          className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          autoComplete="email"
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 font-medium">Şifre</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          autoComplete="current-password"
        />
      </div>
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
      <button
        type="submit"
        disabled={!email || !password || loading}
        className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-purple-700 active:scale-95 transition-all"
      >
        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-b from-purple-600 to-purple-800 px-6 pt-5 pb-6 text-center relative">
        {/* Dekoratif sınav objeleri (hero dışına taşmasınlar diye ayrı, kırpılan bir katmanda) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <span className="hidden sm:block absolute text-4xl opacity-20 select-none" style={{ top: '14%', left: '6%', transform: 'rotate(-18deg)' }}>✏️</span>
          <span className="hidden sm:block absolute text-4xl opacity-20 select-none" style={{ top: '55%', left: '10%', transform: 'rotate(12deg)' }}>📐</span>
          <span className="hidden sm:block absolute text-4xl opacity-20 select-none" style={{ top: '20%', right: '8%', transform: 'rotate(15deg)' }}>🧮</span>
          <span className="hidden sm:block absolute text-4xl opacity-20 select-none" style={{ top: '58%', right: '6%', transform: 'rotate(-10deg)' }}>🎓</span>
          <span className="hidden sm:block absolute text-3xl opacity-15 select-none" style={{ top: '4%', left: '38%', transform: 'rotate(-6deg)' }}>📏</span>
          <span className="hidden sm:block absolute text-3xl opacity-15 select-none" style={{ bottom: '6%', left: '30%', transform: 'rotate(8deg)' }}>✅</span>
        </div>

        <div className="max-w-2xl mx-auto flex flex-wrap justify-end items-center gap-2 mb-2 relative">
          <button
            onClick={() => setAboutOpen(true)}
            className="bg-white/10 border border-white/25 text-white text-sm font-semibold rounded-xl px-4 py-2 hover:bg-white/20 transition-colors"
          >
            Hedefim LGS Nedir?
          </button>
          <a
            href="#sss"
            className="bg-white/10 border border-white/25 text-white text-sm font-semibold rounded-xl px-4 py-2 hover:bg-white/20 transition-colors"
          >
            SSS
          </a>
          <a
            href="#iletisim"
            className="bg-white/10 border border-white/25 text-white text-sm font-semibold rounded-xl px-4 py-2 hover:bg-white/20 transition-colors"
          >
            İletişim
          </a>
          <details className="relative">
            <summary className="list-none cursor-pointer bg-white/15 border border-white/30 text-white text-sm font-semibold rounded-xl px-4 py-2 hover:bg-white/25 transition-colors">
              Giriş Yap
            </summary>
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl p-5 text-left z-20">
              {loginForm}
            </div>
          </details>
        </div>

        <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

        <div className="relative">
          <h1 className="flex justify-center mb-1 text-white">
            <Logo size={72} textColor="#FFFFFF" />
          </h1>
          <p className="text-purple-100 text-sm mt-3 max-w-md mx-auto">
            Yapay zeka destekli, çocuğunuzun zayıf konularına göre kişiselleştirilmiş LGS sınav hazırlık sistemi.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {SUBJECT_ORDER.map(name => (
              <span key={name} className="text-xs bg-white/10 text-purple-50 rounded-full px-3 py-1 border border-white/20">
                {FALLBACK_QUESTIONS[name]?.subjectIcon} {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tanıtım Videosu */}
      <div className="max-w-2xl mx-auto px-6 mt-8">
        <IntroVideo />
      </div>

      {/* Özellikler */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        <h2 className="text-lg font-bold text-slate-800 text-center mb-4">✨ Neden Hedefim LGS?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="text-sm font-bold text-slate-800">{f.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nasıl Çalışır */}
      <div className="max-w-2xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center relative">
              <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <div className="text-3xl mb-2">{s.icon}</div>
              <h3 className="text-sm font-bold text-slate-800">{s.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Sorular */}
      <div className="max-w-2xl mx-auto px-6 mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1">🧪 Örnek Sorularımızı Çözün</h2>
          <p className="text-sm text-slate-500 mb-4">Bir cevap seçin, doğru mu yanlış mı olduğunu ve çözümünü hemen görün.</p>
          {demoQuestions === null ? (
            <p className="text-sm text-slate-400 text-center py-6">Sorular yükleniyor...</p>
          ) : (
            <div className="space-y-3">
              {demoQuestions.map(q => <DemoQuestionCard key={q.id} q={q} />)}
            </div>
          )}
        </div>
      </div>

      {/* Fiyatlandırma */}
      <div className="max-w-2xl mx-auto px-6 mt-10 pb-14">
        <h2 className="text-lg font-bold text-slate-800 text-center mb-1">💳 Fiyatlandırma</h2>
        <p className="text-sm text-slate-500 text-center mb-6">Tek paket, sınırsız kullanım.</p>
        <div className="flex justify-center">
          {PACKAGES.map((pkg) => (
            <div key={pkg.name} className="relative bg-white rounded-2xl shadow-lg border-2 border-purple-500 p-6 max-w-sm w-full text-center">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-semibold rounded-full px-3 py-1 shadow">
                🏆 En Popüler
              </span>
              <div className="text-4xl mt-2">🎓</div>
              <h3 className="font-bold text-slate-800 mt-1">{pkg.name}</h3>
              <p className="mt-2">
                <span className="text-3xl font-extrabold text-purple-700">{pkg.price}</span>
                <span className="text-slate-400 text-sm">{pkg.period}</span>
              </p>
              <ul className="mt-4 space-y-2 text-left">
                {pkg.features.map((f) => (
                  <li key={f} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
              <details className="mt-5">
                <summary className="list-none cursor-pointer block bg-purple-600 text-white font-semibold rounded-xl py-2.5 hover:bg-purple-700 active:scale-95 transition-all text-center">
                  🎁 3 Gün Ücretsiz Dene
                </summary>
                <div className="mt-4 text-left bg-slate-50 rounded-xl p-4">
                  <TrialRequestForm />
                </div>
              </details>
            </div>
          ))}
        </div>

        <FaqSection />

        <ContactSection />

        <div className="flex justify-center gap-4 mt-6">
          <Link to="/kullanim-sartlari" className="text-xs text-slate-400 hover:text-purple-600 underline">Kullanım Şartları</Link>
          <Link to="/gizlilik-politikasi" className="text-xs text-slate-400 hover:text-purple-600 underline">Gizlilik Politikası</Link>
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">
          © {new Date().getFullYear()} Hedefim LGS — çocuğunuzun başarısı için buradayız.
        </p>
        <p className="text-center text-xs text-slate-400 mt-2">
          Bir dershane veya eğitim kurumu musunuz?{' '}
          <a href="/sunum.html" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:text-purple-700 underline">
            Kurumsal sunumu inceleyin
          </a>
        </p>
      </div>

      <ChatbotWidget />
    </div>
  );
}
