import { Navigate, Route, Routes } from 'react-router-dom'
import AuthInvalidationRedirect from '../guards/AuthInvalidationRedirect'
import GuestRoute from '../guards/GuestRoute'
import ProtectedRoute from '../guards/ProtectedRoute'
import PublicHomeRoute from '../guards/PublicHomeRoute'
import { useAuth } from '../hooks/useAuth'
import AdminLayout from '../layouts/AdminLayout'
import LearningLayout from '../layouts/LearningLayout'
import LandingPage from '../pages/LandingPage'
import AdminCourseListPage from '../pages/admin/AdminCourseListPage'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminSectionListPage from '../pages/admin/AdminSectionListPage'
import AdminSectionTopicsPage from '../pages/admin/AdminSectionTopicsPage'
import AdminAIContentPage from '../pages/admin/AdminAIContentPage'
import AdminDiamondPackagePage from '../pages/admin/AdminDiamondPackagePage'
import AdminLessonDetailPage from '../pages/admin/AdminLessonDetailPage'
import AdminPaymentListPage from '../pages/admin/AdminPaymentListPage'
import AdminQuestionListPage from '../pages/admin/AdminQuestionListPage'
import AdminRevenuePage from '../pages/admin/AdminRevenuePage'
import AdminTopicDetailPage from '../pages/admin/AdminTopicDetailPage'
import AdminUserDetailPage from '../pages/admin/AdminUserDetailPage'
import AdminUserListPage from '../pages/admin/AdminUserListPage'
import AppSectionPage from '../pages/app/AppSectionPage'
import AuthPage from '../pages/auth/AuthPage'
import ForbiddenPage from '../pages/errors/ForbiddenPage'
import CourseSectionsPage from '../pages/learn/CourseSectionsPage'
import LearnPage from '../pages/learn/LearnPage'
import ProfilePage from '../pages/profile/ProfilePage'

function DashboardRedirect() {
  const { user } = useAuth()
  return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/learn'} replace />
}

function AppRoutes() {
  return (
    <>
      <AuthInvalidationRedirect />
      <Routes>
        <Route
          path="/"
          element={<PublicHomeRoute><LandingPage /></PublicHomeRoute>}
        />
        <Route
          path="/register"
          element={<GuestRoute><AuthPage mode="register" /></GuestRoute>}
        />
        <Route
          path="/login"
          element={<GuestRoute><AuthPage mode="login" /></GuestRoute>}
        />

        {/* Protected User Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <LearningLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/courses/:courseId" element={<CourseSectionsPage />} />
          <Route
            path="/pronunciation"
            element={<AppSectionPage section="pronunciation" />}
          />
          <Route
            path="/leaderboard"
            element={<AppSectionPage section="leaderboard" />}
          />
          <Route path="/quests" element={<AppSectionPage section="quests" />} />
          <Route path="/shop" element={<AppSectionPage section="shop" />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="courses" element={<AdminCourseListPage />} />
          <Route
            path="courses/:courseId"
            element={<AdminSectionListPage />}
          />
          <Route
            path="courses/:courseId/sections"
            element={<AdminSectionListPage />}
          />
          <Route path="sections/:sectionId/topics" element={<AdminSectionTopicsPage />} />
          <Route path="topics/:topicId" element={<AdminTopicDetailPage />} />
          <Route path="topics/:topicId/lessons" element={<AdminTopicDetailPage />} />
          <Route path="lessons/:lessonId" element={<AdminLessonDetailPage />} />
          <Route path="questions" element={<AdminQuestionListPage />} />
          <Route path="ai-content" element={<AdminAIContentPage />} />
          <Route path="users" element={<AdminUserListPage />} />
          <Route path="users/:userId" element={<AdminUserDetailPage />} />
          <Route path="payments" element={<AdminPaymentListPage />} />
          <Route path="payments/packages" element={<AdminDiamondPackagePage />} />
          <Route path="revenue" element={<AdminRevenuePage />} />
        </Route>

        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>}
        />
        <Route
          path="/403"
          element={<ProtectedRoute><ForbiddenPage /></ProtectedRoute>}
        />
      </Routes>
    </>
  )
}

export default AppRoutes
