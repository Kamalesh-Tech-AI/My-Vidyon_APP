import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketContext } from '@/context/WebSocketContext';
import { toast } from 'sonner';

/**
 * Centralized Service to handle Real-time Updates using Supabase Realtime.
 * This hook is used in Main Layouts or Dashboards to keep data fresh.
 */
export function useERPRealtime(institutionId?: string) {
    const queryClient = useQueryClient();
    const { subscribeToTable, connectionStatus } = useWebSocketContext();

    useEffect(() => {
        if (!institutionId) return;

        console.log(`📡 Setting up native realtime subscriptions for institution: ${institutionId}`);

        // 1. Subscribe to critical tables for this institution

        // Students table
        const unsubStudents = subscribeToTable('students', (payload) => {
            console.log('📡 Realtime: Student change detected', payload.eventType);
            queryClient.invalidateQueries({ queryKey: ['faculty-total-students'] });
            queryClient.invalidateQueries({ queryKey: ['faculty-my-students'] });
            queryClient.invalidateQueries({ queryKey: ['faculty-assigned-subjects'] });
            queryClient.invalidateQueries({ queryKey: ['institution-total-students'] });
            queryClient.invalidateQueries({ queryKey: ['student-profile'] });
        }, { filter: `institution_id=eq.${institutionId}` });

        // Attendance table
        const unsubAttendance = subscribeToTable('student_attendance', (payload) => {
            console.log('📡 Realtime: Attendance update detected', payload.eventType);
            queryClient.invalidateQueries({ queryKey: ['faculty-today-attendance'] });
            queryClient.invalidateQueries({ queryKey: ['institution-today-attendance'] });
            queryClient.invalidateQueries({ queryKey: ['student-attendance'] });
        }, { filter: `institution_id=eq.${institutionId}` });

        // Leave requests table
        const unsubLeaves = subscribeToTable('leave_requests', (payload) => {
            if (payload.eventType === 'INSERT') {
                toast.info('New leave request received');
            }
            queryClient.invalidateQueries({ queryKey: ['faculty-pending-leaves'] });
            queryClient.invalidateQueries({ queryKey: ['institution-pending-leaves'] });
        });

        // Announcements table
        const unsubAnnouncements = subscribeToTable('announcements', (payload) => {
            if (payload.eventType === 'INSERT') {
                toast.info('New announcement published');
            }
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
        }, { filter: `institution_id=eq.${institutionId}` });

        return () => {
            unsubStudents();
            unsubAttendance();
            unsubLeaves();
            unsubAnnouncements();
        };
    }, [institutionId, subscribeToTable, queryClient]);

    return { connectionStatus };
}
