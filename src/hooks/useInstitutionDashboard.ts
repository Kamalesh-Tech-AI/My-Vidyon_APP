import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useERPRealtime } from './useERPRealtime';

interface InstitutionDashboardStats {
    totalStudents: number;
    totalStaff: number;
    todayAttendance: number;
    attendancePercentage: string;
    pendingApplications: number;
    totalRevenue: number;
    pendingLeaveRequests: number;
}

/**
 * Custom hook for institution dashboard data with real-time updates
 * Fetches:
 * - Student and staff counts
 * - Attendance analytics
 * - Financial metrics
 * - Application status
 * - Real-time updates for all metrics
 */
export function useInstitutionDashboard(institutionId?: string) {
    const queryClient = useQueryClient();

    // 1. Total Students
    const { data: totalStudents = 0 } = useQuery({
        queryKey: ['institution-total-students', institutionId],
        queryFn: async () => {
            if (!institutionId) return 0;

            const { count, error } = await supabase
                .from('students')
                .select('id', { count: 'exact', head: true })
                .eq('institution_id', institutionId);

            if (error) throw error;
            return count || 0;
        },
        enabled: !!institutionId,
        staleTime: 5 * 60 * 1000,
    });

    // 2. Total Staff
    const { data: totalStaff = 0 } = useQuery({
        queryKey: ['institution-total-staff', institutionId],
        queryFn: async () => {
            if (!institutionId) return 0;

            const { count, error } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('institution_id', institutionId)
                .in('role', ['faculty', 'teacher', 'staff']);

            if (error) throw error;
            return count || 0;
        },
        enabled: !!institutionId,
        staleTime: 5 * 60 * 1000,
    });

    // 3. Today's Attendance
    const { data: attendanceData } = useQuery({
        queryKey: ['institution-today-attendance', institutionId],
        queryFn: async () => {
            if (!institutionId) return { present: 0, total: 0 };

            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('student_attendance')
                .select('status')
                .eq('institution_id', institutionId)
                .eq('attendance_date', today);

            if (error) throw error;

            const present = data?.filter(r => r.status === 'present').length || 0;
            const total = data?.length || 0;

            return { present, total };
        },
        enabled: !!institutionId,
        staleTime: 30 * 1000, // 30 seconds
    });

    // 4. Pending Applications
    const { data: pendingApplications = 0 } = useQuery({
        queryKey: ['institution-pending-applications', institutionId],
        queryFn: async () => {
            if (!institutionId) return 0;

            const { count, error } = await supabase
                .from('applications')
                .select('id', { count: 'exact', head: true })
                .eq('institution_id', institutionId)
                .eq('status', 'pending');

            if (error) {
                // Table might not exist
                console.warn('Applications table not found');
                return 0;
            }
            return count || 0;
        },
        enabled: !!institutionId,
        staleTime: 2 * 60 * 1000,
    });

    // 5. Total Revenue (from fee payments)
    const { data: totalRevenue = 0 } = useQuery({
        queryKey: ['institution-total-revenue', institutionId],
        queryFn: async () => {
            if (!institutionId) return 0;

            const { data, error } = await supabase
                .from('fee_payments')
                .select('amount, status')
                .eq('institution_id', institutionId)
                .eq('status', 'paid');

            if (error) throw error;

            return data?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;
        },
        enabled: !!institutionId,
        staleTime: 5 * 60 * 1000,
    });

    // 6. Pending Leave Requests
    const { data: pendingLeaveRequests = 0 } = useQuery({
        queryKey: ['institution-pending-leaves', institutionId],
        queryFn: async () => {
            if (!institutionId) return 0;

            const { count, error } = await supabase
                .from('leave_requests')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending');

            if (error) throw error;
            return count || 0;
        },
        enabled: !!institutionId,
        staleTime: 2 * 60 * 1000,
    });

    // 7. Calculate Dashboard Stats
    const stats: InstitutionDashboardStats = {
        totalStudents,
        totalStaff,
        todayAttendance: attendanceData?.present || 0,
        attendancePercentage: attendanceData?.total
            ? `${Math.round((attendanceData.present / attendanceData.total) * 100)}%`
            : '0%',
        pendingApplications,
        totalRevenue,
        pendingLeaveRequests,
    };

    // 8. Real-time Subscriptions (Migrated to SSE)
    useERPRealtime(institutionId);

    return {
        stats,
        isLoading: false,
    };
}
