import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
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
import { supabase } from '@/lib/supabase';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import {
  BookOpen,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle,
  DollarSign,
} from 'lucide-react';

// Fallback notifications if real ones are empty
const getPlaceholderNotifications = (t: any) => [
  { title: 'Welcome', message: 'Welcome to your new real-time dashboard.', type: 'info' as const, time: 'Just now' },
];

export function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Fetch Student Profile
  const { data: studentProfile } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      if (!user?.email) return null;

      const query = supabase
        .from('students')
        .select('*')
        .ilike('email', user.email.trim());

      if (user.institutionId) {
        query.eq('institution_id', user.institutionId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Profile Fetch Error:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.email,
    staleTime: 1000 * 60,
  });

  // Use the hook for all data
  const { stats, assignments, attendanceRecords, grades, subjects } = useStudentDashboard(
    studentProfile?.id,
    studentProfile?.institution_id
  );

  // Get today's attendance status
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayRecord = attendanceRecords.find(r => r.date === today);
  const isAfterAbsentThreshold = new Date().getHours() >= 10;

  // 10. Fetch real academic events
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['upcoming-events', user?.institutionId || studentProfile?.institution_id],
    queryFn: async () => {
      const instId = user?.institutionId || studentProfile?.institution_id;
      if (!instId) return [];

      const { data, error } = await supabase
        .from('academic_events')
        .select('*')
        .eq('institution_id', instId)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!(user?.institutionId || studentProfile?.institution_id),
  });
  // 11. Calculate chart data from real records
  const chartAttendanceData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => {
    return { name: day, value: stats.attendancePercentage ? parseInt(stats.attendancePercentage) : 0 };
  });

  const chartGradeDistribution = [
    { name: 'Graded', value: grades.length },
    { name: 'Pending', value: assignments.filter(a => a.status === 'pending').length },
  ];

  return (
    <StudentLayout>
      <PageHeader
        title={`${t.common.welcome}, ${user?.name.split(' ')[0]}!`}
        subtitle={t.dashboard.overview}
      />

      {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
      <div className="stats-grid mb-6 sm:mb-8">
        <StatCard
          title="Subjects"
          value={subjects.length}
          icon={BookOpen}
          iconColor="text-student"
          change="Enrolled Courses"
        />
        <StatCard
          title="Attendance Status"
          value={
            todayRecord?.status === 'present' ? 'PRESENT' :
              todayRecord?.status === 'late' ? 'LATE' :
                todayRecord?.status === 'absent' ? 'ABSENT' :
                  (isAfterAbsentThreshold ? 'ABSENT' : 'NOT MARKED')
          }
          icon={CheckCircle}
          iconColor={
            todayRecord?.status === 'present' ? 'text-success' :
              todayRecord?.status === 'late' ? 'text-warning' :
                (todayRecord?.status === 'absent' || (!todayRecord && isAfterAbsentThreshold)) ? 'text-destructive' : 'text-muted-foreground'
          }
          change={stats.attendancePercentage}
          changeType={parseInt(stats.attendancePercentage) >= 75 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Average Grade"
          value={stats.averageGrade}
          icon={TrendingUp}
          iconColor="text-primary"
          change={`${grades.length} subjects graded`}
          changeType="positive"
        />
        <StatCard
          title="Academic Info"
          value={`${studentProfile?.class_name || 'N/A'}-${studentProfile?.section || ''}`}
          icon={Clock}
          iconColor="text-warning"
          change={studentProfile?.register_number || "No ID"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="lg:col-span-2 dashboard-card p-4 sm:p-6">
          <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Attendance Trend</h3>
          <div className="chart-container-responsive">
            <AreaChart data={chartAttendanceData} color="hsl(var(--student))" height={220} />
          </div>
        </div>
        <div className="dashboard-card p-4 sm:p-6">
          <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Assignment Progress</h3>
          <div className="chart-container-responsive">
            <DonutChart data={chartGradeDistribution} height={220} />
          </div>
        </div>
      </div>


    </StudentLayout>
  );
}
