import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import AdminLogin from '../pages/AdminLogin';
import Dashboard from '../pages/Dashboard';
import Courses from '../pages/Courses';
import Library from '../pages/Library';
import About from '../pages/About';
import NotFound from '../pages/NotFound';
import StudentOverview from '../pages/StudentOverview';
import StudentMyCourses from '../pages/StudentMyCourses';
import StudentAssignments from '../pages/StudentAssignments';
import StudentCertificates from '../pages/student/StudentCertificates';
import StudentProfile from '../pages/student/StudentProfile';
import SavedBooks from '../pages/SavedBooks';
import BookDetail from '../pages/BookDetail';
import CourseDetail from '../pages/CourseDetail';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import SupportCenter from '../pages/SupportCenter';
import Partnerships from '../pages/Partnerships';
import MaintenancePage from '../pages/MaintenancePage';
import CertificateVerificationPage from '../pages/CertificateVerificationPage';
import ForgotPassword from '../pages/ForgotPassword';
import PageLoader from './PageLoader';
import { useMaintenance } from '../context/MaintenanceContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Admin = lazy(() => import('../pages/AdminDashboard'));
const InstructorDashboard = lazy(() => import('../pages/InstructorDashboard'));
const InstructorOverview = lazy(() => import('../pages/InstructorOverview'));
const InstructorProfile = lazy(() => import('../pages/instructor/InstructorProfile'));
const ChatPage = lazy(() => import('../pages/ChatPage'));
const AddCourse = lazy(() => import('../pages/add-courses'));
const MyCourses = lazy(() => import('../pages/MyCourses'));
const EditCourse = lazy(() => import('../pages/EditCourse'));
const ManageAssignments = lazy(() => import('../pages/ManageAssignments'));
const SubmittedAssignments = lazy(() => import('../pages/SubmittedAssignments'));
const ManageCourseExam = lazy(() => import('../pages/ManageCourseExam'));
const VirtualLab = lazy(() => import('../pages/VirtualLab'));

const AdminOverview = lazy(() => import('../pages/admin/AdminOverview'));
const AdminRequests = lazy(() => import('../pages/admin/AdminRequests'));
const AdminInstructors = lazy(() => import('../pages/admin/AdminInstructors'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminCourses = lazy(() => import('../pages/admin/AdminCourses'));
const AdminCourseStudents = lazy(() => import('../pages/admin/AdminCourseStudents'));
const AdminLibrary = lazy(() => import('../pages/admin/AdminLibrary'));
const AdminAddBook = lazy(() => import('../pages/admin/AdminAddBook'));
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories'));
const AdminLibraryCategories = lazy(() => import('../pages/admin/AdminLibraryCategories'));
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'));
const AdminActivityLogs = lazy(() => import('../pages/admin/AdminActivityLogs'));
const AdminProfile = lazy(() => import('../pages/admin/AdminProfile'));

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -8 }
};

const pageTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.12
};

const PageWrapper = ({ children }) => {
  const location = useLocation();
  const rootKey = (location.pathname.startsWith('/admin-dashboard') || location.pathname.startsWith('/AdminDashboard'))
    ? '/admin-dashboard'
    : location.pathname.startsWith('/instructor-dashboard')
    ? '/instructor-dashboard'
    : location.pathname.startsWith('/dashboard')
    ? '/dashboard'
    : location.pathname;

  return (
    <motion.div
      key={rootKey}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full h-full"
    >
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </motion.div>
  );
};

export default function AnimatedRoutes({ StudentGuard, AdminGuard, InstructorGuard }) {
  const location = useLocation();
  const { isMaintenance } = useMaintenance();
  const { userRole } = useAuth();
  const { dir } = useLanguage();

  const isAdmin = userRole === 'admin';
  const currentPath = location.pathname;

  const isAllowedPath =
    currentPath === '/login-admin' ||
    currentPath.startsWith('/admin-dashboard') ||
    currentPath.toLowerCase() === '/admindashboard';

  if (isMaintenance && !isAdmin && !isAllowedPath) {
    return <MaintenancePage />;
  }

  return (
    <>
      {isMaintenance && isAdmin && (
        <div className="fixed bottom-4 start-4 z-[9999] bg-amber-500 text-stone-950 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 border border-amber-300 select-none animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
          <span>
            {dir === 'rtl' 
              ? 'وضع الصيانة مفعّل حالياً (الموقع متاح لك فقط كمسؤول)' 
              : 'Maintenance Mode Active (Website accessible to admins only)'}
          </span>
          <Link to="/admin-dashboard/settings" className="underline hover:text-white ms-1">
            {dir === 'rtl' ? 'الإعدادات' : 'Settings'}
          </Link>
        </div>
      )}

      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/login-trainer" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
          <Route path="/login-admin" element={<PageWrapper><AdminLogin /></PageWrapper>} />
          <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
        
        <Route path="/dashboard" element={<StudentGuard><PageWrapper><Dashboard /></PageWrapper></StudentGuard>}>
          <Route index element={<StudentOverview />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="my-courses" element={<StudentMyCourses />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="certificates" element={<StudentCertificates />} />
          <Route path="saved-books" element={<SavedBooks />} />
          <Route path="browse-courses" element={<Courses embedded={true} />} />
          <Route path="messages" element={<ChatPage />} />
        </Route>
        
        <Route path="/AdminDashboard" element={<Navigate to="/admin-dashboard" replace />} />
        <Route path="/admin-dashboard" element={<AdminGuard><PageWrapper><Admin /></PageWrapper></AdminGuard>}>
          <Route index element={<AdminOverview />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="instructors" element={<AdminInstructors />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="course-students/:courseId" element={<AdminCourseStudents />} />
          <Route path="courses/:courseId/students" element={<AdminCourseStudents />} />
          <Route path="course-categories" element={<AdminCategories />} />
          <Route path="add-course" element={<AddCourse />} />
          <Route path="edit-course/:id" element={<EditCourse />} />
          <Route path="library" element={<AdminLibrary />} />
          <Route path="library-categories" element={<AdminLibraryCategories />} />
          <Route path="add-book" element={<AdminAddBook />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="activity-logs" element={<AdminActivityLogs />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="messages" element={<ChatPage />} />
        </Route>
        
        <Route path="/instructor-dashboard" element={<InstructorGuard><PageWrapper><InstructorDashboard /></PageWrapper></InstructorGuard>}>
          <Route index element={<InstructorOverview />} />
          <Route path="profile" element={<InstructorProfile />} />
          <Route path="add-courses" element={<Navigate to="/instructor-dashboard/my-courses" replace />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="saved-books" element={<SavedBooks />} />
          <Route path="edit-course/:id" element={<EditCourse />} />
          <Route path="exam/:id" element={<ManageCourseExam />} />
          <Route path="assignments/:id" element={<ManageAssignments />} />
          <Route path="submissions/:id" element={<SubmittedAssignments />} />
          <Route path="messages" element={<ChatPage />} />
        </Route>
        
        <Route path="/courses" element={<PageWrapper><Courses /></PageWrapper>} />
        <Route path="/courses/:id" element={<PageWrapper><CourseDetail /></PageWrapper>} />
        <Route path="/library" element={<PageWrapper><Library /></PageWrapper>} />
        <Route path="/library/:id" element={<PageWrapper><BookDetail /></PageWrapper>} />
        <Route path="/verify-certificate/:code?" element={<PageWrapper><CertificateVerificationPage /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
        <Route path="/privacy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
        <Route path="/terms" element={<PageWrapper><TermsOfService /></PageWrapper>} />
        <Route path="/support" element={<PageWrapper><SupportCenter /></PageWrapper>} />
        <Route path="/partnerships" element={<PageWrapper><Partnerships /></PageWrapper>} />
        <Route path="/virtual-lab" element={<PageWrapper><VirtualLab /></PageWrapper>} />
        <Route path="/assignments" element={<Navigate to="/dashboard/assignments" replace />} />
        <Route path="/saved-books" element={<Navigate to="/dashboard/saved-books" replace />} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
    </>
  );
}
