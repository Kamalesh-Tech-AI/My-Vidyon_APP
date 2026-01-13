import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ParentLayout } from '@/layouts/ParentLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart } from '@/components/charts/BarChart';
import { toast } from 'sonner';
import {
    GraduationCap,
    BookOpen,
    Calendar,
    ClipboardCheck,
    FileText,
    Send,
    Loader2
} from 'lucide-react';
import { useTranslation } from '@/i18n/TranslationContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export function ParentChildDetail() {
    const { t } = useTranslation();
    const { studentId } = useParams();
    const navigate = useNavigate();

    const [leaveRequest, setLeaveRequest] = useState({
        startDate: '',
        endDate: '',
        reason: ''
    });

    // Fetch Student Details from Supabase
    const { data: student, isLoading } = useQuery({
        queryKey: ['student-detail', studentId],
        queryFn: async () => {
            if (!studentId) throw new Error('Student ID required');

            // Fetch basic profile
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            if (error) throw error;

            // Return with mixed mock data for performance/attendance
            return {
                ...data,
                // Mocking complex nested data until tables exist
                attendanceHistory: [
                    { name: 'Mon', value: 100 },
                    { name: 'Tue', value: 100 },
                    { name: 'Wed', value: 0 },
                    { name: 'Thu', value: 100 },
                    { name: 'Fri', value: 100 },
                ],
                marks: [
                    { subject: 'Mathematics', unitTest: '18/20', midTerm: '45/50', final: '92/100', grade: 'A1' },
                    { subject: 'Science', unitTest: '16/20', midTerm: '42/50', final: '88/100', grade: 'A2' },
                    { subject: 'English', unitTest: '19/20', midTerm: '48/50', final: '95/100', grade: 'A1' },
                ],
                assignments: [
                    { title: 'Algebra Worksheet', subject: 'Mathematics', dueDate: 'Dec 25, 2025', status: 'pending' },
                    { title: 'Physics Lab Report', subject: 'Science', dueDate: 'Dec 22, 2025', status: 'submitted' },
                ]
            };
        },
        enabled: !!studentId
    });

    const handleLeaveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`${t.parent.leave.submittedSuccess} ${student?.name}`);
        setLeaveRequest({ startDate: '', endDate: '', reason: '' });
    };

    if (isLoading) {
        return (
            <ParentLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ParentLayout>
        );
    }

    if (!student) {
        return (
            <ParentLayout>
                <div className="flex flex-col items-center justify-center h-[50vh]">
                    <h2 className="text-2xl font-bold mb-4">{t.parent.childDetail.studentNotFound}</h2>
                    <Button onClick={() => navigate('/parent')}>{t.parent.childDetail.goBack}</Button>
                </div>
            </ParentLayout>
        );
    }

    const marksColumns = [
        { key: 'subject', header: t.parent.childDetail.subject },
        { key: 'unitTest', header: t.parent.childDetail.unitTest },
        { key: 'midTerm', header: t.parent.childDetail.midTerm },
        { key: 'final', header: t.parent.childDetail.finalExam },
        {
            key: 'grade',
            header: t.parent.childDetail.overallGrade,
            render: (row: any) => (
                <Badge variant={row.grade.startsWith('A') ? 'success' : 'info'}>{row.grade}</Badge>
            )
        }
    ];

    const assignmentsColumns = [
        { key: 'title', header: t.parent.childDetail.assignment },
        { key: 'subject', header: t.parent.childDetail.subject },
        { key: 'dueDate', header: t.parent.childDetail.dueDate },
        {
            key: 'status',
            header: t.parent.childDetail.status,
            render: (row: any) => (
                <Badge variant={
                    row.status === 'graded' ? 'success' :
                        row.status === 'submitted' ? 'info' : 'warning'
                }>
                    {row.status}
                </Badge>
            )
        }
    ];

    return (
        <ParentLayout>
            <PageHeader
                title={student.name}
                subtitle={`${student.class_name || 'Not Assigned'} • ${t.parent.childDetail.performanceOverview}`}
                actions={<Button variant="outline" className="w-full sm:w-auto min-h-[44px]" onClick={() => navigate('/parent')}>{t.parent.childDetail.backToDashboard}</Button>}
            />

            <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    <TabsList className="w-max sm:w-auto">
                        <TabsTrigger value="overview" className="text-xs sm:text-sm px-3 sm:px-4">{t.parent.childDetail.overview}</TabsTrigger>
                        <TabsTrigger value="academic" className="text-xs sm:text-sm px-3 sm:px-4">{t.parent.childDetail.academic}</TabsTrigger>
                        <TabsTrigger value="attendance" className="text-xs sm:text-sm px-3 sm:px-4">{t.parent.childDetail.attendance}</TabsTrigger>
                        <TabsTrigger value="leave" className="text-xs sm:text-sm px-3 sm:px-4">{t.parent.childDetail.leave}</TabsTrigger>
                    </TabsList>
                </div>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                    <div className="stats-grid">
                        <StatCard
                            title={t.parent.childDetail.attendance}
                            value="92%"
                            icon={ClipboardCheck}
                            iconColor="text-success"
                            change="+2% this month"
                            changeType="positive"
                        />
                        <StatCard
                            title={t.parent.childDetail.avgGrade}
                            value="A2"
                            icon={GraduationCap}
                            iconColor="text-primary"
                        />
                        <StatCard
                            title={t.parent.childDetail.academic}
                            value={`${student.assignments.length} Pending`}
                            icon={FileText}
                            iconColor="text-warning"
                        />
                        <StatCard
                            title={t.parent.childDetail.nextExam}
                            value="Jan 15"
                            icon={Calendar}
                            iconColor="text-info"
                            change="Spring Sem"
                        />
                    </div>

                    <div className="dashboard-card p-4 sm:p-6">
                        <h3 className="font-semibold mb-4 sm:mb-6 text-sm sm:text-base">{t.parent.childDetail.attendanceTrend}</h3>
                        <div className="chart-container-responsive">
                            <BarChart data={student.attendanceHistory} color="hsl(var(--primary))" height={250} />
                        </div>
                    </div>
                </TabsContent>

                {/* ACADEMIC TAB */}
                <TabsContent value="academic" className="space-y-4 sm:space-y-6">
                    <div className="dashboard-card p-4 sm:p-6">
                        <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            {t.parent.childDetail.marksAndGrades}
                        </h3>
                        <DataTable columns={marksColumns} data={student.marks} mobileCardView />
                    </div>

                    <div className="dashboard-card p-4 sm:p-6">
                        <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            {t.parent.childDetail.assignmentsStatus}
                        </h3>
                        <DataTable columns={assignmentsColumns} data={student.assignments} mobileCardView />
                    </div>
                </TabsContent>

                {/* ATTENDANCE TAB */}
                <TabsContent value="attendance">
                    <div className="dashboard-card p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                            <h3 className="font-semibold text-sm sm:text-base">{t.parent.childDetail.detailedAttendance}</h3>
                            <Badge variant="success">{t.parent.childDetail.presentToday}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
                            <div className="p-3 sm:p-4 bg-muted/30 rounded-lg border border-border text-center">
                                <div className="text-xl sm:text-3xl font-bold text-primary mb-0.5 sm:mb-1">180</div>
                                <div className="text-[10px] sm:text-sm text-muted-foreground">{t.parent.childDetail.totalWorkingDays}</div>
                            </div>
                            <div className="p-3 sm:p-4 bg-muted/30 rounded-lg border border-border text-center">
                                <div className="text-xl sm:text-3xl font-bold text-success mb-0.5 sm:mb-1">165</div>
                                <div className="text-[10px] sm:text-sm text-muted-foreground">{t.parent.childDetail.daysPresent}</div>
                            </div>
                            <div className="p-3 sm:p-4 bg-muted/30 rounded-lg border border-border text-center">
                                <div className="text-xl sm:text-3xl font-bold text-warning mb-0.5 sm:mb-1">15</div>
                                <div className="text-[10px] sm:text-sm text-muted-foreground">{t.parent.childDetail.daysAbsent}</div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* LEAVE TAB */}
                <TabsContent value="leave">
                    <div className="dashboard-card p-4 sm:p-6 max-w-2xl mx-auto">
                        <h3 className="font-semibold mb-2 text-sm sm:text-base">{t.parent.childDetail.submitLeaveRequest}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                            {t.parent.childDetail.leaveDisclaimer}
                        </p>

                        <form onSubmit={handleLeaveSubmit} className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="from">{t.parent.childDetail.fromDate}</Label>
                                    <Input
                                        id="from"
                                        type="date"
                                        required
                                        value={leaveRequest.startDate}
                                        onChange={(e) => setLeaveRequest({ ...leaveRequest, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="to">{t.parent.childDetail.toDate}</Label>
                                    <Input
                                        id="to"
                                        type="date"
                                        required
                                        value={leaveRequest.endDate}
                                        onChange={(e) => setLeaveRequest({ ...leaveRequest, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">{t.parent.childDetail.reason}</Label>
                                <textarea
                                    id="reason"
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder={t.parent.childDetail.reasonPlaceholder}
                                    required
                                    value={leaveRequest.reason}
                                    onChange={(e) => setLeaveRequest({ ...leaveRequest, reason: e.target.value })}
                                />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" className="w-full sm:w-auto flex items-center gap-2 min-h-[44px]">
                                    <Send className="w-4 h-4" />
                                    {t.parent.childDetail.submitRequest}
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-6 sm:mt-8 dashboard-card p-4 sm:p-6">
                        <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{t.parent.childDetail.pastLeaveRequests}</h3>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                                <div className="min-w-0">
                                    <p className="font-medium text-xs sm:text-sm">Sick Leave (2 days)</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Nov 12 - Nov 13, 2025</p>
                                </div>
                                <Badge variant="success">{t.parent.leave.approved}</Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                                <div className="min-w-0">
                                    <p className="font-medium text-xs sm:text-sm">Family Function (1 day)</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Oct 05, 2025</p>
                                </div>
                                <Badge variant="success">{t.parent.leave.approved}</Badge>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </ParentLayout>
    );
}

export default ParentChildDetail;
