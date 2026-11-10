"use client";
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { supabase } from '../supabase/client';
import { doc, updateDoc, increment, db } from '../supabase/db';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import PageLoader from '../components/PageLoader';
import ReviewSection from '../components/ReviewSection';
import { useAuth } from '../context/AuthContext';
import { useSavedBooks } from '../hooks/useSavedBooks';
import { getLocalizedCategory } from '../utils/categoryUtils';
import { listenToTargetReviews } from '../services/reviewService';
import SEO from '../components/SEO';
import { getDynamicSiteUrl } from '../utils/siteUrl';

export default function BookDetail() {
  const { t, dir, lang } = useLanguage();
  const isRtl = dir === 'rtl';
  const { id } = useParams();
  const navigate = useNavigate();
  const { books, loading: libraryLoading, incrementDownload } = useLibrary();
  const { currentUser } = useAuth();
  const { isSaved, toggleSave } = useSavedBooks();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fast single book resolution
  const cachedBook = books.find(b => b.id === id);
  const [singleBook, setSingleBook] = useState(null);
  const [singleLoading, setSingleLoading] = useState(!cachedBook);

  useEffect(() => {
    if (cachedBook) {
      setSingleLoading(false);
      return;
    }
    if (!id) return;
    let isMounted = true;
    const fetchSingleBook = async () => {
      try {
        setSingleLoading(true);
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (isMounted && data && !error) {
          const resolvedCategory = data.category_name || data.category || '';
          setSingleBook({
            ...data,
            category: resolvedCategory,
            category_name: resolvedCategory,
            downloads: data.downloads_count !== undefined ? Number(data.downloads_count) : (Number(data.downloads) || 0),
            downloads_count: data.downloads_count !== undefined ? Number(data.downloads_count) : (Number(data.downloads) || 0),
            link: data.link || data.pdf_url || '',
            driveUrl: data.driveUrl || data.pdf_url || data.link || '',
            pdf_url: data.pdf_url || data.driveUrl || data.link || '',
          });
        }
      } catch (err) {
        console.error('Error fetching single book:', err);
      } finally {
        if (isMounted) setSingleLoading(false);
      }
    };

    fetchSingleBook();
    return () => { isMounted = false; };
  }, [id, cachedBook]);

  const book = cachedBook || singleBook;

  // Lock body scroll and handle Escape key when preview modal is open
  useEffect(() => {
    if (!isPreviewOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsPreviewOpen(false);
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPreviewOpen]);

  const [reviewStats, setReviewStats] = useState({
    average: Number(book?.ratingAverage ?? book?.rating ?? 5.0),
    count: Number(book?.ratingCount ?? 0)
  });

  useEffect(() => {
    if (!id) return;
    const unsub = listenToTargetReviews('book', id, (reviewsList) => {
      const count = reviewsList.length;
      const sum = reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
      const avg = count > 0 ? Number((sum / count).toFixed(1)) : (Number(book?.ratingAverage ?? book?.rating) || 5.0);
      setReviewStats({
        average: avg,
        count
      });
    });

    return () => unsub();
  }, [id, book?.ratingAverage, book?.rating]);

  useEffect(() => {
    if (book?.ratingCount !== undefined) {
      setReviewStats(prev => {
        if (prev.count === 0 && book.ratingCount > 0) {
          return {
            average: Number(book.ratingAverage ?? book.rating ?? prev.average),
            count: Number(book.ratingCount)
          };
        }
        return prev;
      });
    }
  }, [book?.ratingCount, book?.ratingAverage, book?.rating]);

  if (!book && (singleLoading || libraryLoading)) {
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

  // 1. رابط ملف الكتاب
  const rawUrl = book.driveUrl || book.link || book.pdf_url;

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

  // 3. رابط تصفح الكتاب ومعاينته التفاعلية (Google Drive Viewer أو الرابط المباشر)
  const getPreviewUrl = (url) => {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  const previewUrl = getPreviewUrl(rawUrl);

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
        // 2. Reliable direct download trigger for cross-origin URLs (e.g. Google Drive)
        try {
          const a = document.createElement('a');
          a.href = directDownloadUrl;
          a.setAttribute('download', `${cleanTitle || 'book'}.pdf`);
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
          document.body.appendChild(a);
          a.click();
          a.remove();
          downloadStarted = true;
        } catch (linkErr) {
          window.open(directDownloadUrl, '_blank', 'noopener,noreferrer');
          downloadStarted = true;
        }
      }

      // 3. Increment download counter in Supabase ONLY after download actually begins
      if (downloadStarted) {
        try {
          if (typeof incrementDownload === 'function') {
            await incrementDownload(id);
          }
          // Update local state display immediately
          if (book) {
            const nextCount = (Number(book.downloads ?? book.downloads_count) || 0) + 1;
            book.downloads = nextCount;
            book.downloads_count = nextCount;
          }
        } catch (dbErr) {
          console.error('Download count update error:', dbErr);
        }
      }
    } catch (err) {
      console.error('Download execution error:', err);
      setDownloadError(err.message || (dir === 'rtl' ? 'فشل التنزيل: تعذر الوصول إلى الملف.' : 'Download failed: File could not be accessed.'));
    } finally {
      setDownloading(false);
    }
  };

  const cleanTitle = (book?.title || '')
    .replace(/\.pdf$/i, '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanAuthor = (book?.author || '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanSubtitle = book?.subtitle
    ? book.subtitle.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim()
    : cleanAuthor;

  const bookSchema = book ? {
    '@context': 'https://schema.org',
    '@type': 'Book',
    'name': cleanTitle,
    'author': {
      '@type': 'Person',
      'name': cleanAuthor || (isRtl ? 'مؤلف أكاديمي' : 'Academic Author')
    },
    'description': book.description || cleanTitle,
    'image': book.coverImage || `${getDynamicSiteUrl()}/logo-wep.png`,
    ...(book.pages ? { 'numberOfPages': Number(book.pages) } : {}),
    ...(reviewStats.count > 0 ? {
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': reviewStats.average,
        'reviewCount': reviewStats.count
      }
    } : {})
  } : null;

  return (
    <div className="min-h-screen flex flex-col font-alexandria bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-gray-100 transition-colors" dir={dir}>
      <SEO
        title={book ? `${cleanTitle} | ${isRtl ? 'المكتبة الرقمية' : 'Digital Library'}` : undefined}
        description={book ? (book.description?.slice(0, 160) || `${cleanTitle} - ${cleanAuthor}`) : undefined}
        ogImage={book?.coverImage}
        canonical={`/library/${id}`}
        ogType="book"
        breadcrumbs={[
          { name: isRtl ? 'الرئيسية' : 'Home', item: '/' },
          { name: isRtl ? 'المكتبة' : 'Library', item: '/library' },
          { name: cleanTitle || (isRtl ? 'تفاصيل الكتاب' : 'Book Details'), item: `/library/${id}` }
        ]}
        schema={bookSchema}
      />
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
                  {getLocalizedCategory(book.category, lang)}
                </span>
              </>
            )}
            
            <span className="material-symbols-outlined text-xs rtl:rotate-180 shrink-0 text-gray-400">chevron_right</span>
            <span className="font-bold text-dark dark:text-white truncate max-w-xs sm:max-w-md inline-block" title={cleanTitle}>
              {cleanTitle}
            </span>
          </div>
        </nav>

        {/* Hero */}
        <section className="bg-[#FAF7F2] dark:bg-gray-900 text-dark dark:text-white py-12 px-4 border-b border-[#E8E2D5] dark:border-gray-800 transition-colors">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
            {/* Book Cover */}
            <div className="relative w-48 sm:w-56 h-72 shrink-0 rounded-2xl shadow-md border border-amber-300/60 dark:border-[#3A322B] bg-[#F5F0E6] dark:bg-[#27221D] flex flex-col items-center justify-center p-6 text-center group overflow-hidden max-w-full">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400 shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0">
                <span className="material-symbols-outlined text-4xl">auto_stories</span>
              </div>
              <h3 
                className="text-dark dark:text-white font-bold text-base leading-snug line-clamp-3 mb-2 font-headline-md w-full max-w-full break-words [overflow-wrap:anywhere] overflow-hidden"
                title={cleanTitle}
              >
                {cleanTitle}
              </h3>
              <p 
                className="text-gray-500 dark:text-stone-400 text-xs line-clamp-1 font-body-md w-full max-w-full break-words [overflow-wrap:anywhere] overflow-hidden"
                title={cleanSubtitle}
              >
                {cleanSubtitle}
              </p>
            </div>

            {/* Info */}
            <div className="flex-1 text-start min-w-0 max-w-full">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-primary/20 text-primary text-xs px-3 py-1 rounded-full font-bold">{getLocalizedCategory(book.category, lang)}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 leading-snug text-dark dark:text-white break-words [overflow-wrap:anywhere]">{cleanTitle}</h1>

              <div className="flex flex-wrap items-center gap-5 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <span className="flex items-center gap-1 break-words [overflow-wrap:anywhere]">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  {cleanAuthor}
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
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  disabled={!previewUrl}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-primary text-primary dark:text-amber-400 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-stone-900 px-6 py-3 rounded-xl font-bold transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                  title={dir === 'rtl' ? 'تصفح وقراءة الكتاب قبل التنزيل' : 'Browse and read book before downloading'}
                >
                  <span className="material-symbols-outlined text-lg">auto_stories</span>
                  <span>{t('bookDetail.browseBook') || (dir === 'rtl' ? 'تصفح الكتاب' : 'Browse Book')}</span>
                </button>
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
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="material-symbols-outlined text-3xl sm:text-4xl text-primary shrink-0">cloud_download</span>
                    <div>
                      <p className="font-bold text-dark dark:text-white mb-0.5 text-sm sm:text-base">{t('bookDetail.availableForDownload')}</p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('bookDetail.clickToDownload')}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full sm:w-auto bg-primary hover:bg-secondary text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 min-h-[44px]"
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
                    { icon: 'category', label: t('bookDetail.category'), value: getLocalizedCategory(book.category, lang) },
                    { icon: 'calendar_today', label: t('bookDetail.publicationYear'), value: book.year },
                    { icon: 'menu_book', label: t('bookDetail.pages'), value: book.pages && Number(book.pages) > 0 ? `${book.pages} ${t('bookDetail.pages')}` : (dir === 'rtl' ? 'نسخة رقمية' : 'Digital Edition') },
                    { 
                      icon: 'star', 
                      label: dir === 'rtl' ? 'التقييم' : 'Rating', 
                      value: reviewStats.count > 0 ? (
                        <a 
                          href="#book-reviews" 
                          className="flex items-center gap-1.5 text-primary hover:underline font-bold transition-colors"
                          title={isRtl ? 'الانتقال إلى تقييمات ومراجعات الكتاب' : 'Go to book reviews'}
                        >
                          <span className="text-amber-500 font-extrabold flex items-center">
                            ★ {reviewStats.average.toFixed(1)}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 font-normal text-xs">
                            ({reviewStats.count} {isRtl ? (reviewStats.count === 1 ? 'تقييم' : 'تقييمات') : (reviewStats.count === 1 ? 'review' : 'reviews')})
                          </span>
                        </a>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">
                          {isRtl ? 'لا يوجد تقييمات بعد' : 'No ratings yet'}
                        </span>
                      )
                    },
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
          <div id="book-reviews" className="mt-12 pt-8 border-t border-[#E8E2D5] dark:border-gray-800 scroll-mt-20">
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

      {/* Book Reading / Preview Modal */}
      {isPreviewOpen && previewUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-preview-title"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl max-w-5xl w-full h-[92vh] max-h-[900px] overflow-hidden shadow-2xl border border-stone-200 dark:border-gray-800 flex flex-col transition-all"
            dir={dir}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-stone-200 dark:border-gray-800 flex items-center justify-between gap-3 bg-[#FAF7F2] dark:bg-gray-900/90 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">auto_stories</span>
                </div>
                <div className="min-w-0">
                  <h3 id="book-preview-title" className="font-extrabold text-sm sm:text-base text-dark dark:text-white truncate" title={cleanTitle}>
                    {cleanTitle}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {cleanAuthor || (dir === 'rtl' ? 'نسخة للقراءة والمطالعة' : 'Reading Edition')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {directDownloadUrl && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-1.5 bg-primary hover:bg-secondary text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    title={t('bookDetail.downloadBook')}
                  >
                    <span className="material-symbols-outlined text-base">
                      {downloading ? 'hourglass_top' : 'download'}
                    </span>
                    <span>
                      {downloading 
                        ? (dir === 'rtl' ? 'جاري التنزيل...' : 'Downloading...') 
                        : (dir === 'rtl' ? 'تنزيل' : 'Download')
                      }
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  aria-label={dir === 'rtl' ? 'إغلاق نافذة المعاينة' : 'Close preview modal'}
                  className="w-9 h-9 rounded-xl hover:bg-stone-200/60 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-gray-700"
                >
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
                </button>
              </div>
            </div>

            {/* Modal Content - Book Viewer */}
            <div className="relative flex-1 w-full bg-stone-100 dark:bg-stone-950 overflow-hidden">
              {/* Fallback loading indicator behind iframe */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center -z-0">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {dir === 'rtl' ? 'جاري تحميل الكتاب لتصفحه...' : 'Loading book for reading...'}
                </p>
              </div>

              {/* PDF / Document Iframe */}
              <iframe
                src={previewUrl}
                title={cleanTitle}
                className="relative z-10 w-full h-full border-0 bg-transparent"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}