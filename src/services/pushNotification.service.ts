import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';

let isInitialized = false;

export const initializePushNotifications = async (userId: string) => {
    // Prevent multiple initializations
    if (isInitialized) {
        console.log('[PUSH] Already initialized, skipping');
        return;
    }

    console.log('[PUSH] ========================================');
    console.log('[PUSH] BEGIN INITIALIZATION');
    console.log('[PUSH] User ID:', userId);
    console.log('[PUSH] Platform:', Capacitor.getPlatform());
    console.log('[PUSH] Is Native Platform:', Capacitor.isNativePlatform());
    console.log('[PUSH] ========================================');

    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
        console.log('[PUSH] ❌ Skipping push notifications on web platform');
        return;
    }

    try {
        console.log('[PUSH] 🔔 Requesting notification permissions...');

        // Request permission
        const permStatus = await PushNotifications.requestPermissions();
        console.log('[PUSH] Permission response:', JSON.stringify(permStatus));

        if (permStatus.receive !== 'granted') {
            console.log('[PUSH] ❌ Permission DENIED. Status:', permStatus.receive);
            return;
        }

        console.log('[PUSH] ✅ Permission granted, registering...');

        // Listen for registration success and save token
        // IMPORTANT: Set up listener BEFORE calling register()
        await PushNotifications.addListener('registration', async (token) => {
            console.log('[PUSH] ✅ Registration successful, token:', token.value);

            try {
                const { error } = await supabase
                    .from('user_push_tokens')
                    .upsert({
                        user_id: userId,
                        fcm_token: token.value,
                        platform: Capacitor.getPlatform(),
                        device_info: {
                            model: Capacitor.getPlatform(),
                            appVersion: '1.0.0',
                            registeredAt: new Date().toISOString()
                        },
                        last_used_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id,fcm_token'
                    });

                if (error) {
                    console.error('[PUSH] ❌ Failed to save token to database:', error);
                } else {
                    console.log('[PUSH] ✅ Token saved to database successfully');
                }
            } catch (err) {
                console.error('[PUSH] ❌ Error saving token:', err);
            }
        });

        // Now register AFTER listener is set up
        await PushNotifications.register();

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error) => {
            console.error('[PUSH] ❌ Registration error:', error);
        });

        // Handle notification received while app is in foreground
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[PUSH] 📬 Notification received (foreground):', notification);
            // Notification will be shown automatically by the system
        });

        // Handle notification tapped (app was in background/closed)
        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('[PUSH] 👆 Notification tapped:', action);

            // Navigate based on notification data
            const data = action.notification.data;
            if (data?.action_url) {
                console.log('[PUSH] Navigating to:', data.action_url);
                // TODO: Implement navigation logic
                window.location.href = data.action_url;
            }
        });

        isInitialized = true;
        console.log('[PUSH] ✅ Push notifications initialized successfully');

    } catch (error) {
        console.error('[PUSH] ❌ Failed to initialize push notifications:', error);
        // Don't throw - we don't want to crash the app if push fails
    }
};

// Function to remove token on logout
export const removePushToken = async (userId: string) => {
    try {
        const { error } = await supabase
            .from('user_push_tokens')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error('[PUSH] Failed to remove token:', error);
        } else {
            console.log('[PUSH] ✅ Token removed on logout');
        }
    } catch (err) {
        console.error('[PUSH] Error removing token:', err);
    }
};
