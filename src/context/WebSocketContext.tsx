/**
 * WebSocket Provider (Using Supabase Realtime)
 * Global real-time context using Supabase's built-in realtime functionality
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { realtimeService } from '@/services/realtime.service';
import { toast } from 'sonner';
import { App as CapacitorApp } from '@capacitor/app';
import { useQueryClient } from '@tanstack/react-query';

type RealtimeChannel =
    | 'leave_requests'
    | 'attendance'
    | 'assignments'
    | 'grades'
    | 'payments'
    | 'announcements'
    | 'timetable'
    | 'exam_schedule'
    | 'certificates'
    | 'students'
    | 'staff_details';

interface WebSocketContextType {
    isConnected: boolean;
    subscribe: (channel: RealtimeChannel, callback: (data: any) => void) => () => void;
    subscribeToTable: (tableName: string, callback: (data: any) => void, filter?: { event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'; schema?: string; filter?: string }) => () => void;
    broadcast: (channel: string, event: string, data: any) => Promise<any>;
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
    refreshConnection: () => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
    const queryClient = useQueryClient();
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    const refreshConnection = useCallback(async () => {
        if (!isAuthenticated || !user) return;

        console.log('🔄 Refreshing realtime connection and clearing stale data...');

        // Invalidate all queries to ensure fresh data on resume
        queryClient.invalidateQueries();

        setConnectionStatus('connecting');
        const connected = await realtimeService.connect();

        setIsConnected(connected);
        setConnectionStatus(connected ? 'connected' : 'error');

        if (connected) {
            console.log('✅ Realtime reconnected');
        } else {
            // Retry logic
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(refreshConnection, 5000);
        }
    }, [isAuthenticated, user, queryClient]);

    /**
     * Connect to Supabase Realtime when authenticated
     */
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setConnectionStatus('disconnected');
            setIsConnected(false);
            realtimeService.disconnect();
            return;
        }

        refreshConnection();

        // 1. Handle Capacitor App State Changes (Background/Foreground)
        const appStateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                console.log('📱 App resumed - Refreshing realtime and data');
                refreshConnection();
            } else {
                console.log('💤 App backgrounded - Realtime may throttle');
            }
        });

        // 2. Handle Browser/WebView Visibility Changes
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('👀 WebView visible - Refreshing realtime and data');
                refreshConnection();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            appStateListener.then(l => l.remove());
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [isAuthenticated, user, refreshConnection]);

    /**
     * Subscribe to a specific channel/table
     */
    const subscribe = useCallback((channel: RealtimeChannel, callback: (data: any) => void) => {
        console.log(`📡 Subscribing to ${channel}...`);

        const subscribeMethod = {
            'leave_requests': realtimeService.subscribeToLeaveRequests,
            'attendance': realtimeService.subscribeToAttendance,
            'assignments': realtimeService.subscribeToAssignments,
            'grades': realtimeService.subscribeToGrades,
            'payments': realtimeService.subscribeToPayments,
            'announcements': realtimeService.subscribeToAnnouncements,
            'timetable': realtimeService.subscribeToTimetable,
            'exam_schedule': realtimeService.subscribeToExams,
            'certificates': realtimeService.subscribeToCertificates,
            'students': realtimeService.subscribeToStudents,
            'staff_details': realtimeService.subscribeToStaff,
        }[channel];

        if (subscribeMethod) {
            return subscribeMethod.call(realtimeService, callback);
        }

        return () => { };
    }, []);

    /**
     * Subscribe to any table
     */
    const subscribeToTable = useCallback((tableName: string, callback: (data: any) => void, filter?: { event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'; schema?: string; filter?: string }) => {
        console.log(`📡 Subscribing to table ${tableName}...`, filter);
        return realtimeService.subscribeToTable(tableName, callback, filter);
    }, []);

    /**
     * Broadcast message
     */
    const broadcast = useCallback(async (channel: string, event: string, data: any) => {
        return realtimeService.broadcast(channel, event, data);
    }, []);

    return (
        <WebSocketContext.Provider
            value={{
                isConnected,
                subscribe,
                subscribeToTable,
                broadcast,
                connectionStatus,
                refreshConnection,
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocketContext() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocketContext must be used within a WebSocketProvider');
    }
    return context;
}

export default WebSocketProvider;
