import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile from Supabase profiles table
  const fetchUserProfile = async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user profile:", error);
      }
      return data || null;
    } catch (e) {
      console.error("Profile fetch exception:", e);
      return null;
    }
  };

  useEffect(() => {
    let profileSubscription = null;

    // Check active session on mount
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            setUserRole(profile.role || 'student');
            setUserStatus(profile.status || 'active');
            setUserData({ ...profile, uid: profile.id, name: profile.full_name });
          } else {
            setUserRole('student');
            setUserStatus('active');
            setUserData({ uid: session.user.id, email: session.user.email });
          }
        } else {
          setCurrentUser(null);
          setUserRole(null);
          setUserStatus(null);
          setUserData(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          setUserRole(profile.role || 'student');
          setUserStatus(profile.status || 'active');
          setUserData({ ...profile, uid: profile.id, name: profile.full_name });
        } else {
          setUserRole('student');
          setUserStatus('active');
          setUserData({ uid: session.user.id, email: session.user.email });
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserStatus(null);
        setUserData(null);
      }
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
    const actualRole = profile?.role || 'student';

    if (requestedRole && actualRole !== requestedRole) {
      await supabase.auth.signOut();
      throw new Error('role_mismatch');
    }

    return { userCredential: { user: data.user }, role: actualRole };
  };

  const register = async (email, password, fullName, role) => {
    const status = role === 'instructor' ? 'pending' : 'active';
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          status: status
        }
      }
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      // Upsert profile in Supabase
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        email: email,
        role: role,
        status: status,
        updated_at: new Date()
      });
    }

    return { user: data.user };
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
