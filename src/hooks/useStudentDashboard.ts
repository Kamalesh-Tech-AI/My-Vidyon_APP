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

    // 0. Resolve institution UUID from TEXT code if needed
    const { data: instUuid } = useQuery({
        queryKey: ['institution-uuid', institutionId],
        queryFn: async () => {
            if (!institutionId) return null;
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(institutionId)) {
                return institutionId;
            }
            const { data } = await supabase
                .from('institutions')
                .select('id')
                .eq('institution_id', institutionId)
                .maybeSingle();
            return data?.id || null;
        },
        enabled: !!institutionId,
        staleTime: 24 * 60 * 60 * 1000,
    });

    // 1. Fetch Assignments
    const { data: assignments = [] } = useQuery({
        queryKey: ['student-assignments', studentId, instUuid],
        queryFn: async () => {
            console.log('🚀 [v3] Fetching assignments for student:', studentId);
            if (!studentId || !instUuid) return [];

            const { data, error } = await supabase
                .from('assignments')
                .select(`
                    *,
                    assignment_submissions(id, submitted_at, marks_obtained, status)
                `)
                .eq('institution_id', instUuid) // Changed to instUuid (UUID)
                .order('due_date', { ascending: true });

            if (error) throw error;

            return (data || []).map((assignment: any) => ({
                id: assignment.id,
                title: assignment.title,
                subject: assignment.subject,
                dueDate: assignment.due_date,
                status: assignment.assignment_submissions?.[0]?.status || 'pending',
            })) as Assignment[];
        },
        enabled: !!studentId && !!instUuid,
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
        queryKey: ['student-grades', studentId, instUuid],
        queryFn: async () => {
            if (!studentId || !instUuid) return [];

            const { data, error } = await supabase
                .from('grades')
                .select('*')
                .eq('student_id', studentId)
                .eq('institution_id', instUuid)
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
        enabled: !!studentId && !!instUuid,
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
        queryKey: ['student-events', instUuid],
        queryFn: async () => {
            if (!instUuid) return 0;

            const today = new Date().toISOString().split('T')[0];

            const { count, error } = await supabase
                .from('academic_events')
                .select('id', { count: 'exact', head: true })
                .eq('institution_id', instUuid)
                .gte('event_date', today);

            if (error) throw error;
            return count || 0;
        },
        enabled: !!instUuid,
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

    const { data: subjectsData = { subjects: [], classTeacher: 'Not Assigned' }, isLoading: subjectsLoading } = useQuery({
        queryKey: ['student-subjects-view-full', studentId, institutionId, instUuid],
        queryFn: async () => {
            if (!studentId || !institutionId || !instUuid) return { subjects: [], classTeacher: 'Not Assigned' };

            // 1. Get student's current assignment (class_name and section)
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('class_name, section, institution_id')
                .eq('id', studentId)
                .single();

            if (studentError || !studentData) {
                console.error('❌ Student data not found:', studentError);
                return { subjects: [], classTeacher: 'Not Assigned' };
            }

            console.log('🔍 Student Data:', studentData);

            // 2. Resolve the class ID using class_name and institution_id (joined via groups)
            // Strategy: Join with groups to filter by institution code and check sections array
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select(`
                    id, 
                    name,
                    groups!inner(institution_id)
                `)
                .eq('name', studentData.class_name)
                .eq('groups.institution_id', institutionId)
                .contains('sections', [studentData.section])
                .maybeSingle();

            console.log('🔍 Resolved Class Data:', classData);

            if (classError || !classData) {
                console.error('⚠️ Class not found for:', studentData.class_name, studentData.section, classError);
                return { subjects: [], classTeacher: 'Not Assigned' };
            }

            // 3. Fetch Faculty Subjects assignments
            const { data: facultyAssignments, error: assignmentsError } = await supabase
                .from('faculty_subjects')
                .select(`
                    subject_id,
                    faculty_profile_id,
                    section,
                    assignment_type,
                    subjects:subject_id (
                        id,
                        name,
                        code
                    ),
                    profiles:faculty_profile_id (
                        id,
                        full_name,
                        phone
                    )
                `)
                .eq('class_id', classData.id)
                .eq('institution_id', institutionId)
                .or(`section.ilike.${studentData.section?.trim() || ''},section.is.null,section.eq.""`);

            if (assignmentsError) {
                console.error('❌ Error fetching faculty assignments:', assignmentsError);
                throw assignmentsError;
            }

            console.log('📋 [v3] Fetched Faculty Assignments:', facultyAssignments?.length);

            // 4. Map the data into the format required by the UI
            const subjects = (facultyAssignments || [])
                .filter((a: any) => a.subjects && a.assignment_type === 'subject_staff')
                .map((a: any) => {
                    const profileData = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;

                    if (profileData?.full_name && !profileData?.phone) {
                        console.warn(`⚠️ Missing phone for instructor: ${profileData.full_name}`);
                    }

                    return {
                        id: a.subjects.id,
                        title: a.subjects.name,
                        code: a.subjects.code || 'N/A',
                        instructor: profileData?.full_name || 'Not Assigned',
                        instructorPhone: profileData?.phone?.trim() || null,
                        progress: 0,
                        students: 0,
                        status: 'active' as const
                    };
                });

            // Find class teacher
            const teacherEntry = (facultyAssignments || []).find((a: any) => a.assignment_type === 'class_teacher');
            const teacherProfile = teacherEntry ? (Array.isArray(teacherEntry.profiles) ? teacherEntry.profiles[0] : teacherEntry.profiles) : null;
            const classTeacher = teacherProfile?.full_name || 'Not Assigned';

            return {
                subjects,
                classTeacher
            };
        },
        enabled: !!studentId && !!institutionId && !!instUuid,
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
