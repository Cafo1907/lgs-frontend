import { useState, useEffect } from 'react';
import axios from 'axios';

interface Props { onLogout: () => void }

interface OverviewData {
  totalStudents: number; totalFamilies: number; activeStudents: number;
  engagementRate: number; avgNet: number | null;
  fallingBehind: { studentId: number; studentName: string; familyName: string; branchName: string | null; daysInactive: number; avgWeakness: number | null; latestMockNet: number | null }[];
  byBranch: { branchName: string; studentCount: number; avgNet: number | null; engagementRate: number }[];
}
interface Branch { id: number; name: string; createdAt: string; familyCount: number; studentCount: number; avgNet: number | null }
interface TeacherRow { id: number; name: string; email: string; branchId: number | null; branchName: string | null; createdAt: string }
interface FamilyUser { id: number; name: string; email: string; role: string; isFirstLogin: boolean }
interface FamilyRow {
  id: number; name: string; isActive: boolean; subscriptionExpiresAt: string | null;
  branch: { id: number; name: string } | null; users: FamilyUser[];
}

const token = () => localStorage.getItem('institutionAdminToken') || '';
const headers = () => ({ Authorization: `Bearer ${token()}` });

interface MockExamData {
  available: boolean;
  periodKey?: string;
  periodLabel?: string;
  questions?: { id: number; subjectId: number; subjectName: string; orderIndex: number; text: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; difficulty: string }[];
}

export default function InstitutionAdminPanel({ onLogout }: Props) {
  const [tab, setTab] = useState<'overview' | 'branches' | 'teachers' | 'families' | 'create' | 'bulk' | 'settings' | 'mockexam'>('overview');
  const [adminInfo] = useState(() => { try { return JSON.parse(localStorage.getItem('institutionAdminInfo') || '{}'); } catch { return {}; } });
  const [msg, setMsg] = useState('');
  const [demoExpiredMsg, setDemoExpiredMsg] = useState<string | null>(null);

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [branding, setBranding] = useState<{ logoUrl: string | null; slogan: string | null; brandColor: string | null }>({ logoUrl: null, slogan: null, brandColor: null });
  const [brandingForm, setBrandingForm] = useState({ logoUrl: '', slogan: '', brandColor: '' });
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const LOGO_MAX_MB = 2;
  const [mockExam, setMockExam] = useState<MockExamData | null>(null);
  const [mockExamPdfLoading, setMockExamPdfLoading] = useState(false);

  const loadOverview = () => axios.get('/api/institution-admin/overview', { headers: headers() }).then(r => setOverview(r.data)).catch((e: any) => {
    if (e.response?.data?.code === 'DEMO_EXPIRED') setDemoExpiredMsg(e.response.data.error);
  });
  const loadBranches = () => axios.get('/api/institution-admin/branches', { headers: headers() }).then(r => setBranches(r.data.branches)).catch(() => {});
  const loadTeachers = () => axios.get('/api/institution-admin/teachers', { headers: headers() }).then(r => setTeachers(r.data)).catch(() => {});
  const loadFamilies = () => axios.get('/api/institution-admin/families', { headers: headers() }).then(r => setFamilies(r.data)).catch(() => {});
  const loadMockExam = () => axios.get('/api/institution-admin/mock-exam', { headers: headers() }).then(r => setMockExam(r.data)).catch(() => {});

  const downloadMockExamPdf = async () => {
    setMockExamPdfLoading(true);
    try {
      const { data } = await axios.get('/api/institution-admin/mock-exam/pdf', { headers: headers(), responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `deneme-sinavi-${mockExam?.periodKey || ''}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) { setMsg('❌ PDF indirilemedi'); }
    finally { setMockExamPdfLoading(false); }
  };
  const loadBranding = () => axios.get('/api/institution-admin/branding', { headers: headers() }).then(r => {
    setBranding(r.data);
    setBrandingForm({ logoUrl: r.data.logoUrl || '', slogan: r.data.slogan || '', brandColor: r.data.brandColor || '' });
  }).catch(() => {});

  useEffect(() => {
    loadOverview(); loadBranches(); loadTeachers(); loadFamilies(); loadBranding(); loadMockExam();
  }, []);

  const saveBranding = async () => {
    setMsg(''); setBrandingSaving(true);
    try {
      const { data } = await axios.put('/api/institution-admin/branding', brandingForm, { headers: headers() });
      setBranding(data);
      setMsg('✅ Marka ayarları kaydedildi');
    } catch (e: any) { setMsg('❌ ' + (e.response?.data?.error || 'Hata')); }
    finally { setBrandingSaving(false); }
  };

  const uploadLogo = async (file: File) => {
    setMsg('');
    if (file.size > LOGO_MAX_MB * 1024 * 1024) { setMsg(`❌ Logo en fazla ${LOGO_MAX_MB} MB olabilir`); return; }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setMsg('❌ Sadece PNG, JPEG veya WEBP dosyaları desteklenir'); return; }
    const formData = new FormData();
    formData.append('logo', file);
    setLogoUploading(true);
    try {
      const { data } = await axios.post('/api/institution-admin/branding/logo', formData, { headers: { ...headers(), 'Content-Type': 'multipart/form-data' } });
      setBranding(data);
      setBrandingForm(f => ({ ...f, logoUrl: data.logoUrl || '' }));
      setMsg('✅ Logo yüklendi');
    } catch (e: any) { setMsg('❌ ' + (e.response?.data?.error || 'Hata')); }
    finally { setLogoUploading(false); }
  };

  // ── Şube ──
  const [newBranchName, setNewBranchName] = useState('');
  const createBranch = async () => {
    if (!newBranchName.trim()) return;
    try { await axios.post('/api/institution-admin/branches', { name: newBranchName }, { headers: headers() }); setNewBranchName(''); loadBranches(); }
    catch (e: any) { setMsg('❌ ' + (e.response?.data?.error || 'Hata')); }
  };
  const deleteBranch = async (id: number) => {
    if (!confirm('Bu şubeyi silmek istediğine emin misin? Şubedeki aileler şubesiz kalır.')) return;
    await axios.delete(`/api/institution-admin/branches/${id}`, { headers: headers() });
    loadBranches(); loadFamilies();
  };

  // ── Öğretmen ──
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', password: '', branchId: '' });
  const createTeacher = async () => {
    if (!teacherForm.name || !teacherForm.email || !teacherForm.password || !teacherForm.branchId) { setMsg('❌ Tüm alanlar (şube dahil) zorunlu'); return; }
    try {
      await axios.post('/api/institution-admin/teachers', { ...teacherForm, branchId: parseInt(teacherForm.branchId) }, { headers: headers() });
      setTeacherForm({ name: '', email: '', password: '', branchId: '' });
      setMsg('✅ Öğretmen oluşturuldu'); loadTeachers();
    } catch (e: any) { setMsg('❌ ' + (e.response?.data?.error || 'Hata')); }
  };
  const deleteTeacher = async (id: number) => {
    if (!confirm('Bu öğretmeni silmek istediğine emin misin?')) return;
    await axios.delete(`/api/institution-admin/teachers/${id}`, { headers: headers() });
    loadTeachers();
  };
  const resetTeacherPassword = async (id: number) => {
    const pw = prompt('Yeni şifre girin:');
    if (!pw) return;
    await axios.post(`/api/institution-admin/teachers/${id}/reset-password`, { newPassword: pw }, { headers: headers() });
    setMsg('✅ Şifre sıfırlandı');
  };

  // ── Tekli aile ──
  const [form, setForm] = useState({ familyName: '', branchName: '', subscriptionMonths: '', studentName: '', studentEmail: '', studentPassword: '', parentName: '', parentEmail: '', parentPassword: '' });
  const [lastGenerated, setLastGenerated] = useState<Record<string, string> | null>(null);
  const createFamily = async () => {
    setMsg(''); setLastGenerated(null);
    try {
      const { data } = await axios.post('/api/institution-admin/create-family', {
        ...form, subscriptionMonths: form.subscriptionMonths ? parseInt(form.subscriptionMonths) : undefined,
      }, { headers: headers() });
      setMsg('✅ Aile oluşturuldu');
      if (data.generatedPasswords && Object.keys(data.generatedPasswords).length > 0) setLastGenerated(data.generatedPasswords);
      setForm({ familyName: '', branchName: '', subscriptionMonths: '', studentName: '', studentEmail: '', studentPassword: '', parentName: '', parentEmail: '', parentPassword: '' });
      loadFamilies(); loadBranches(); loadOverview();
    } catch (e: any) { setMsg('❌ ' + (e.response?.data?.error || 'Hata')); }
  };

  // ── Toplu kayıt ──
  const [csvText, setCsvText] = useState('');
  const [bulkSubscriptionMonths, setBulkSubscriptionMonths] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ total: number; successCount: number; failCount: number; results: any[] } | null>(null);
  const BULK_COLUMNS = ['familyName', 'branchName', 'studentName', 'studentEmail', 'studentPassword', 'parentName', 'parentEmail', 'parentPassword', 'parent2Name', 'parent2Email', 'parent2Password'] as const;
  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const startIdx = lines[0].toLowerCase().includes('familyname') ? 1 : 0;
    return lines.slice(startIdx).map(line => {
      const cells = line.split(',').map(c => c.trim());
      const row: Record<string, string> = {};
      BULK_COLUMNS.forEach((col, i) => { if (cells[i]) row[col] = cells[i]; });
      return row;
    });
  };
  const handleCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result || ''));
    reader.readAsText(file, 'utf-8');
  };
  const uploadBulk = async () => {
    setMsg(''); setBulkResults(null);
    const rows = parseCsv(csvText);
    if (rows.length === 0) { setMsg('❌ Yüklenecek satır bulunamadı'); return; }
    setBulkLoading(true);
    try {
      const { data } = await axios.post('/api/institution-admin/bulk-create-families', {
        rows, subscriptionMonths: bulkSubscriptionMonths ? parseInt(bulkSubscriptionMonths) : undefined,
      }, { headers: headers() });
      setBulkResults(data);
      setMsg(`✅ ${data.successCount}/${data.total} kayıt oluşturuldu`);
      loadFamilies(); loadBranches(); loadOverview();
    } catch (e: any) { setMsg('❌ ' + (e.response?.data?.error || 'Hata')); }
    finally { setBulkLoading(false); }
  };

  const toggleFamily = async (id: number) => {
    await axios.post(`/api/institution-admin/toggle-family/${id}`, {}, { headers: headers() });
    loadFamilies();
  };

  const TABS = [
    { key: 'overview', label: '🧭 Genel Bakış' },
    { key: 'branches', label: '🏢 Şubeler' },
    { key: 'teachers', label: '🧑‍🏫 Öğretmenler' },
    { key: 'families', label: '👨‍👩‍👧 Aileler' },
    { key: 'create', label: '➕ Yeni Aile' },
    { key: 'bulk', label: '📥 Toplu Kayıt' },
    { key: 'settings', label: '🎨 Marka Ayarları' },
    { key: 'mockexam', label: '📝 Deneme Sınavı' },
  ] as const;

  const brandStyle = branding.brandColor ? { background: `linear-gradient(to right, ${branding.brandColor}, ${branding.brandColor}dd)` } : undefined;

  if (demoExpiredMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-3">🎬</div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Demo Süresi Doldu</h2>
          <p className="text-sm text-slate-500 mb-6">{demoExpiredMsg}</p>
          <button onClick={onLogout} className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold">Çıkış Yap</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-50 pb-10">
      <div className={branding.brandColor ? 'px-6 pt-10 pb-6 text-white' : 'bg-gradient-to-r from-slate-800 to-slate-900 px-6 pt-10 pb-6 text-white'} style={brandStyle}>
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Kurum logosu" className="h-10 mb-2 rounded bg-white/90 px-2 py-1 object-contain" />
        ) : (
          <div className="text-3xl mb-2">🏢</div>
        )}
        <h1 className="text-lg font-bold">{adminInfo.institutionName || 'Kurum Paneli'}</h1>
        {branding.slogan && <p className="text-white/80 text-xs italic mt-0.5">{branding.slogan}</p>}
        <p className="text-slate-300 text-xs mt-0.5">{adminInfo.name} · {adminInfo.email}</p>
        <button onClick={onLogout} className="mt-3 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg">Çıkış Yap</button>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 py-3 bg-white border-b sticky top-0 z-10">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${tab === t.key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {msg && <div className="mx-4 mt-3 text-xs bg-white rounded-lg px-3 py-2 shadow-sm">{msg}</div>}

      <div className="px-4 mt-4 space-y-4">
        {tab === 'overview' && overview && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center"><div className="text-2xl font-black text-slate-800">{overview.totalStudents}</div><div className="text-xs text-slate-500 mt-1">Öğrenci</div></div>
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center"><div className="text-2xl font-black text-slate-800">{overview.totalFamilies}</div><div className="text-xs text-slate-500 mt-1">Aile</div></div>
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center"><div className="text-2xl font-black text-green-600">%{overview.engagementRate}</div><div className="text-xs text-slate-500 mt-1">7 Gün Aktiflik</div></div>
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center"><div className="text-2xl font-black text-purple-600">{overview.avgNet ?? '–'}</div><div className="text-xs text-slate-500 mt-1">Ort. Net</div></div>
            </div>
            {overview.byBranch.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Şube Bazlı</h3>
                {overview.byBranch.map(b => (
                  <div key={b.branchName} className="flex justify-between text-sm py-1.5 border-b last:border-0 border-slate-100">
                    <span className="text-slate-600">{b.branchName}</span>
                    <span className="text-slate-400 text-xs">{b.studentCount} öğrenci · net {b.avgNet ?? '–'} · %{b.engagementRate} aktif</span>
                  </div>
                ))}
              </div>
            )}
            {overview.fallingBehind.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">⚠️ Geride Kalanlar</h3>
                {overview.fallingBehind.slice(0, 10).map(s => (
                  <div key={s.studentId} className="flex justify-between text-sm py-1.5 border-b last:border-0 border-slate-100">
                    <span className="text-slate-600">{s.studentName} <span className="text-slate-400 text-xs">({s.familyName})</span></span>
                    <span className="text-red-500 text-xs">{s.daysInactive} gün pasif</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'branches' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Yeni Şube</h3>
              <div className="flex gap-2">
                <input value={newBranchName} onChange={e => setNewBranchName(e.target.value)} placeholder="Şube adı"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <button onClick={createBranch} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">Ekle</button>
              </div>
            </div>
            {branches.map(b => (
              <div key={b.id} className="bg-white rounded-2xl shadow-sm p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{b.name}</div>
                  <div className="text-xs text-slate-400">{b.familyCount} aile · {b.studentCount} öğrenci · net {b.avgNet ?? '–'}</div>
                </div>
                <button onClick={() => deleteBranch(b.id)} className="text-xs text-red-500 font-semibold">Sil</button>
              </div>
            ))}
          </>
        )}

        {tab === 'teachers' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Yeni Öğretmen</h3>
              <input value={teacherForm.name} onChange={e => setTeacherForm(f => ({ ...f, name: e.target.value }))} placeholder="Ad Soyad"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input value={teacherForm.email} onChange={e => setTeacherForm(f => ({ ...f, email: e.target.value }))} placeholder="E-posta"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input value={teacherForm.password} onChange={e => setTeacherForm(f => ({ ...f, password: e.target.value }))} placeholder="Şifre"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <select value={teacherForm.branchId} onChange={e => setTeacherForm(f => ({ ...f, branchId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Şube seç...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <button onClick={createTeacher} className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold">Oluştur</button>
            </div>
            {teachers.map(t => (
              <div key={t.id} className="bg-white rounded-2xl shadow-sm p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.email} · {t.branchName ?? 'Şube atanmadı'}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => resetTeacherPassword(t.id)} className="text-xs text-purple-600 font-semibold">Şifre Sıfırla</button>
                  <button onClick={() => deleteTeacher(t.id)} className="text-xs text-red-500 font-semibold">Sil</button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'families' && families.map(f => (
          <div key={f.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-slate-800 text-sm">{f.name}</div>
                <div className="text-xs text-slate-400">{f.branch?.name ?? 'Şubesiz'} · {f.isActive ? 'Aktif' : 'Pasif'}</div>
              </div>
              <button onClick={() => toggleFamily(f.id)} className={`text-xs font-semibold px-2 py-1 rounded-lg ${f.isActive ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {f.isActive ? 'Pasifleştir' : 'Aktifleştir'}
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {f.users.map(u => (
                <div key={u.id} className="text-xs text-slate-500">{u.role === 'STUDENT' ? '🎓' : '👤'} {u.name} — {u.email}</div>
              ))}
            </div>
          </div>
        ))}

        {tab === 'create' && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-1">Yeni Aile Oluştur</h3>
            <input value={form.familyName} onChange={e => setForm(f => ({ ...f, familyName: e.target.value }))} placeholder="Aile adı"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input value={form.branchName} onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))} placeholder="Şube adı (yoksa oluşturulur)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input value={form.subscriptionMonths} onChange={e => setForm(f => ({ ...f, subscriptionMonths: e.target.value }))} type="number" min="1"
              placeholder="Abonelik süresi, ay (boş = 3 günlük deneme)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <div className="border-t border-slate-100 pt-2 mt-2 text-xs font-semibold text-slate-500">Öğrenci</div>
            <input value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} placeholder="Ad Soyad"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input value={form.studentEmail} onChange={e => setForm(f => ({ ...f, studentEmail: e.target.value }))} placeholder="E-posta"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input value={form.studentPassword} onChange={e => setForm(f => ({ ...f, studentPassword: e.target.value }))} placeholder="Şifre (boş = otomatik üretilir)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <div className="border-t border-slate-100 pt-2 mt-2 text-xs font-semibold text-slate-500">Veli</div>
            <input value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} placeholder="Ad Soyad"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input value={form.parentEmail} onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))} placeholder="E-posta"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input value={form.parentPassword} onChange={e => setForm(f => ({ ...f, parentPassword: e.target.value }))} placeholder="Şifre (boş = otomatik üretilir)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <button onClick={createFamily} className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold mt-2">Oluştur</button>
            {lastGenerated && (
              <div className="bg-purple-50 rounded-lg p-3 text-xs text-purple-800 mt-2">
                Üretilen şifreler: {Object.entries(lastGenerated).map(([k, v]) => `${k}: ${v}`).join(' · ')}
              </div>
            )}
          </div>
        )}

        {tab === 'bulk' && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-1">📥 CSV ile Toplu Öğrenci Kaydı</h3>
            <p className="text-xs text-slate-400">Sütunlar: {BULK_COLUMNS.join(', ')}</p>
            <input type="file" accept=".csv,text/csv" onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }} className="text-xs" />
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={8} placeholder="ya da CSV metnini buraya yapıştırın"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono" />
            <input value={bulkSubscriptionMonths} onChange={e => setBulkSubscriptionMonths(e.target.value)} type="number" min="1"
              placeholder="Abonelik süresi, tüm satırlar için (ay)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <button onClick={uploadBulk} disabled={bulkLoading} className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
              {bulkLoading ? 'Yükleniyor...' : `📥 ${parseCsv(csvText).length} Satırı Yükle`}
            </button>
            {bulkResults && (
              <div className="bg-slate-50 rounded-lg p-3 text-xs">
                <div className="font-semibold text-slate-700">Sonuç: {bulkResults.successCount}/{bulkResults.total} başarılı</div>
                {bulkResults.results.filter(r => !r.success).map((r, i) => (
                  <div key={i} className="text-red-500 mt-1">Satır {r.row}: {r.error}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-1">🎨 Marka Ayarları (Beyaz Etiket)</h3>
            <p className="text-xs text-slate-400">Logonuz ve sloganınız kurum panelinde, öğretmen/öğrenci/veli panellerinde ve gönderilen maillerde gösterilir.</p>
            <div>
              <label className="text-xs font-semibold text-slate-500">Logo</label>
              <div className="flex items-center gap-3 mt-1">
                {brandingForm.logoUrl ? (
                  <img src={brandingForm.logoUrl} alt="Logo" className="h-12 w-12 rounded-lg border border-slate-200 object-contain bg-slate-50 p-1" />
                ) : (
                  <div className="h-12 w-12 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-300 text-lg">🏢</div>
                )}
                <label className="cursor-pointer">
                  <span className={`inline-block text-xs font-semibold px-3 py-2 rounded-lg border ${logoUploading ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                    {logoUploading ? 'Yükleniyor...' : '📁 Gözat...'}
                  </span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={logoUploading}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ''; }} />
                </label>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">PNG, JPEG veya WEBP · en fazla {LOGO_MAX_MB} MB</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Slogan</label>
              <input value={brandingForm.slogan} onChange={e => setBrandingForm({ ...brandingForm, slogan: e.target.value })}
                placeholder="Örn: Başarıya giden yol burada başlar" maxLength={120} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Marka Rengi</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={brandingForm.brandColor || '#1e293b'} onChange={e => setBrandingForm({ ...brandingForm, brandColor: e.target.value })}
                  className="w-10 h-9 rounded border border-slate-200" />
                <input value={brandingForm.brandColor} onChange={e => setBrandingForm({ ...brandingForm, brandColor: e.target.value })}
                  placeholder="#1e293b" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" />
              </div>
            </div>
            {brandingForm.logoUrl && (
              <div className="rounded-lg p-4 text-white" style={{ background: brandingForm.brandColor || '#1e293b' }}>
                <img src={brandingForm.logoUrl} alt="Önizleme" className="h-8 mb-1 rounded bg-white/90 px-2 py-1 object-contain" />
                <div className="text-sm font-bold">{adminInfo.institutionName}</div>
                {brandingForm.slogan && <div className="text-xs italic text-white/80">{brandingForm.slogan}</div>}
              </div>
            )}
            <button onClick={saveBranding} disabled={brandingSaving} className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
              {brandingSaving ? 'Kaydediliyor...' : '💾 Kaydet'}
            </button>
          </div>
        )}

        {tab === 'mockexam' && (
          <div className="space-y-3">
            {!mockExam ? (
              <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-slate-400">Yükleniyor...</div>
            ) : !mockExam.available ? (
              <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-slate-400">Henüz bu kuruma ait bir deneme sınavı üretilmedi. İlk öğrenci deneme sınavını başlattığında burada görünecek.</div>
            ) : (
              <>
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-slate-700">📝 {mockExam.periodLabel}</h3>
                  <p className="text-xs text-slate-400 mt-1">Bu kurumdaki tüm öğrencilerin gördüğü {mockExam.questions?.length ?? 0} soru — cevap anahtarı dahil.</p>
                  <button onClick={downloadMockExamPdf} disabled={mockExamPdfLoading} className="mt-3 w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
                    {mockExamPdfLoading ? 'Hazırlanıyor...' : '🖨️ Yazdırılabilir PDF İndir (cevap anahtarsız)'}
                  </button>
                </div>
                {mockExam.questions?.map((q, i) => (
                  <div key={q.id} className="bg-white rounded-2xl shadow-sm p-4">
                    {(i === 0 || mockExam.questions![i - 1]!.subjectName !== q.subjectName) && (
                      <div className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-2">{q.subjectName}</div>
                    )}
                    <p className="text-sm font-medium text-slate-800">{i + 1}. {q.text}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      {(['A', 'B', 'C', 'D'] as const).map(letter => {
                        const optionText = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[letter];
                        const isCorrect = q.correctAnswer === letter;
                        return <div key={letter} className={isCorrect ? 'font-bold text-green-600' : 'text-slate-500'}>{letter}) {optionText} {isCorrect && '✓'}</div>;
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
