import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import HomePage from './pages/public/HomePage';
import BookingPage from './pages/public/BookingPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardLayout from './components/admin/DashboardLayout';
import Overview from './pages/admin/Overview';
import AppointmentsMenu from './pages/admin/Appointments';
import ServicesMenu from './pages/admin/Services';
import HoursMenu from './pages/admin/BusinessHours';
import BlocksMenu from './pages/admin/BlockedDates';
import SettingsMenu from './pages/admin/CoachingSettings';

function ProtectedAdminRoute() {
  const { user, isAdmin, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <h2 className="text-2xl font-serif text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">
            You are signed in, but you are not authorized as an admin.
          </p>
          <button 
            onClick={() => {
              import('./lib/supabase').then(({supabase}) => supabase.auth.signOut());
            }}
            className="w-full bg-slate-900 text-white rounded-xl py-3 font-medium hover:bg-slate-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <DashboardLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/book/:serviceId" element={<BookingPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<ProtectedAdminRoute />}>
            <Route index element={<Overview />} />
            <Route path="appointments" element={<AppointmentsMenu />} />
            <Route path="services" element={<ServicesMenu />} />
            <Route path="hours" element={<HoursMenu />} />
            <Route path="blocks" element={<BlocksMenu />} />
            <Route path="settings" element={<SettingsMenu />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
