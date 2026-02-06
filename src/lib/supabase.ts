import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error('❌ Supabase credentials are missing or invalid. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

// Helper to check if supabase is configured
const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';
};

// Validate configuration before creating client
if (!isSupabaseConfigured()) {
  console.error('❌ Cannot initialize Supabase client with invalid configuration');
}

// Custom storage adapter for Capacitor
const isNativePlatform = Capacitor.isNativePlatform();

console.log('[STORAGE] Platform detection:', { isNativePlatform, platform: Capacitor.getPlatform() });

// Helper to manage active account ID for multi-account support
let activeAccountId: string | null = null;

export const setActiveAccount = (id: string | null) => {
  activeAccountId = id;
  console.log('[STORAGE] Active account set to:', id || 'default');
};

const getStorageKey = (key: string) => {
  if (key === 'myvidyon-auth-session' && activeAccountId) {
    return `myvidyon-auth-session-${activeAccountId}`;
  }
  return key;
};

export const capacitorStorage = {
  getItem: async (key: string) => {
    try {
      const storageKey = getStorageKey(key);
      if (isNativePlatform) {
        const { value } = await Preferences.get({ key: storageKey });

        if (value && key === 'myvidyon-auth-session') {
          console.log(`[STORAGE] ✅ Auth session loaded (${activeAccountId || 'default'})`);
        }

        return value;
      }
      return localStorage.getItem(storageKey);
    } catch (error) {
      console.error('[STORAGE] 💥 Error getting item:', error, 'key:', key);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      const storageKey = getStorageKey(key);
      if (isNativePlatform) {
        await Preferences.set({ key: storageKey, value });
        if (key === 'myvidyon-auth-session') {
          console.log(`[STORAGE] 💾 Auth session saved (${activeAccountId || 'default'})`);
        }
      } else {
        localStorage.setItem(storageKey, value);
      }
    } catch (error) {
      console.error('[STORAGE] 💥 Error setting item:', error, 'key:', key);
    }
  },
  removeItem: async (key: string) => {
    try {
      const storageKey = getStorageKey(key);
      if (isNativePlatform) {
        await Preferences.remove({ key: storageKey });
        if (key === 'myvidyon-auth-session') {
          console.log(`[STORAGE] 🗑️ Auth session removed (${activeAccountId || 'default'})`);
        }
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('[STORAGE] 💥 Error removing item:', error, 'key:', key);
    }
  },
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      storage: capacitorStorage as any,
      storageKey: 'myvidyon-auth-session',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  }
);

// Initialize session from storage on app startup
export const initializeSession = async () => {
  try {
    console.log('[AUTH] Initializing session from storage...');
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[AUTH] Error getting session:', error);
      return null;
    }

    if (data.session) {
      console.log('[AUTH] ✅ Session restored successfully');
      return data.session;
    } else {
      console.log('[AUTH] No existing session found');
      return null;
    }
  } catch (error) {
    console.error('[AUTH] Failed to initialize session:', error);
    return null;
  }
};

// Test Supabase connection
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase is not configured. Check your environment variables.' };
    }

    // Simple query to test connection
    const { error } = await supabase.from('institutions').select('count', { count: 'exact', head: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown connection error' };
  }
};

export { isSupabaseConfigured };
