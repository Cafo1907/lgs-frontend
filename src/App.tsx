import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import PlacementExamPage from './pages/student/PlacementExamPage';
import PlacementDonePage from './pages/student/PlacementDonePage';
import StudentHome from './pages/student/StudentHome';
import ExamPage from './pages/student/ExamPage';
import ResultPage from './pages/student/ResultPage';
import MockExamPage from './pages/student/MockExamPage';
import MockExamDonePage from './pages/student/MockExamDonePage';
import TargetSchoolSetup from './pages/parent/TargetSchoolSetup';
import ParentHome from './pages/parent/ParentHome';

function AppRoutes() {
  const { user, loading, login, logout, refreshUser } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
    </div>
  );

  if (!user) return <LoginPage onLogin={login} />;

  if (user.role === 'STUDENT') {
    if (user.isFirstLogin) return <PlacementExamPage />;
    return (
      <Routes>
        <Route path="/" element={<StudentHome user={user} onLogout={logout} />} />
        <Route path="/exam/:examId" element={<ExamPage />} />
        <Route path="/result/:examId" element={<ResultPage onLogout={logout} />} />
        <Route path="/mock-exam" element={<MockExamPage />} />
        <Route path="/mock-exam-done" element={<MockExamDonePage />} />
        <Route path="/placement-done" element={<PlacementDonePage />} />
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
