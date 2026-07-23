import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

interface StudentRow {
  studentId: number; studentName: string; familyName: string; branchName: string | null;
  daysInactive: number; avgWeakness: number | null; latestMockNet: number | null;
}

interface StudentDetail {
  studentId: number; studentName: string; familyName: string; branchName: string | null;
  weakTopics: Array<{ topicName: string; subjectName: string; subjectIcon: string; weaknessScore: number }>;
  netTrend: Array<{ date: string; net: number; estimatedScore: number }>;
}

type NoteVisibility = 'private' | 'teachers' | 'parent';

interface TeacherNote {
  id: number; note: string; teacherName: string; visibility: NoteVisibility; createdAt: string;
}

const VISIBILITY_LABEL: Record<NoteVisibility, string> = {
  private: '🔒 Sadece ben',
  teachers: '🧑‍🏫 Tüm öğretmenler',
  parent: '👨‍👩‍👧 Veli de görsün',
};

interface ClassTopic {
  topicName: string; subjectName: string; subjectIcon: string; avgWeakness: number; studentCount: number;
}

type SortKey = 'inactive' | 'net-asc' | 'net-desc' | 'name';

function authHeaders() {
  const token = localStorage.getItem('teacherToken');
  return { Authorization: `Bearer ${token}` };
}

function StudentDetailPanel({ studentId, onClose }: { studentId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [newNoteVisibility, setNewNoteVisibility] = useState<NoteVisibility>('teachers');
  const [savingNote, setSavingNote] = useState(false);

  const loadNotes = () => {
    setNotesLoading(true);
    axios.get(`/api/teacher/students/${studentId}/notes`, { headers: authHeaders() })
      .then(({ data }) => setNotes(data.notes))
      .finally(() => setNotesLoading(false));
  };

  useEffect(() => {
    axios.get(`/api/teacher/students/${studentId}`, { headers: authHeaders() })
      .then(({ data }) => setDetail(data))
      .finally(() => setLoading(false));
    loadNotes();
  }, [studentId]);

  const submitNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      await axios.post(`/api/teacher/students/${studentId}/notes`, { note: newNote.trim(), visibility: newNoteVisibility }, { headers: authHeaders() });
      setNewNote('');
      setNewNoteVisibility('teachers');
      loadNotes();
    } finally {
      setSavingNote(false);
    }
  };

  const maxNet = detail?.netTrend.length ? Math.max(...detail.netTrend.map(n => n.net), 1) : 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-xl">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Yükleniyor...</div>
        ) : detail ? (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-800">{detail.studentName}</h3>
                <p className="text-xs text-slate-400">{detail.familyName}{detail.branchName ? ` · ${detail.branchName}` : ''}</p>
              </div>
              <button onClick={onClose} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg font-medium">Kapat</button>
            </div>

            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Deneme Neti Trendi</h4>
            {detail.netTrend.length === 0 ? (
              <div className="text-xs text-slate-400 mb-4">Henüz tamamlanmış deneme sınavı yok.</div>
            ) : (
              <div className="flex items-end gap-2 h-24 mb-1 px-1">
                {detail.netTrend.map((n, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-purple-500 rounded-t-md" style={{ height: `${Math.max((n.net / maxNet) * 80, 4)}px` }} />
                    <div className="text-[10px] text-slate-500 font-semibold">{n.net}</div>
                  </div>
                ))}
              </div>
            )}
            {detail.netTrend.length > 0 && <div className="text-xs text-slate-400 mb-5">Soldan sağa: eskiden yeniye son {detail.netTrend.length} deneme.</div>}

            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Zayıf Konular</h4>
            {detail.weakTopics.length === 0 ? (
              <div className="text-xs text-slate-400 mb-5">Belirgin bir zayıf konu tespit edilmedi 🎉</div>
            ) : (
              <div className="space-y-1.5 mb-5">
                {detail.weakTopics.map((t, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2">
                    <div className="text-xs text-slate-700">{t.subjectIcon} {t.topicName} <span className="text-slate-400">({t.subjectName})</span></div>
                    <div className="text-xs font-bold text-red-600">{t.weaknessScore}</div>
                  </div>
                ))}
              </div>
            )}

            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notlar</h4>
            <div className="space-y-2 mb-3">
              <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Bu öğrenciyle ilgili bir not bırak..."
                rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              <div>
                <label className="text-[11px] text-slate-500 font-medium">Kimler görsün?</label>
                <select value={newNoteVisibility} onChange={e => setNewNoteVisibility(e.target.value as NoteVisibility)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                  <option value="private">🔒 Sadece ben</option>
                  <option value="teachers">🧑‍🏫 Tüm öğretmenler</option>
                  <option value="parent">👨‍👩‍👧 Veli de görsün</option>
                </select>
              </div>
              <button onClick={submitNote} disabled={savingNote || !newNote.trim()}
                className="w-full py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
                {savingNote ? 'Kaydediliyor...' : 'Notu Kaydet'}
              </button>
            </div>
            {notesLoading ? (
              <div className="text-xs text-slate-400">Yükleniyor...</div>
            ) : notes.length === 0 ? (
              <div className="text-xs text-slate-400">Henüz not bırakılmamış.</div>
            ) : (
              <div className="space-y-1.5">
                {notes.map(n => (
                  <div key={n.id} className="bg-slate-50 rounded-xl px-3 py-2">
                    <div className="text-xs text-slate-700">{n.note}</div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-[10px] text-slate-400">{n.teacherName} · {new Date(n.createdAt).toLocaleDateString('tr-TR')}</div>
                      <div className="text-[10px] text-slate-400">{VISIBILITY_LABEL[n.visibility]}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">Öğrenci bulunamadı.</div>
        )}
      </div>
    </div>
  );
}

export default function TeacherHome({ onLogout }: { onLogout: () => void }) {
  const [teacherName, setTeacherName] = useState('');
  const [branchName, setBranchName] = useState<string | null>(null);
  const [branding, setBranding] = useState<{ logoUrl: string | null; slogan: string | null; brandColor: string | null } | null>(null);
  const [mockExam, setMockExam] = useState<{ available: boolean; periodKey?: string; periodLabel?: string; questions?: { id: number; subjectName: string; text: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string }[] } | null>(null);
  const [mockExamOpen, setMockExamOpen] = useState(false);
  const [mockExamPdfLoading, setMockExamPdfLoading] = useState(false);
  const [demoExpiredMsg, setDemoExpiredMsg] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classTopics, setClassTopics] = useState<ClassTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('inactive');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  useEffect(() => {
    const info = JSON.parse(localStorage.getItem('teacherInfo') || '{}');
    setTeacherName(info.name || '');
    setBranchName(info.branchName || null);

    axios.get('/api/teacher/me', { headers: authHeaders() }).then(r => setBranding(r.data.branding || null)).catch((e: any) => {
      if (e.response?.data?.code === 'DEMO_EXPIRED') setDemoExpiredMsg(e.response.data.error);
    });
    axios.get('/api/teacher/mock-exam', { headers: authHeaders() }).then(r => setMockExam(r.data)).catch(() => {});

    Promise.all([
      axios.get('/api/teacher/students', { headers: authHeaders() }),
      axios.get('/api/teacher/topic-summary', { headers: authHeaders() }),
    ])
      .then(([studentsRes, topicsRes]) => {
        setStudents(studentsRes.data.students);
        setClassTopics(topicsRes.data.topics);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalStudents = students.length;
  const engaged7d = students.filter(s => s.daysInactive <= 7).length;
  const engagementRate = totalStudents ? Math.round((engaged7d / totalStudents) * 1000) / 10 : 0;
  const nets = students.map(s => s.latestMockNet).filter((n): n is number => n !== null);
  const avgNet = nets.length ? Math.round((nets.reduce((a, b) => a + b, 0) / nets.length) * 100) / 100 : null;

  const visibleStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = students.filter(s => !q || s.studentName.toLowerCase().includes(q) || s.familyName.toLowerCase().includes(q));
    rows = [...rows].sort((a, b) => {
      if (sortKey === 'inactive') return b.daysInactive - a.daysInactive;
      if (sortKey === 'name') return a.studentName.localeCompare(b.studentName, 'tr');
      const an = a.latestMockNet ?? -1, bn = b.latestMockNet ?? -1;
      return sortKey === 'net-asc' ? an - bn : bn - an;
    });
    return rows;
  }, [students, search, sortKey]);

  const downloadMockExamPdf = async () => {
    setMockExamPdfLoading(true);
    try {
      const { data } = await axios.get('/api/teacher/mock-exam/pdf', { headers: authHeaders(), responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `deneme-sinavi-${mockExam?.periodKey || ''}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { /* yok say */ }
    finally { setMockExamPdfLoading(false); }
  };

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
      <div className={`px-6 pt-10 pb-6 text-white flex justify-between items-start ${branding?.brandColor ? '' : 'bg-gradient-to-r from-slate-800 to-slate-900'}`}
        style={branding?.brandColor ? { background: `linear-gradient(to right, ${branding.brandColor}, ${branding.brandColor}dd)` } : undefined}>
        <div>
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt="Kurum logosu" className="h-9 mb-2 rounded bg-white/90 px-2 py-1 object-contain" />
          ) : (
            <div className="text-3xl mb-2">🧑‍🏫</div>
          )}
          <h1 className="text-xl font-bold">{teacherName}</h1>
          <p className="text-slate-400 text-sm mt-1">{branchName ? `${branchName} Şubesi` : 'Tüm Şubeler'}</p>
          {branding?.slogan && <p className="text-white/70 text-xs italic mt-0.5">{branding.slogan}</p>}
        </div>
        <button onClick={onLogout} className="text-xs bg-white/10 px-3 py-1.5 rounded-lg font-medium">Çıkış</button>
      </div>

      <div className="px-4 mt-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Yükleniyor...</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <div className="text-xl font-black text-slate-800">{totalStudents}</div>
                <div className="text-xs text-slate-500 mt-1">Öğrenci</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <div className={`text-xl font-black ${engagementRate >= 50 ? 'text-green-700' : engagementRate >= 25 ? 'text-orange-600' : 'text-red-600'}`}>%{engagementRate}</div>
                <div className="text-xs text-slate-500 mt-1">7 Gün Aktiflik</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <div className="text-xl font-black text-purple-700">{avgNet ?? '—'}</div>
                <div className="text-xs text-slate-500 mt-1">Ort. Net</div>
              </div>
            </div>

            {mockExam?.available && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-700 text-sm">📝 {mockExam.periodLabel}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Bu dönemin deneme sınavı — {mockExam.questions?.length ?? 0} soru, cevap anahtarı dahil</p>
                  </div>
                  <button onClick={() => setMockExamOpen(o => !o)} className="text-xs font-semibold text-violet-600 whitespace-nowrap">
                    {mockExamOpen ? 'Gizle' : 'Görüntüle'}
                  </button>
                </div>
                <button onClick={downloadMockExamPdf} disabled={mockExamPdfLoading} className="mt-3 w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
                  {mockExamPdfLoading ? 'Hazırlanıyor...' : '🖨️ Yazdırılabilir PDF İndir (cevap anahtarsız)'}
                </button>
                {mockExamOpen && (
                  <div className="mt-3 space-y-3 max-h-96 overflow-y-auto pr-1">
                    {mockExam.questions?.map((q, i) => (
                      <div key={q.id} className="bg-slate-50 rounded-xl p-3">
                        <div className="text-[10px] font-bold text-violet-600 uppercase tracking-wide mb-1">{q.subjectName}</div>
                        <p className="text-xs font-medium text-slate-800">{i + 1}. {q.text}</p>
                        <div className="mt-1.5 space-y-0.5 text-[11px]">
                          {(['A', 'B', 'C', 'D'] as const).map(letter => {
                            const optionText = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[letter];
                            const isCorrect = q.correctAnswer === letter;
                            return <div key={letter} className={isCorrect ? 'font-bold text-green-600' : 'text-slate-500'}>{letter}) {optionText} {isCorrect && '✓'}</div>;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h3 className="font-semibold text-slate-700 text-sm mb-1">🎯 Sınıfın En Zayıf Konuları</h3>
              <p className="text-xs text-slate-400 mb-3">Tüm öğrencilerin ortalamasına göre en çok zorlanılan konular</p>
              {classTopics.length === 0 ? (
                <div className="text-center text-slate-400 py-2 text-sm">Belirgin bir zayıf konu tespit edilmedi 🎉</div>
              ) : (
                <div className="space-y-1.5">
                  {classTopics.map((t, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2">
                      <div className="text-xs text-slate-700">{t.subjectIcon} {t.topicName} <span className="text-slate-400">({t.subjectName})</span></div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-red-600">{t.avgWeakness}</div>
                        <div className="text-[10px] text-slate-400">{t.studentCount} öğrenci</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-700 text-sm">Öğrenciler</h3>
                <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-600">
                  <option value="inactive">Pasiflik süresine göre</option>
                  <option value="net-asc">Nete göre (düşük → yüksek)</option>
                  <option value="net-desc">Nete göre (yüksek → düşük)</option>
                  <option value="name">İsme göre</option>
                </select>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Öğrenci veya aile ara..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-slate-400" />

              {visibleStudents.length === 0 ? (
                <div className="text-center text-slate-400 py-4 text-sm">
                  {students.length === 0 ? 'Henüz öğrenci bulunmuyor.' : 'Aramanızla eşleşen öğrenci yok.'}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {visibleStudents.map(s => (
                    <button key={s.studentId} onClick={() => setSelectedStudentId(s.studentId)}
                      className="w-full flex justify-between items-center bg-slate-50 hover:bg-slate-100 rounded-xl px-3 py-2 text-left transition-colors">
                      <div>
                        <div className="text-xs font-bold text-slate-700">{s.studentName}</div>
                        <div className="text-xs text-slate-400">{s.familyName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-600">Net: {s.latestMockNet ?? '—'}</div>
                        <div className={`text-xs ${s.daysInactive >= 14 ? 'text-red-600' : s.daysInactive >= 7 ? 'text-orange-600' : 'text-green-700'}`}>
                          {s.daysInactive >= 9999 ? 'Hiç aktivite yok' : `${s.daysInactive} gün pasif`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedStudentId !== null && (
        <StudentDetailPanel studentId={selectedStudentId} onClose={() => setSelectedStudentId(null)} />
      )}
    </div>
  );
}
