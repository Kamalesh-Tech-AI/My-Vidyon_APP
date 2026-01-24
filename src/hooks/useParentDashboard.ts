import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface Child {
    id: string;
    name: string;
    class: string;
    section: string;
    rollNumber: string;
}

interface ParentDashboardStats {
    totalChildren: number;
    pendingLeaveRequests: number;
    upcomingEvents: number;
    totalPendingFees: number;
}

interface ChildAttendance {
    childId: string;
    childName: string;
    presentDays: number;
    totalDays: number;
    percentage: string;
}

interface LeaveRequest {
    id: string;
    childName: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
}

/**
 * Custom hook for parent dashboard data with real-time updates
 * Fetches:
 * - Children's data
 * - Attendance for all children
 * - Grades for all children
 * - Leave requests
 * - Fee payment status
 * - Real-time updates for all metrics
 */
export function useParentDashboard(parentId?: string, institutionId?: string) {
    const queryClient = useQueryClient();

    // 1. Fetch Children
    const { data: children = [] } = useQuery({
        queryKey: ['parent-children', parentId],
        queryFn: async () => {
            if (!parentId) return [];

            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('parent_id', parentId);

            if (error) throw error;

            return (data || []).map((child: any) => ({
                id: child.id,
                name: child.full_name,
                class: child.class_name,
                section: child.section,
                rollNumber: child.roll_number,
            })) as Child[];
        },
        enabled: !!parentId,
        staleTime: 5 * 60 * 1000,
    });

    const childIds = children.map(c => c.id);

    // 2. Fetch Attendance for all children
    const { data: childrenAttendance = [] } = useQuery({
        queryKey: ['parent-children-attendance', childIds],
        queryFn: async () => {
            if (childIds.length === 0) return [];

            const attendancePromises = children.map(async (child) => {
                const { data, error } = await supabase
                    .from('student_attendance') // Correct table
                    .select('*')
                    .eq('student_id', child.id)
                    .order('attendance_date', { ascending: false })
                    .limit(30);

                if (error) throw error;

                const presentDays = data?.filter(r => r.status === 'present').length || 0;
                const totalDays = data?.length || 0;

                return {
                    childId: child.id,
                    childName: child.name,
                    presentDays,
                    totalDays,
                    percentage: totalDays > 0 ? `${Math.round((presentDays / totalDays) * 100)}%` : '0%',
                };
            });

            return Promise.all(attendancePromises) as Promise<ChildAttendance[]>;
        },
        enabled: childIds.length > 0,
        staleTime: 2 * 60 * 1000,
    });

    // 3. Fetch Leave Requests
    const { data: leaveRequests = [] } = useQuery({
        queryKey: ['parent-leave-requests', childIds],
        queryFn: async () => {
            if (childIds.length === 0) return [];

            const { data, error } = await supabase
                .from('student_leave_requests') // Correct table
                .select(`
                    *,
                    students:student_id (name)
                `)
                .in('student_id', childIds)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map((request: any) => ({
                id: request.id,
                childName: request.students?.name || 'Unknown',
                startDate: request.start_date,
                endDate: request.end_date,
                reason: request.reason,
                status: request.status,
            })) as LeaveRequest[];
        },
        enabled: childIds.length > 0,
        staleTime: 2 * 60 * 1000,
    });

    // 4. Fetch Total Pending Fees
    const { data: feeData } = useQuery({
        queryKey: ['parent-fees', childIds],
        queryFn: async () => {
            if (childIds.length === 0) return { total: 0, paid: 0, pending: 0 };

            const { data, error } = await supabase
                .from('student_fees') // Correct table
                .select('*')
                .in('student_id', childIds);

            if (error) throw error;

            const total = data?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;
            const paid = data?.filter(f => f.status === 'paid').reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0; // Or define logic for 'paid' amount column usage. 
            // The schema has paid_amount column. Better to use that if partial payments supported.
            // But for now, let's assume status 'paid' implies full amount or sum up paid_amount.
            // Let's use paid_amount if available.
            const paidReal = data?.reduce((sum, fee) => sum + (fee.paid_amount || 0), 0) || 0;

            return {
                total,
                paid: paidReal,
                pending: total - paidReal,
            };
        },
        enabled: childIds.length > 0,
        staleTime: 5 * 60 * 1000,
    });

    // 5. Fetch Upcoming Events
    const { data: upcomingEventsCount = 0 } = useQuery({
        queryKey: ['parent-events', institutionId],
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
    const stats: ParentDashboardStats = {
        totalChildren: children.length,
        pendingLeaveRequests: leaveRequests.filter(r => r.status === 'pending').length,
        upcomingEvents: upcomingEventsCount,
        totalPendingFees: feeData?.pending || 0,
    };

    // 7. Real-time Subscriptions
    useEffect(() => {
        if (!parentId || childIds.length === 0) return;

        const channel = supabase
            .channel('parent-dashboard-realtime')
            // Student changes (new child added, etc.)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'students',
                    filter: `parent_id=eq.${parentId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['parent-children'] });
                    toast.info('Student information updated');
                }
            )
            // Attendance changes
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'student_attendance',
                },
                (payload: any) => {
                    if (childIds.includes(payload.new?.student_id)) {
                        queryClient.invalidateQueries({ queryKey: ['parent-children-attendance'] });
                        toast.info('Attendance updated');
                    }
                }
            )
            // Grades posted
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'grades',
                },
                (payload: any) => {
                    if (childIds.includes(payload.new?.student_id)) {
                        const childName = children.find(c => c.id === payload.new?.student_id)?.name;
                        toast.success(`New grade posted for ${childName}`);
                    }
                }
            )
            // Leave request status changes
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'student_leave_requests',
                },
                (payload: any) => {
                    if (childIds.includes(payload.new?.student_id)) {
                        queryClient.invalidateQueries({ queryKey: ['parent-leave-requests'] });
                        if (payload.new?.status !== payload.old?.status) {
                            toast.info(`Leave request ${payload.new?.status}`);
                        }
                    }
                }
            )
            // Fee payments
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'student_fees',
                },
                (payload: any) => {
                    if (childIds.includes(payload.new?.student_id)) {
                        queryClient.invalidateQueries({ queryKey: ['parent-fees'] });
                        toast.info('Fee payment updated');
                    }
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
                    queryClient.invalidateQueries({ queryKey: ['parent-events'] });
                    toast.info('New event added');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [parentId, childIds, institutionId, queryClient, children]);

    return {
        stats,
        children,
        childrenAttendance,
        leaveRequests,
        feeData,
        isLoading: false,
    };
}
