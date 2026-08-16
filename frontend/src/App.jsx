import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import DocumentsList from './pages/Documents/DocumentsList';
import UploadReport from './pages/Documents/UploadReport';
import VerificationQueue from './pages/Verification/VerificationQueue';
import PatientsList from './pages/Patients/PatientsList';
import AnalysisResults from './pages/Analysis/AnalysisResults';
import ReportsPage from './pages/Reports/ReportsPage';
import AuditLogsPage from './pages/AuditLogs/AuditLogsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents" element={<DocumentsList />} />
          <Route path="/documents/upload" element={<UploadReport />} />
          <Route path="/patients" element={<PatientsList />} />
          <Route path="/verification" element={<VerificationQueue />} />
          <Route path="/analysis" element={<AnalysisResults />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
