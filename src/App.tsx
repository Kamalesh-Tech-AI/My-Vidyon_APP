import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { GenericPage } from "@/components/common/GenericPage";
import { TranslationProvider } from "@/i18n/TranslationContext";

// Layouts
import { StudentLayout } from "@/layouts/StudentLayout";
import { FacultyLayout } from "@/layouts/FacultyLayout";
import { InstitutionLayout } from "@/layouts/InstitutionLayout";
import { AdminLayout } from "@/layouts/AdminLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { LoginPage } from "./pages/auth/LoginPage";

// Student Pages
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { StudentCourses } from "./pages/student/StudentCourses";
import { StudentAttendance } from "./pages/student/StudentAttendance";
import { StudentAssignments } from "./pages/student/StudentAssignments";
import { StudentTimetable } from "./pages/student/StudentTimetable";
import { StudentGrades } from "./pages/student/StudentGrades";
import { StudentMaterials } from "./pages/student/StudentMaterials";
import { StudentFees } from "./pages/student/StudentFees";
import { StudentCertificates } from "./pages/student/StudentCertificates";
import { StudentNotifications } from "./pages/student/StudentNotifications";
import { StudentAITutor } from "./pages/student/StudentAITutor";

// Faculty Pages
import { FacultyDashboard } from "./pages/faculty/FacultyDashboard";
import { FacultyCourses } from "./pages/faculty/FacultyCourses";
import { FacultyAttendance } from "./pages/faculty/FacultyAttendance";
import { FacultyAssignments } from "./pages/faculty/FacultyAssignments";
import { FacultyMarks } from "./pages/faculty/FacultyMarks";
import { FacultyExams } from "./pages/faculty/FacultyExams";
import { FacultyAnalytics } from "./pages/faculty/FacultyAnalytics";
import { FacultyStudents } from "./pages/faculty/FacultyStudents";
import { FacultyAnnouncements } from "./pages/faculty/FacultyAnnouncements";
import { FacultyLeave } from "./pages/faculty/FacultyLeave";
import { CreateAssignment } from "./pages/faculty/CreateAssignment";

// Institution Pages
import { InstitutionDashboard } from "./pages/institution/InstitutionDashboard";
import { InstitutionDepartments } from "./pages/institution/InstitutionDepartments";
import { InstitutionCourses } from "./pages/institution/InstitutionCourses";
import { InstitutionFaculty } from "./pages/institution/InstitutionFaculty";
import { InstitutionCalendar } from "./pages/institution/InstitutionCalendar";
import { InstitutionAdmissions } from "./pages/institution/InstitutionAdmissions";
import { InstitutionFees } from "./pages/institution/InstitutionFees";
import { InstitutionAnalytics } from "./pages/institution/InstitutionAnalytics";
import { InstitutionReports } from "./pages/institution/InstitutionReports";
import { InstitutionSettings } from "./pages/institution/InstitutionSettings";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminInstitutions } from "./pages/admin/AdminInstitutions";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AddInstitution } from "./pages/admin/AddInstitution";
import { InstitutionDetail } from "./pages/admin/InstitutionDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TranslationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Student Routes */}
              <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/courses" element={<ProtectedRoute allowedRoles={['student']}><StudentCourses /></ProtectedRoute>} />
              <Route path="/student/timetable" element={<ProtectedRoute allowedRoles={['student']}><StudentTimetable /></ProtectedRoute>} />
              <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />
              <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={['student']}><StudentAssignments /></ProtectedRoute>} />
              <Route path="/student/grades" element={<ProtectedRoute allowedRoles={['student']}><StudentGrades /></ProtectedRoute>} />
              <Route path="/student/materials" element={<ProtectedRoute allowedRoles={['student']}><StudentMaterials /></ProtectedRoute>} />
              <Route path="/student/fees" element={<ProtectedRoute allowedRoles={['student']}><StudentFees /></ProtectedRoute>} />
              <Route path="/student/certificates" element={<ProtectedRoute allowedRoles={['student']}><StudentCertificates /></ProtectedRoute>} />
              <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={['student']}><StudentNotifications /></ProtectedRoute>} />
              <Route path="/student/ai-tutor" element={<ProtectedRoute allowedRoles={['student']}><StudentAITutor /></ProtectedRoute>} />

              {/* Faculty Routes */}
              <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
              <Route path="/faculty/courses" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyCourses /></ProtectedRoute>} />
              <Route path="/faculty/attendance" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyAttendance /></ProtectedRoute>} />
              <Route path="/faculty/assignments" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyAssignments /></ProtectedRoute>} />
              <Route path="/faculty/assignments/create" element={<ProtectedRoute allowedRoles={['faculty']}><CreateAssignment /></ProtectedRoute>} />
              <Route path="/faculty/marks" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyMarks /></ProtectedRoute>} />
              <Route path="/faculty/exams" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyExams /></ProtectedRoute>} />
              <Route path="/faculty/analytics" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyAnalytics /></ProtectedRoute>} />
              <Route path="/faculty/students" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyStudents /></ProtectedRoute>} />
              <Route path="/faculty/announcements" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyAnnouncements /></ProtectedRoute>} />
              <Route path="/faculty/leave" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyLeave /></ProtectedRoute>} />

              {/* Institution Routes */}
              <Route path="/institution" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionDashboard /></ProtectedRoute>} />
              <Route path="/institution/departments" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionDepartments /></ProtectedRoute>} />
              <Route path="/institution/courses" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionCourses /></ProtectedRoute>} />
              <Route path="/institution/faculty" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionFaculty /></ProtectedRoute>} />
              <Route path="/institution/calendar" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionCalendar /></ProtectedRoute>} />
              <Route path="/institution/admissions" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionAdmissions /></ProtectedRoute>} />
              <Route path="/institution/fees" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionFees /></ProtectedRoute>} />
              <Route path="/institution/analytics" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionAnalytics /></ProtectedRoute>} />
              <Route path="/institution/reports" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionReports /></ProtectedRoute>} />
              <Route path="/institution/settings" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionSettings /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/add-institution" element={<ProtectedRoute allowedRoles={['admin']}><AddInstitution /></ProtectedRoute>} />
              <Route path="/admin/institutions" element={<ProtectedRoute allowedRoles={['admin']}><AdminInstitutions /></ProtectedRoute>} />
              <Route path="/admin/institutions/:institutionId" element={<ProtectedRoute allowedRoles={['admin']}><InstitutionDetail /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['admin']}><GenericPage title="Roles & Permissions" subtitle="Manage user roles and permissions" Layout={AdminLayout}><></></GenericPage></ProtectedRoute>} />
              <Route path="/admin/api" element={<ProtectedRoute allowedRoles={['admin']}><GenericPage title="API Management" subtitle="Manage API keys and access" Layout={AdminLayout}><></></GenericPage></ProtectedRoute>} />
              <Route path="/admin/database" element={<ProtectedRoute allowedRoles={['admin']}><GenericPage title="Database" subtitle="Database management and backups" Layout={AdminLayout}><></></GenericPage></ProtectedRoute>} />
              <Route path="/admin/monitoring" element={<ProtectedRoute allowedRoles={['admin']}><GenericPage title="Monitoring" subtitle="System monitoring and logs" Layout={AdminLayout}><></></GenericPage></ProtectedRoute>} />
              <Route path="/admin/features" element={<ProtectedRoute allowedRoles={['admin']}><GenericPage title="Feature Flags" subtitle="Manage feature toggles" Layout={AdminLayout}><></></GenericPage></ProtectedRoute>} />
              <Route path="/admin/config" element={<ProtectedRoute allowedRoles={['admin']}><GenericPage title="Global Config" subtitle="Global system configuration" Layout={AdminLayout}><></></GenericPage></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><GenericPage title="Settings" subtitle="Admin settings and preferences" Layout={AdminLayout}><></></GenericPage></ProtectedRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </TranslationProvider>
  </QueryClientProvider>
);

export default App;
