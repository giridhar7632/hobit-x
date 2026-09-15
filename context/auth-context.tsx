import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const GUEST_STORAGE_KEY = '@hobit_guest_mode';
const AUTH_SESSION_STORAGE_KEY = '@hobit_auth_session';

export type AuthStatus = 'INITIALIZING' | 'AUTHENTICATED' | 'GUEST' | 'UNAUTHENTICATED';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  isConfigured: boolean;
  authStatus: AuthStatus;
  signInWithGoogle: () => Promise<{ error?: Error | null }>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: true,
  isGuest: false,
  isConfigured: false,
  authStatus: 'INITIALIZING',
  signInWithGoogle: async () => ({ error: null }),
  signInAsGuest: async () => {},
  signOut: async () => {},
});

/**
 * Loads any locally persisted authentication session from AsyncStorage.
 * Checks dedicated cache first, then falls back to Supabase's local storage key.
 */
async function loadStoredAuthSession(): Promise<{ session: Session | null; user: User } | null> {
  try {
    // 1. Primary: dedicated cached session key
    const cachedRaw = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw);
      if (parsed?.user) {
        return { session: parsed, user: parsed.user };
      }
    }

    // 2. Secondary: Supabase client's active storageKey
    const supabaseKey = (supabase.auth as any)?.storageKey;
    if (supabaseKey) {
      const raw = await AsyncStorage.getItem(supabaseKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user) {
          await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, raw).catch(() => {});
          return { session: parsed, user: parsed.user };
        }
      }
    }

    // 3. Tertiary: scan AsyncStorage for sb-*-auth-token for existing installs
    const allKeys = await AsyncStorage.getAllKeys();
    const tokenKey = allKeys.find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (tokenKey) {
      const raw = await AsyncStorage.getItem(tokenKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user) {
          await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, raw).catch(() => {});
          return { session: parsed, user: parsed.user };
        }
      }
    }
  } catch (err) {
    console.warn('[Auth] Failed to restore local offline session:', err);
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        // Step 1: Critical Local Initialization (AsyncStorage only, 0 network latency)
        const [savedGuest, localAuth] = await Promise.all([
          AsyncStorage.getItem(GUEST_STORAGE_KEY).catch(() => null),
          loadStoredAuthSession(),
        ]);

        if (!isMounted) return;

        if (localAuth?.user) {
          setSession(localAuth.session);
          setUser(localAuth.user);
          setIsGuest(false);
        } else if (savedGuest === 'true') {
          setIsGuest(true);
          setUser(null);
          setSession(null);
        } else {
          setIsGuest(false);
          setUser(null);
          setSession(null);
        }
      } catch (e) {
        console.warn('[Auth] Local session initialization error:', e);
      } finally {
        if (isMounted) {
          // Unblock app startup immediately — UI renders with local identity
          setIsLoading(false);
        }
      }

      // Step 2: Optional Network Initialization (Non-blocking background refresh)
      if (configured) {
        (async () => {
          try {
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise<{ data: { session: null }; error: Error }>((resolve) =>
              setTimeout(() => resolve({ data: { session: null }, error: new Error('Session fetch timeout') }), 4000)
            );

            const { data, error } = await Promise.race([sessionPromise, timeoutPromise]);
            if (!isMounted) return;

            if (data?.session?.user) {
              setSession(data.session);
              setUser(data.session.user);
              setIsGuest(false);
              await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(data.session)).catch(() => {});
              await AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {});
            } else if (error) {
              // Network error, timeout, or offline: safe to ignore, offline identity remains intact!
              console.log('[Auth] Background session check notice:', error.message);
            }
          } catch (netErr) {
            console.log('[Auth] Background session refresh notice:', netErr);
          }
        })();
      }
    }

    initializeAuth();

    if (configured) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMounted) return;

        if (event === 'INITIAL_SESSION') {
          // If Supabase was able to refresh or confirm the session, update it
          if (newSession?.user) {
            setSession(newSession);
            setUser(newSession.user);
            setIsGuest(false);
            await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(newSession)).catch(() => {});
            await AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {});
          }
          // IMPORTANT: If newSession is null on INITIAL_SESSION (due to offline or token refresh failure),
          // DO NOT clear the restored local user! The user is still authenticated locally on this device.
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (newSession?.user) {
            setSession(newSession);
            setUser(newSession.user);
            setIsGuest(false);
            await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(newSession)).catch(() => {});
            await AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {});

            if (event === 'SIGNED_IN') {
              (async () => {
                try {
                  const { syncLocalAndCloud } = require('@/lib/sync');
                  await syncLocalAndCloud(newSession.user.id);
                } catch (syncError) {
                  console.error('[Auth] Background sync error:', syncError);
                }
              })();
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsGuest(false);
          await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY).catch(() => {});
          await AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {});
        }

        setIsLoading(false);
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [configured]);

  const signInWithGoogle = useCallback(async () => {
    if (!configured) {
      return {
        error: new Error(
          'Supabase is not configured yet. Please add your EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your .env file.'
        ),
      };
    }

    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'app.giridhar.hobit',
        path: 'auth',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) throw error;

      if (Platform.OS !== 'web' && data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

        if (result.type === 'success' && result.url) {
          const parsedUrl = new URL(result.url);

          // Check for code exchange (PKCE) or hash params
          const code = parsedUrl.searchParams.get('code');
          if (code) {
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) throw exchangeError;
            if (exchangeData?.session) {
              setSession(exchangeData.session);
              setUser(exchangeData.session.user);
              setIsGuest(false);
              await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(exchangeData.session)).catch(() => {});
              await AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {});
            }
          } else {
            // Hash params: #access_token=...&refresh_token=...
            const hash = parsedUrl.hash.substring(1);
            const params = new URLSearchParams(hash);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (access_token && refresh_token) {
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (sessionError) throw sessionError;
              if (sessionData?.session) {
                setSession(sessionData.session);
                setUser(sessionData.session.user);
                setIsGuest(false);
                await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(sessionData.session)).catch(() => {});
                await AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {});
              }
            }
          }
        }
      }

      return { error: null };
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      return { error: err };
    }
  }, [configured]);

  const signInAsGuest = useCallback(async () => {
    setIsGuest(true);
    setUser(null);
    setSession(null);
    await AsyncStorage.setItem(GUEST_STORAGE_KEY, 'true').catch(() => {});
    await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY).catch(() => {});
  }, []);

  const signOut = useCallback(async () => {
    setIsGuest(false);
    setUser(null);
    setSession(null);
    await AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {});
    await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY).catch(() => {});
    if (configured) {
      await supabase.auth.signOut().catch(() => {});
    }
  }, [configured]);

  const authStatus: AuthStatus = useMemo(() => {
    if (isLoading) return 'INITIALIZING';
    if (user) return 'AUTHENTICATED';
    if (isGuest) return 'GUEST';
    return 'UNAUTHENTICATED';
  }, [isLoading, user, isGuest]);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isGuest,
      isConfigured: configured,
      authStatus,
      signInWithGoogle,
      signInAsGuest,
      signOut,
    }),
    [user, session, isLoading, isGuest, configured, authStatus, signInWithGoogle, signInAsGuest, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
