import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
    Loader2,
    Award,
    Download
} from 'lucide-react';
import { useTranslation } from '@/i18n/TranslationContext';
import { supabase } from '@/lib/supabase';
import { ParentExamScheduleView } from '@/components/parent/ParentExamScheduleView';
import { useQuery } from '@tanstack/react-query';

export function ParentChildDetail() {
    const { t } = useTranslation();
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'overview';

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

            // 1. Fetch Basic Profile
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            if (studentError) throw studentError;

            // 2. Fetch Real Attendance
            const { data: attendanceData } = await supabase
                .from('student_attendance')
                .select('*')
                .eq('student_id', studentId)
                .order('attendance_date', { ascending: false })
                .limit(30);

            const attendanceHistory = (attendanceData || []).reverse().map(a => ({
                name: new Date(a.attendance_date).toLocaleDateString(undefined, { weekday: 'short' }),
                value: a.status === 'present' ? 100 : 0
            }));

            const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
            const totalAttendance = attendanceData?.length || 0;
            const attendance_percentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

            // 3. Fetch Real Assignments
            let assignmentsData: any[] = [];
            const { data: classData } = await supabase
                .from('classes')
                .select('id')
                .eq('name', studentData.class_name)
                .maybeSingle();

            if (classData?.id) {
                const { data: fetchedAssignments } = await supabase
                    .from('assignments')
                    .select(`
                        *,
                        submissions (status, grade)
                    `)
                    .eq('class_id', classData.id)
                    .eq('section', studentData.section)
                    .order('due_date', { ascending: false })
                    .limit(5);
                assignmentsData = fetchedAssignments || [];
            }

            const assignments = (assignmentsData || []).map(a => ({
                title: a.title,
                subject: a.subject,
                dueDate: new Date(a.due_date).toLocaleDateString(),
                status: a.submissions?.[0]?.status || 'pending'
            }));

            // 4. Fetch Real Grades (Marks)
            const { data: gradesData } = await supabase
                .from('grades')
                .select('*')
                .eq('student_id', studentId)
                .order('date', { ascending: false })
                .limit(5);

            const marks = (gradesData || []).map(g => ({
                subject: g.subject,
                unitTest: g.exam_type?.includes('Quiz') ? `${g.marks}/${g.total_marks}` : '-',
                midTerm: g.exam_type?.includes('Midterm') ? `${g.marks}/${g.total_marks}` : '-',
                final: g.exam_type?.includes('Final') ? `${g.marks}/${g.total_marks}` : '-',
                grade: g.grade_letter || '-'
            }));

            // 5. Fetch Certificates
            const { data: certificatesData } = await supabase
                .from('certificates')
                .select('*')
                .eq('student_email', studentData.email)
                .eq('status', 'active')
                .order('uploaded_at', { ascending: false });

            // 6. Fetch Leave History
            const { data: leavesData } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            return {
                ...studentData,
                name: studentData.name,
                attendanceHistory: attendanceHistory.length > 0 ? attendanceHistory : [
                    { name: 'Mon', value: 0 }, { name: 'Tue', value: 0 }, { name: 'Wed', value: 0 },
                    { name: 'Thu', value: 0 }, { name: 'Fri', value: 0 }
                ],
                attendance_percentage,
                marks: marks.length > 0 ? marks : [
                    { subject: 'No data', unitTest: '-', midTerm: '-', final: '-', grade: '-' }
                ],
                assignments: assignments.length > 0 ? assignments : [
                    { title: 'No assignments', subject: 'N/A', dueDate: '-', status: 'none' }
                ],
                certificates: certificatesData || [],
                leaves: leavesData || []
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

            <Tabs defaultValue={initialTab} className="space-y-4 sm:space-y-6">
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    <TabsList className="w-max sm:w-auto">
                        <TabsTrigger value="overview" className="text-xs sm:text-sm px-3 sm:px-4">{t.parent.childDetail.overview}</TabsTrigger>
                        <TabsTrigger value="academic" className="text-xs sm:text-sm px-3 sm:px-4">{t.parent.childDetail.academic}</TabsTrigger>
                        <TabsTrigger value="attendance" className="text-xs sm:text-sm px-3 sm:px-4">{t.parent.childDetail.attendance}</TabsTrigger>
                        <TabsTrigger value="leave" className="text-xs sm:text-sm px-3 sm:px-4">{t.parent.childDetail.leave}</TabsTrigger>
                        <TabsTrigger value="exam-schedule" className="text-xs sm:text-sm px-3 sm:px-4">Exam Schedule</TabsTrigger>
                        <TabsTrigger value="certificates" className="text-xs sm:text-sm px-3 sm:px-4">Certificates</TabsTrigger>
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
                        <StatCard
                            title="Certificates"
                            value={student.certificates.length}
                            icon={Award}
                            iconColor="text-purple-500"
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

                <TabsContent value="leave">
                    <div className="dashboard-card p-4 sm:p-6">
                        <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{t.parent.childDetail.pastLeaveRequests}</h3>
                        <div className="space-y-2 sm:space-y-3">
                            {student.leaves.length > 0 ? (
                                student.leaves.map((leave: any) => (
                                    <div key={leave.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                                        <div className="min-w-0">
                                            <p className="font-medium text-xs sm:text-sm">{leave.reason}</p>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                                                {new Date(leave.start_date || leave.from_date).toLocaleDateString()} - {new Date(leave.end_date || leave.to_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge variant={
                                            leave.status === 'Approved' ? 'success' :
                                                leave.status === 'Rejected' ? 'destructive' : 'warning'
                                        }>
                                            {leave.status}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-8 text-muted-foreground text-sm">
                                    No past leave requests found.
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* EXAM SCHEDULE TAB */}
                <TabsContent value="exam-schedule">
                    <ParentExamScheduleView
                        institutionId={student.institution_id}
                        classId={student.class_name}
                        section={student.section}
                    />
                </TabsContent>

                {/* CERTIFICATES TAB */}
                <TabsContent value="certificates">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {student.certificates.length > 0 ? (
                            student.certificates.map((cert: any) => (
                                <div key={cert.id} className="bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-4 border-b border-border bg-muted/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Award className="w-5 h-5 text-primary" />
                                                <h4 className="font-semibold line-clamp-1">{cert.category}</h4>
                                            </div>
                                            <Badge variant="success" className="text-xs">Active</Badge>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {cert.course_description && (
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Description</p>
                                                <p className="text-sm line-clamp-2">{cert.course_description}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                                            <span>{new Date(cert.uploaded_at).toLocaleDateString()}</span>
                                            <span>{Math.round(cert.file_size / 1024)} KB</span>
                                        </div>
                                        <Button
                                            className="w-full mt-2"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.open(cert.file_url, '_blank')}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-card rounded-lg border border-dashed border-border text-center">
                                <Award className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                                <h3 className="text-lg font-semibold">No Certificates Yet</h3>
                                <p className="text-muted-foreground">Certificates earned will appear here.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </ParentLayout>
    );
}

export default ParentChildDetail;
