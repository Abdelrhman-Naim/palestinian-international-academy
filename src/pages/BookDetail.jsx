import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import screenImg from '../assets/screen.png';
import { useLanguage } from '../context/LanguageContext';
import PageLoader from '../components/PageLoader';
import ReviewSection from '../components/ReviewSection';
import { useAuth } from '../context/AuthContext';
import { useSavedBooks } from '../hooks/useSavedBooks';

export default function BookDetail() {
  const { t, dir } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { books, loading } = useLibrary();
  const { currentUser } = useAuth();
  const { isSaved, toggleSave } = useSavedBooks();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const book = books.find(b => b.id === id);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900" dir={dir}>
        <Navbar />
        <main className="grow flex items-center justify-center">
          <PageLoader message={dir === 'rtl' ? 'جاري تحميل تفاصيل الكتاب...' : 'Loading book details...'} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900" dir={dir}>
        <Navbar />
        <main className="grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4"></p>
            <h1 className="text-2xl font-bold text-dark dark:text-white mb-2">{t('bookDetail.notFound')}</h1>
            <button onClick={() => navigate('/library')} className="mt-4 text-primary hover:underline font-bold">
              {t('bookDetail.backToLibrary')}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 1.  
  const rawUrl = book.driveUrl || book.link;

  // 2.  Google Drive  {t('bookDetail.download')} 
  const getDirectDownloadUrl = (url) => {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
    return url;
  };

  const directDownloadUrl = getDirectDownloadUrl(rawUrl);

  const handleDownload = async () => {
    if (!directDownloadUrl) {
      alert(t('bookDetail.noDownloadLink'));
      return;
    }

    setDownloading(true);
    setDownloadError('');

    try {
      let downloadStarted = false;

      // 1. Attempt CORS fetch to verify response & download as blob
      try {
        const response = await fetch(directDownloadUrl);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${book.title || 'book'}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
          downloadStarted = true;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (corsErr) {
        // 2. Fallback for CORS-restricted URLs (Google Drive export links)
        // Perform no-cors check to ensure server responds with 200/opaque response
        try {
          const checkRes = await fetch(directDownloadUrl, { mode: 'no-cors' });
          if (checkRes.type === 'opaque' || checkRes.ok) {
            const a = document.createElement('a');
            a.href = directDownloadUrl;
            a.setAttribute('download', '');
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
            document.body.appendChild(a);
            a.click();
            a.remove();
            downloadStarted = true;
          } else {
            throw new Error('Server unreachable');
          }
        } catch (noCorsErr) {
          throw new Error(dir === 'rtl' ? 'تعذر التوصيل بسيرفر التنزيل. تحقق من الاتصال بالإنترنت.' : 'Unable to connect to download server. Check your internet connection.');
        }
      }

      // 3. Increment download counter in Firestore ONLY after verified server response & download start
      if (downloadStarted) {
        try {
          await updateDoc(doc(db, 'library', id), { downloads: increment(1) });
          // Update local state display immediately
          book.downloads = (book.downloads || 0) + 1;
        } catch (dbErr) {
          console.error('Firestore download count update error:', dbErr);
        }
      }
    } catch (err) {
      console.error('Download execution error:', err);
      setDownloadError(err.message || (dir === 'rtl' ? 'فشل التنزيل: تعذر الوصول إلى الملف.' : 'Download failed: File could not be accessed.'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 transition-colors" dir={dir}>
      <Navbar />
      <main className="grow">

        {/* Breadcrumb Navigation */}
        <nav className="bg-[#FAF7F2] dark:bg-gray-900 pt-6 px-4 transition-colors" aria-label="Breadcrumb">
          <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 overflow-x-auto py-2 border-b border-[#E8E2D5]/60 dark:border-gray-800">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1 shrink-0 font-medium">
              <span className="material-symbols-outlined text-base">home</span>
              <span>{dir === 'rtl' ? 'الرئيسية' : 'Home'}</span>
            </Link>
            <span className="material-symbols-outlined text-xs rtl:rotate-180 shrink-0 text-gray-400">chevron_right</span>
            
            <Link to="/library" className="hover:text-primary transition-colors shrink-0 font-medium">
              {dir === 'rtl' ? 'المكتبة' : 'Library'}
            </Link>
            
            {book.category && (
              <>
                <span className="material-symbols-outlined text-xs rtl:rotate-180 shrink-0 text-gray-400">chevron_right</span>
                <span className="shrink-0 font-medium text-gray-600 dark:text-gray-300">
                  {book.category}
                </span>
              </>
            )}
            
            <span className="material-symbols-outlined text-xs rtl:rotate-180 shrink-0 text-gray-400">chevron_right</span>
            <span className="font-bold text-dark dark:text-white truncate max-w-xs sm:max-w-md">
              {book.title}
            </span>
          </div>
        </nav>

        {/* Hero */}
        <section className="bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white py-12 px-4 border-b border-[#E8E2D5] dark:border-gray-800 transition-colors">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
            {/* Book Cover */}
            <div className="relative w-44 h-60 shrink-0 rounded-xl overflow-hidden shadow-md border border-[#E8E2D5] dark:border-gray-700 bg-[#F3EFE6] dark:bg-gray-800 flex items-center justify-center">
              <img src={screenImg} alt={book.title} className="w-full h-full object-cover opacity-80" />
            </div>

            {/* Info */}
            <div className="flex-1 text-start">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-primary/20 text-primary text-xs px-3 py-1 rounded-full font-bold">{book.category}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-snug text-dark dark:text-white">{book.title}</h1>

              <div className="flex flex-wrap items-center gap-5 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  {book.author}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  {book.year}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  {book.pages && Number(book.pages) > 0 ? `${book.pages} ${t('bookDetail.pages')}` : (dir === 'rtl' ? 'نسخة رقمية' : 'Digital Edition')}
                </span>
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-download text-xs"></i>
                  {(book.downloads || 0).toLocaleString()} {t('bookDetail.download')}
                </span>
              </div>

              {downloadError && (
                <div className="w-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 p-3.5 rounded-xl text-xs sm:text-sm font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-lg shrink-0">error</span>
                  <span>{downloadError}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">
                    {downloading ? 'hourglass_top' : 'download'}
                  </span>
                  <span>
                    {downloading 
                      ? (dir === 'rtl' ? 'جاري التنزيل...' : 'Downloading...') 
                      : t('bookDetail.downloadBook')
                    }
                  </span>
                </button>
                <button
                  onClick={async () => {
                    if (!currentUser) { navigate('/login'); return; }
                    await toggleSave(book);
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all border cursor-pointer ${
                    isSaved(book.id)
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-white dark:bg-gray-800 border-[#E8E2D5] dark:border-gray-700 text-dark dark:text-white hover:border-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {isSaved(book.id) ? 'bookmark' : 'bookmark_add'}
                  </span>
                  <span>
                    {isSaved(book.id) 
                      ? (dir === 'rtl' ? 'محفوظ في حسابك' : 'Saved') 
                      : (dir === 'rtl' ? 'حفظ الكتاب' : 'Save Book')}
                  </span>
                </button>
                <button
                  onClick={() => navigate('/library')}
                  className="flex items-center gap-2 border border-[#E8E2D5] dark:border-gray-700 hover:border-primary text-dark dark:text-white bg-white dark:bg-gray-800 px-6 py-3 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg rtl:rotate-180">arrow_forward</span>
                  {t('common.back')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="max-w-5xl mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* About the book */}
            <div className="md:col-span-2 space-y-6">

              {directDownloadUrl && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
                  <span className="material-symbols-outlined text-4xl text-primary">cloud_download</span>
                  <div>
                    <p className="font-bold text-dark dark:text-white mb-1">{t('bookDetail.availableForDownload')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('bookDetail.clickToDownload')}</p>
                  </div>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="mr-auto bg-primary hover:bg-secondary text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">
                      {downloading ? 'hourglass_top' : 'download'}
                    </span>
                    <span>
                      {downloading ? (dir === 'rtl' ? 'جاري التنزيل...' : 'Downloading...') : t('bookDetail.download')}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-dark dark:text-white mb-4">{t('bookDetail.bookInfo')}</h3>
                <ul className="space-y-3 text-sm">
                  {[
                    { icon: 'person', label: t('bookDetail.author'), value: book.author },
                    { icon: 'category', label: t('bookDetail.category'), value: book.category },
                    { icon: 'calendar_today', label: t('bookDetail.publicationYear'), value: book.year },
                    { icon: 'menu_book', label: t('bookDetail.pages'), value: book.pages && Number(book.pages) > 0 ? `${book.pages} ${t('bookDetail.pages')}` : (dir === 'rtl' ? 'نسخة رقمية' : 'Digital Edition') },
                    { icon: 'star', label: dir === 'rtl' ? 'التقييم' : 'Rating', value: (book.ratingCount && book.ratingCount > 0) ? `${(book.ratingAverage || 0).toFixed(1)} (${book.ratingCount})` : (dir === 'rtl' ? 'لا يوجد تقييمات بعد' : 'No ratings yet') },
                  ].map(item => (
                    <li key={item.label} className="flex items-center gap-3 text-text-main dark:text-gray-400">
                      <span className="material-symbols-outlined text-base text-primary">{item.icon}</span>
                      <span className="font-semibold text-dark dark:text-white">{item.label}:</span>
                      <span className="mr-auto">{item.value || ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          {/* Book Reviews Section */}
          <div className="mt-12 pt-8 border-t border-[#E8E2D5] dark:border-gray-800">
            <ReviewSection 
              targetType="book" 
              targetId={id} 
              canReview={true}
              targetTitle={book.title}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}