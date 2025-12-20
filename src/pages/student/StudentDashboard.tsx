import { StudentLayout } from '@/layouts/StudentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { CourseCard } from '@/components/cards/CourseCard';
import { AssignmentCard } from '@/components/cards/AssignmentCard';
import { NotificationCard } from '@/components/cards/NotificationCard';
import { AreaChart } from '@/components/charts/AreaChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/i18n/TranslationContext';
import {
  BookOpen,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle,
} from 'lucide-react';

const attendanceData = [
  { name: 'Mon', value: 95 },
  { name: 'Tue', value: 88 },
  { name: 'Wed', value: 92 },
  { name: 'Thu', value: 100 },
  { name: 'Fri', value: 85 },
  { name: 'Sat', value: 0 },
];

const gradeDistribution = [
  { name: 'A Grade', value: 4 },
  { name: 'B Grade', value: 2 },
  { name: 'C Grade', value: 1 },
];

const enrolledSubjects = [
  { title: 'Mathematics', code: 'Grade 10', instructor: 'Dr. Smith', progress: 75, students: 45, schedule: 'Mon, Wed 10:00 AM' },
  { title: 'General Science', code: 'Grade 10', instructor: 'Prof. Johnson', progress: 60, students: 52, schedule: 'Tue, Thu 2:00 PM' },
  { title: 'English Literature', code: 'Grade 10', instructor: 'Ms. Davis', progress: 85, students: 38, schedule: 'Mon, Fri 11:00 AM' },
];

const upcomingAssignments = [
  { title: 'Algebra Homework', course: 'Mathematics', dueDate: 'Dec 22, 2025', status: 'pending' as const },
  { title: 'Physics Lab Report', course: 'General Science', dueDate: 'Dec 20, 2025', status: 'submitted' as const },
  { title: 'Shakespeare Essay', course: 'English Literature', dueDate: 'Dec 18, 2025', status: 'graded' as const, grade: '95', maxGrade: '100' },
];

const notifications = [
  { title: 'Assignment Graded', message: 'Your Shakespeare Essay has been graded. You scored 95/100.', type: 'success' as const, time: '2 hours ago' },
  { title: 'New Material Uploaded', message: 'New lecture notes for Mathematics have been uploaded.', type: 'info' as const, time: '5 hours ago' },
  { title: 'Exam Reminder', message: 'Your Unit Test - II for Mathematics is scheduled for next Monday.', type: 'warning' as const, time: '1 day ago' },
];

export function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <StudentLayout>
      <PageHeader
        title={`${t.common.welcome}, ${user?.name.split(' ')[0]}!`}
        subtitle={t.dashboard.overview}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Subjects"
          value={3}
          icon={BookOpen}
          iconColor="text-student"
          change="Academic Year 2025"
        />
        <StatCard
          title="Attendance Rate"
          value="92%"
          icon={CheckCircle}
          iconColor="text-success"
          change="+3% this month"
          changeType="positive"
        />
        <StatCard
          title="Current CGPA"
          value="3.75"
          icon={TrendingUp}
          iconColor="text-primary"
          change="+0.15 from last sem"
          changeType="positive"
        />
        <StatCard
          title="Pending Tasks"
          value={4}
          icon={Clock}
          iconColor="text-warning"
          change="2 due this week"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 dashboard-card">
          <h3 className="font-semibold mb-4">Weekly Attendance</h3>
          <AreaChart data={attendanceData} color="hsl(var(--student))" height={250} />
        </div>
        <div className="dashboard-card">
          <h3 className="font-semibold mb-4">Grade Distribution</h3>
          <DonutChart data={gradeDistribution} height={250} />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Courses */}
        <div className="mb-8 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">My Subjects</h3>
            <a href="/student/courses" className="text-sm text-primary hover:underline">View All</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledSubjects.map((course) => (
              <CourseCard key={course.code} {...course} />
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="dashboard-card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Upcoming Events</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">22</div>
                  <div className="text-xs text-muted-foreground">Dec</div>
                </div>
                <div>
                  <p className="font-medium text-sm">Mid-Semester Exam</p>
                  <p className="text-xs text-muted-foreground">CS201 • 10:00 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">25</div>
                  <div className="text-xs text-muted-foreground">Dec</div>
                </div>
                <div>
                  <p className="font-medium text-sm">Project Presentation</p>
                  <p className="text-xs text-muted-foreground">CS205 • 2:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assignments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Assignments</h3>
              <a href="/student/assignments" className="text-sm text-primary hover:underline">View All</a>
            </div>
            <div className="space-y-3">
              {upcomingAssignments.map((assignment, index) => (
                <AssignmentCard key={index} {...assignment} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Notifications</h3>
          <a href="/student/notifications" className="text-sm text-primary hover:underline">View All</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notifications.map((notification, index) => (
            <NotificationCard key={index} {...notification} />
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}
