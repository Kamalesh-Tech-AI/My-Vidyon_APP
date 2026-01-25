import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useERPRealtime } from './useERPRealtime';

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

    // 7. Real-time Subscriptions (Migrated to SSE)
    useERPRealtime(institutionId);

    // 8. Fetch Subjects for Student's Class via faculty_subjects
    const { data: subjectsData = { subjects: [], classTeacher: 'Not Assigned' }, isLoading: subjectsLoading } = useQuery({
        queryKey: ['student-subjects-view-full', studentId],
        queryFn: async () => {
            if (!studentId) return { subjects: [], classTeacher: 'Not Assigned' };

            // Get student's class_id and section
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('class_id, section, institution_id')
                .eq('id', studentId)
                .single();

            if (studentError || !studentData) return { subjects: [], classTeacher: 'Not Assigned' };

            // 1. Fetch Class Teacher (Advisor)
            const { data: advisorData } = await supabase
                .from('faculty_subjects')
                .select('profiles:faculty_profile_id(full_name)')
                .eq('class_id', studentData.class_id)
                .eq('section', studentData.section)
                .eq('assignment_type', 'class_teacher')
                .maybeSingle();

            // 2. Fetch Subjects
            const { data: assignmentsData, error: assignmentsError } = await supabase
                .from('faculty_subjects')
                .select(`
                    subject_id,
                    faculty_profile_id,
                    subjects:subject_id (
                        id,
                        name,
                        code
                    ),
                    profiles:faculty_profile_id (
                        full_name
                    )
                `)
                .eq('class_id', studentData.class_id)
                .eq('section', studentData.section)
                .eq('assignment_type', 'subject_staff');

            if (assignmentsError) throw assignmentsError;

            const subjects = (assignmentsData || [])
                .filter((a: any) => a.subjects)
                .map((a: any) => ({
                    id: a.subjects.id,
                    title: a.subjects.name,
                    code: a.subjects.code || 'N/A',
                    instructor: a.profiles?.full_name || 'Not Assigned',
                    progress: 0,
                    students: 0,
                    status: 'active' as const
                }));

            return {
                subjects,
                classTeacher: (advisorData?.profiles as any)?.full_name || 'Not Assigned'
            };
        },
        enabled: !!studentId,
        staleTime: 5 * 60 * 1000,
    });

    // 9. Real-time subscription for subjects and assignments (DEPRECATED: Managed by central SSE)

    return {
        stats,
        assignments,
        attendanceRecords,
        grades,
        feeStatus,
        subjects: subjectsData.subjects,
        classTeacher: subjectsData.classTeacher,
        isLoading: subjectsLoading,
    };
}
