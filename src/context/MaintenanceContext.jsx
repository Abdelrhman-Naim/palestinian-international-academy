import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const MaintenanceContext = createContext(null);

export function MaintenanceProvider({ children }) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState({
    enabled: false,
    message: '',
    updatedAt: null,
    updatedBy: ''
  });
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'config', 'maintenance'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setIsMaintenance(!!data.enabled);
          setMaintenanceData({
            enabled: !!data.enabled,
            message: data.message || '',
            updatedAt: data.updatedAt || null,
            updatedBy: data.updatedBy || ''
          });
        } else {
          setIsMaintenance(false);
          setMaintenanceData({
            enabled: false,
            message: '',
            updatedAt: null,
            updatedBy: ''
          });
        }
        setLoading(false);
      },
      (err) => {
        if (err.code !== 'permission-denied') {
          console.warn('Maintenance status listener error:', err.message);
        }
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const toggleMaintenance = async (enabled, customMessage = '') => {
    try {
      const ref = doc(db, 'config', 'maintenance');
      const payload = {
        enabled: Boolean(enabled),
        message: customMessage || maintenanceData.message || 'المنصة تخضع لأعمال صيانة وتحديث مجدولة لتقديم تجربة تعليمية استثنائية. سنعود للعمل قريباً جداً.',
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.email || 'Admin'
      };
      await setDoc(ref, payload, { merge: true });
      return { success: true };
    } catch (err) {
      console.error('Error updating maintenance mode:', err);
      return { success: false, error: err.message };
    }
  };

  return (
    <MaintenanceContext.Provider
      value={{
        isMaintenance,
        maintenanceData,
        loading,
        toggleMaintenance
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return ctx;
}
