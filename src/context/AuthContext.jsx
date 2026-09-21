import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUserDoc = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (user) {
        setCurrentUser(user);
        // Real-time listener for user profile in Firestore
        unsubUserDoc = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setUserStatus(data.status || 'active');
            setUserData(data);
          } else {
            setUserRole('student');
            setUserStatus('active');
            setUserData(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user profile: ", error);
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserStatus(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubUserDoc) unsubUserDoc();
      unsubscribe();
    };
  }, []);

  const login = async (email, password, requestedRole) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    const actualRole = userDoc.exists() ? userDoc.data().role : 'student';
    
    if (requestedRole && actualRole !== requestedRole) {
      await signOut(auth);
      throw new Error('role_mismatch');
    }
    return { userCredential, role: actualRole };
  };

  const register = async (email, password, fullName, role) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update Firebase Auth displayName
    try {
      await updateProfile(user, { displayName: fullName });
    } catch (e) {
      console.warn('Could not update displayName on auth user:', e);
    }

    // Save user info and role to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: fullName,
      fullName: fullName,
      email: email,
      role: role,
      // Instructors need admin approval, students are active immediately
      status: role === 'instructor' ? 'pending' : 'active',
      createdAt: new Date()
    });
    
    return userCredential;
  };

  const logout = async () => {
    try {
      await signOut(auth);
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
    return sendPasswordResetEmail(auth, email);
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
