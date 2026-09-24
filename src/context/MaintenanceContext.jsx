import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from './AuthContext';

const MaintenanceContext = createContext(null);
const MAINTENANCE_STORAGE_KEY = 'pia_maintenance_settings';

const DEFAULT_MAINTENANCE_MESSAGE =
  'المنصة تخضع حالياً لأعمال صيانة دورية وتحديثات هامة لتقديم تجربة استثنائية لكافة المهندسين والطلاب. سنعود للعمل بكامل طاقتنا في أقرب وقت.';

const getInitialMaintenance = () => {
  try {
    const raw = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: Boolean(parsed.enabled),
        message: parsed.message || DEFAULT_MAINTENANCE_MESSAGE,
        updatedAt: parsed.updatedAt || null,
        updatedBy: parsed.updatedBy || ''
      };
    }
  } catch (e) {
    console.warn('Could not read maintenance state from storage:', e);
  }
  return {
    enabled: false,
    message: DEFAULT_MAINTENANCE_MESSAGE,
    updatedAt: null,
    updatedBy: ''
  };
};

export function MaintenanceProvider({ children }) {
  const [maintenanceData, setMaintenanceData] = useState(getInitialMaintenance);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  // Multi-tab synchronization
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === MAINTENANCE_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setMaintenanceData({
            enabled: Boolean(parsed.enabled),
            message: parsed.message || DEFAULT_MAINTENANCE_MESSAGE,
            updatedAt: parsed.updatedAt || null,
            updatedBy: parsed.updatedBy || ''
          });
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleMaintenance = async (enabled, customMessage = '') => {
    try {
      const nextData = {
        enabled: Boolean(enabled),
        message: customMessage || maintenanceData.message || DEFAULT_MAINTENANCE_MESSAGE,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'Admin'
      };

      setMaintenanceData(nextData);
      localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(nextData));

      // Log action to activity_logs table in Supabase
      try {
        await supabase.from('activity_logs').insert([{
          action: enabled ? 'ENABLE_MAINTENANCE' : 'DISABLE_MAINTENANCE',
          user_id: currentUser?.id || null,
          details: { message: nextData.message, updated_by: nextData.updatedBy }
        }]);
      } catch (logErr) {}

      return { success: true };
    } catch (err) {
      console.error('Error updating maintenance mode:', err);
      return { success: false, error: err.message };
    }
  };

  return (
    <MaintenanceContext.Provider
      value={{
        isMaintenance: maintenanceData.enabled,
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
