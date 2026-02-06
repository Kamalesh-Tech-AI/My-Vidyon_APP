import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { User, UserRole, AuthState, LoginCredentials, ROLE_ROUTES } from '@/types/auth';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured, setActiveAccount, capacitorStorage } from '@/lib/supabase';
import { Preferences } from '@capacitor/preferences';
import { toast } from 'sonner';
import { SplashScreen } from '@capacitor/splash-screen';
import { initializePushNotifications, removePushToken } from '@/services/pushNotification.service';

interface AuthStateWithAccounts extends AuthState {
  accounts: User[];
  activeAccountId: string | null;
}

interface AuthContextType extends AuthStateWithAccounts {
  login: (credentials: LoginCredentials, isAdding?: boolean) => Promise<void>;
  logout: (all?: boolean) => Promise<void>;
  switchAccount: (userId: string) => Promise<void>;
  forgetAccount: (userId: string) => Promise<void>;
  switchRole: (role: UserRole) => void; // Demo feature
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthStateWithAccounts>({
    user: null,
    accounts: [],
    activeAccountId: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const navigate = useNavigate();

  const fetchUserProfile = useCallback(async (userId: string, email: string) => {
    try {
      console.log('[AUTH] Verifying role for:', email);
      console.log('[AUTH] Starting profile fetch at:', new Date().toISOString());

      //  30-second timeout for profile fetch (increased for slower connections)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          console.error('[AUTH] ⏱️ Profile fetch timed out after 30 seconds - database is not responding');
          reject(new Error('Profile fetch timed out after 30 seconds. Please check your network connection.'));
        }, 30000)
      );

      const profileFetchPromise = (async () => {
        let detectedRole: UserRole | null = null;
        let institutionId: string | undefined = undefined;

        // 1. Fetch profile with institution data in one query
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, institution_id, is_active, phone, avatar_url, profile_image_url')
          .eq('id', userId)
          .maybeSingle();

        // If Super Admin, return immediately
        if (profile?.role === 'admin') {
          return {
            id: userId,
            email: email,
            name: profile.full_name || email.split('@')[0],
            role: 'admin' as UserRole,
            institutionId: profile.institution_id,
            forcePasswordChange: false
          };
        }

        // Check if profile is active
        if (profile?.is_active === false) {
          console.error('🚫 [AUTH] BLOCKING LOGIN - Profile is disabled');
          throw new Error('USER_DISABLED');
        }

        // 2. Role detection logic
        if (profile?.role) {
          // If we have a role in the profile, use it immediately
          detectedRole = profile.role as UserRole;
          institutionId = profile.institution_id;
          console.log('[AUTH] Role found in profile:', detectedRole);
        } else {
          // Fallback: Parallel queries for role detection if profile role is missing
          console.log('[AUTH] Role missing from profile, running fallback queries...');
          const [instRes, studentRes, parentRes, staffRes] = await Promise.all([
            supabase.from('institutions').select('institution_id').eq('admin_email', email).maybeSingle(),
            supabase.from('students').select('institution_id, is_active, phone, address').eq('email', email).maybeSingle(),
            supabase.from('parents').select('institution_id, is_active, phone').eq('email', email).maybeSingle(),
            supabase.from('staff_details').select('institution_id, role').eq('profile_id', userId).maybeSingle()
          ]);

          // Check Institution Admin
          if (instRes.data) {
            detectedRole = 'institution';
            institutionId = instRes.data.institution_id;
          }

          // Check Student
          if (!detectedRole && studentRes.data) {
            if (studentRes.data.is_active === false) {
              console.error('🚫 [AUTH] BLOCKING LOGIN - Student account is disabled');
              throw new Error('USER_DISABLED');
            }
            detectedRole = 'student';
            institutionId = studentRes.data.institution_id;
          }

          // Check Parent
          if (!detectedRole && parentRes.data) {
            if (parentRes.data.is_active === false) {
              console.error('🚫 [AUTH] BLOCKING LOGIN - Parent account is disabled');
              throw new Error('USER_DISABLED');
            }
            detectedRole = 'parent';
            institutionId = parentRes.data.institution_id;
          }

          // Check Staff/Faculty (StaffDetails might have different role field)
          if (!detectedRole && staffRes.data) {
            detectedRole = staffRes.data.role as UserRole;
            institutionId = staffRes.data.institution_id;
          }

          if (!detectedRole) {
            // Last resort: check profiles again but more loosely
            if (institutionId) {
              detectedRole = 'student'; // Default to student if institution found but role not
            } else {
              console.error('No role detected for user');
              return null;
            }
          }

          // --- SYNC LOGIC: Update profiles table if data was missing ---
          if (profile && (!profile.role || !profile.institution_id || !profile.full_name)) {
            console.log('[AUTH] Syncing profile table with detected data...');
            await supabase.from('profiles').update({
              role: detectedRole,
              institution_id: institutionId,
              full_name: profile.full_name || email.split('@')[0]
            }).eq('id', userId);
          }
        }

        // 2b. If institutionId is still missing, try to find it from any associated table
        if (!institutionId) {
          const [s, p, st] = await Promise.all([
            supabase.from('students').select('institution_id').eq('email', email).maybeSingle(),
            supabase.from('parents').select('institution_id').eq('email', email).maybeSingle(),
            supabase.from('staff_details').select('institution_id, role').eq('profile_id', userId).maybeSingle()
          ]);
          institutionId = s.data?.institution_id || p.data?.institution_id || st.data?.institution_id;
        }

        // 5. Fetch additional details for card (Institution info, Class, Section, Student ID, Photo)
        let institutionName = 'Unknown Institution';
        let institutionCode = institutionId || 'N/A';
        let extraDetails: any = {};

        // 2c. Fetch Staff Details if needed
        let staffId = undefined;
        let staffImage = undefined;
        if (detectedRole !== 'student' && detectedRole !== 'parent' && detectedRole !== 'admin') {
          const { data: staff } = await supabase
            .from('staff_details')
            .select('staff_id, image_url, class_assigned, section_assigned')
            .eq('profile_id', userId)
            .maybeSingle();
          if (staff) {
            staffId = staff.staff_id;
            staffImage = (staff as any).image_url;
            extraDetails.className = (staff as any).class_assigned;
            extraDetails.section = (staff as any).section_assigned;
          }
        }

        if (institutionId) {
          const { data: inst } = await supabase
            .from('institutions')
            .select('name, institution_id')
            .eq('institution_id', institutionId)
            .maybeSingle();
          if (inst) {
            institutionName = inst.name;
            institutionCode = inst.institution_id;
          }
        }

        if (detectedRole === 'student') {
          const { data: student } = await supabase
            .from('students')
            .select('register_number, class_name, section, image_url')
            .eq('id', userId)
            .maybeSingle();
          if (student) {
            extraDetails = {
              studentId: student.register_number,
              className: student.class_name,
              section: student.section,
              imageUrl: student.image_url
            };
          }
        }

        return {
          id: userId,
          email: email,
          name: profile?.full_name || email.split('@')[0],
          role: detectedRole,
          avatar: profile?.avatar_url || profile?.profile_image_url || extraDetails.imageUrl || staffImage,
          institutionId: institutionId,
          institutionName,
          institutionCode,
          studentId: extraDetails.studentId,
          staffId: staffId,
          className: extraDetails.className,
          section: extraDetails.section,
          academicYear: '2025-26', // TODO: Fetch from settings
          forcePasswordChange: false,
          phone: profile?.phone,
          address: undefined
        };
      })();

      // Race between profile fetch and 30s timeout
      const result = await Promise.race([profileFetchPromise, timeoutPromise]);
      return result as User | null;

    } catch (err: any) {
      console.error('Profile fetch error:', err);
      if (err.message === 'INSTITUTION_INACTIVE' || err.message === 'INSTITUTION_DELETED' || err.message === 'USER_DISABLED') {
        throw err; // Re-throw blocking errors
      }

      // If it's a network timeout or connection error, don't return null (which triggers logout)
      // instead, throw a specific TRANSIENT_ERROR so caller knows not to clear session
      const errorMsg = err.message || '';
      if (errorMsg.includes('timeout') || errorMsg.includes('fetch') || errorMsg.includes('Network')) {
        console.warn('⚠️ [AUTH] Network error during profile fetch - holding session');
        throw new Error('TRANSIENT_NETWORK_ERROR');
      }

      return null;
    }
  }, []);

  const userRef = useRef(state.user);
  const isProcessingAuth = useRef(false);

  useEffect(() => {
    userRef.current = state.user;
  }, [state.user]);

  const saveAccountsList = async (accounts: User[]) => {
    await Preferences.set({
      key: 'myvidyon-accounts-list',
      value: JSON.stringify(accounts)
    });
  };

  const getAccountsList = async (): Promise<User[]> => {
    const { value } = await Preferences.get({ key: 'myvidyon-accounts-list' });
    return value ? JSON.parse(value) : [];
  };

  const getActiveAccountId = async (): Promise<string | null> => {
    const { value } = await Preferences.get({ key: 'myvidyon-active-account-id' });
    return value;
  };

  const setActiveAccountId = async (id: string | null) => {
    if (id) {
      await Preferences.set({ key: 'myvidyon-active-account-id', value: id });
    } else {
      await Preferences.remove({ key: 'myvidyon-active-account-id' });
    }
    setActiveAccount(id);
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    let isInitialLoad = true;

    // Explicitly initialize session from storage on startup
    const initSession = async () => {
      try {
        console.log('[AUTH] Checking for existing accounts...');
        const accounts = await getAccountsList();
        const activeId = await getActiveAccountId();

        if (activeId) {
          setActiveAccount(activeId);
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AUTH] Error retrieving session:', error);
          setState(prev => ({ ...prev, accounts, activeAccountId: activeId, isLoading: false }));
          return;
        }

        if (session) {
          console.log('[AUTH] Found existing session, restoring user...');
          try {
            const user = await fetchUserProfile(session.user.id, session.user.email!);

            if (user) {
              setState({
                user,
                accounts: accounts.find(a => a.id === user.id) ? accounts : [...accounts, user],
                activeAccountId: user.id,
                isAuthenticated: true,
                isLoading: false,
              });
              console.log('[AUTH] Session restored successfully, navigating to:', ROLE_ROUTES[user.role]);

              // Only navigate if we're on the root or login path
              if (window.location.pathname === '/' || window.location.pathname === '/login') {
                navigate(ROLE_ROUTES[user.role]);
              }

              // Initialize push notifications after session restoration
              try {
                console.log('[AUTH] Initializing push notifications for restored session...');
                await initializePushNotifications(user.id);
              } catch (error) {
                console.error('[AUTH] Push notification init failed during session restoration:', error);
              }
            } else {
              console.log('[AUTH] Profile not found, clearing session');
              await supabase.auth.signOut();
              setState({ user: null, accounts, activeAccountId: null, isAuthenticated: false, isLoading: false });
            }
          } catch (error: any) {
            console.error('[AUTH] Error restoring session:', error);
            const isBlockingError = ['INSTITUTION_INACTIVE', 'INSTITUTION_DELETED', 'USER_DISABLED'].includes(error.message);
            const isTransientError = error.message === 'TRANSIENT_NETWORK_ERROR';

            if (isBlockingError) {
              await supabase.auth.signOut();
              setState({ user: null, accounts, activeAccountId: null, isAuthenticated: false, isLoading: false });
            } else if (isTransientError) {
              // On network error, try to use the cached account data from preferences if available
              const cachedAccount = accounts.find(a => a.id === activeId);
              if (cachedAccount) {
                console.log('[AUTH] Network error on init, using cached account data');
                setState({
                  user: cachedAccount,
                  accounts,
                  activeAccountId: activeId,
                  isAuthenticated: true,
                  isLoading: false,
                });
              } else {
                setState(prev => ({ ...prev, accounts, activeAccountId: activeId, isLoading: false }));
              }
            } else {
              setState({ user: null, accounts, activeAccountId: null, isAuthenticated: false, isLoading: false });
            }
          }
        } else {
          console.log('[AUTH] No active session found');
          setState({ user: null, accounts, activeAccountId: activeId, isAuthenticated: false, isLoading: false });
        }

        // Hide splash screen after initial session check
        setTimeout(async () => {
          try {
            await SplashScreen.hide();
            console.log('[AUTH] Splash screen hidden after auth check');
          } catch (error) {
            console.log('[AUTH] Splash screen already hidden or not available');
          }
        }, 300);
        isInitialLoad = false;
      } catch (error) {
        console.error('[AUTH] Fatal error during session init:', error);
        const accounts = await getAccountsList();
        setState({ user: null, accounts, activeAccountId: null, isAuthenticated: false, isLoading: false });
      }
    };

    // Initialize session immediately
    initSession();

    // Listen for auth changes and handle initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isProcessingAuth.current) {
        console.log(`🔄 [AUTH] Event ${event} skipped (manual processing in progress)`);
        return;
      }

      console.log(`🔄 [AUTH] Event: ${event}`);

      // Skip initial load events since we handle them above
      if (isInitialLoad) {
        console.log('[AUTH] Skipping event during initial load');
        return;
      }

      if (session) {
        // If we already have the same user and it's just a token refresh (not SIGNED_IN), 
        // we can skip the heavy profile fetch to avoid transient network issues logging the user out.
        if (userRef.current?.id === session.user.id && event !== 'SIGNED_IN') {
          console.log('[AUTH] Token refresh for same user, skipping profile fetch');
          return;
        }

        try {
          const user = await fetchUserProfile(session.user.id, session.user.email!);

          if (user) {
            setState(prev => {
              const accounts = prev.accounts.find(a => a.id === user.id)
                ? prev.accounts
                : [...prev.accounts, user];
              saveAccountsList(accounts);
              return {
                ...prev,
                user,
                accounts,
                activeAccountId: user.id,
                isAuthenticated: true,
                isLoading: false,
              };
            });

            // Only auto-navigate on SIGNED_IN events
            if (event === 'SIGNED_IN') {
              console.log('[AUTH] User signed in, navigating to:', ROLE_ROUTES[user.role]);
              navigate(ROLE_ROUTES[user.role]);
            }
          } else {
            // Profile explicitly not found in DB
            console.error('🚫 [AUTH] Profile not found - signing out');
            await supabase.auth.signOut();
            setState(prev => ({ ...prev, user: null, isAuthenticated: false, isLoading: false }));
          }
        } catch (error: any) {
          const isBlockingError = ['INSTITUTION_INACTIVE', 'INSTITUTION_DELETED', 'USER_DISABLED'].includes(error.message);

          if (isBlockingError) {
            console.error('🚫 [AUTH] Blocking error - signing out:', error.message);
            await supabase.auth.signOut();
            setState(prev => ({ ...prev, user: null, isAuthenticated: false, isLoading: false }));

            toast.error('Access Denied', {
              description: error.message === 'USER_DISABLED'
                ? 'Your account has been disabled.'
                : error.message === 'INSTITUTION_INACTIVE'
                  ? 'Your institution has been deactivated.'
                  : 'Your institution has been deleted.',
            });
          } else {
            // Transient error (timeout/network)
            console.warn('⚠️ [AUTH] Transient auth error (not signing out):', error);
          }
        }
      } else {
        // No session
        console.log('[AUTH] Session ended');
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    });

    // Sub-periodic check for institution status (optional, but keep it robust)
    const statusCheckInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !userRef.current) return;

      try {
        // Use a silent fetch that doesn't trigger global loading or aggressive error handling
        await fetchUserProfile(session.user.id, session.user.email!);
      } catch (error: any) {
        if (['INSTITUTION_INACTIVE', 'INSTITUTION_DELETED', 'USER_DISABLED'].includes(error.message)) {
          console.error('🚫 [AUTH] Mid-session block detected');
          await supabase.auth.signOut();
          setState(prev => ({ ...prev, user: null, isAuthenticated: false, isLoading: false }));
          toast.error('Session Expired', { description: 'Your access has been revoked.' });
        }
      }
    }, 60000); // Reduce frequency to once per minute

    return () => {
      subscription.unsubscribe();
      clearInterval(statusCheckInterval);
    };
  }, [fetchUserProfile]);

  const login = useCallback(async (credentials: LoginCredentials, isAdding?: boolean) => {
    console.log(`[AUTH] Login started for: ${credentials.email} (Adding: ${isAdding})`);
    setState(prev => ({ ...prev, isLoading: true }));

    isProcessingAuth.current = true;
    try {
      // Mock Login Bypass (Demo Mode)
      if (!isSupabaseConfigured()) {
        const role: UserRole = credentials.email.includes('admin') ? 'admin' : 'student';
        const user: User = { id: `MOCK_${Date.now()}`, email: credentials.email, name: 'Demo User', role };

        setState(prev => {
          const accounts = prev.accounts.find(a => a.email === user.email)
            ? prev.accounts
            : [...prev.accounts, user];
          saveAccountsList(accounts);
          return {
            ...prev,
            user,
            accounts,
            activeAccountId: user.id,
            isAuthenticated: true,
            isLoading: false,
          };
        });
        navigate(ROLE_ROUTES[role]);
        return;
      }

      // If adding a new account, we should sign out existing session first in Supabase client
      // but remember we are in "Adding Mode" so we don't clear our UI state yet.
      if (isAdding) {
        await supabase.auth.signOut();
        setActiveAccountId(null);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;
      if (!data.user?.email) throw new Error("User email not found");

      const user = await fetchUserProfile(data.user.id, data.user.email);

      if (user) {
        // --- SESSION MIGRATION ---
        // 1. Get current session (it was saved to the 'default' slot during signInWithPassword)
        const { data: { session } } = await supabase.auth.getSession();

        // 2. Set the active account ID (this changes the storage key)
        await setActiveAccountId(user.id);

        // 3. Move/Save the session to the new user-specific slot
        if (session) {
          console.log(`[AUTH] Migrating session to slot: myvidyon-auth-session-${user.id}`);
          await capacitorStorage.setItem('myvidyon-auth-session', JSON.stringify(session));
        }
        // -------------------------

        setState(prev => {
          const accounts = prev.accounts.find(a => a.id === user.id)
            ? prev.accounts
            : [...prev.accounts, user];
          saveAccountsList(accounts);
          return {
            ...prev,
            user,
            accounts,
            activeAccountId: user.id,
            isAuthenticated: true,
            isLoading: false,
          };
        });
        navigate(ROLE_ROUTES[user.role]);
        await initializePushNotifications(user.id);
      } else {
        await supabase.auth.signOut();
        throw new Error("Profile not found.");
      }
    } catch (error: any) {
      console.error('[AUTH] Login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error(error.message || "Login failed");
      throw error;
    } finally {
      isProcessingAuth.current = false;
    }
  }, [navigate, fetchUserProfile]);

  const logout = useCallback(async (all?: boolean) => {
    try {
      const loadingToast = toast.loading(all ? 'Logging out of all accounts...' : 'Logging out...');

      if (all) {
        // Log out of all accounts
        const accounts = await getAccountsList();
        for (const acc of accounts) {
          await setActiveAccountId(acc.id);
          await supabase.auth.signOut();
          await removePushToken(acc.id).catch(() => { });
        }
        await setActiveAccountId(null);
        await saveAccountsList([]);
        setState({ user: null, accounts: [], activeAccountId: null, isAuthenticated: false, isLoading: false });
      } else if (state.user) {
        // Log out current account only
        const userId = state.user.id;
        await supabase.auth.signOut();
        await removePushToken(userId).catch(() => { });

        // IMPORTANT: We NO LONGER filter out the account from the list here.
        // We want the account card to stick around on the login page.
        // The session is removed from storage by Supabase, so the account is effectively "logged out".

        await setActiveAccountId(null);
        setState(prev => ({
          ...prev,
          user: null,
          activeAccountId: null,
          isAuthenticated: false,
          isLoading: false
        }));
      }

      toast.success('Logged out successfully', { id: loadingToast });
      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      setState(prev => ({ ...prev, user: null, isAuthenticated: false, isLoading: false }));
      navigate('/login');
    }
  }, [navigate, state.user, state.accounts]);

  const forgetAccount = useCallback(async (userId: string) => {
    try {
      // 1. If it's the current user, log out first
      if (state.user?.id === userId) {
        await logout();
      }

      // 2. Remove session from storage
      await setActiveAccountId(userId);
      await capacitorStorage.removeItem('myvidyon-auth-session');
      await setActiveAccountId(null);

      // 3. Remove credentials from storage
      const account = state.accounts.find(a => a.id === userId);
      if (account) {
        const credsKey = `creds_${account.email.toLowerCase().trim()}`;
        await Preferences.remove({ key: credsKey });
      }

      // 4. Remove from accounts list
      const remainingAccounts = state.accounts.filter(a => a.id !== userId);
      setState(prev => ({ ...prev, accounts: remainingAccounts }));
      await saveAccountsList(remainingAccounts);

      toast.success("Account forgotten from this device");
    } catch (error) {
      console.error('[AUTH] Forget error:', error);
      toast.error("Failed to remove account");
    }
  }, [state.user, state.accounts, logout]);

  const switchAccount = useCallback(async (userId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await setActiveAccountId(userId);

      // --- CRITICAL: Force session refresh from storage to clear memory cache ---
      const savedSessionStr = await capacitorStorage.getItem('myvidyon-auth-session');
      if (savedSessionStr) {
        console.log('[AUTH] Forcing session reload from storage for:', userId);
        const session = JSON.parse(savedSessionStr);
        const { error: setSessionError } = await supabase.auth.setSession(session);
        if (setSessionError) {
          console.error('[AUTH] setSession error:', setSessionError);
        }
      }

      // Re-fetch session for the target account
      const { data: { session } } = await supabase.auth.getSession();

      console.log(`[AUTH] Switching to user ${userId}, session found:`, !!session);

      if (session) {
        const user = await fetchUserProfile(session.user.id, session.user.email!);
        if (user) {
          setState(prev => ({
            ...prev,
            user,
            activeAccountId: user.id,
            isAuthenticated: true,
            isLoading: false
          }));
          navigate(ROLE_ROUTES[user.role]);
          toast.success(`Switched to ${user.name}`);
          return;
        }
      } else {
        // If session not found in the specific slot, try checking the 'default' slot
        // This might happen if migration failed previously
        console.warn(`[AUTH] Session not found for ${userId} in its slot, checking default...`);
        await setActiveAccountId(null);
        const { data: { session: defaultSession } } = await supabase.auth.getSession();

        if (defaultSession && defaultSession.user.id === userId) {
          console.log(`[AUTH] Found session in default slot, migrating now...`);
          await setActiveAccountId(userId);
          await capacitorStorage.setItem('myvidyon-auth-session', JSON.stringify(defaultSession));

          // Try fetch again
          const user = await fetchUserProfile(defaultSession.user.id, defaultSession.user.email!);
          if (user) {
            setState(prev => ({
              ...prev,
              user,
              activeAccountId: user.id,
              isAuthenticated: true,
              isLoading: false
            }));
            navigate(ROLE_ROUTES[user.role]);
            toast.success(`Switched to ${user.name}`);
            return;
          }
        }
      }
      throw new Error("Unable to restore session for this account");
    } catch (error) {
      console.error('[AUTH] Switch error:', error);
      // Suppress toast - the switcher will handle the fallback to login form
      // toast.error("Failed to switch account");
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [fetchUserProfile, navigate]);

  const switchRole = useCallback((role: UserRole) => {
    // Only for demo/testing purposes
    const demoUser: User = {
      id: 'DEMO_' + role.toUpperCase(),
      email: `${role}@demo.com`,
      name: `Demo ${role}`,
      role: role,
    };
    setState(prev => ({
      ...prev,
      user: demoUser,
      isAuthenticated: true,
      isLoading: false,
    }));
    navigate(ROLE_ROUTES[role]);
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, switchAccount, forgetAccount, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
