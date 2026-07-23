import { useState, useEffect } from 'react';
import axios from 'axios';

interface User { id: number; name: string; email: string; role: string; isFirstLogin: boolean }
interface Family { id: number; name: string; isActive: boolean; usdToTry: number; margin: number; subscriptionExpiresAt: string | null; createdAt: string; users: User[]; targetSchool: any; branch: { id: number; name: string } | null }
interface TokenFamily { familyId: number; familyName: string; realCostUsd: number; displayCostTry: number; usages: any[] }
interface BranchSummary { id: number; name: string; createdAt: string; familyCount: number; studentCount: number; avgNet: number | null }
interface InstitutionRow {
  id: number; name: string; createdAt: string; branchCount: number; familyCount: number; teacherCount: number;
  admins: { id: number; name: string; email: string; createdAt: string }[];
  isDemo: boolean; demoExpiresAt: string | null;
  maxAdmins: number | null; maxTeachers: number | null; maxBranches: number | null; maxStudents: number | null;
}

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('superAdminToken') || ''}` });

export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<'overview' | 'families' | 'create' | 'tokens' | 'engagement' | 'settings' | 'institutions' | 'chatbot'>('overview');
  const [chatbotLogs, setChatbotLogs] = useState<Array<{ id: number; sessionId: string; question: string; matched: boolean; matchedFaqQ: string | null; createdAt: string }>>([]);
  const [chatbotLeads, setChatbotLeads] = useState<Array<{ id: number; sessionId: string; name: string; contact: string; lastQuestion: string | null; createdAt: string }>>([]);
  const loadChatbotLogs = async () => {
    const [logsRes, leadsRes] = await Promise.all([
      axios.get('/api/admin/chatbot-logs', { headers: headers() }),
      axios.get('/api/admin/chatbot-leads', { headers: headers() }),
    ]);
    setChatbotLogs(logsRes.data);
    setChatbotLeads(leadsRes.data);
  };
  const [families, setFamilies] = useState<Family[]>([]);
  const [tokenReport, setTokenReport] = useState<{ totalRealUsd: number; totalDisplayTry: number; families: TokenFamily[] } | null>(null);
  const [engagement, setEngagement] = useState<{
    totalViews: number; newGenerations: number;
    byType: { question_explanation: number; topic_explanation: number };
    topTopics: { topicId: number; count: number; topicName: string; subjectName: string }[];
    recent: { type: string; subjectName: string | null; cacheHit: boolean; studentName: string; createdAt: string }[];
  } | null>(null);
  const [overview, setOverview] = useState<{
    totalStudents: number; totalFamilies: number; activeStudents: number; engagementRate: number; avgNet: number | null;
    fallingBehind: Array<{ studentId: number; studentName: string; familyName: string; familyActive: boolean; branchName: string | null; daysInactive: number; avgWeakness: number | null; latestMockNet: number | null }>;
    byBranch: Array<{ branchName: string; studentCount: number; avgNet: number | null; engagementRate: number }>;
  } | null>(null);
  const [questionReports, setQuestionReports] = useState<Array<{ id: number; questionType: string; questionText: string; reason: string | null; studentName: string; createdAt: string }>>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);

  // Kurumlar (çoklu dershane)
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
  const [newInstitution, setNewInstitution] = useState({ institutionName: '', adminName: '', adminEmail: '' });
  const [newInstitutionGenerated, setNewInstitutionGenerated] = useState<string | null>(null);
  // Standart demo paketi: 1 admin, 2 şube, 3 öğretmen, 20 öğrenci, 14 gün.
  const defaultDemoExpiry = () => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().slice(0, 10); };
  const defaultDemoForm = () => ({ isDemo: false, demoExpiresAt: defaultDemoExpiry(), maxAdmins: '1', maxTeachers: '3', maxBranches: '2', maxStudents: '20' });
  const [demoForm, setDemoForm] = useState(defaultDemoForm());

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [expandedFamilies, setExpandedFamilies] = useState<Set<number>>(new Set());
  const [pricingEdit, setPricingEdit] = useState<{ familyId: number; usdToTry: string; margin: string } | null>(null);
  const [subEdit, setSubEdit] = useState<{ familyId: number; date: string } | null>(null);
  const [iban, setIban] = useState('');
  const [ibanSaved, setIbanSaved] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState('');

  // Yeni aile formu
  const [form, setForm] = useState({ familyName: '', branchName: '', subscriptionMonths: '', studentName: '', studentEmail: '', studentPassword: '', parentName: '', parentEmail: '', parentPassword: '' });

  // Şifre/email düzenleme
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editType, setEditType] = useState<'password' | 'email' | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => { loadOverview(); }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/overview', { headers: headers() });
      setOverview(data);
    } finally { setLoading(false); }
  };

  const loadBranches = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/branches', { headers: headers() });
      setBranches(data.branches);
    } finally { setLoading(false); }
  };

  const loadInstitutions = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/institutions', { headers: headers() });
      setInstitutions(data);
    } finally { setLoading(false); }
  };

  const createInstitution = async () => {
    if (!newInstitution.institutionName.trim() || !newInstitution.adminName.trim() || !newInstitution.adminEmail.trim()) {
      setMsg('❌ Kurum adı, admin adı ve e-posta gerekli'); return;
    }
    if (demoForm.isDemo && !demoForm.demoExpiresAt) {
      setMsg('❌ Demo kurum için bitiş tarihi gerekli'); return;
    }
    setNewInstitutionGenerated(null);
    try {
      const { data } = await axios.post('/api/admin/institutions', {
        ...newInstitution,
        isDemo: demoForm.isDemo,
        demoExpiresAt: demoForm.isDemo ? demoForm.demoExpiresAt : undefined,
        maxAdmins: demoForm.maxAdmins ? parseInt(demoForm.maxAdmins) : undefined,
        maxTeachers: demoForm.maxTeachers ? parseInt(demoForm.maxTeachers) : undefined,
        maxBranches: demoForm.maxBranches ? parseInt(demoForm.maxBranches) : undefined,
        maxStudents: demoForm.maxStudents ? parseInt(demoForm.maxStudents) : undefined,
      }, { headers: headers() });
      setMsg('✅ Kurum oluşturuldu');
      if (data.generatedPassword) setNewInstitutionGenerated(data.generatedPassword);
      setNewInstitution({ institutionName: '', adminName: '', adminEmail: '' });
      setDemoForm(defaultDemoForm());
      loadInstitutions();
    } catch (e: any) {
      setMsg('❌ Hata: ' + (e.response?.data?.error || e.message));
    }
  };

  const [editingDemoId, setEditingDemoId] = useState<number | null>(null);
  const [demoEditForm, setDemoEditForm] = useState({ demoExpiresAt: '', maxAdmins: '', maxTeachers: '', maxBranches: '', maxStudents: '' });

  const openDemoEditor = (inst: InstitutionRow) => {
    setEditingDemoId(inst.id);
    setDemoEditForm({
      demoExpiresAt: inst.demoExpiresAt ? inst.demoExpiresAt.slice(0, 10) : '',
      maxAdmins: inst.maxAdmins != null ? String(inst.maxAdmins) : '',
      maxTeachers: inst.maxTeachers != null ? String(inst.maxTeachers) : '',
      maxBranches: inst.maxBranches != null ? String(inst.maxBranches) : '',
      maxStudents: inst.maxStudents != null ? String(inst.maxStudents) : '',
    });
  };

  const saveDemoEdit = async () => {
    if (!editingDemoId) return;
    try {
      await axios.put(`/api/admin/institutions/${editingDemoId}/demo`, {
        demoExpiresAt: demoEditForm.demoExpiresAt || null,
        maxAdmins: demoEditForm.maxAdmins ? parseInt(demoEditForm.maxAdmins) : null,
        maxTeachers: demoEditForm.maxTeachers ? parseInt(demoEditForm.maxTeachers) : null,
        maxBranches: demoEditForm.maxBranches ? parseInt(demoEditForm.maxBranches) : null,
        maxStudents: demoEditForm.maxStudents ? parseInt(demoEditForm.maxStudents) : null,
      }, { headers: headers() });
      setMsg('✅ Demo ayarları güncellendi');
      setEditingDemoId(null);
      loadInstitutions();
    } catch (e: any) { setMsg('❌ ' + (e.response?.data?.error || 'Hata')); }
  };

  const convertToFull = async (inst: InstitutionRow) => {
    if (!confirm(`${inst.name} kurumunu demo'dan tam sürüme çevirmek istediğine emin misin? Tüm limitler kalkacak.`)) return;
    try {
      await axios.put(`/api/admin/institutions/${inst.id}/demo`, { isDemo: false, demoExpiresAt: null, maxAdmins: null, maxTeachers: null, maxBranches: null, maxStudents: null }, { headers: headers() });
      setMsg('✅ Kurum tam sürüme çevrildi');
      loadInstitutions();
    } catch (e: any) { setMsg('❌ ' + (e.response?.data?.error || 'Hata')); }
  };

  const deleteInstitution = async (inst: InstitutionRow) => {
    try {
      const { data: summary } = await axios.get(`/api/admin/institutions/${inst.id}/delete-summary`, { headers: headers() });
      const lines = [
        `"${inst.name}" kurumunu ve aşağıdakileri KALICI OLARAK sileceksin:`,
        '',
        `• ${summary.branchCount} şube`,
        `• ${summary.teacherCount} öğretmen`,
        `• ${summary.familyCount} aile`,
        `• ${summary.studentCount} öğrenci`,
        `• ${summary.parentCount} veli`,
        `• ${summary.adminCount} kurum admin hesabı`,
        '',
        'Tüm sınav geçmişi, raporlar ve mail tercihleri dahil her şey silinir. Bu işlem GERİ ALINAMAZ.',
        '',
        'Devam etmek istiyor musun?',
      ];
      if (!confirm(lines.join('\n'))) return;
      await axios.delete(`/api/admin/institutions/${inst.id}`, { headers: headers() });
      setMsg('✅ Kurum ve bağlı tüm veriler silindi');
      loadInstitutions();
    } catch (e: any) { setMsg('❌ ' + (e.response?.data?.error || 'Hata')); }
  };

  const resetInstitutionAdminPassword = async (institutionId: number, adminUserId: number) => {
    const pw = prompt('Yeni şifre girin:');
    if (!pw) return;
    try {
      await axios.post(`/api/admin/institutions/${institutionId}/admins/${adminUserId}/reset-password`, { newPassword: pw }, { headers: headers() });
      setMsg('✅ Şifre sıfırlandı');
    } catch { setMsg('❌ Hata'); }
  };

  const assignBranch = async (familyId: number, branchId: number | null) => {
    try {
      await axios.post(`/api/admin/assign-branch/${familyId}`, { branchId }, { headers: headers() });
      setMsg('✅ Şube ataması güncellendi');
      loadFamilies();
    } catch { setMsg('❌ Hata'); }
  };

  const loadFamilies = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/families', { headers: headers() });
      setFamilies(data);
    } finally { setLoading(false); }
  };

  const loadTokens = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/token-report', { headers: headers() });
      setTokenReport(data);
    } finally { setLoading(false); }
  };

  const loadEngagement = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/engagement-stats', { headers: headers() });
      setEngagement(data);
      const { data: reports } = await axios.get('/api/admin/question-reports', { headers: headers() });
      setQuestionReports(reports);
    } finally { setLoading(false); }
  };

  const createFamily = async () => {
    setMsg('');
    try {
      const { data } = await axios.post('/api/admin/create-family', form, { headers: headers() });
      const gen = data.generatedPasswords || {};
      const genLines = [
        gen.studentPassword && `Öğrenci şifresi: ${gen.studentPassword}`,
        gen.parentPassword && `Veli şifresi: ${gen.parentPassword}`,
        gen.parent2Password && `2. veli şifresi: ${gen.parent2Password}`,
      ].filter(Boolean);
      setMsg(genLines.length ? `✅ Aile oluşturuldu! Otomatik üretilen şifreler — ${genLines.join(' · ')}` : '✅ Aile oluşturuldu!');
      setForm({ familyName: '', branchName: '', subscriptionMonths: '', studentName: '', studentEmail: '', studentPassword: '', parentName: '', parentEmail: '', parentPassword: '' });
      loadFamilies();
    } catch (e: any) {
      setMsg('❌ Hata: ' + (e.response?.data?.error || e.message));
    }
  };

  const saveEdit = async () => {
    if (!editUserId || !editType) return;
    try {
      if (editType === 'password') {
        await axios.post('/api/admin/reset-password', { userId: editUserId, newPassword: editValue }, { headers: headers() });
      } else {
        await axios.post('/api/admin/update-email', { userId: editUserId, newEmail: editValue }, { headers: headers() });
      }
      setMsg('✅ Güncellendi');
      setEditUserId(null); setEditType(null); setEditValue('');
      loadFamilies();
    } catch (e: any) {
      setMsg('❌ Hata: ' + (e.response?.data?.error || e.message));
    }
  };

  const savePricing = async () => {
    if (!pricingEdit) return;
    try {
      await axios.post(`/api/admin/update-pricing/${pricingEdit.familyId}`, {
        usdToTry: parseFloat(pricingEdit.usdToTry),
        margin: parseFloat(pricingEdit.margin),
      }, { headers: headers() });
      setMsg('✅ Fiyatlandırma güncellendi');
      setPricingEdit(null);
      loadFamilies();
    } catch { setMsg('❌ Hata'); }
  };

  const toggleFamily = async (familyId: number) => {
    try {
      await axios.post(`/api/admin/toggle-family/${familyId}`, {}, { headers: headers() });
      setMsg('✅ Güncellendi');
      loadFamilies();
    } catch { setMsg('❌ Hata'); }
  };

  const saveSubscription = async () => {
    if (!subEdit) return;
    try {
      await axios.post(`/api/admin/update-subscription/${subEdit.familyId}`, { subscriptionExpiresAt: subEdit.date || null }, { headers: headers() });
      setMsg('✅ Abonelik tarihi güncellendi');
      setSubEdit(null);
      loadFamilies();
    } catch { setMsg('❌ Hata'); }
  };

  const resetFirstLogin = async (userId: number) => {
    try {
      await axios.post(`/api/admin/reset-first-login/${userId}`, {}, { headers: headers() });
      setMsg('✅ isFirstLogin sıfırlandı');
      loadFamilies();
    } catch { setMsg('❌ Hata'); }
  };

  const TABS = [{ key: 'overview', label: '🧭 Genel Bakış' }, { key: 'institutions', label: '🏢 Kurumlar' }, { key: 'families', label: '👨‍👩‍👧 Aileler' }, { key: 'create', label: '➕ Yeni Aile' }, { key: 'tokens', label: '💰 Token Raporu' }, { key: 'engagement', label: '📊 Kullanım' }, { key: 'chatbot', label: '💬 Chatbot' }, { key: 'settings', label: '⚙️ Ayarlar' }] as const;

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-50 pb-10">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 pt-10 pb-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-3xl mb-2">🔧</div>
            <h1 className="text-xl font-bold">Admin Paneli</h1>
            <p className="text-slate-400 text-sm mt-1">LGS Platform Yönetimi</p>
          </div>
          <button onClick={onLogout} className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all">Çıkış →</button>
        </div>
      </div>

      <div className="bg-white border-b sticky top-0 z-40">
        <div className="flex gap-1 px-3 py-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => {
              setTab(t.key); setMsg('');
              if (t.key === 'overview') loadOverview();
              if (t.key === 'institutions') loadInstitutions();
              if (t.key === 'families') { loadFamilies(); loadBranches(); }
              if (t.key === 'create') loadBranches();
              if (t.key === 'tokens') loadTokens();
              if (t.key === 'engagement') loadEngagement();
              if (t.key === 'settings') axios.get('/api/admin/settings', { headers: headers() }).then(r => { setIban(r.data.iban || ''); setIbanSaved(false); }).catch(() => {});
              if (t.key === 'chatbot') loadChatbotLogs();
            }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t.key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {msg && <div className="mx-4 mt-3 px-4 py-2 bg-white rounded-xl text-sm text-center shadow-sm">{msg}</div>}

      <div className="px-4 mt-4">
        {/* GENEL BAKIŞ */}
        {tab === 'overview' && (
          loading ? <div className="text-center py-8 text-slate-400">Yükleniyor...</div> : overview && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                  <div className="text-2xl font-black text-slate-800">{overview.totalStudents}</div>
                  <div className="text-xs text-slate-500 mt-1">Toplam Öğrenci</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                  <div className="text-2xl font-black text-slate-800">{overview.totalFamilies}</div>
                  <div className="text-xs text-slate-500 mt-1">Toplam Aile</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                  <div className={`text-2xl font-black ${overview.engagementRate >= 50 ? 'text-green-700' : overview.engagementRate >= 25 ? 'text-orange-600' : 'text-red-600'}`}>%{overview.engagementRate}</div>
                  <div className="text-xs text-slate-500 mt-1">7 Günlük Aktiflik</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                  <div className="text-2xl font-black text-purple-700">{overview.avgNet !== null ? overview.avgNet : '—'}</div>
                  <div className="text-xs text-slate-500 mt-1">Ortalama Son Deneme Neti</div>
                </div>
              </div>

              {overview.byBranch.length > 1 && (
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <h3 className="font-semibold text-slate-700 text-sm mb-2">🏢 Şube Bazlı Özet</h3>
                  <div className="space-y-1.5">
                    {overview.byBranch.map(b => (
                      <div key={b.branchName} className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2">
                        <div className="text-xs font-bold text-slate-700">{b.branchName}</div>
                        <div className="text-xs text-slate-500 flex gap-3">
                          <span>{b.studentCount} öğrenci</span>
                          <span>Net: {b.avgNet ?? '—'}</span>
                          <span>Aktiflik: %{b.engagementRate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-slate-700 text-sm mb-1">⚠️ Geride Kalan Öğrenciler</h3>
                <p className="text-xs text-slate-400 mb-3">14+ gündür pasif olan veya zayıflık skoru yüksek öğrenciler</p>
                {overview.fallingBehind.length === 0 ? (
                  <div className="text-center text-slate-400 py-4 text-sm">Şu an geride kalan öğrenci yok 🎉</div>
                ) : (
                  <div className="space-y-1.5 max-h-96 overflow-y-auto">
                    {overview.fallingBehind.map(s => (
                      <div key={s.studentId} className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2">
                        <div>
                          <div className="text-xs font-bold text-slate-700">{s.studentName}</div>
                          <div className="text-xs text-slate-400">{s.familyName}{!s.familyActive && ' · pasif'}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-semibold ${s.daysInactive >= 14 ? 'text-red-600' : 'text-orange-600'}`}>
                            {s.daysInactive >= 9999 ? 'Hiç aktivite yok' : `${s.daysInactive} gün pasif`}
                          </div>
                          {s.avgWeakness !== null && <div className="text-xs text-slate-400">Zayıflık: {Math.round(s.avgWeakness)}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* AİLELER */}
        {tab === 'families' && (
          <div className="space-y-3">
            {loading ? <div className="text-center py-8 text-slate-400">Yükleniyor...</div> : families.map(f => (
              <div key={f.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-bold text-slate-800">{f.name}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${f.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {f.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                      {f.branch && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700">🏢 {f.branch.name}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{new Date(f.createdAt).toLocaleDateString('tr-TR')}</div>
                  </div>
                  <button onClick={() => toggleFamily(f.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold ${f.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                    {f.isActive ? 'Pasife Al' : 'Aktife Al'}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mb-2">
                  <div className="text-xs text-slate-500">
                    💱 Kur: <span className="font-semibold text-slate-700">{f.usdToTry}₺/$</span>
                    <span className="mx-2">·</span>
                    📊 Marj: <span className="font-semibold text-slate-700">%{Math.round((f.margin - 1) * 100)}</span>
                  </div>
                  <button onClick={() => setPricingEdit({ familyId: f.id, usdToTry: String(f.usdToTry), margin: String(f.margin) })}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-medium">Düzenle</button>
                </div>
                {/* Abonelik tarihi */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mb-2">
                  <div className="text-xs text-slate-500">
                    🗓️ Abonelik:{' '}
                    {f.subscriptionExpiresAt ? (
                      <span className={`font-semibold ${new Date() > new Date(f.subscriptionExpiresAt) ? 'text-red-600' : Math.ceil((new Date(f.subscriptionExpiresAt).getTime() - Date.now()) / 86400000) <= 7 ? 'text-orange-600' : 'text-green-700'}`}>
                        {new Date(f.subscriptionExpiresAt).toLocaleDateString('tr-TR')}
                        {' '}({Math.ceil((new Date(f.subscriptionExpiresAt).getTime() - Date.now()) / 86400000)} gün)
                      </span>
                    ) : <span className="text-slate-400">Tanımlı değil</span>}
                  </div>
                  <button onClick={() => setSubEdit({ familyId: f.id, date: f.subscriptionExpiresAt ? f.subscriptionExpiresAt.slice(0, 10) : '' })}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-medium">Güncelle</button>
                </div>
                {/* Şube ataması */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mb-2">
                  <div className="text-xs text-slate-500">🏢 Şube:</div>
                  <select value={f.branch?.id ?? ''} onChange={e => assignBranch(f.id, e.target.value ? parseInt(e.target.value) : null)}
                    onFocus={() => { if (branches.length === 0) loadBranches(); }}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-700">
                    <option value="">Şubesiz</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  {f.users.map(u => (
                    <div key={u.id} className="bg-slate-50 rounded-xl p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-slate-700">{u.name}</span>
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${u.role === 'STUDENT' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{u.role}</span>
                          {u.isFirstLogin && <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">İlk giriş</span>}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <button onClick={() => { setEditUserId(u.id); setEditType('password'); setEditValue(''); setMsg(''); }}
                          className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg font-medium">Şifre Sıfırla</button>
                        <button onClick={() => { setEditUserId(u.id); setEditType('email'); setEditValue(u.email); setMsg(''); }}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">Email Güncelle</button>
                        {u.role === 'STUDENT' && u.isFirstLogin === false && (
                          <button onClick={() => resetFirstLogin(u.id)}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-medium">Sınavı Sıfırla</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DÜZENLEME MODALI */}
        {editUserId && editType && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
              <h3 className="font-bold text-slate-800 mb-3">{editType === 'password' ? 'Yeni Şifre' : 'Yeni Email'}</h3>
              <input type={editType === 'password' ? 'password' : 'email'} value={editValue}
                onChange={e => setEditValue(e.target.value)} placeholder={editType === 'password' ? 'Yeni şifre...' : 'Yeni email...'}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-slate-400" />
              <div className="flex gap-2">
                <button onClick={() => { setEditUserId(null); setEditType(null); }} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold">İptal</button>
                <button onClick={saveEdit} className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold">Kaydet</button>
              </div>
            </div>
          </div>
        )}

        {/* ABONELİK MODALİ */}
        {subEdit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
              <h3 className="font-bold text-slate-800 mb-1">Abonelik Bitiş Tarihi</h3>
              <p className="text-xs text-slate-400 mb-4">Havale alındıktan sonra tarihi 1 ay ileri alın.</p>
              <input type="date" value={subEdit.date} onChange={e => setSubEdit(s => s ? { ...s, date: e.target.value } : s)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400" />
              <p className="text-xs text-slate-400 mb-3">Tarihi silerek "Tanımlı değil" yapabilirsiniz (sınırsız erişim).</p>
              <div className="flex gap-2">
                <button onClick={() => setSubEdit(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold">İptal</button>
                <button onClick={saveSubscription} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold">Kaydet</button>
              </div>
            </div>
          </div>
        )}

        {/* FİYATLANDIRMA MODALİ */}
        {pricingEdit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
              <h3 className="font-bold text-slate-800 mb-4">Fiyatlandırma Ayarları</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Dolar Kuru (₺/$)</label>
                  <input type="number" step="0.01" value={pricingEdit.usdToTry}
                    onChange={e => setPricingEdit(p => p ? { ...p, usdToTry: e.target.value } : p)}
                    className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Kar Marjı (1.25 = %25)</label>
                  <input type="number" step="0.01" value={pricingEdit.margin}
                    onChange={e => setPricingEdit(p => p ? { ...p, margin: e.target.value } : p)}
                    className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  <p className="text-xs text-slate-400 mt-1">%{Math.round((parseFloat(pricingEdit.margin || '1') - 1) * 100)} kar marjı</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setPricingEdit(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold">İptal</button>
                <button onClick={savePricing} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold">Kaydet</button>
              </div>
            </div>
          </div>
        )}

        {/* YENİ AİLE */}
        {tab === 'create' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <h2 className="font-semibold text-slate-700">Aile Bilgileri</h2>
              <input value={form.familyName} onChange={e => setForm(f => ({ ...f, familyName: e.target.value }))} placeholder="Aile adı (Örn: Yılmaz Ailesi)"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              <input value={form.branchName} onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))} placeholder="Şube (opsiyonel, Örn: Kadıköy Şubesi)"
                list="branch-suggestions"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              <datalist id="branch-suggestions">
                {branches.map(b => <option key={b.id} value={b.name} />)}
              </datalist>
              <input value={form.subscriptionMonths} onChange={e => setForm(f => ({ ...f, subscriptionMonths: e.target.value }))}
                type="number" min="1" placeholder="Abonelik süresi, ay (boş bırakılırsa 3 günlük deneme)"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <h2 className="font-semibold text-slate-700">Öğrenci</h2>
              {['studentName', 'studentEmail', 'studentPassword'].map(k => (
                <input key={k} value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  type={k.includes('Password') ? 'password' : k.includes('Email') ? 'email' : 'text'}
                  placeholder={k === 'studentName' ? 'Ad Soyad' : k === 'studentEmail' ? 'E-posta' : 'Şifre (boş bırakılırsa otomatik üretilir)'}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              ))}
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <h2 className="font-semibold text-slate-700">Veli</h2>
              {['parentName', 'parentEmail', 'parentPassword'].map(k => (
                <input key={k} value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  type={k.includes('Password') ? 'password' : k.includes('Email') ? 'email' : 'text'}
                  placeholder={k === 'parentName' ? 'Ad Soyad' : k === 'parentEmail' ? 'E-posta' : 'Şifre (boş bırakılırsa otomatik üretilir)'}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              ))}
            </div>
            <button onClick={createFamily} className="w-full py-3.5 bg-slate-800 text-white font-bold rounded-2xl">Aile Oluştur</button>
          </div>
        )}

        {/* TOPLU KAYIT */}
        {/* AYARLAR */}
        {/* KULLANIM İSTATİSTİKLERİ */}
        {tab === 'engagement' && (
          loading ? <div className="text-center py-8 text-slate-400">Yükleniyor...</div> : engagement && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                  <div className="text-2xl font-black text-purple-700">{engagement.totalViews}</div>
                  <div className="text-xs text-slate-500 mt-1">Toplam Görüntülenme</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                  <div className="text-2xl font-black text-purple-700">{engagement.newGenerations}</div>
                  <div className="text-xs text-slate-500 mt-1">Yeni AI Üretimi</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-slate-700 text-sm mb-2">Tür Dağılımı</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">💬 Soru Çözümleri</span>
                  <span className="font-bold text-purple-700">{engagement.byType.question_explanation}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-600">📘 Konu Özetleri</span>
                  <span className="font-bold text-purple-700">{engagement.byType.topic_explanation}</span>
                </div>
              </div>

              {engagement.topTopics.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <h3 className="font-semibold text-slate-700 text-sm mb-2">En Çok İzlenen Konular</h3>
                  <div className="space-y-1.5">
                    {engagement.topTopics.map(t => (
                      <div key={t.topicId} className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">{t.topicName} <span className="text-slate-400">({t.subjectName})</span></span>
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg">{t.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {engagement.recent.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <h3 className="font-semibold text-slate-700 text-sm mb-2">Son Etkinlikler</h3>
                  <div className="space-y-1.5">
                    {engagement.recent.map((e, i) => (
                      <div key={i} className="flex justify-between items-center text-xs text-slate-500">
                        <span>{e.type === 'topic_explanation' ? '📘' : '💬'} {e.studentName}{e.subjectName ? ` · ${e.subjectName}` : ''}</span>
                        <span>{new Date(e.createdAt).toLocaleDateString('tr-TR')} {e.cacheHit ? '' : '🆕'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {engagement.totalViews === 0 && (
                <div className="text-center text-slate-400 py-8 text-sm">Henüz kullanım verisi yok.</div>
              )}

              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-slate-700 text-sm mb-1">🚩 Bildirilen Sorular</h3>
                <p className="text-xs text-slate-400 mb-3">Öğrencilerin hatalı/belirsiz bulup bildirdiği sorular</p>
                {questionReports.length === 0 ? (
                  <div className="text-center text-slate-400 py-4 text-sm">Henüz bildirim yok.</div>
                ) : (
                  <div className="space-y-2">
                    {questionReports.map(r => (
                      <div key={r.id} className="bg-red-50 rounded-xl p-3">
                        <div className="text-xs text-slate-700">{r.questionText}</div>
                        {r.reason && <div className="text-xs text-red-600 mt-1">"{r.reason}"</div>}
                        <div className="text-xs text-slate-400 mt-1">
                          {r.studentName} · {r.questionType === 'mock' ? 'Deneme Sınavı' : 'Günlük Sınav'} · {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {tab === 'chatbot' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h3 className="font-semibold text-slate-700 text-sm mb-1">📞 Hedo Üzerinden Gelen Talepler</h3>
              <p className="text-xs text-slate-400 mb-3">Chatbotta bilgi bırakan ziyaretçiler.</p>
              {chatbotLeads.length === 0 ? (
                <div className="text-center text-slate-400 py-4 text-sm">Henüz talep yok.</div>
              ) : (
                <div className="space-y-2">
                  {chatbotLeads.map(l => (
                    <div key={l.id} className="bg-purple-50 rounded-xl p-3">
                      <div className="text-xs font-semibold text-slate-700">{l.name} · {l.contact}</div>
                      {l.lastQuestion && <div className="text-xs text-slate-500 mt-1">"{l.lastQuestion}"</div>}
                      <div className="text-xs text-slate-400 mt-1">{new Date(l.createdAt).toLocaleString('tr-TR')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h3 className="font-semibold text-slate-700 text-sm mb-1">💬 Chatbot Soruları</h3>
              <p className="text-xs text-slate-400 mb-3">Landing page SSS chatbotuna sorulan sorular. Kırmızı olanlar SSS'de karşılığı bulunamayan, eklenmesi gereken sorular.</p>
              {chatbotLogs.length === 0 ? (
                <div className="text-center text-slate-400 py-4 text-sm">Henüz soru sorulmamış.</div>
              ) : (
                <div className="space-y-2">
                  {chatbotLogs.map(l => (
                    <div key={l.id} className={`rounded-xl p-3 ${l.matched ? 'bg-slate-50' : 'bg-red-50'}`}>
                      <div className="text-xs font-semibold text-slate-700">{l.question}</div>
                      {l.matched ? (
                        <div className="text-xs text-green-600 mt-1">✓ Eşleşti: {l.matchedFaqQ}</div>
                      ) : (
                        <div className="text-xs text-red-600 mt-1">✗ Eşleşme bulunamadı</div>
                      )}
                      <div className="text-xs text-slate-400 mt-1">{new Date(l.createdAt).toLocaleString('tr-TR')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <h2 className="font-semibold text-slate-700">💳 IBAN Bilgisi</h2>
            <p className="text-xs text-slate-400">Aboneliği sona eren kullanıcılara gösterilecek IBAN. Boş bırakılırsa gösterilmez.</p>
            <input value={iban} onChange={e => { setIban(e.target.value); setIbanSaved(false); }}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <button onClick={async () => {
              try {
                await axios.post('/api/admin/settings', { key: 'iban', value: iban }, { headers: headers() });
                setIbanSaved(true);
                setMsg('✅ IBAN kaydedildi');
              } catch { setMsg('❌ Hata'); }
            }} className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold">
              {ibanSaved ? '✅ Kaydedildi' : 'Kaydet'}
            </button>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="font-semibold text-slate-700 mb-1">📧 Mail Raporları (Test)</h2>
              <p className="text-xs text-slate-400 mb-3">Normalde her akşam 21:00 (günlük) ve her Pazar 20:00 (haftalık) otomatik gönderilir. Beklemeden test etmek için elle tetikleyebilirsin.</p>
              <div className="space-y-2">
                <button onClick={async () => {
                  setMsg('⏳ Gönderiliyor...');
                  try {
                    await axios.post('/api/admin/trigger-daily-summary', {}, { headers: headers() });
                    setMsg('✅ Günlük özet mailleri gönderildi');
                  } catch { setMsg('❌ Hata'); }
                }} className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">
                  📅 Günlük Özeti Şimdi Gönder
                </button>
                <button onClick={async () => {
                  setMsg('⏳ Gönderiliyor...');
                  try {
                    await axios.post('/api/admin/trigger-weekly-report', {}, { headers: headers() });
                    setMsg('✅ Haftalık rapor mailleri gönderildi');
                  } catch { setMsg('❌ Hata'); }
                }} className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">
                  📈 Haftalık Raporu Şimdi Gönder
                </button>
                <button onClick={async () => {
                  setMsg('⏳ Gönderiliyor...');
                  try {
                    await axios.post('/api/admin/trigger-mock-reminder', {}, { headers: headers() });
                    setMsg('✅ Deneme sınavı hatırlatma mailleri gönderildi');
                  } catch { setMsg('❌ Hata'); }
                }} className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">
                  ⏰ Deneme Hatırlatmasını Şimdi Gönder
                </button>
                <button onClick={async () => {
                  setMsg('⏳ Gönderiliyor...');
                  try {
                    await axios.post('/api/admin/trigger-teacher-weekly-report', {}, { headers: headers() });
                    setMsg('✅ Öğretmen haftalık özet mailleri gönderildi');
                  } catch { setMsg('❌ Hata'); }
                }} className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">
                  🧑‍🏫 Öğretmen Haftalık Özetini Şimdi Gönder
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="font-semibold text-slate-700 mb-1">🔒 Şifremi Değiştir</h2>
              <div className="space-y-2">
                <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                  placeholder="Mevcut şifre" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
                <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Yeni şifre" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
                {pwMsg && <p className="text-xs text-center text-slate-500">{pwMsg}</p>}
                <button onClick={async () => {
                  setPwMsg('');
                  try {
                    await axios.post('/api/admin/change-password', pwForm, { headers: headers() });
                    setPwMsg('✅ Şifre değiştirildi');
                    setPwForm({ currentPassword: '', newPassword: '' });
                  } catch (e: any) { setPwMsg(`❌ ${e.response?.data?.error || 'Hata'}`); }
                }} className="w-full py-2.5 bg-slate-700 text-white rounded-xl text-sm font-semibold">
                  Şifreyi Değiştir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* KURUMLAR */}
        {tab === 'institutions' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
              <h2 className="font-semibold text-slate-700 mb-1">➕ Yeni Kurum (Dershane)</h2>
              <p className="text-xs text-slate-400 mb-2">Kurum kendi şubelerini, öğretmenlerini ve ailelerini yönetir, maliyet raporunu göremez.</p>
              <input value={newInstitution.institutionName} onChange={e => setNewInstitution(f => ({ ...f, institutionName: e.target.value }))}
                placeholder="Kurum adı (örn: X Dershanesi)" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
              <input value={newInstitution.adminName} onChange={e => setNewInstitution(f => ({ ...f, adminName: e.target.value }))}
                placeholder="Kurum admini adı" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
              <input value={newInstitution.adminEmail} onChange={e => setNewInstitution(f => ({ ...f, adminEmail: e.target.value }))}
                placeholder="Kurum admini e-posta" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />

              <label className="flex items-center gap-2 pt-1 text-sm text-slate-600">
                <input type="checkbox" checked={demoForm.isDemo} onChange={e => setDemoForm(f => ({ ...f, isDemo: e.target.checked }))} />
                🎬 Demo kurum (süreli, limitli)
              </label>
              {demoForm.isDemo && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                  <div>
                    <label className="text-xs font-semibold text-amber-800">Demo bitiş tarihi</label>
                    <input type="date" value={demoForm.demoExpiresAt} onChange={e => setDemoForm(f => ({ ...f, demoExpiresAt: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border border-amber-200 rounded-lg text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-amber-700">Max kurum admini</label>
                      <input value={demoForm.maxAdmins} onChange={e => setDemoForm(f => ({ ...f, maxAdmins: e.target.value }))} type="number" min="0"
                        placeholder="sınırsız" className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-[11px] text-amber-700">Max öğretmen</label>
                      <input value={demoForm.maxTeachers} onChange={e => setDemoForm(f => ({ ...f, maxTeachers: e.target.value }))} type="number" min="0"
                        placeholder="sınırsız" className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-[11px] text-amber-700">Max şube</label>
                      <input value={demoForm.maxBranches} onChange={e => setDemoForm(f => ({ ...f, maxBranches: e.target.value }))} type="number" min="0"
                        placeholder="sınırsız" className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-[11px] text-amber-700">Max öğrenci</label>
                      <input value={demoForm.maxStudents} onChange={e => setDemoForm(f => ({ ...f, maxStudents: e.target.value }))} type="number" min="0"
                        placeholder="sınırsız" className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm" />
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-700">Boş bırakılan limitler sınırsız sayılır. Süre dolunca kurum admini ve öğretmenler giriş yapamaz; öğrenci/veli etkilenmez.</p>
                </div>
              )}

              <button onClick={createInstitution} className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold">Kurum Oluştur</button>
              {newInstitutionGenerated && (
                <div className="bg-purple-50 rounded-lg p-3 text-xs text-purple-800">
                  Admin şifresi (otomatik üretildi): <b>{newInstitutionGenerated}</b> — bir daha gösterilmeyecek, kaydedin.
                </div>
              )}
            </div>

            {institutions.map(inst => {
              const demoExpired = inst.isDemo && inst.demoExpiresAt && new Date(inst.demoExpiresAt) < new Date();
              return (
              <div key={inst.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                      {inst.name}
                      {inst.isDemo && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${demoExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {demoExpired ? '🎬 DEMO SÜRESİ DOLDU' : '🎬 DEMO'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {inst.branchCount}{inst.maxBranches != null ? `/${inst.maxBranches}` : ''} şube ·{' '}
                      {inst.teacherCount}{inst.maxTeachers != null ? `/${inst.maxTeachers}` : ''} öğretmen ·{' '}
                      {inst.familyCount}{inst.maxStudents != null ? `/${inst.maxStudents}` : ''} aile
                    </div>
                    {inst.isDemo && inst.demoExpiresAt && (
                      <div className="text-xs text-slate-400 mt-0.5">Bitiş: {new Date(inst.demoExpiresAt).toLocaleDateString('tr-TR')}</div>
                    )}
                  </div>
                  <button onClick={() => deleteInstitution(inst)} className="text-xs text-red-500 font-semibold whitespace-nowrap">Kurumu Sil</button>
                </div>
                {inst.isDemo && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openDemoEditor(inst)} className="text-xs bg-amber-50 text-amber-700 font-semibold px-3 py-1.5 rounded-lg">📅 Süre / Limit Düzenle</button>
                    <button onClick={() => convertToFull(inst)} className="text-xs bg-green-50 text-green-700 font-semibold px-3 py-1.5 rounded-lg">✅ Tam Sürüme Çevir</button>
                  </div>
                )}
                {editingDemoId === inst.id && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2 space-y-2">
                    <div>
                      <label className="text-xs font-semibold text-amber-800">Demo bitiş tarihi</label>
                      <input type="date" value={demoEditForm.demoExpiresAt} onChange={e => setDemoEditForm(f => ({ ...f, demoExpiresAt: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 border border-amber-200 rounded-lg text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-amber-700">Max kurum admini</label>
                        <input value={demoEditForm.maxAdmins} onChange={e => setDemoEditForm(f => ({ ...f, maxAdmins: e.target.value }))} type="number" min="0"
                          placeholder="sınırsız" className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="text-[11px] text-amber-700">Max öğretmen</label>
                        <input value={demoEditForm.maxTeachers} onChange={e => setDemoEditForm(f => ({ ...f, maxTeachers: e.target.value }))} type="number" min="0"
                          placeholder="sınırsız" className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="text-[11px] text-amber-700">Max şube</label>
                        <input value={demoEditForm.maxBranches} onChange={e => setDemoEditForm(f => ({ ...f, maxBranches: e.target.value }))} type="number" min="0"
                          placeholder="sınırsız" className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="text-[11px] text-amber-700">Max öğrenci</label>
                        <input value={demoEditForm.maxStudents} onChange={e => setDemoEditForm(f => ({ ...f, maxStudents: e.target.value }))} type="number" min="0"
                          placeholder="sınırsız" className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveDemoEdit} className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold">Kaydet</button>
                      <button onClick={() => setEditingDemoId(null)} className="flex-1 py-2 bg-white border border-amber-200 text-amber-700 rounded-lg text-sm font-semibold">Vazgeç</button>
                    </div>
                  </div>
                )}
                <div className="mt-2 space-y-1.5">
                  {inst.admins.map(a => (
                    <div key={a.id} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2">
                      <div className="text-xs text-slate-600">{a.name} — {a.email}</div>
                      <button onClick={() => resetInstitutionAdminPassword(inst.id, a.id)} className="text-xs text-purple-600 font-semibold">Şifre Sıfırla</button>
                    </div>
                  ))}
                  {inst.admins.length === 0 && <p className="text-xs text-slate-400">Henüz admin hesabı yok.</p>}
                </div>
              </div>
              );
            })}
            {institutions.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Henüz kurum oluşturulmadı.</p>}
          </div>
        )}

        {/* TOKEN RAPORU */}
        {tab === 'tokens' && (
          <div className="space-y-4">
            {loading ? <div className="text-center py-8 text-slate-400">Yükleniyor...</div> : tokenReport && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                    <div className="text-xs text-slate-500 mb-1">Gerçek Maliyet</div>
                    <div className="text-xl font-black text-slate-700">${tokenReport.totalRealUsd.toFixed(4)}</div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                    <div className="text-xs text-slate-500 mb-1">Müşteriye Yansıtılan</div>
                    <div className="text-xl font-black text-purple-700">₺{tokenReport.totalDisplayTry.toFixed(2)}</div>
                  </div>
                </div>
                {tokenReport.families.map(f => {
                  const expanded = expandedFamilies.has(f.familyId);
                  const shown = expanded ? f.usages : f.usages.slice(0, 5);
                  return (
                  <div key={f.familyId} className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-bold text-slate-800">{f.familyName}</div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">${f.realCostUsd.toFixed(4)}</div>
                        <div className="text-sm font-bold text-purple-700">₺{f.displayCostTry.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {shown.map((u: any, i: number) => {
                        const actionLabel = u.action === 'explanation' ? '💬 Soru Açıklaması'
                          : u.action === 'mock_explanation' ? '💬 Deneme Soru Açıklaması'
                          : u.action === 'topic_explanation' ? '📘 Konu Özeti'
                          : u.action === 'mock_generate' ? '🏆 Aylık Deneme'
                          : u.action === 'placement_generate' ? '📊 Seviye Tespiti'
                          : u.action === 'exam_generate' ? `📝 ${u.subjectName || 'Sınav'}`
                          : u.action;
                        return (
                          <div key={i} className="flex justify-between items-center text-xs text-slate-500">
                            <span>{actionLabel} <span className="text-slate-300">· {new Date(u.createdAt).toLocaleDateString('tr-TR')}</span></span>
                            <span>₺{u.displayTry.toFixed(2)}</span>
                          </div>
                        );
                      })}
                      {f.usages.length > 5 && (
                        <button onClick={() => setExpandedFamilies(prev => { const s = new Set(prev); expanded ? s.delete(f.familyId) : s.add(f.familyId); return s; })} className="w-full text-xs text-purple-600 font-semibold py-1 hover:text-purple-800">
                          {expanded ? '▲ Daha az göster' : `▼ +${f.usages.length - 5} daha göster`}
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
