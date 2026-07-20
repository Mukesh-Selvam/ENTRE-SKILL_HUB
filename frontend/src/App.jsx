import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GuestBanner from './components/GuestBanner';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Ideas from './pages/Ideas';
import IdeaDetail from './pages/IdeaDetail';
import Mentors from './pages/Mentors';
import MentorPanel from './pages/MentorPanel';
import Resources from './pages/Resources';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';

function NotFound() {
  return (
    <div className="page-wrap page-section text-center py-24">
      <p className="section-label mb-3">404</p>
      <h1 className="page-title mb-3">Page not found</h1>
      <p className="text-ink-soft mb-8">That page doesn't exist or has been moved.</p>
      <a href="/" className="btn-primary">Back to home</a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <div className="min-h-screen flex flex-col font-body bg-paper">
          <Navbar />
          <GuestBanner />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/ideas" element={<Ideas />} />
              <Route path="/ideas/:id" element={<IdeaDetail />} />
              <Route path="/mentors" element={<Mentors />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/mentor-panel" element={<ProtectedRoute role="mentor"><MentorPanel /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
