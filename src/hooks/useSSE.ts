import { useEffect, useState, useCallback } from 'react';

/**
 * Reusable hook for Server-Sent Events (SSE)
 * Provides a "Zero-Buffer" stream of events from the server.
 */
export function useSSE<T = any>(url: string | null) {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closed'>('closed');

    const subscribe = useCallback(() => {
        if (!url) return;

        setConnectionStatus('connecting');
        const eventSource = new EventSource(url);

        eventSource.onopen = () => {
            setConnectionStatus('open');
            setError(null);
        };

        eventSource.onmessage = (event) => {
            try {
                const parsedData = JSON.parse(event.data);
                setData(parsedData);
            } catch (err) {
                console.error('SSE Parse Error:', err);
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE Connection Error:', err);
            setConnectionStatus('closed');
            setError(new Error('SSE connection failed'));
            eventSource.close();
        };

        return () => {
            eventSource.close();
            setConnectionStatus('closed');
        };
    }, [url]);

    useEffect(() => {
        const unsub = subscribe();
        return () => {
            if (unsub) unsub();
        };
    }, [subscribe]);

    return { data, error, connectionStatus };
}
