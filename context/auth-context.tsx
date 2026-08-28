import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const GUEST_STORAGE_KEY = '@hobit_guest_mode';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  isConfigured: boolean;
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
  signInWithGoogle: async () => ({ error: null }),
  signInAsGuest: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const configured = isSupabaseConfigured();

  // Load cached session & guest mode from local disk (works 100% offline)
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        // 1. Check if user previously chose guest/offline mode
        const savedGuest = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
        if (savedGuest === 'true' && isMounted) {
          setIsGuest(true);
        }

        // 2. If Supabase configured, read persisted session from AsyncStorage
        if (configured) {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data?.session && isMounted) {
            setSession(data.session);
            setUser(data.session.user);
            setIsGuest(false);
          }
        }
      } catch (e) {
        console.warn('[Auth] Offline session load fallback:', e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // 3. Listen to auth changes when online
    if (configured) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setIsGuest(false);
          await AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {});
          
          // Only trigger data migration and sync on explicit SIGNED_IN events to prevent infinite loops
          if (_event === 'SIGNED_IN') {
            (async () => {
              try {
                const { syncLocalAndCloud } = require('@/lib/sync');
                await syncLocalAndCloud(session.user.id);
              } catch (syncError) {
                console.error('[Auth] Background sync error:', syncError);
              }
            })();
          }
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
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) throw exchangeError;
          } else {
            // Hash params: #access_token=...&refresh_token=...
            const hash = parsedUrl.hash.substring(1);
            const params = new URLSearchParams(hash);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (access_token && refresh_token) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (sessionError) throw sessionError;
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
    await AsyncStorage.setItem(GUEST_STORAGE_KEY, 'true').catch(() => {});
  }, []);

  const signOut = useCallback(async () => {
    setIsGuest(false);
    await AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {});
    if (configured) {
      await supabase.auth.signOut().catch(() => {});
    }
    setSession(null);
    setUser(null);
  }, [configured]);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isGuest,
      isConfigured: configured,
      signInWithGoogle,
      signInAsGuest,
      signOut,
    }),
    [user, session, isLoading, isGuest, configured, signInWithGoogle, signInAsGuest, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
