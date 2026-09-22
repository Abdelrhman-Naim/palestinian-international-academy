import { useState, useEffect } from 'react';
import AdminPageShell from './AdminPageShell';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

export default function AdminRequests() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.warn('Fetch profiles notice:', error.message);
        setRequests([]);
      } else {
        const pendingUsers = (data || []).filter(u => 
          u.role === 'instructor' && (u.status === 'pending' || u.is_approved === false || u.is_approved === null)
        ).map(u => ({
          ...u,
          id: u.id,
          name: u.full_name || u.name || u.email,
          email: u.email,
          field: u.specialization || u.bio || t('adminRequests.unspecifiedSpecialization'),
          experience: u.experience || t('adminRequests.unspecified'),
        }));
        setRequests(pendingUsers);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const decide = async (id, action) => {
    const item = requests.find((r) => r.id === id);
    if (!item) return;
    try {
      if (action === 'accept') {
        const { error } = await supabase
          .from('profiles')
          .update({ status: 'active', is_approved: true, role: 'instructor' })
          .eq('id', id);
        if (error) throw error;
        showToast(`${t('adminRequests.accepted')} ${item.name}`, 'success');
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({ status: 'rejected', is_approved: false, role: 'student' })
          .eq('id', id);
        if (error) throw error;
        showToast(`${t('adminRequests.rejected')} ${item.name}`, 'info');
      }
      fetchRequests();
    } catch (err) {
      console.error(err);
      showToast(t('adminInstructors.deleteError') || 'حدث خطأ', 'error');
    }
  };

  return (
    <AdminPageShell
      parent={t('adminRequests.parent')}
      title={t('adminRequests.title')}
      subtitle={t('adminRequests.subtitle')}
      icon="how_to_reg"
    >

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-[#E8E2D5] bg-white dark:border-gray-700 dark:bg-gray-800">
           <p className="font-bold text-gray-500">{t('common.loading')}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-[#F3EFE6]/50 dark:bg-gray-800/50 border-2 border-dashed border-[#E8E2D5] text-gray-400 dark:border-gray-700">
          <span className="material-symbols-outlined mb-3 text-5xl text-gray-300 dark:text-gray-600">inbox</span>
          <p className="font-bold text-gray-500 dark:text-gray-400">{t('adminRequests.noPending')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="hover-lift flex flex-col gap-4 rounded-2xl border border-[#E8E2D5] bg-white p-5 shadow-sm transition-all hover:border-[#D4AF37] dark:border-gray-700 dark:bg-gray-800 md:flex-row md:items-center"
            >
              <div className="flex flex-1 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-secondary to-primary text-lg font-bold text-white shadow-md shadow-primary/20">
                  {request.name ? request.name.trim().charAt(0).toUpperCase() : 'م'}
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-lg font-bold text-dark dark:text-white">{request.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{request.field || t('adminRequests.unspecifiedSpecialization')}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-gray-500 dark:text-gray-400">
                    <span>{request.email}</span>
                    <span>{t('adminRequests.experience')} {request.experience || t('adminRequests.unspecified')}</span>
                    <span>{request.created_at ? new Date(request.created_at).toLocaleDateString() : t('adminRequests.notSpecified')}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 md:w-auto">
                <button
                  type="button"
                  onClick={() => decide(request.id, 'accept')}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-secondary dark:bg-primary dark:text-gray-950 dark:hover:bg-amber-400 md:flex-none shadow-sm shadow-primary/20 cursor-pointer"
                >
                  {t('adminRequests.accept')}
                </button>
                <button
                  type="button"
                  onClick={() => decide(request.id, 'reject')}
                  className="flex-1 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/40 md:flex-none border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                >
                  {t('adminRequests.reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
