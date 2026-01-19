import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export type NotificationType =
    | 'assignment'
    | 'attendance'
    | 'leave'
    | 'announcement'
    | 'exam'
    | 'fees'
    | 'event'
    | 'info'
    | 'warning'
    | 'success'
    | 'error';

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    date: string; // Display string (e.g., "2 hours ago")
    rawDate: string; // ISO string for sorting
    read: boolean;
    priority?: 'high' | 'normal' | 'low';
    actionUrl?: string;
    source: 'notification' | 'calendar' | 'system';
}

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.institutionId) return;

        const fetchNotifications = async () => {
            try {
                setLoading(true);

                // 1. Fetch Personal Notifications
                const { data: userNotifs, error: notifError } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (notifError) throw notifError;

                // 2. Fetch Academic Events (Broadcast)
                // Filter events created recently (e.g., last 30 days) to keep list relevant
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const { data: events, error: eventError } = await supabase
                    .from('academic_events')
                    .select('*')
                    .eq('institution_id', user.institutionId)
                    .gte('created_at', thirtyDaysAgo.toISOString())
                    .order('created_at', { ascending: false });

                if (eventError) throw eventError;

                // Transform Personal Notifications
                const formattedUserNotifs: NotificationItem[] = (userNotifs || []).map(n => ({
                    id: n.id,
                    title: n.title,
                    message: n.message,
                    type: (n.type as NotificationType) || 'info',
                    date: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }),
                    rawDate: n.created_at,
                    read: n.read,
                    priority: 'normal',
                    source: 'notification'
                }));

                // Transform Academic Events
                const formattedEvents: NotificationItem[] = (events || []).map(e => ({
                    id: `event-${e.id}`,
                    title: `New Event: ${e.title}`,
                    message: `${e.description || e.title} on ${new Date(e.start_date).toLocaleDateString()}`,
                    type: 'event',
                    date: formatDistanceToNow(new Date(e.created_at || e.start_date), { addSuffix: true }), // Use created_at if available
                    rawDate: e.created_at || e.start_date,
                    read: false, // Events don't have read state per user unless tracked separately
                    priority: 'normal',
                    source: 'calendar',
                    actionUrl: `/${user.role}/calendar`
                }));

                // Merge and Sort
                const merged = [...formattedUserNotifs, ...formattedEvents].sort((a, b) =>
                    new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
                );

                setNotifications(merged);

            } catch (err) {
                console.error("Error fetching notifications:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Real-time subscriptions could be added here similar to RealtimeNotificationBell
        // For simplicity, we fetch on mount.

    }, [user?.institutionId, user?.id, user?.role]);

    return { notifications, loading };
}
