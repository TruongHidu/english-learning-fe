import { Navigate, Route, Routes } from 'react-router-dom'
import AuthInvalidationRedirect from '../guards/AuthInvalidationRedirect'
import GuestRoute from '../guards/GuestRoute'
import ProtectedRoute from '../guards/ProtectedRoute'
import PublicHomeRoute from '../guards/PublicHomeRoute'
import LearningLayout from '../layouts/LearningLayout'
import LandingPage from '../pages/LandingPage'
import AdminCourseListPage from '../pages/admin/AdminCourseListPage'
import AdminSectionListPage from '../pages/admin/AdminSectionListPage'
import AppSectionPage from '../pages/app/AppSectionPage'
import AuthPage from '../pages/auth/AuthPage'
import ForbiddenPage from '../pages/errors/ForbiddenPage'
import CourseSectionsPage from '../pages/learn/CourseSectionsPage'
import LearnPage from '../pages/learn/LearnPage'
import ProfilePage from '../pages/profile/ProfilePage'

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
        <Route element={<ProtectedRoute><LearningLayout /></ProtectedRoute>}>
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
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <LearningLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/courses" element={<AdminCourseListPage />} />
          <Route
            path="/admin/courses/:courseId/sections"
            element={<AdminSectionListPage />}
          />
        </Route>

        <Route path="/dashboard" element={<Navigate to="/learn" replace />} />
        <Route
          path="/403"
          element={<ProtectedRoute><ForbiddenPage /></ProtectedRoute>}
        />
      </Routes>
    </>
  )
}

export default AppRoutes
