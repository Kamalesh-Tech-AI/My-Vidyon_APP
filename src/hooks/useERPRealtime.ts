import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSSE } from './useSSE';
import { toast } from 'sonner';

/**
 * Centralized Service to handle Real-time Updates via SSE.
 * This hook is used in Main Layouts or Dashboards to keep data fresh 
 * WITHOUT buffering entire JSON responses.
 */
export function useERPRealtime(institutionId?: string) {
    const queryClient = useQueryClient();

    // Connect to the streaming SSE endpoint (example URL)
    // In a real setup, this would be your Supabase Edge Function or Backend URL
    const { data: event, connectionStatus } = useSSE(
        institutionId ? `${import.meta.env.VITE_API_URL || ''}/api/realtime-stream?institution_id=${institutionId}` : null
    );

    useEffect(() => {
        if (!event) return;

        // Handle different event types from the stream
        switch (event.type) {
            case 'STUDENT_CHANGED':
                queryClient.invalidateQueries({ queryKey: ['faculty-total-students'] });
                queryClient.invalidateQueries({ queryKey: ['institution-total-students'] });
                break;

            case 'ATTENDANCE_UPDATED':
                queryClient.invalidateQueries({ queryKey: ['faculty-today-attendance'] });
                queryClient.invalidateQueries({ queryKey: ['institution-today-attendance'] });
                break;

            case 'LEAVE_REQUESTED':
                queryClient.invalidateQueries({ queryKey: ['faculty-pending-leaves'] });
                toast.info(event.message || 'New leave request received');
                break;

            default:
                // Generic refresh if unknown event
                queryClient.invalidateQueries();
        }
    }, [event, queryClient]);

    return { connectionStatus };
}
