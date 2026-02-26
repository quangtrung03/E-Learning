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
import Messages from './pages/MessagesEnhanced';
import StudyGroups from './pages/StudyGroups';
import StudyGroupDetail from './pages/StudyGroupDetail';
import StudyGroupCreate from './pages/StudyGroupCreate';
import LearningAnalytics from './pages/LearningAnalytics';
import PaymentCheckout from './pages/PaymentCheckout';
import PaymentHistory from './pages/PaymentHistory';
import PaymentReturn from './pages/PaymentReturn';
import DiscussionList from './pages/DiscussionList';
import DiscussionDetail from './pages/DiscussionDetail';
import DiscussionCreate from './pages/DiscussionCreate';
import SubmissionList from './pages/SubmissionList';
import AssignmentGrading from './pages/AssignmentGrading';
import AdminReviewManagement from './pages/AdminReviewManagement';
import AdminCouponManagement from './pages/AdminCouponManagement';
import CertificateVerification from './pages/CertificateVerification';
import InstructorProfile from './pages/InstructorProfile';
import AdminPaymentManagement from './pages/AdminPaymentManagement';
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
            path="/assignments/:assignmentId/submissions" 
            element={
              <ProtectedRoute>
                <SubmissionList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assignments/:assignmentId/submissions/:submissionId/grade" 
            element={
              <ProtectedRoute>
                <AssignmentGrading />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/courses/:courseId/discussions" 
            element={
              <ProtectedRoute>
                <DiscussionList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/courses/:courseId/discussions/create" 
            element={
              <ProtectedRoute>
                <DiscussionCreate />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/courses/:courseId/discussions/:discussionId" 
            element={
              <ProtectedRoute>
                <DiscussionDetail />
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
          <Route 
            path="/messages" 
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/study-groups" 
            element={
              <ProtectedRoute>
                <StudyGroups />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/study-groups/create" 
            element={
              <ProtectedRoute>
                <StudyGroupCreate />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/study-groups/:id" 
            element={
              <ProtectedRoute>
                <StudyGroupDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <LearningAnalytics />
              </ProtectedRoute>
            } 
          />
          
          {/* Payment Routes */}
          <Route 
            path="/payment/checkout/:courseId" 
            element={
              <ProtectedRoute>
                <PaymentCheckout />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment/history" 
            element={
              <ProtectedRoute>
                <PaymentHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment/return" 
            element={
              <ProtectedRoute>
                <PaymentReturn />
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
          <Route 
            path="/admin/reviews" 
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminReviewManagement />
                </AdminRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/coupons" 
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminCouponManagement />
                </AdminRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/payments" 
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminPaymentManagement />
                </AdminRoute>
              </ProtectedRoute>
            } 
          />
          
          {/* Public Routes */}
          <Route path="/certificates/verify/:hash" element={<CertificateVerification />} />
          <Route path="/instructors/:id" element={<InstructorProfile />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
  );
}

export default App;
