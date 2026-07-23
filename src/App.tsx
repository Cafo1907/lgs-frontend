import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import PlacementChoicePage from './pages/student/PlacementChoicePage';
import PlacementExamInfoPage from './pages/student/PlacementExamInfoPage';
import ManualPlacementPage from './pages/student/ManualPlacementPage';
import StandardExamPage from './pages/student/StandardExamPage';
import PlacementComparisonPage from './pages/student/PlacementComparisonPage';
import PlacementDonePage from './pages/student/PlacementDonePage';
import StudentHome from './pages/student/StudentHome';
import ExamPage from './pages/student/ExamPage';
import ResultPage from './pages/student/ResultPage';
import MockExamPage from './pages/student/MockExamPage';
import MockExamDonePage from './pages/student/MockExamDonePage';
import WeeklySummaryPage from './pages/student/WeeklySummaryPage';
import TopicMapPage from './pages/student/TopicMapPage';
import TargetSchoolSetup from './pages/parent/TargetSchoolSetup';
import ParentHome from './pages/parent/ParentHome';
import AdminLogin from './pages/admin/AdminLogin';
import AdminPanel from './pages/admin/AdminPanel';
import TeacherLogin from './pages/teacher/TeacherLogin';
import TeacherHome from './pages/teacher/TeacherHome';
import InstitutionAdminLogin from './pages/institution/InstitutionAdminLogin';
import InstitutionAdminPanel from './pages/institution/InstitutionAdminPanel';
import TermsPage from './pages/legal/TermsPage';
import PrivacyPage from './pages/legal/PrivacyPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

function AdminRoute() {
  const [adminAuthed, setAdminAuthed] = useState(() => !!localStorage.getItem('superAdminToken'));
  const logout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminInfo');
    setAdminAuthed(false);
  };
  if (!adminAuthed) return <AdminLogin onLogin={() => setAdminAuthed(true)} />;
  return <AdminPanel onLogout={logout} />;
}

function TeacherRoute() {
  const [teacherAuthed, setTeacherAuthed] = useState(() => !!localStorage.getItem('teacherToken'));
  const logout = () => {
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherInfo');
    setTeacherAuthed(false);
  };
  if (!teacherAuthed) return <TeacherLogin onLogin={() => setTeacherAuthed(true)} />;
  return <TeacherHome onLogout={logout} />;
}

function InstitutionAdminRoute() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('institutionAdminToken'));
  const logout = () => {
    localStorage.removeItem('institutionAdminToken');
    localStorage.removeItem('institutionAdminInfo');
    setAuthed(false);
  };
  if (!authed) return <InstitutionAdminLogin onLogin={() => setAuthed(true)} />;
  return <InstitutionAdminPanel onLogout={logout} />;
}

function AppRoutes() {
  const { user, loading, login, logout, refreshUser } = useAuth();
  const [placementStep, setPlacementStep] = useState<'choice' | 'examInfo' | 'manualScore' | 'manualNets' | 'exam' | 'comparison'>('choice');
  const [comparisonData, setComparisonData] = useState<any>(null);
  const location = useLocation();

  if (location.pathname === '/admin') return <AdminRoute />;
  if (location.pathname === '/ogretmen') return <TeacherRoute />;
  if (location.pathname === '/kurum') return <InstitutionAdminRoute />;
  if (location.pathname === '/kullanim-sartlari') return <TermsPage />;
  if (location.pathname === '/gizlilik-politikasi') return <PrivacyPage />;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
    </div>
  );

  if (!user) return <LandingPage onLogin={login} />;

  if (!user.subscriptionExpiresAt || new Date() > new Date(user.subscriptionExpiresAt)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Abonelik Süresi Doldu</h2>
          <p className="text-slate-500 text-sm mb-4">Platformu kullanmaya devam etmek için aboneliğinizi yenileyin. Ödemenizi yaptıktan sonra erişiminiz aktif edilecektir.</p>
          {user.iban && (
            <div className="bg-slate-50 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs text-slate-400 font-medium mb-1">Havale / EFT için IBAN:</p>
              <p className="text-sm font-bold text-slate-700 tracking-wide break-all">{user.iban}</p>
              <p className="text-xs text-slate-400 mt-2">Açıklama kısmına aile adınızı yazmayı unutmayın.</p>
            </div>
          )}
          <p className="text-xs text-slate-400">Ödeme sonrası yöneticinizi bilgilendirin.</p>
          <button onClick={logout} className="mt-6 w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold">Çıkış Yap</button>
        </div>
      </div>
    );
  }

  if (user.mustChangePassword) {
    return <ChangePasswordPage onDone={refreshUser} />;
  }

  if (user.role === 'STUDENT') {
    if (user.isFirstLogin) {
      if (placementStep === 'choice') {
        return (
          <PlacementChoicePage
            onSelect={(mode) => setPlacementStep(mode === 'exam' ? 'examInfo' : mode === 'score' ? 'manualScore' : 'manualNets')}
          />
        );
      }
      if (placementStep === 'examInfo') {
        return <PlacementExamInfoPage onStart={() => setPlacementStep('exam')} onBack={() => setPlacementStep('choice')} />;
      }
      if (placementStep === 'manualScore') return <ManualPlacementPage mode="score" onDone={refreshUser} onBack={() => setPlacementStep('choice')} />;
      if (placementStep === 'manualNets') return <ManualPlacementPage mode="nets" onDone={refreshUser} onBack={() => setPlacementStep('choice')} />;
      if (placementStep === 'exam') return <StandardExamPage onDone={(data) => { setComparisonData(data); setPlacementStep('comparison'); }} />;
      if (placementStep === 'comparison' && comparisonData) return <PlacementComparisonPage {...comparisonData} onDone={refreshUser} />;
    }
    return (
      <Routes>
        <Route path="/" element={<StudentHome user={user} onLogout={logout} />} />
        <Route path="/exam/:examId" element={<ExamPage />} />
        <Route path="/result/:examId" element={<ResultPage onLogout={logout} />} />
        <Route path="/mock-exam" element={<MockExamPage />} />
        <Route path="/mock-exam-done" element={<MockExamDonePage />} />
        <Route path="/placement-done" element={<PlacementDonePage />} />
        <Route path="/weekly-summary" element={<WeeklySummaryPage />} />
        <Route path="/topic-map" element={<TopicMapPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (user.role === 'PARENT') {
    if (user.isFirstLogin) return <TargetSchoolSetup onDone={refreshUser} />;
    return (
      <Routes>
        <Route path="/" element={<ParentHome user={user} onLogout={logout} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return <div className="flex items-center justify-center min-h-screen text-slate-500">Bilinmeyen rol.</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
