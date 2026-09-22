import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, db } from '../supabase/db';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getCourseExam, saveCourseExam } from '../services/examService';

export default function ManageCourseExam() {
  const { t, dir } = useLanguage();
  const { id } = useParams(); // courseId
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const isRtl = dir === 'rtl';

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [examAttempts, setExamAttempts] = useState([]);

  // Exam Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passPercentage, setPassPercentage] = useState(80);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(20);
  const [questions, setQuestions] = useState([]);
  const [collapsedQuestions, setCollapsedQuestions] = useState({});

  const toggleQuestionCollapse = (qIndex) => {
    setCollapsedQuestions(prev => ({
      ...prev,
      [qIndex]: !prev[qIndex]
    }));
  };

  const expandAllQuestions = () => {
    setCollapsedQuestions({});
  };

  const collapseAllQuestions = () => {
    const next = {};
    questions.forEach((_, idx) => { next[idx] = true; });
    setCollapsedQuestions(next);
  };

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setLoading(true);
      try {
        // Fetch course details
        const cSnap = await getDoc(doc(db, 'courses', id));
        if (cSnap.exists()) {
          setCourse({ id: cSnap.id, ...cSnap.data() });
        }

        // Fetch existing exam if available
        const existingExam = await getCourseExam(id);
        if (existingExam) {
          setTitle(existingExam.title || '');
          setDescription(existingExam.description || '');
          setPassPercentage(existingExam.passPercentage ?? 80);
          setTimeLimitMinutes(existingExam.timeLimitMinutes ?? 20);
          if (Array.isArray(existingExam.questions) && existingExam.questions.length > 0) {
            setQuestions(existingExam.questions);
          } else {
            setQuestions([
              {
                question: '',
                options: ['', '', '', ''],
                correctOption: 0
              }
            ]);
          }
        } else {
          // Defaults if new
          setTitle(isRtl ? `اختبار التخرج النهائي - ${cSnap.data()?.title || ''}` : `Graduation Exam - ${cSnap.data()?.title || ''}`);
          setDescription(isRtl ? 'اختبار تقييمي شامل لمحتوى الدورة للحصول على شهادة الإتمام المعتمدة بنسبة 80% فما فوق.' : 'Comprehensive evaluation exam to earn your verified certificate (80%+ passing score).');
          setQuestions([
            {
              question: '',
              options: ['', '', '', ''],
              correctOption: 0
            }
          ]);
        }

        // Fetch exam statistics / attempts
        const attemptsQ = query(collection(db, 'exam_attempts'), where('courseId', '==', id));
        const attemptsSnap = await getDocs(attemptsQ);
        setExamAttempts(attemptsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error loading exam data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, isRtl]);

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question: '',
        options: ['', '', '', ''],
        correctOption: 0
      }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length <= 1) {
      alert(isRtl ? 'يجب أن يحتوي الاختبار على سؤال واحد على الأقل.' : 'Exam must contain at least one question.');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuestionTextChange = (index, value) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[index].question = value;
      return copy;
    });
  };

  const handleOptionTextChange = (qIndex, optIndex, value) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIndex].options[optIndex] = value;
      return copy;
    });
  };

  const handleCorrectOptionChange = (qIndex, optIndex) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIndex].correctOption = optIndex;
      return copy;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert(isRtl ? 'يرجى إدخال عنوان الاختبار.' : 'Please enter exam title.');
      return;
    }

    // Validation for questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(isRtl ? `يرجى إدخال نص السؤال رقم ${i + 1}.` : `Please enter text for question #${i + 1}.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          alert(isRtl ? `يرجى إدخال نص الخيار ${j + 1} في السؤال رقم ${i + 1}.` : `Please fill option ${j + 1} in question #${i + 1}.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const res = await saveCourseExam(id, {
        title: title.trim(),
        description: description.trim(),
        passPercentage: Number(passPercentage) || 80,
        timeLimitMinutes: Number(timeLimitMinutes) || 20,
        questions,
        instructorName: userData?.name || userData?.fullName || currentUser?.displayName || course?.instructor || 'المدرب',
        instructorId: currentUser?.uid || ''
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert(isRtl ? 'فشل حفظ الاختبار: ' + res.error : 'Failed to save exam: ' + res.error);
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const passedCount = examAttempts.filter(a => a.passed).length;
  const totalAttempts = examAttempts.length;

  if (loading) {
    return (
      <div dir={dir} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
          {/* Navigation Breadcrumb Skeleton */}
          <div className="border-b border-[#E8E2D5] dark:border-gray-700 pb-4 space-y-3">
            <div className="h-3.5 w-56 bg-stone-200 dark:bg-stone-700 rounded-full" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-200 dark:bg-stone-700" />
              <div className="h-7 w-80 bg-stone-200 dark:bg-stone-700 rounded-xl" />
            </div>
            <div className="h-4 w-full max-w-md bg-stone-200 dark:bg-stone-700 rounded-full" />
          </div>

          {/* Quick Stats Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-[#E8E2D5] dark:border-gray-700 h-24 flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-stone-200 dark:bg-stone-700 rounded-full" />
                  <div className="h-6 w-12 bg-stone-200 dark:bg-stone-700 rounded-lg" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-700" />
              </div>
            ))}
          </div>

          {/* Settings Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-[#E8E2D5] dark:border-gray-700 space-y-4">
            <div className="h-5 w-48 bg-stone-200 dark:bg-stone-700 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="h-11 bg-stone-100 dark:bg-gray-900 rounded-xl" />
              <div className="h-11 bg-stone-100 dark:bg-gray-900 rounded-xl" />
            </div>
            <div className="h-16 bg-stone-100 dark:bg-gray-900 rounded-xl" />
          </div>

          {/* Questions Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 w-56 bg-stone-200 dark:bg-stone-700 rounded-lg" />
              <div className="h-9 w-36 bg-stone-200 dark:bg-stone-700 rounded-xl" />
            </div>

            {[1, 2].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-[#E8E2D5] dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-gray-700 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-stone-200 dark:bg-stone-700" />
                    <div className="h-4 w-32 bg-stone-200 dark:bg-stone-700 rounded-full" />
                  </div>
                </div>
                <div className="h-11 bg-stone-100 dark:bg-gray-900 rounded-xl" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[1, 2, 3, 4].map(opt => (
                    <div key={opt} className="h-12 bg-stone-100 dark:bg-gray-900 rounded-2xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action Bar Skeleton */}
          <div className="h-16 bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-[#E8E2D5] dark:border-gray-700" />
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#E8E2D5] dark:border-gray-700 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-400">
              <Link to="/instructor-dashboard/my-courses" className="hover:text-primary transition-colors">
                {isRtl ? 'دوراتي' : 'My Courses'}
              </Link>
              <span>/</span>
              <span className="text-primary">{course?.title || (isRtl ? 'الدورة' : 'Course')}</span>
              <span>/</span>
              <span className="text-dark dark:text-white">{isRtl ? 'اختبار التخرج' : 'Graduation Exam'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">quiz</span>
              </span>
              <span>{isRtl ? 'إعداد اختبار التخرج للدورة' : 'Manage Course Graduation Exam'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              {isRtl 
                ? 'الطلاب الذين يكملون محاضرات الدورة بنسبة 100% سيخوضون هذا الاختبار للحصول على الشهادة عند تحقيق 80% فما فوق.'
                : 'Students completing 100% of lectures will take this exam to unlock their certificate upon scoring 80% or higher.'}
            </p>
          </div>

          <Link
            to="/instructor-dashboard/my-courses"
            className="px-4 py-2 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-primary hover:text-primary transition-all shadow-xs"
          >
            {isRtl ? 'العودة للدورات' : 'Back to Courses'}
          </Link>
        </div>

        {/* Exam Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-[#E8E2D5] dark:border-gray-700 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-400 block">{isRtl ? 'عدد الأسئلة' : 'Questions Count'}</span>
              <span className="text-2xl font-extrabold text-dark dark:text-white">{questions.length}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">format_list_bulleted</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-[#E8E2D5] dark:border-gray-700 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-400 block">{isRtl ? 'نسبة النجاح المطلوبة' : 'Passing Threshold'}</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{passPercentage}%</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined">verified</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-[#E8E2D5] dark:border-gray-700 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-400 block">{isRtl ? 'الطلاب الناجحون' : 'Passed Students'}</span>
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {passedCount} <span className="text-xs font-normal text-stone-400">/ {totalAttempts} {isRtl ? 'محاولة' : 'attempts'}</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined">school</span>
            </div>
          </div>
        </div>

        {/* Save Success Banner */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-xl">check_circle</span>
            <span>{isRtl ? 'تم حفظ وتحديث اختبار التخرج بنجاح! أصبح جاهزاً للطلاب الآن.' : 'Graduation exam saved successfully! Now available for students.'}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* General Exam Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-[#E8E2D5] dark:border-gray-700 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-dark dark:text-white flex items-center gap-2 border-b border-stone-100 dark:border-gray-700 pb-3">
              <span className="material-symbols-outlined text-primary text-xl">tune</span>
              <span>{isRtl ? 'إعدادات الاختبار العامة' : 'General Exam Settings'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1.5">
                  {isRtl ? 'عنوان الاختبار' : 'Exam Title'} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-900 text-dark dark:text-white font-semibold text-sm focus:outline-hidden focus:border-primary"
                  placeholder={isRtl ? 'مثال: اختبار التخرج النهائي لمسار تطوير الويب' : 'e.g. Final Web Development Exam'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1.5">
                  {isRtl ? 'نسبة النجاح للشهادة (%)' : 'Passing Score (%)'} *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="50"
                    max="100"
                    required
                    value={passPercentage}
                    onChange={e => setPassPercentage(e.target.value)}
                    className="w-32 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-900 text-dark dark:text-white font-bold text-sm focus:outline-hidden focus:border-primary"
                  />
                  <span className="text-xs text-stone-400 font-semibold">
                    {isRtl ? '(الافتراضي 80% للحصول على الشهادة)' : '(Default 80% to earn certificate)'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1.5">
                {isRtl ? 'وصف أو تعليمات الاختبار للطلاب' : 'Exam Description & Instructions'}
              </label>
              <textarea
                rows="2"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-900 text-dark dark:text-white text-sm focus:outline-hidden focus:border-primary"
                placeholder={isRtl ? 'اكتب تعليمات موجزة للطالب قبل بدء الاختبار...' : 'Brief instructions before starting the exam...'}
              />
            </div>
          </div>

          {/* Questions Builder Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-extrabold text-dark dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">help</span>
                  <span>{isRtl ? 'أسئلة الاختبار (اختيار من متعدد)' : 'Exam Questions (MCQs)'}</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  {questions.length} {isRtl ? 'سؤال' : 'questions'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {questions.length > 1 && (
                  <div className="flex items-center gap-1 border border-stone-200 dark:border-gray-700 rounded-xl p-1 bg-stone-50 dark:bg-gray-900 text-xs font-bold">
                    <button
                      type="button"
                      onClick={expandAllQuestions}
                      className="px-2.5 py-1 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      title={isRtl ? 'توسيع كل الأسئلة' : 'Expand All'}
                    >
                      {isRtl ? 'توسيع الكل' : 'Expand All'}
                    </button>
                    <span className="text-stone-300 dark:text-gray-700">|</span>
                    <button
                      type="button"
                      onClick={collapseAllQuestions}
                      className="px-2.5 py-1 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      title={isRtl ? 'طي كل الأسئلة' : 'Collapse All'}
                    >
                      {isRtl ? 'طي الكل' : 'Collapse All'}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleAddQuestion}
                  className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  <span>{isRtl ? 'إضافة سؤال جديد' : 'Add New Question'}</span>
                </button>
              </div>
            </div>

            {questions.map((q, qIndex) => {
              const isCollapsed = !!collapsedQuestions[qIndex];
              const selectedOptText = q.options[q.correctOption] || `${isRtl ? 'الخيار' : 'Option'} ${q.correctOption + 1}`;

              return (
                <div 
                  key={qIndex} 
                  className={`bg-white dark:bg-gray-800 rounded-3xl border transition-all ${
                    isCollapsed 
                      ? 'p-4 border-[#E8E2D5] dark:border-gray-700 hover:border-amber-500/50 shadow-xs' 
                      : 'p-6 border-[#E8E2D5] dark:border-gray-700 shadow-sm space-y-4'
                  }`}
                >
                  {/* Question Header Accordion Bar */}
                  <div 
                    onClick={() => toggleQuestionCollapse(qIndex)}
                    className="flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 font-bold text-dark dark:text-white min-w-0 flex-1">
                      <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                        {qIndex + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-dark dark:text-white truncate">
                            {q.question.trim() || (isRtl ? `السؤال رقم ${qIndex + 1}` : `Question #${qIndex + 1}`)}
                          </span>
                        </div>
                        {isCollapsed && (
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-400 font-medium">
                            <span className="truncate max-w-md">{q.question || (isRtl ? 'لم يتم إدخال نص السؤال' : 'No prompt entered')}</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                              {isRtl ? 'الإجابة:' : 'Ans:'} {selectedOptText}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      {!isCollapsed && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          <span>{selectedOptText}</span>
                        </span>
                      )}

                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                          title={isRtl ? 'حذف هذا السؤال' : 'Delete Question'}
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                          <span className="hidden sm:inline">{isRtl ? 'حذف' : 'Remove'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleQuestionCollapse(qIndex)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-dark dark:hover:text-white hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        title={isCollapsed ? (isRtl ? 'توسيع' : 'Expand') : (isRtl ? 'طي' : 'Collapse')}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {isCollapsed ? 'expand_more' : 'expand_less'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Question Body (Inputs & Options) - Hidden when Collapsed */}
                  {!isCollapsed && (
                    <div className="pt-2 space-y-4 border-t border-stone-100 dark:border-gray-700/60">
                      {/* Question Text Input */}
                      <div>
                        <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">
                          {isRtl ? 'نص السؤال' : 'Question Prompt'} *
                        </label>
                        <input
                          type="text"
                          required
                          value={q.question}
                          onChange={e => handleQuestionTextChange(qIndex, e.target.value)}
                          placeholder={isRtl ? 'اكتب صيغة السؤال هنا بدقة...' : 'Type the question here...'}
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-900 text-dark dark:text-white font-medium text-sm focus:outline-hidden focus:border-primary"
                        />
                      </div>

                      {/* Options List */}
                      <div className="space-y-2 pt-1">
                        <label className="block text-xs font-bold text-stone-600 dark:text-stone-300">
                          {isRtl ? 'الخيارات (حدد الخيار الدائري للإجابة الصحيحة):' : 'Options (Check radio for correct answer):'}
                        </label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {q.options.map((opt, optIndex) => {
                            const isCorrect = Number(q.correctOption) === optIndex;
                            return (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                                  isCorrect 
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500/50' 
                                    : 'border-stone-200 dark:border-gray-700 bg-stone-50/70 dark:bg-gray-900/60'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`correct_${qIndex}`}
                                  checked={isCorrect}
                                  onChange={() => handleCorrectOptionChange(qIndex, optIndex)}
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  title={isRtl ? 'تعيين كإجابة صحيحة' : 'Mark as correct answer'}
                                />
                                <input
                                  type="text"
                                  required
                                  value={opt}
                                  onChange={e => handleOptionTextChange(qIndex, optIndex, e.target.value)}
                                  placeholder={`${isRtl ? 'الخيار' : 'Option'} ${optIndex + 1}${isCorrect ? (isRtl ? ' (الإجابة الصحيحة)' : ' (Correct)') : ''}`}
                                  className="w-full bg-transparent text-dark dark:text-white text-xs font-semibold focus:outline-hidden"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Bottom Actions Sticky Bar */}
          <div className="sticky bottom-4 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl p-4 border border-[#E8E2D5] dark:border-gray-700 shadow-2xl flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleAddQuestion}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-gray-600 hover:border-primary text-dark dark:text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>{isRtl ? 'إضافة سؤال آخر' : 'Add Another Question'}</span>
              </button>

              <span className="hidden sm:inline text-xs text-stone-400 font-medium">
                {questions.length} {isRtl ? 'أسئلة مضافة' : 'questions added'}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || saving}
              className="px-8 py-3 rounded-xl bg-primary hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-primary/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">
                {saving ? 'sync' : 'save'}
              </span>
              <span>{saving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ ونشر الاختبار' : 'Save & Publish Exam')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
