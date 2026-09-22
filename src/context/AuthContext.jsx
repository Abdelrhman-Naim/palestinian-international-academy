import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile from Supabase profiles table using maybeSingle()
  const fetchUserProfile = async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
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
      return;
    }

    setCurrentUser(user);
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

    setUserRole(role);
    setUserStatus(status);
    setUserData(profile ? { ...profile, uid: profile.id, status, name: profile.full_name || nameFromMeta } : { uid: user.id, id: user.id, email: user.email, role, status, name: nameFromMeta });
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await applyUserSession(session?.user || null);
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await applyUserSession(session?.user || null);
      setLoading(false);
    });

    return () => {
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
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
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
      {!loading && children}
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
