import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
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
    // Default maintenance off
    setIsMaintenance(false);
    setLoading(false);
  }, []);

  const toggleMaintenance = async (enabled, customMessage = '') => {
    try {
      setIsMaintenance(Boolean(enabled));
      setMaintenanceData({
        enabled: Boolean(enabled),
        message: customMessage || 'المنصة تخضع لأعمال صيانة وتحديث مجدولة لتقديم تجربة تعليمية استثنائية. سنعود للعمل قريباً جداً.',
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'Admin'
      });
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
