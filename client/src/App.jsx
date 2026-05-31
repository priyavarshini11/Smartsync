import React, { useState, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import SplashScreen from './components/UI/SplashScreen';
import AppShell from './components/UI/AppShell';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import StudentDashboard from './pages/StudentDashboard';
import FavoritesPage from './pages/FavoritesPage';
import StudentFaculty from './pages/StudentFaculty';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyUpload from './pages/FacultyUpload';
import FacultyUploads from './pages/FacultyUploads';
import AdminOverview from './pages/AdminOverview';
import AdminTaxonomy from './pages/AdminTaxonomy';
import AdminUpload from './pages/AdminUpload';
import AdminUsers from './pages/AdminUsers';
import AdminRecycle from './pages/AdminRecycle';
import AdminResourceBrowser from './pages/AdminResourceBrowser';
import AdminAccess from './pages/AdminAccess';

function getRoleHome(role) {
  if (role === 'admin' || role === 'admin_faculty') return '/admin';
  if (role === 'faculty') return '/faculty';
  return '/student';
}

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user, isOnboarded, needsUsername } = useContext(AuthContext);
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading...</p></div>;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  // If user needs to set username, let them stay on /auth page — don't redirect away
  if (needsUsername) return <Navigate to="/auth?step=username" replace />;
  
  const isStudentType = user.role === 'student' || user.role === 'cr';
  if (isStudentType && !isOnboarded) return <Navigate to="/onboarding" replace />;
  
  const effectiveRole = user.role === 'admin_faculty' ? 'admin' 
                      : user.role === 'cr' ? 'student' 
                      : user.role;

  if (roles && !roles.includes(effectiveRole)) return <Navigate to={getRoleHome(user.role)} replace />;
  return children;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, user, loading, needsUsername, isOnboarded } = useContext(AuthContext);

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  // Determine if we should auto-redirect from /auth
  const isStudentType = user?.role === 'student' || user?.role === 'cr';
  const shouldRedirectFromAuth = isAuthenticated && !needsUsername && !loading &&
    (!isStudentType || isOnboarded);

  return (
    <Router>
      <Routes>
        {/* Auth — only redirect if fully authenticated + onboarded */}
        <Route path="/auth" element={shouldRedirectFromAuth ? <Navigate to={getRoleHome(user?.role)} replace /> : <AuthPage />} />
        <Route path="/onboarding" element={
          !isAuthenticated && !loading ? <Navigate to="/auth" replace /> : <OnboardingPage />
        } />

        {/* Student */}
        <Route path="/student" element={<ProtectedRoute roles={['student']}><AppShell><StudentDashboard /></AppShell></ProtectedRoute>} />
        <Route path="/student/favorites" element={<ProtectedRoute roles={['student']}><AppShell><FavoritesPage /></AppShell></ProtectedRoute>} />
        <Route path="/student/faculty" element={<ProtectedRoute roles={['student']}><AppShell><StudentFaculty /></AppShell></ProtectedRoute>} />

        {/* Faculty */}
        <Route path="/faculty" element={<ProtectedRoute roles={['faculty']}><AppShell><FacultyDashboard /></AppShell></ProtectedRoute>} />
        <Route path="/faculty/upload" element={<ProtectedRoute roles={['faculty']}><AppShell><FacultyUpload /></AppShell></ProtectedRoute>} />
        <Route path="/faculty/my-uploads" element={<ProtectedRoute roles={['faculty']}><AppShell><FacultyUploads /></AppShell></ProtectedRoute>} />
        <Route path="/faculty/users" element={<ProtectedRoute roles={['faculty']}><AppShell><AdminUsers /></AppShell></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AppShell><AdminOverview /></AppShell></ProtectedRoute>} />
        <Route path="/admin/taxonomy" element={<ProtectedRoute roles={['admin']}><AppShell><AdminTaxonomy /></AppShell></ProtectedRoute>} />
        <Route path="/admin/upload" element={<ProtectedRoute roles={['admin']}><AppShell><AdminUpload /></AppShell></ProtectedRoute>} />
        <Route path="/admin/my-uploads" element={<ProtectedRoute roles={['admin']}><AppShell><FacultyUploads /></AppShell></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AppShell><AdminUsers /></AppShell></ProtectedRoute>} />
        <Route path="/admin/recycle" element={<ProtectedRoute roles={['admin']}><AppShell><AdminRecycle /></AppShell></ProtectedRoute>} />
        <Route path="/admin/resources" element={<ProtectedRoute roles={['admin']}><AppShell><AdminResourceBrowser /></AppShell></ProtectedRoute>} />
        <Route path="/admin/access" element={<ProtectedRoute roles={['admin']}><AppShell><AdminAccess /></AppShell></ProtectedRoute>} />

        {/* Default */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
