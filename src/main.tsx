import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from './lib/supabase';
import { LanguageProvider } from '@/i18n/LanguageContext';

// Initialize Capacitor App lifecycle
CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
    console.log('[CAPACITOR] App state changed. Is active:', isActive);

    if (isActive) {
        // Refresh session when app becomes active to maintain login state
        try {
            const { data, error } = await supabase.auth.refreshSession();

            if (error) {
                console.error('[AUTH] Failed to refresh session on app resume:', error);
            } else if (data.session) {
                console.log('[AUTH] ✅ Session refreshed successfully on app resume');
            } else {
                console.log('[AUTH] ℹ️ No active session to refresh');
            }
        } catch (err) {
            console.error('[AUTH] Unexpected error refreshing session:', err);
        }
    }
});

// Render React app
createRoot(document.getElementById("root")!).render(
    <LanguageProvider>
        <App />
    </LanguageProvider>
);
