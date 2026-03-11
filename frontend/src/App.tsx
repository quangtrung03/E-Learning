import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import MyCourses from './pages/MyCourses';
import Profile from './pages/Profile';
import EmailVerification from './pages/EmailVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';


import LessonViewer from './pages/LessonViewer';
import AdminRequestForm from './pages/AdminRequestForm';
import AssignmentDetail from './pages/AssignmentDetail';
import MyCertificates from './pages/MyCertificates';
import StudyGroups from './pages/StudyGroups';
import StudyGroupDetail from './pages/StudyGroupDetail';
import StudyGroupCreate from './pages/StudyGroupCreate';
import PaymentCheckout from './pages/PaymentCheckout';
import PaymentHistory from './pages/PaymentHistory';
import PaymentReturn from './pages/PaymentReturn';
import PaymentSimulate from './pages/PaymentSimulate';
import DiscussionList from './pages/DiscussionList';
import DiscussionDetail from './pages/DiscussionDetail';
import DiscussionCreate from './pages/DiscussionCreate';
import SubmissionList from './pages/SubmissionList';
import AssignmentGrading from './pages/AssignmentGrading';
import CertificateVerification from './pages/CertificateVerification';
import InstructorProfile from './pages/InstructorProfile';
import { useAuth } from './context/AuthContext';

const LessonManagement = lazy(() => import('./pages/LessonManagement'));

const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const LearningAnalytics = lazy(() => import('./pages/LearningAnalytics'));

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUsersList = lazy(() => import('./pages/AdminUsersList'));
const AdminCoursesList = lazy(() => import('./pages/AdminCoursesList'));
const AdminUserDetail = lazy(() => import('./pages/AdminUserDetail'));
const AdminCourseDetail = lazy(() => import('./pages/AdminCourseDetail'));
const AdminRequestManagement = lazy(() => import('./pages/AdminRequestManagement'));
const AdminReviewManagement = lazy(() => import('./pages/AdminReviewManagement'));
const AdminCouponManagement = lazy(() => import('./pages/AdminCouponManagement'));
const AdminPaymentManagement = lazy(() => import('./pages/AdminPaymentManagement'));
const AdminDefaultThumbnails = lazy(() => import('./pages/AdminDefaultThumbnails'));
const AdminMediaManager = lazy(() => import('./pages/AdminMediaManager'));

const Messages = lazy(() => import('./pages/MessagesEnhanced'));
const TestimonialProfile = lazy(() => import('./pages/TestimonialProfile'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
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
              path="/courses/:courseId/learn/:lessonId"
              element={
                <ProtectedRoute>
                  <LessonViewer />
                </ProtectedRoute>
              }
            />
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
              path="/my-courses" 
              element={
                <ProtectedRoute>
                  <MyCourses />
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
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminUsersList />
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/courses" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminCoursesList />
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/:id" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminUserDetail />
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/courses/:id" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminCourseDetail />
                  </AdminRoute>
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

          <Route 
            path="/payment/simulate" 
            element={
              <ProtectedRoute>
                <PaymentSimulate />
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

          <Route 
            path="/admin/settings/thumbnails" 
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminDefaultThumbnails />
                </AdminRoute>
              </ProtectedRoute>
            } 
          />

          <Route
            path="/admin/media"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminMediaManager />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          {/* Public Routes */}
          <Route path="/certificates/verify/:hash" element={<CertificateVerification />} />
          <Route path="/instructors/:id" element={<InstructorProfile />} />
          <Route path="/testimonials/:slug" element={<TestimonialProfile />} />
          
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
  );
}

export default App;
