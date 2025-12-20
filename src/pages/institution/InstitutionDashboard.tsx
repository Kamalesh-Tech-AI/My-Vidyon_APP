import { InstitutionLayout } from '@/layouts/InstitutionLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { AreaChart } from '@/components/charts/AreaChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { BarChart } from '@/components/charts/BarChart';
import { useAuth } from '@/context/AuthContext';
import {
  GraduationCap,
  Users,
  Building,
  TrendingUp,
  DollarSign,
  UserPlus,
} from 'lucide-react';

const enrollmentTrend = [
  { name: 'Jan', value: 850 },
  { name: 'Feb', value: 920 },
  { name: 'Mar', value: 1050 },
  { name: 'Apr', value: 1180 },
  { name: 'May', value: 1250 },
  { name: 'Jun', value: 1320 },
];

const classDistribution = [
  { name: 'Grade 10', value: 250 },
  { name: 'Grade 9', value: 280 },
  { name: 'Grade 8', value: 220 },
  { name: 'Grade 11', value: 180 },
  { name: 'Grade 12', value: 150 },
];

const feeCollection = [
  { name: 'Jan', value: 1.2 },
  { name: 'Feb', value: 1.5 },
  { name: 'Mar', value: 1.8 },
  { name: 'Apr', value: 2.1 },
];

const recentAdmissions = [
  { id: 1, name: 'James Wilson', program: 'Grade 10-A', date: 'Dec 15, 2025', status: 'confirmed' },
  { id: 2, name: 'Olivia Martinez', program: 'Grade 9-B', date: 'Dec 14, 2025', status: 'pending' },
  { id: 3, name: 'William Anderson', program: 'Grade 8-C', date: 'Dec 14, 2025', status: 'confirmed' },
  { id: 4, name: 'Sophia Thomas', program: 'Grade 11-A', date: 'Dec 13, 2025', status: 'documents' },
  { id: 5, name: 'Benjamin Jackson', program: 'Grade 12-B', date: 'Dec 12, 2025', status: 'confirmed' },
];

const topPerformingDepts = [
  { department: 'Computer Science', students: 420, faculty: 28, avgGPA: 3.65, placement: '92%' },
  { department: 'Electrical Eng.', students: 380, faculty: 24, avgGPA: 3.52, placement: '88%' },
  { department: 'Business Admin.', students: 340, faculty: 22, avgGPA: 3.48, placement: '85%' },
  { department: 'Mechanical Eng.', students: 310, faculty: 20, avgGPA: 3.41, placement: '82%' },
];

export function InstitutionDashboard() {
  const { user } = useAuth();

  const admissionColumns = [
    { key: 'name', header: 'Student Name' },
    { key: 'program', header: 'Program' },
    { key: 'date', header: 'Application Date' },
    {
      key: 'status',
      header: 'Status',
      render: (item: typeof recentAdmissions[0]) => {
        const variants: Record<string, 'success' | 'warning' | 'info'> = {
          confirmed: 'success',
          pending: 'warning',
          documents: 'info',
        };
        return <Badge variant={variants[item.status]}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Badge>;
      },
    },
  ];

  const deptColumns = [
    { key: 'department', header: 'Department' },
    { key: 'students', header: 'Students' },
    { key: 'faculty', header: 'Faculty' },
    { key: 'avgGPA', header: 'Avg. GPA' },
    { key: 'placement', header: 'Placement Rate' },
  ];

  return (
    <InstitutionLayout>
      <PageHeader
        title="Institution Overview"
        subtitle={`${user?.name} • Academic Year 2025-26`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value="2,450"
          icon={GraduationCap}
          iconColor="text-institution"
          change="+180 this semester"
          changeType="positive"
        />
        <StatCard
          title="Total Teachers"
          value={125}
          icon={Users}
          iconColor="text-faculty"
          change="+4 this month"
        />
        <StatCard
          title="Total Classes"
          value={45}
          icon={Building}
          iconColor="text-institution"
          change="Across all grades"
        />
        <StatCard
          title="Revenue (YTD)"
          value="$12.5M"
          icon={DollarSign}
          iconColor="text-success"
          change="+15% vs last year"
          changeType="positive"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 dashboard-card">
          <h3 className="font-semibold mb-4">Enrollment Trend</h3>
          <AreaChart data={enrollmentTrend} color="hsl(var(--institution))" height={280} />
        </div>
        <div className="dashboard-card pt-6">
          <h3 className="font-semibold mb-6">Class Enrollment Distribution</h3>
          <div className="h-[300px]">
            <DonutChart data={classDistribution} />
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Recent Admissions */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Recent Admissions</h3>
            </div>
            <a href="/institution/admissions" className="text-sm text-primary hover:underline">View All</a>
          </div>
          <DataTable columns={admissionColumns} data={recentAdmissions} />
        </div>

        {/* Fee Collection */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <h3 className="font-semibold">Fee Collection (in M)</h3>
            </div>
          </div>
          <BarChart data={feeCollection} color="hsl(var(--success))" height={280} />
        </div>
      </div>

      {/* Department Performance */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Department Performance</h3>
          <a href="/institution/departments" className="text-sm text-primary hover:underline">Manage Departments</a>
        </div>
        <DataTable columns={deptColumns} data={topPerformingDepts} />
      </div>
    </InstitutionLayout>
  );
}
