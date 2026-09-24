import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = 'pia_auth_session';

const getStoredSession = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.currentUser && data.currentUser.id) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Error reading stored session:', e);
  }
  return null;
};

const saveStoredSession = (data) => {
  try {
    if (data && data.currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Error writing stored session:', e);
  }
};

export function AuthProvider({ children }) {
  const initial = getStoredSession();
  const [currentUser, setCurrentUser] = useState(initial?.currentUser || null);
  const [userRole, setUserRole] = useState(initial?.userRole || null);
  const [userStatus, setUserStatus] = useState(initial?.userStatus || null);
  const [userData, setUserData] = useState(initial?.userData || null);
  const [loading, setLoading] = useState(!initial);

  // Helper to fetch profile from Supabase profiles table using maybeSingle() with safety timeout
  const fetchUserProfile = async (userId) => {
    if (!userId) return null;
    try {
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ data: null, error: new Error('timeout') }), 2500)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error && error.message !== 'timeout') {
        console.warn("Notice fetching user profile:", error.message);
      }
      return data || null;
    } catch (e) {
      console.warn("Profile fetch exception:", e);
      return null;
    }
  };

  const applyUserSession = async (user) => {
    if (!user) {
      setCurrentUser(null);
      setUserRole(null);
      setUserStatus(null);
      setUserData(null);
      saveStoredSession(null);
      return;
    }

    const normalizedUser = {
      ...user,
      uid: user.id,
      id: user.id
    };

    setCurrentUser(normalizedUser);
    const profile = await fetchUserProfile(user.id);

    const roleFromMeta = user.user_metadata?.role || 'student';
    const nameFromMeta = user.user_metadata?.full_name || user.email;
    const statusFromMeta = user.user_metadata?.status || 'active';

    const role = profile?.role || roleFromMeta;
    let status = profile?.status;
    if (!status || status === 'active') {
      if (role === 'instructor' && profile?.is_approved !== true) {
        status = 'pending';
      } else if (!status) {
        status = statusFromMeta;
      }
    }

    const finalUserData = profile 
      ? { ...profile, uid: profile.id, status, name: profile.full_name || nameFromMeta } 
      : { uid: user.id, id: user.id, email: user.email, role, status, name: nameFromMeta };

    setUserRole(role);
    setUserStatus(status);
    setUserData(finalUserData);

    // Save snapshot to local storage for immediate 0ms hydration on next reload
    saveStoredSession({
      currentUser: normalizedUser,
      userRole: role,
      userStatus: status,
      userData: finalUserData
    });
  };

  useEffect(() => {
    let isMounted = true;

    // Hard fallback safety timer: loading is NEVER stuck at true longer than 1800ms
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1800);

    const initAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve({ data: { session: null }, error: new Error('timeout') }), 2000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        if (isMounted) {
          await applyUserSession(session?.user || null);
        }
      } catch (err) {
        console.warn("Auth init notice:", err);
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes without blocking GoTrue internal mutex locks
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      // Dispatch in separate macrotask to prevent GoTrue mutex deadlock on page reload
      setTimeout(async () => {
        if (!isMounted) return;
        await applyUserSession(session?.user || null);
        setLoading(false);
      }, 0);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password, requestedRole) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    const profile = await fetchUserProfile(data.user.id);
    const roleFromMeta = data.user.user_metadata?.role || 'student';
    const actualRole = profile?.role || roleFromMeta;

    if (requestedRole && actualRole !== requestedRole) {
      await supabase.auth.signOut();
      saveStoredSession(null);
      throw new Error('role_mismatch');
    }

    await applyUserSession(data.user);
    return { userCredential: { user: data.user }, role: actualRole };
  };

  const register = async (email, password, fullName, role) => {
    const isInstructor = role === 'instructor';
    const status = isInstructor ? 'pending' : 'active';
    const isApproved = !isInstructor;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          status: status,
          is_approved: isApproved
        }
      }
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          email: email,
          role: role,
          status: status,
          is_approved: isApproved,
          updated_at: new Date()
        });
      } catch (e) {
        console.warn('Upsert profile notice:', e);
      }

      if (data.session) {
        await applyUserSession(data.user);
      }
    }

    return { user: data.user, session: data.session };
  };

  const logout = async () => {
    try {
      saveStoredSession(null);
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      saveStoredSession(null);
      setCurrentUser(null);
      setUserRole(null);
      setUserStatus(null);
      setUserData(null);
    }
  };

  const resetPassword = (email) => {
    return supabase.auth.resetPasswordForEmail(email);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userRole, userStatus, userData, user: userData, login, register, logout, resetPassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
