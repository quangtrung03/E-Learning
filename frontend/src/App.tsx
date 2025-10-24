import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Profile from './pages/Profile';
import EmailVerification from './pages/EmailVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';


import LessonManagement from './pages/LessonManagement';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersList from './pages/AdminUsersList';
import AdminCoursesList from './pages/AdminCoursesList';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminCourseDetail from './pages/AdminCourseDetail';
import AdminRequestForm from './pages/AdminRequestForm';
import AdminRequestManagement from './pages/AdminRequestManagement';
import AssignmentDetail from './pages/AssignmentDetail';
import MyCertificates from './pages/MyCertificates';
import { useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// Admin Route Component (require admin role)
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/courses" 
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            } 
          />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />


          <Route 
            path="/courses/:courseId/lessons" 
            element={
              <ProtectedRoute>
                <LessonManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute>
                <AdminUsersList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/courses" 
            element={
              <ProtectedRoute>
                <AdminCoursesList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users/:id" 
            element={
              <ProtectedRoute>
                <AdminUserDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/courses/:id" 
            element={
              <ProtectedRoute>
                <AdminCourseDetail />
              </ProtectedRoute>
            } 
          />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route 
            path="/forgot-password" 
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } 
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route 
            path="/assignments/:assignmentId" 
            element={
              <ProtectedRoute>
                <AssignmentDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-certificates" 
            element={
              <ProtectedRoute>
                <MyCertificates />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Request Routes */}
          <Route 
            path="/admin/validate/:token" 
            element={<AdminRequestForm />} 
          />
          <Route 
            path="/admin/requests" 
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminRequestManagement />
                </AdminRoute>
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
  );
}

export default App;
