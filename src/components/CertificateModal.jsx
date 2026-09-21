import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc, db } from '../firebase/config';

export default function CertificateModal({ certificate, onClose }) {
  const { t, dir } = useLanguage();
  const { userData, currentUser } = useAuth();
  const certRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logoSrc, setLogoSrc] = useState(logo);

  // Pre-convert logo to base64 Data URL to guarantee zero canvas tainting or CORS issues
  useEffect(() => {
    let active = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const convert = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        if (active) {
          setLogoSrc(canvas.toDataURL('image/png'));
        }
      } catch (e) {
        console.warn('Could not convert logo to base64:', e);
      }
    };
    img.onload = convert;
    img.src = logo;
    if (img.complete) {
      convert();
    }
    return () => { active = false; };
  }, []);

  // Compute best available student name immediately
  const initialName = (certificate?.studentName && certificate.studentName !== 'طالب' && certificate.studentName !== 'طالب المنصة' && certificate.studentName !== 'Student')
    ? certificate.studentName
    : (userData?.fullName || userData?.name || currentUser?.displayName || certificate?.studentName || 'طالب المنصة');

  const [studentDisplayName, setStudentDisplayName] = useState(initialName);

  // Auto-resolve and heal student name in database if it was previously saved as generic 'طالب'
  useEffect(() => {
    let isMounted = true;
    async function resolveAndHealName() {
      const isGeneric = !studentDisplayName || studentDisplayName === 'طالب' || studentDisplayName === 'طالب المنصة' || studentDisplayName === 'Student';
      
      let realName = null;
      if (userData?.fullName || userData?.name) {
        realName = userData.fullName || userData.name;
      } else if (currentUser?.displayName) {
        realName = currentUser.displayName;
      } else if (certificate?.studentId) {
        try {
          const userSnap = await getDoc(doc(db, 'users', certificate.studentId));
          if (userSnap.exists()) {
            const udata = userSnap.data();
            realName = udata.fullName || udata.name;
          }
        } catch (err) {
          console.warn('Could not fetch user name for cert modal:', err);
        }
      }

      if (realName && isMounted) {
        setStudentDisplayName(realName);

        // Permanently heal the certificate document in Firestore if it was stored with generic 'طالب'
        if (isGeneric && certificate) {
          try {
            const certDocId = certificate.id || `${certificate.studentId}_${certificate.courseId}`;
            if (certDocId) {
              await updateDoc(doc(db, 'certificates', certDocId), {
                studentName: realName
              });
            }
          } catch (e) {
            console.warn('Error auto-healing cert in Firestore:', e);
          }
        }
      }
    }

    resolveAndHealName();
    return () => { isMounted = false; };
  }, [certificate, userData, currentUser]);

  if (!certificate) return null;

  const isRtl = dir === 'rtl';
  const verificationUrl = `${window.location.origin}/verify-certificate/${certificate.certificateId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Direct PDF Download handler using html-to-image (SVG foreignObject) and jsPDF
  const handleDownloadPdf = async () => {
    if (!certRef.current || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      let dataUrl;
      try {
        dataUrl = await toPng(certRef.current, {
          pixelRatio: 2,
          cacheBust: true,
          skipFonts: true,
        });
      } catch (err1) {
        console.warn('First toPng attempt with skipFonts failed, retrying fallback:', err1);
        dataUrl = await toPng(certRef.current, {
          pixelRatio: 2,
          cacheBust: true,
        });
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // A4 Landscape is 297mm x 210mm
      pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
      const safeStudent = (studentDisplayName || 'طالب').replace(/[\\/:*?"<>|]/g, '_');
      const safeCourse = (certificate.courseTitle || 'دورة').replace(/[\\/:*?"<>|]/g, '_');
      const filename = `شهادة_${safeStudent}_${safeCourse}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert(
        isRtl
          ? `تعذر تنزيل الـ PDF مباشرة (${err?.message || 'خطأ غير معروف'}). يمكنك الضغط على زر "طباعة" واختيار "حفظ بتنسيق PDF" كبديل فوري.`
          : `Could not generate PDF directly (${err?.message || 'unknown error'}). You can click "Print" and choose "Save as PDF".`
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Dedicated Print handler
  const handlePrint = () => {
    setIsPrinting(true);
    const prevTitle = document.title;
    document.title = `شهادة_${studentDisplayName || 'إتمام'}_${certificate.courseTitle || 'دورة'}`;
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      document.title = prevTitle;
    }, 200);
  };

  const modalContent = (
    <div id="certificate-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      {/* ================= High-Priority Print Styles ================= */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0 !important;
          }
          #root {
            display: none !important;
          }
          body::before,
          body::after {
            display: none !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          .modal-controls,
          .modal-footer {
            display: none !important;
          }
          #certificate-modal-overlay {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            overflow: visible !important;
            display: block !important;
          }
          #certificate-modal-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            border-radius: 0 !important;
            display: block !important;
          }
          #certificate-print-area {
            width: 100vw !important;
            height: 99.5vh !important;
            max-width: 100vw !important;
            max-height: 99.5vh !important;
            margin: 0 !important;
            padding: 28px 40px !important;
            border: 8px double #d97706 !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            break-inside: avoid !important;
            break-after: avoid !important;
            background: #ffffff !important;
            background: linear-gradient(135deg, #fffdf8 0%, #ffffff 50%, #fffbf0 100%) !important;
            color: #1c1917 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #certificate-print-area .cert-print-text-dark {
            color: #1c1917 !important;
          }
          #certificate-print-area .cert-print-text-muted {
            color: #57534e !important;
          }
          #certificate-print-area .cert-print-primary {
            color: #ea580c !important;
          }
          #certificate-print-area .cert-print-gold {
            color: #d97706 !important;
          }
        }
      `}</style>

      <div id="certificate-modal-container" className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-8 my-auto">
        
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="modal-controls flex items-center justify-between pb-6 mb-6 border-b border-stone-200 dark:border-stone-800 gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">verified</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-dark dark:text-white">
                {isRtl ? 'شهادة إتمام معتمدة' : 'Verified Certificate of Completion'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                ID: {certificate.certificateId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Share / Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer"
              title={isRtl ? 'نسخ رابط التحقق' : 'Copy Verification Link'}
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'رابط التحقق' : 'Share Link')}</span>
            </button>

            {/* 2. Dedicated Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-orange-700 text-white shadow-md shadow-primary/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              title={isRtl ? 'تنزيل الشهادة كملف PDF عالي الدقة مباشرة' : 'Download high-res PDF directly'}
            >
              {isDownloadingPdf ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isRtl ? 'جاري تجهيز PDF...' : 'Generating PDF...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>{isRtl ? 'تنزيل PDF' : 'Download PDF'}</span>
                </>
              )}
            </button>

            {/* 3. Dedicated Print Button */}
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-700 dark:text-amber-400 dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
              title={isRtl ? 'طباعة الشهادة' : 'Print Certificate'}
            >
              {isPrinting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
                  <span>{isRtl ? 'جاري التجهيز...' : 'Preparing...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span>{isRtl ? 'طباعة' : 'Print'}</span>
                </>
              )}
            </button>

            {/* 4. Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close') || (isRtl ? 'إغلاق النافذة' : 'Close modal')}
              className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* ================= Printable Certificate Canvas ================= */}
        <div 
          id="certificate-print-area"
          ref={certRef}
          className="relative w-full aspect-[1.414/1] bg-linear-to-br from-amber-50/70 via-white to-amber-50/50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 p-6 sm:p-12 rounded-2xl border-8 border-double border-amber-600/40 text-stone-900 dark:text-white overflow-hidden shadow-inner select-none font-alexandria flex flex-col justify-between"
          dir="rtl"
        >
          {/* Subtle Background Watermark Pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none flex items-center justify-center">
            <img src={logoSrc} alt="Watermark" crossOrigin="anonymous" className="w-[85%] max-w-[500px] object-contain rotate-[-12deg]" />
          </div>

          {/* Decorative Corner Filigrees */}
          <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 border-amber-600/60 pointer-events-none" />
          <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 border-amber-600/60 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 border-amber-600/60 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 border-amber-600/60 pointer-events-none" />

          {/* Certificate Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <img src={logoSrc} alt="PALESTINIAN INTERNATIONAL ACADEMY (PIA)" crossOrigin="anonymous" className="h-12 w-auto object-contain rounded-lg drop-shadow-xs" />
              <div>
                <span className="text-xs font-bold text-amber-600 cert-print-gold tracking-widest uppercase block">أكاديمية فلسطين الدولية</span>
                <span className="text-[10px] text-stone-400 cert-print-text-muted font-mono tracking-wider">PALESTINIAN INTERNATIONAL ACADEMY (PIA)</span>
              </div>
            </div>

            <div className="text-left font-mono text-[10px] text-stone-500 dark:text-stone-400 cert-print-text-muted">
              <div>كود الاعتماد: <span className="font-bold text-amber-600 dark:text-amber-400 cert-print-gold">{certificate.certificateId}</span></div>
              <div>تاريخ الإصدار: {certificate.formattedDate || certificate.issueDate?.toDate?.()?.toLocaleDateString('ar-EG') || new Date().toLocaleDateString('ar-EG')}</div>
            </div>
          </div>

          {/* Certificate Body Content */}
          <div className="relative z-10 my-auto text-center py-4 sm:py-6">
            <span className="inline-block px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 cert-print-gold font-bold text-xs tracking-widest uppercase mb-3">
              شهادة إتمام معتمدة • Certificate of Completion
            </span>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 dark:text-white cert-print-text-dark tracking-tight mb-2">
              شهـادة إنجـاز وتفـوق
            </h1>

            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 cert-print-text-muted mb-4">
              تشهد إدارة المنصة بأن المهندس / الطالب
            </p>

            <div className="inline-block relative mb-4">
              <span className="text-xl sm:text-3xl font-extrabold text-primary cert-print-primary px-6 py-1 border-b-2 border-primary/50 font-alexandria">
                {studentDisplayName}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 cert-print-text-dark max-w-xl mx-auto leading-relaxed mb-3">
              قد أتم بنجاح كافة متطلبات البرنامج التدريبي والمحاضرات العملية والاختبارات المقررة لدورة:
            </p>

            <h2 className="text-base sm:text-2xl font-bold text-stone-900 dark:text-amber-400 cert-print-gold mb-2">
              « {certificate.courseTitle} »
            </h2>

            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 cert-print-text-muted">
              تحت إشراف المدرب المعتمد: <span className="font-bold text-stone-800 dark:text-stone-200 cert-print-text-dark">{certificate.instructorName || 'هيئة التدريس'}</span>
            </p>
          </div>

          {/* Certificate Footer with Badges & Signatures */}
          <div className="relative z-10 pt-4 border-t border-amber-500/20 flex items-end justify-between">
            {/* Instructor Signature */}
            <div className="text-center w-36 sm:w-44">
              <div className="font-serif italic text-sm sm:text-base text-stone-800 dark:text-stone-200 cert-print-text-dark mb-1 border-b border-stone-400 dark:border-stone-600 pb-1">
                {certificate.instructorName}
              </div>
              <span className="text-[10px] text-stone-400 cert-print-text-muted block">توقيع مدرّب الدورة</span>
            </div>

            {/* Central Luxury Seal / Badge */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-linear-to-tr from-amber-600 via-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
                <div className="w-full h-full rounded-full border-2 border-dashed border-white/60 flex flex-col items-center justify-center text-white">
                  <span className="material-symbols-outlined text-xl sm:text-2xl">verified</span>
                  <span className="text-[7px] font-bold tracking-widest uppercase">معتمد</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 cert-print-gold mt-1 font-mono">
                {certificate.certificateId}
              </span>
            </div>

            {/* Platform Official Stamp */}
            <div className="text-center w-36 sm:w-44">
              <div className="font-serif italic text-sm sm:text-base text-stone-800 dark:text-stone-200 cert-print-text-dark mb-1 border-b border-stone-400 dark:border-stone-600 pb-1">
                عمادة المنصة الهندسية
              </div>
              <span className="text-[10px] text-stone-400 cert-print-text-muted block">الختم الأكاديمي الرسمي</span>
            </div>
          </div>

        </div>

        {/* Bottom Verification Note (Hidden in Print) */}
        <div className="modal-footer mt-4 pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 print:hidden flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{isRtl ? 'هذه الشهادة إلكترونية معتمدة وتحتوي على رمز تحقق دائم.' : 'This verified electronic certificate contains a permanent verification code.'}</span>
          </div>
          <a
            href={verificationUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline font-bold flex items-center gap-1"
          >
            <span>{isRtl ? 'فتح صفحة التحقق العامة' : 'Public Verification Page'}</span>
            <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
          </a>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
