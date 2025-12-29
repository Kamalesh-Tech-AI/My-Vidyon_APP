import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  IndianRupee,
  CalendarCheck,
  UserPlus,
  FileText,
  CheckCircle,
  Bell
} from 'lucide-react';

const recentActivities = [
  { id: 1, action: 'Fee Payment Received', user: 'Rohan Kumar (Class 10-A)', time: '10 mins ago', type: 'success', amount: '₹15,000' },
  { id: 2, action: 'New Admission Inquiry', user: 'Priya Sharma (Grade 1)', time: '1 hour ago', type: 'info', amount: '-' },
  { id: 3, action: 'Staff Leave Request', user: 'Mrs. Geetha (Math)', time: '2 hours ago', type: 'warning', amount: '2 Days' },
  { id: 4, action: 'Notice Circulated', user: 'Principal Office', time: '4 hours ago', type: 'default', amount: 'Exam Schedule' },
  { id: 5, action: 'Attendance Alert', user: 'Class 9-B', time: '5 hours ago', type: 'destructive', amount: '85% Present' },
];

export function AdminDashboard() {
  const navigate = useNavigate();

  const activityColumns = [
    { key: 'action', header: 'Activity / Event' },
    { key: 'user', header: 'Related To' },
    { key: 'amount', header: 'Details/Amount' },
    { key: 'time', header: 'Time' },
    {
      key: 'type',
      header: 'Status',
      render: (item: typeof recentActivities[0]) => {
        const variants: Record<string, 'success' | 'warning' | 'info' | 'destructive' | 'default'> = {
          success: 'success',
          info: 'info',
          warning: 'warning',
          destructive: 'destructive',
          default: 'default',
        };
        return <Badge variant={variants[item.type]}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Badge>;
      },
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Admin Dashboard"
        subtitle="School Overview and Administration Control Center"
        actions={
          <Button className="btn-primary flex items-center gap-2">
            <span>Academic Year 2025-26</span>
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="stats-grid mb-6 sm:mb-8">
        <StatCard
          title="Total Students"
          value="2,450"
          icon={GraduationCap}
          iconColor="text-primary"
          change="+12 New Admissions"
          changeType="positive"
        />
        <StatCard
          title="Teaching Staff"
          value="125"
          icon={Users}
          iconColor="text-success"
          change="98% Present Today"
          changeType="positive"
        />
        <StatCard
          title="Fee Collection (Today)"
          value="₹1.2L"
          icon={IndianRupee}
          iconColor="text-warning"
          change="₹45.5L Pending (Term 1)"
          changeType="neutral"
        />
        <StatCard
          title="Avg. Attendance"
          value="94.5%"
          icon={CalendarCheck}
          iconColor="text-info"
          change="Class 10 Lead: 99%"
          changeType="positive"
        />
      </div>

      {/* Quick Actions Grid */}
      <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all" onClick={() => navigate('/admin/users')}>
          <UserPlus className="w-8 h-8 text-primary" />
          <span>Admit Student</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all" onClick={() => navigate('/admin/communication')}>
          <Bell className="w-8 h-8 text-warning" />
          <span>Send Notice</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all" onClick={() => navigate('/admin/approvals')}>
          <CheckCircle className="w-8 h-8 text-success" />
          <span>Approve Leaves</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all" onClick={() => navigate('/admin/reports')}>
          <FileText className="w-8 h-8 text-info" />
          <span>View Reports</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 dashboard-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base">Recent Activities</h3>
            <Button variant="ghost" size="sm" className="text-primary">View All Logs</Button>
          </div>
          <DataTable columns={activityColumns} data={recentActivities} mobileCardView />
        </div>

        {/* Pending Approvals / Notice Board */}
        <div className="space-y-6">
          <div className="dashboard-card p-4 sm:p-6">
            <h3 className="font-semibold text-base mb-4">Pending Approvals</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Leave Request</p>
                  <p className="text-xs text-muted-foreground">Mr. Rajesh (Physics)</p>
                </div>
                <Button size="sm" variant="outline">Review</Button>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Marks Entry</p>
                  <p className="text-xs text-muted-foreground">Class 10-A (Maths)</p>
                </div>
                <Button size="sm" variant="outline">Review</Button>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Bonafide Request</p>
                  <p className="text-xs text-muted-foreground">Suresh (Class 12)</p>
                </div>
                <Button size="sm" variant="outline">Sign</Button>
              </div>
            </div>
          </div>

          <div className="dashboard-card p-4 sm:p-6 bg-primary/5 border-primary/20">
            <h3 className="font-semibold text-base mb-2 text-primary">Admin Note</h3>
            <p className="text-sm text-muted-foreground">
              Next Board Meeting scheduled for Friday, 10:00 AM. Prepare term analysis reports.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
