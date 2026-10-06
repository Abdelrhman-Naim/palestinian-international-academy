"use client";
import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminPageShell from './AdminPageShell';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import CustomSelect from '../../components/CustomSelect';
import Pagination from '../../components/Pagination';
import { formatCustomDate } from '../../utils/formatDate';

export default function AdminContactMessages() {
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // View Modal state
  const [viewMessage, setViewMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Merge with localStorage read status as fallback if DB doesn't support it
      const readIds = JSON.parse(localStorage.getItem('read_contact_messages') || '[]');
      const mergedData = (data || []).map(msg => ({
        ...msg,
        is_read: msg.is_read || readIds.includes(msg.id)
      }));
      
      setMessages(mergedData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (msg) => {
    setViewMessage(msg);
    if (msg.is_read) return; // Already read

    // Optimistically update UI
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    
    // Save to localStorage to persist across reloads
    const readIds = JSON.parse(localStorage.getItem('read_contact_messages') || '[]');
    if (!readIds.includes(msg.id)) {
      localStorage.setItem('read_contact_messages', JSON.stringify([...readIds, msg.id]));
    }
    
    try {
      const { error } = await supabase.from('contact_messages').update({ is_read: true }).eq('id', msg.id);
      if (error) {
        console.error('Failed to mark message as read in DB:', error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?')) return;
    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (error) throw error;
      setMessages(messages.filter(m => m.id !== id));
      showToast(isRtl ? 'تم حذف الرسالة بنجاح' : 'Message deleted successfully', 'success');
      if (viewMessage?.id === id) setViewMessage(null);
    } catch (err) {
      console.error(err);
      showToast(isRtl ? 'حدث خطأ أثناء حذف الرسالة' : 'Error deleting message', 'error');
    }
  };

  // Sort Options
  const sortOptions = [
    { value: 'newest', label: isRtl ? 'تاريخ الاستلام: الأحدث' : 'Date: Newest' },
    { value: 'oldest', label: isRtl ? 'تاريخ الاستلام: الأقدم' : 'Date: Oldest' },
  ];

  // Filter and sort
  const filteredMessages = useMemo(() => {
    return messages
      .filter(msg => {
        const query = debouncedSearch.trim().toLowerCase();
        if (!query) return true;
        return (
          msg.name?.toLowerCase().includes(query) ||
          msg.email?.toLowerCase().includes(query) ||
          msg.message?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        if (sortBy === 'newest') return dateB - dateA;
        if (sortBy === 'oldest') return dateA - dateB;
        return 0;
      });
  }, [messages, debouncedSearch, sortBy]);

  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage) || 1;
  const paginatedMessages = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMessages.slice(start, start + itemsPerPage);
  }, [filteredMessages, currentPage, itemsPerPage]);

  const isFilterActive = searchQuery.trim() !== '' || sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <AdminPageShell
      parent={isRtl ? 'البريد الوارد' : 'Inbox'}
      title={isRtl ? 'البريد الوارد' : 'Inbox'}
      subtitle={isRtl ? 'إدارة رسائل التواصل والاستفسارات الواردة' : 'Manage incoming contact messages and inquiries'}
      icon="mail"
    >
      {/* ===== Advanced Filter & Search Bar ===== */}
      <div className="mb-6 rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <span className="material-symbols-outlined pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              search
            </span>
            <input
              type="text"
              aria-label={isRtl ? 'ابحث في الرسائل، الأسماء أو البريد' : 'Search messages, names or emails'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'ابحث في الرسائل، الأسماء، البريد...' : 'Search messages, names or emails...'}
              className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] py-2.5 pl-4 pr-10 text-sm font-semibold text-dark outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                aria-label="Clear Search"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Sort By */}
          <div>
            <CustomSelect
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
              placeholder={isRtl ? 'ترتيب حسب' : 'Sort by'}
            />
          </div>
        </div>

        {/* Active Filter Bar & Reset Button */}
        {isFilterActive && (
          <div className="mt-3 flex items-center justify-between border-t border-[#E8E2D5] pt-3 text-xs dark:border-gray-700">
            <span className="font-semibold text-gray-500 dark:text-gray-400">
              {isRtl
                ? `نتائج البحث والفلترة: (${filteredMessages.length}) رسالة`
                : `Filtered Results: (${filteredMessages.length}) messages`}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </button>
          </div>
        )}
      </div>

      {/* ===== Messages Table ===== */}
      <div className="overflow-hidden rounded-2xl border border-[#E8E2D5] bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="hidden grid-cols-12 gap-4 border-b border-[#E8E2D5] bg-[#FAF7F2] px-6 py-3 text-xs font-bold text-gray-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 md:grid">
          <span className="col-span-3">{isRtl ? 'المرسل' : 'Sender'}</span>
          <span className="col-span-5">{isRtl ? 'مقتطف من الرسالة' : 'Message Snippet'}</span>
          <span className="col-span-2">{isRtl ? 'تاريخ الاستلام' : 'Received Date'}</span>
          <span className="col-span-2 text-left rtl:text-right">{isRtl ? 'الإجراءات' : 'Actions'}</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm font-bold text-gray-400">{isRtl ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-primary dark:bg-orange-950/40">
              <span className="material-symbols-outlined text-2xl">mail</span>
            </div>
            <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
              {isRtl ? 'لم يتم العثور على أي رسائل' : 'No messages found'}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isRtl
                ? 'جرب تعديل كلمات البحث أو تصفية الخيارات لإظهار النتائج.'
                : 'Try adjusting your search terms or filters.'}
            </p>
            {isFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] px-4 py-2 text-xs font-bold text-gray-700 hover:bg-[#F3EFE6] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
              >
                {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              </button>
            )}
          </div>
        ) : (
          <>
            {paginatedMessages.map((msg) => {
              const dateDisplay = msg.created_at ? formatCustomDate(msg.created_at) : (isRtl ? 'غير محدد' : 'N/A');

              return (
                <div
                  key={msg.id}
                  className="flex flex-col gap-3 border-b border-[#E8E2D5] px-6 py-4 last:border-0 hover:bg-[#FAF7F2] dark:border-gray-700 dark:hover:bg-gray-700/50 md:grid md:grid-cols-12 md:items-center md:gap-4"
                >
                  {/* Sender Column */}
                  <div className="col-span-3 flex flex-col">
                    <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{isRtl ? 'المرسل' : 'Sender'}</span>
                    <div className="flex items-center gap-2">
                      <p className={`font-bold truncate ${!msg.is_read ? 'text-dark dark:text-white' : 'text-gray-600 dark:text-gray-400 font-semibold'}`} title={msg.name}>{msg.name || (isRtl ? 'غير معروف' : 'Unknown')}</p>
                      {!msg.is_read && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 flex-shrink-0 animate-pulse" title={isRtl ? 'رسالة جديدة' : 'New Message'}></span>
                      )}
                    </div>
                    {msg.email && <p className="text-xs text-gray-400 truncate" title={msg.email}>{msg.email}</p>}
                  </div>

                  {/* Message Column */}
                  <div className="col-span-5 flex flex-col">
                    <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{isRtl ? 'مقتطف من الرسالة' : 'Message Snippet'}</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={msg.message}>{msg.message}</p>
                  </div>

                  {/* Received Date Column */}
                  <div className="col-span-2 flex flex-col">
                    <span className="md:hidden text-xs text-gray-400 font-bold mb-1">{isRtl ? 'تاريخ الاستلام' : 'Received Date'}</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{dateDisplay}</p>
                  </div>

                  {/* Actions Column */}
                  <div className="col-span-2 flex items-center justify-between md:justify-start gap-2 mt-2 md:mt-0 pt-3 md:pt-0 border-t border-[#E8E2D5] dark:border-gray-700 md:border-0">
                    <span className="md:hidden text-xs text-gray-400 font-bold">{isRtl ? 'الإجراءات' : 'Actions'}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleViewMessage(msg)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition-colors hover:bg-primary/10 hover:text-primary dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-primary/20 dark:hover:text-primary cursor-pointer"
                        title={isRtl ? 'عرض' : 'View'}
                        aria-label={isRtl ? 'عرض' : 'View'}
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-rose-500 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:bg-gray-800 dark:text-rose-400 dark:hover:bg-rose-900/40 dark:hover:text-rose-300 cursor-pointer"
                        title={isRtl ? 'حذف' : 'Delete'}
                        aria-label={isRtl ? 'حذف' : 'Delete'}
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* ===== View Message Modal ===== */}
      {viewMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm dark:bg-black/60"
          onClick={() => setViewMessage(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white border border-[#E8E2D5] p-6 sm:p-8 shadow-2xl dark:border-gray-700 dark:bg-gray-800 transition-colors relative"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            <div className="mb-6 border-b border-[#E8E2D5] dark:border-gray-700 pb-4">
              <h2 className="text-xl font-bold text-dark dark:text-white mb-1">
                {isRtl ? 'تفاصيل الرسالة' : 'Message Details'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {viewMessage.created_at ? formatCustomDate(viewMessage.created_at) : ''}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                  {isRtl ? 'المرسل' : 'Sender'}
                </label>
                <div className="font-bold text-dark dark:text-white text-lg">{viewMessage.name}</div>
                <a href={`mailto:${viewMessage.email}`} className="text-sm text-primary hover:underline font-bold inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">mail</span>
                  {viewMessage.email}
                </a>
              </div>

              <div className="bg-[#FAF7F2] dark:bg-gray-900 rounded-2xl p-5 border border-[#E8E2D5] dark:border-gray-700 max-h-[300px] overflow-y-auto">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 border-b border-[#E8E2D5] dark:border-gray-700 pb-2">
                  {isRtl ? 'نص الرسالة' : 'Message Content'}
                </label>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mt-3">
                  {viewMessage.message}
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setViewMessage(null)}
                className="flex-1 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] dark:border-gray-700 dark:bg-gray-700 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
              <a
                href={`mailto:${viewMessage.email}`}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-orange-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">reply</span>
                {isRtl ? 'رد على البريد' : 'Reply by Email'}
              </a>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
