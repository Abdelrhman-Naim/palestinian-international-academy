import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { submitExamAttempt } from '../services/examService';

export default function GraduationExamModal({
  exam,
  course,
  currentUser,
  onClose,
  onExamPassed
}) {
  const { t, dir } = useLanguage();
  const { userData } = useAuth();
  const isRtl = dir === 'rtl';

  const [currentStep, setCurrentStep] = useState('intro'); // 'intro' | 'taking' | 'result'
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [examResult, setExamResult] = useState(null);

  const questions = Array.isArray(exam?.questions) ? exam.questions : [];
  const passPercentage = exam?.passPercentage || 80;

  const handleSelectOption = (questionIndex, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleSubmitExam = async () => {
    // Check if any question remains unanswered
    const unansweredCount = questions.filter((_, idx) => selectedAnswers[idx] === undefined).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        isRtl 
          ? `لديك ${unansweredCount} سؤال لم تجب عليه بعد. هل أنت متأكد من تسليم الاختبار الآن؟`
          : `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    try {
      const resolvedStudentName = userData?.fullName || userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'طالب المنصة';

      const res = await submitExamAttempt({
        studentId: currentUser.uid,
        studentName: resolvedStudentName,
        courseId: course.id,
        courseTitle: course.title,
        instructorName: course.instructor,
        instructorId: course.instructorId,
        answers: selectedAnswers,
        questions,
        passPercentage
      });

      if (res.success) {
        setExamResult(res);
        setCurrentStep('result');
        if (res.passed && onExamPassed) {
          onExamPassed(res.certificate);
        }
      } else {
        alert(isRtl ? 'حدث خطأ أثناء تسليم الاختبار: ' + res.error : 'Error submitting exam: ' + res.error);
      }
    } catch (err) {
      console.error('Error submitting exam:', err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setExamResult(null);
    setCurrentStep('taking');
  };

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto font-alexandria" dir={dir}>
      <div className="relative w-full max-w-3xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-8 my-auto transition-all max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-xl">quiz</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-dark dark:text-white">
                {exam?.title || (isRtl ? 'اختبار التخرج النهائي' : 'Graduation Exam')}
              </h3>
              <p className="text-xs text-stone-400 font-medium">
                {course?.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close') || (isRtl ? 'إغلاق الاختبار' : 'Close exam modal')}
            className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-stone-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">

          {/* STEP 1: INTRO */}
          {currentStep === 'intro' && (
            <div className="py-6 space-y-6 text-center">
              <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                <span className="material-symbols-outlined text-4xl">school</span>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-xl font-extrabold text-dark dark:text-white">
                  {isRtl ? 'أنت الآن مؤهل لخوض اختبار التخرج!' : 'You Are Eligible for the Graduation Exam!'}
                </h4>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                  {exam?.description || (isRtl 
                    ? 'لقد أكملت جميع محاضرات الدورة بنجاح. خض هذا الاختبار لإثبات مهاراتك والحصول على شهادتك المعتمدة مباشرة.'
                    : 'You have completed all course lectures. Pass this exam to earn your official verified certificate.')}
                </p>
              </div>

              {/* Exam Instructions Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right sm:text-center pt-2">
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                  <span className="text-stone-400 text-xs font-bold block mb-1">{isRtl ? 'عدد الأسئلة' : 'Questions'}</span>
                  <span className="text-xl font-extrabold text-dark dark:text-white">{questions.length} {isRtl ? 'سؤال' : 'MCQs'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold block mb-1">{isRtl ? 'نسبة الاجتياز' : 'Passing Score'}</span>
                  <span className="text-xl font-extrabold text-emerald-600">{passPercentage}% {isRtl ? 'فما فوق' : '+'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                  <span className="text-stone-400 text-xs font-bold block mb-1">{isRtl ? 'الشهادة المعتمدة' : 'Certificate'}</span>
                  <span className="text-xl font-extrabold text-amber-500">{isRtl ? 'فورية وموثقة' : 'Instant'}</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('taking')}
                  disabled={questions.length === 0}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary hover:bg-orange-700 text-white font-bold text-sm shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">play_arrow</span>
                  <span>{isRtl ? 'بدء الاختبار الآن' : 'Start Exam Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  {isRtl ? 'تأجيل لوقت لاحق' : 'Take Later'}
                </button>
              </div>

              {questions.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                  {isRtl ? '⚠️ لم يقم المدرب بإضافة أسئلة للاختبار بعد. يرجى التواصل مع المدرب.' : '⚠️ Instructor has not added questions yet. Please check back soon.'}
                </p>
              )}
            </div>
          )}

          {/* STEP 2: TAKING EXAM */}
          {currentStep === 'taking' && (
            <div className="space-y-6 py-2">
              
              {/* Top Progress bar for answered questions */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between gap-4">
                <div className="text-xs font-bold text-stone-500 dark:text-stone-400">
                  {isRtl ? 'الأسئلة المجاب عليها:' : 'Answered:'}{' '}
                  <span className="text-dark dark:text-white font-extrabold">{answeredCount} من {questions.length}</span>
                </div>
                <div className="w-36 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${(answeredCount / (questions.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {questions.map((q, qIdx) => {
                  const isAnswered = selectedAnswers[qIdx] !== undefined;
                  return (
                    <div 
                      key={qIdx}
                      className={`p-5 rounded-2xl border transition-all ${
                        isAnswered
                          ? 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 shadow-xs'
                          : 'bg-[#FAF7F2]/50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800'
                      }`}
                    >
                      {/* Question Title */}
                      <div className="flex items-start gap-3 mb-4">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                          isAnswered ? 'bg-primary text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                        }`}>
                          {qIdx + 1}
                        </span>
                        <h5 className="text-sm sm:text-base font-bold text-dark dark:text-white pt-0.5 leading-relaxed">
                          {q.question}
                        </h5>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = Number(selectedAnswers[qIdx]) === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectOption(qIdx, optIdx)}
                              className={`p-3 rounded-xl border text-right text-xs sm:text-sm font-semibold transition-all flex items-center gap-3 cursor-pointer ${
                                isSelected
                                  ? 'border-primary bg-primary/10 text-primary dark:text-primary dark:border-primary ring-1 ring-primary/40'
                                  : 'border-stone-200 dark:border-stone-700/70 hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[10px] ${
                                isSelected
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-stone-300 dark:border-stone-600'
                              }`}>
                                {isSelected && '✓'}
                              </span>
                              <span className="flex-1 leading-snug">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Submit Buttons Bar */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep('intro')}
                  className="px-5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold text-xs hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  {isRtl ? 'السابق' : 'Back'}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitExam}
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">
                    {submitting ? 'sync' : 'verified'}
                  </span>
                  <span>{submitting ? (isRtl ? 'جاري تصحيح الاختبار...' : 'Grading...') : (isRtl ? 'تسليم الاختبار النهائي' : 'Submit Exam')}</span>
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: RESULT */}
          {currentStep === 'result' && examResult && (
            <div className="py-6 space-y-6 text-center">
              
              {examResult.passed ? (
                /* Passed Result (>= 80%) */
                <>
                  <div className="w-24 h-24 rounded-3xl bg-linear-to-tr from-emerald-500 to-emerald-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 animate-bounce">
                    <span className="material-symbols-outlined text-5xl">military_tech</span>
                  </div>

                  <div className="space-y-2 max-w-md mx-auto">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase">
                      {isRtl ? 'ناجح ومؤهل للشهادة' : 'Passed with Excellence'}
                    </span>
                    <h4 className="text-2xl font-extrabold text-dark dark:text-white">
                      {isRtl ? '🎉 ألف مبارك! اجتزت اختبار التخرج بنجاح' : '🎉 Congratulations! You Passed!'}
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                      {isRtl 
                        ? `حققت ${examResult.score}% (الحد الأدنى المطلوب ${passPercentage}%). لقد صدرت شهادتك المعتمدة رسمياً وهي جاهزة الآن للعرض والطباعة.`
                        : `You scored ${examResult.score}% (minimum required was ${passPercentage}%). Your verified certificate has been issued!`}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 max-w-xs mx-auto flex items-center justify-around">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">{isRtl ? 'نتيجتك' : 'Your Score'}</span>
                      <span className="text-3xl font-extrabold text-emerald-600">{examResult.score}%</span>
                    </div>
                    <div className="h-8 w-px bg-emerald-500/20" />
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">{isRtl ? 'الإجابات الصحيحة' : 'Correct'}</span>
                      <span className="text-lg font-bold text-dark dark:text-white">{examResult.correctCount} / {examResult.totalQuestions}</span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onExamPassed) onExamPassed(examResult.certificate);
                      }}
                      className="px-8 py-3.5 rounded-2xl bg-primary hover:bg-orange-700 text-white font-bold text-sm shadow-lg shadow-primary/25 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">workspace_premium</span>
                      <span>{isRtl ? 'عرض الشهادة المعتمدة والطباعة' : 'View Verified Certificate'}</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Failed Result (< 80%) */
                <>
                  <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
                    <span className="material-symbols-outlined text-4xl">refresh</span>
                  </div>

                  <div className="space-y-2 max-w-md mx-auto">
                    <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase">
                      {isRtl ? 'محاولة تحتاج إلى تعزيز' : 'Try Again'}
                    </span>
                    <h4 className="text-xl font-extrabold text-dark dark:text-white">
                      {isRtl ? 'أوشكت على الوصول! تحتاج 80% للحصول على الشهادة' : 'Almost there! You need 80% to earn the certificate'}
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                      {isRtl 
                        ? `لقد حققت ${examResult.score}%. يمكنك مراجعة بعض دروس ومحاضرات الدورة ثم إعادة الاختبار في أي وقت حتى تجتازه بنجاح وتستلم شهادتك.`
                        : `You scored ${examResult.score}%. Review course lectures and retake the exam whenever you are ready.`}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 max-w-xs mx-auto flex items-center justify-around">
                    <div>
                      <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block">{isRtl ? 'نتيجتك الحالية' : 'Current Score'}</span>
                      <span className="text-2xl font-extrabold text-amber-600">{examResult.score}%</span>
                    </div>
                    <div className="h-8 w-px bg-stone-200 dark:bg-stone-700" />
                    <div>
                      <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block">{isRtl ? 'المطلوب للشهادة' : 'Required'}</span>
                      <span className="text-2xl font-extrabold text-emerald-600">{passPercentage}%</span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="px-8 py-3 rounded-2xl bg-primary hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-primary/25 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">replay</span>
                      <span>{isRtl ? 'إعادة الاختبار الآن' : 'Retake Exam Now'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      {isRtl ? 'إغلاق ومراجعة الدروس' : 'Close & Review'}
                    </button>
                  </div>
                </>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
