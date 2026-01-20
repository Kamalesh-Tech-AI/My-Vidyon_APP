import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface StudentDashboardStats {
    totalAssignments: number;
    pendingAssignments: number;
    attendancePercentage: string;
    averageGrade: string;
    upcomingEvents: number;
    pendingFees: number;
}

interface Assignment {
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded';
}

interface AttendanceRecord {
    date: string;
    status: 'present' | 'absent' | 'late';
}

interface Grade {
    id: string;
    subject: string;
    marks: number;
    totalMarks: number;
    examType: string;
    date: string;
}

/**
 * Custom hook for student dashboard data with real-time updates
 * Fetches:
 * - Assignments and submissions
 * - Attendance records
 * - Grades/marks
 * - Fee payment status
 * - Real-time updates for all metrics
 */
export function useStudentDashboard(studentId?: string, institutionId?: string) {
    const queryClient = useQueryClient();

    // 1. Fetch Assignments
    const { data: assignments = [] } = useQuery({
        queryKey: ['student-assignments', studentId],
        queryFn: async () => {
            if (!studentId) return [];

            const { data, error } = await supabase
                .from('assignments')
                .select(`
                    *,
                    submissions!left(id, submitted_at, grade, status)
                `)
                .eq('institution_id', institutionId)
                .order('due_date', { ascending: true });

            if (error) throw error;

            return (data || []).map((assignment: any) => ({
                id: assignment.id,
                title: assignment.title,
                subject: assignment.subject,
                dueDate: assignment.due_date,
                status: assignment.submissions?.[0]?.status || 'pending',
            })) as Assignment[];
        },
        enabled: !!studentId && !!institutionId,
        staleTime: 2 * 60 * 1000,
    });

    // 2. Fetch Attendance Records
    const { data: attendanceRecords = [] } = useQuery({
        queryKey: ['student-attendance', studentId],
        queryFn: async () => {
            if (!studentId) return [];

            const { data, error } = await supabase
                .from('student_attendance')
                .select('*')
                .eq('student_id', studentId)
                .order('attendance_date', { ascending: false })
                .limit(30);

            if (error) throw error;

            return (data || []).map((record: any) => ({
                date: record.attendance_date,
                status: record.status,
            })) as AttendanceRecord[];
        },
        enabled: !!studentId,
        staleTime: 1 * 60 * 1000,
    });

    // 3. Fetch Grades
    const { data: grades = [] } = useQuery({
        queryKey: ['student-grades', studentId],
        queryFn: async () => {
            if (!studentId) return [];

            const { data, error } = await supabase
                .from('grades')
                .select('*')
                .eq('student_id', studentId)
                .order('date', { ascending: false });

            if (error) throw error;

            return (data || []).map((grade: any) => ({
                id: grade.id,
                subject: grade.subject,
                marks: grade.marks,
                totalMarks: grade.total_marks,
                examType: grade.exam_type,
                date: grade.date,
            })) as Grade[];
        },
        enabled: !!studentId,
        staleTime: 2 * 60 * 1000,
    });

    // 4. Fetch Fee Payment Status
    const { data: feeStatus } = useQuery({
        queryKey: ['student-fees', studentId],
        queryFn: async () => {
            if (!studentId) return { total: 0, paid: 0, pending: 0 };

            const { data, error } = await supabase
                .from('fee_payments')
                .select('*')
                .eq('student_id', studentId);

            if (error) throw error;

            const total = data?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;
            const paid = data?.filter(f => f.status === 'paid').reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;

            return {
                total,
                paid,
                pending: total - paid,
            };
        },
        enabled: !!studentId,
        staleTime: 5 * 60 * 1000,
    });

    // 5. Fetch Upcoming Events
    const { data: upcomingEventsCount = 0 } = useQuery({
        queryKey: ['student-events', institutionId],
        queryFn: async () => {
            if (!institutionId) return 0;

            const today = new Date().toISOString().split('T')[0];

            const { count, error } = await supabase
                .from('academic_events')
                .select('id', { count: 'exact', head: true })
                .eq('institution_id', institutionId)
                .gte('event_date', today);

            if (error) throw error;
            return count || 0;
        },
        enabled: !!institutionId,
        staleTime: 5 * 60 * 1000,
    });

    // 6. Calculate Dashboard Stats
    const stats: StudentDashboardStats = {
        totalAssignments: assignments.length,
        pendingAssignments: assignments.filter(a => a.status === 'pending').length,
        attendancePercentage: attendanceRecords.length > 0
            ? `${Math.round((attendanceRecords.filter(r => r.status === 'present').length / attendanceRecords.length) * 100)}%`
            : '0%',
        averageGrade: grades.length > 0
            ? `${Math.round(grades.reduce((sum, g) => sum + (g.marks / g.totalMarks) * 100, 0) / grades.length)}%`
            : 'N/A',
        upcomingEvents: upcomingEventsCount,
        pendingFees: feeStatus?.pending || 0,
    };

    // 7. Real-time Subscriptions
    useEffect(() => {
        if (!studentId || !institutionId) return;

        const channel = supabase
            .channel('student-dashboard-realtime')
            // Assignments
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignments',
                    filter: `institution_id=eq.${institutionId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
                    toast.info('New assignment posted');
                }
            )
            // Submissions
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'submissions',
                    filter: `student_id=eq.${studentId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
                }
            )
            // Attendance
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'student_attendance',
                    filter: `student_id=eq.${studentId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['student-attendance'] });
                    toast.info('Attendance updated');
                }
            )
            // Grades
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'grades',
                    filter: `student_id=eq.${studentId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['student-grades'] });
                    toast.success('New grade posted!');
                }
            )
            // Fee Payments
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'fee_payments',
                    filter: `student_id=eq.${studentId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['student-fees'] });
                    toast.info('Fee payment updated');
                }
            )
            // Academic Events
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'academic_events',
                    filter: `institution_id=eq.${institutionId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['student-events'] });
                    toast.info('New event added');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [studentId, institutionId, queryClient]);

    return {
        stats,
        assignments,
        attendanceRecords,
        grades,
        feeStatus,
        isLoading: false,
    };
}
