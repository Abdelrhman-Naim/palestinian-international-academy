import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import StarRating from './StarRating';
import { 
  listenToTargetReviews, 
  getUserReview, 
  addOrUpdateReview, 
  deleteReview 
} from '../services/reviewService';

export default function ReviewSection({
  targetType = 'course', // 'course' | 'book'
  targetId,
  canReview = true,
  cannotReviewReason = '',
  targetTitle = '',
}) {
  const { t, dir } = useLanguage();
  const { currentUser, userData, userRole } = useAuth();
  const isRtl = dir === 'rtl';

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState(null);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [filterStar, setFilterStar] = useState('all');

  // Real-time listen to all reviews for this target
  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    const unsub = listenToTargetReviews(targetType, targetId, (list) => {
      setReviews(list);
      setLoading(false);
    });

    return () => unsub();
  }, [targetType, targetId]);

  // Check if current user has already submitted a review
  useEffect(() => {
    if (!currentUser || !targetId) {
      setUserReview(null);
      return;
    }
    getUserReview(targetType, targetId, currentUser.uid).then((rev) => {
      if (rev) {
        setUserReview(rev);
        setRating(rev.rating || 5);
        setComment(rev.comment || '');
      } else {
        setUserReview(null);
        setRating(5);
        setComment('');
      }
    });
  }, [targetType, targetId, currentUser]);

  // Stats calculation
  const totalCount = reviews.length;
  const ratingSum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const averageRating = totalCount > 0 ? (ratingSum / totalCount).toFixed(1) : '0.0';

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const v = Math.min(5, Math.max(1, Number(r.rating) || 5));
    breakdown[v] = (breakdown[v] || 0) + 1;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !canReview || isSubmitting) return;

    if (!rating || Number(rating) < 1) {
      setFormError(isRtl ? 'يرجى تحديد عدد النجوم للتقييم (نجمة واحدة على الأقل)' : 'Please select a star rating (at least 1 star)');
      return;
    }

    if (!comment.trim() || comment.trim().length < 3) {
      setFormError(isRtl ? 'يرجى كتابة نص المراجعة والتقييم (3 أحرف على الأقل)' : 'Please write your review feedback (at least 3 characters)');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      const resolvedName = userData?.fullName || userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || (isRtl ? 'طالب المنصة' : 'Platform Student');
      const resolvedAvatar = userData?.photoURL || currentUser?.photoURL || '';

      const res = await addOrUpdateReview({
        targetType,
        targetId,
        userId: currentUser.uid,
        userName: resolvedName,
        userAvatar: resolvedAvatar,
        rating: Number(rating),
        comment: comment.trim(),
      });

      if (res && res.error) {
        throw res.error;
      }

      const updated = await getUserReview(targetType, targetId, currentUser.uid);
      setUserReview(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Error submitting review:', err);
      setFormError(err.message || (isRtl ? 'حدث خطأ أثناء حفظ التقييم' : 'Error saving review'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await deleteReview({
        targetType,
        targetId,
        userId: currentUser.uid,
      });
      setUserReview(null);
      setRating(5);
      setComment('');
      setIsEditing(false);
      setDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReviews = filterStar === 'all' 
    ? reviews 
    : reviews.filter(r => Number(r.rating) === Number(filterStar));

  return (
    <div className="w-full space-y-8 font-alexandria">
      
      {/* Header Title */}
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-dark dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-2xl">rate_review</span>
            <span>{isRtl ? 'التقييمات والمراجعات' : 'Ratings & Reviews'}</span>
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            {isRtl 
              ? `آراء وتقييمات الطلاب والقراء ${targetTitle ? `حول «${targetTitle}»` : ''}`
              : `Student and reader reviews ${targetTitle ? `for "${targetTitle}"` : ''}`}
          </p>
        </div>
      </div>

      {/* Ratings Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl bg-linear-to-br from-amber-500/5 via-stone-50 to-amber-500/10 dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 border border-amber-500/20 dark:border-stone-800 shadow-xs">
        
        {/* Big Average Score */}
        <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-e border-amber-500/20 dark:border-stone-800">
          <span className="text-5xl sm:text-6xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
            {averageRating}
          </span>
          <div className="my-2">
            <StarRating value={Number(averageRating)} readOnly size="lg" />
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-bold">
            {isRtl 
              ? `بناءً على ${totalCount} ${totalCount === 1 ? 'تقييم' : totalCount === 2 ? 'تقييمين' : totalCount > 2 && totalCount < 11 ? 'تقييمات' : 'تقييماً'}`
              : `Based on ${totalCount} ${totalCount === 1 ? 'review' : 'reviews'}`}
          </span>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-2 space-y-2 justify-center flex flex-col">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown[star] || 0;
            const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

            return (
              <button
                key={star}
                type="button"
                onClick={() => setFilterStar(filterStar === String(star) ? 'all' : String(star))}
                className={`w-full flex items-center gap-3 text-xs group cursor-pointer p-1 rounded-xl transition-all ${
                  filterStar === String(star) ? 'bg-amber-500/15 ring-1 ring-amber-500/40' : 'hover:bg-amber-500/5'
                }`}
              >
                <div className="flex items-center gap-1 w-12 text-stone-700 dark:text-stone-300 font-bold shrink-0">
                  <span>{star}</span>
                  <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                </div>

                <div className="flex-1 h-2.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-12 text-end text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                  {count} ({percentage}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Write / Edit Review Form */}
      {currentUser ? (
        canReview ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
            {userReview && !isEditing ? (
              // Display Existing User Review Card
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>{isRtl ? 'تقييمك الحالي' : 'Your Current Review'}</span>
                    </span>
                    <StarRating value={userReview.rating} readOnly size="sm" />
                  </div>
                  {userReview.comment ? (
                    <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                      «{userReview.comment}»
                    </p>
                  ) : (
                    <p className="text-xs text-stone-400 italic">
                      {isRtl ? 'لم تضف تعليقاً نصياً' : 'No written comment provided'}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:border-amber-500 text-stone-700 dark:text-stone-300 hover:text-amber-600 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>{isRtl ? 'تعديل التقييم' : 'Edit Review'}</span>
                  </button>

                  {deleteConfirm ? (
                    <div className="flex items-center gap-1 animate-fade-in">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all cursor-pointer"
                      >
                        {isRtl ? 'تأكيد الحذف' : 'Confirm Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(false)}
                        className="px-2 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(true)}
                      className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-red-500 hover:bg-red-500/10 font-bold text-xs transition-all cursor-pointer"
                      title={isRtl ? 'حذف تقييمي' : 'Delete my review'}
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // Active Submission Form
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-dark dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-lg">star</span>
                    <span>{userReview ? (isRtl ? 'تعديل تقييمك' : 'Edit Your Review') : (isRtl ? 'إضافة تقييم ومراجعة جديدة' : 'Write a Review')}</span>
                  </h4>
                  {userReview && isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white font-bold cursor-pointer"
                    >
                      {isRtl ? 'إلغاء التعديل' : 'Cancel'}
                    </button>
                  )}
                </div>

                {/* Rating Input */}
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    {isRtl ? 'حدد عدد النجوم:' : 'Select your rating:'}
                  </span>
                  <StarRating 
                    value={rating} 
                    onChange={(val) => { setRating(val); if (formError) setFormError(''); }} 
                    size="lg" 
                    showLabel 
                  />
                </div>

                {/* Comment Textarea */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center justify-between">
                    <span>{isRtl ? 'رأيك وتجربتك بالتفصيل:' : 'Your Detailed Review:'}</span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">{isRtl ? '* مطلوب (3 أحرف على الأقل)' : '* Required (min 3 chars)'}</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => { setComment(e.target.value); if (formError) setFormError(''); }}
                    rows={3}
                    placeholder={
                      isRtl
                        ? 'اكتب هنا انطباعك عن جودة المحتوى، الشرح، والاستفادة العملية...'
                        : 'Share your thoughts about content quality, teaching method, and practical skills...'
                    }
                    className={`w-full px-4 py-3 rounded-2xl border bg-stone-50 dark:bg-stone-800 text-dark dark:text-white text-xs sm:text-sm focus:outline-none transition-all resize-y ${
                      formError && (!comment.trim() || comment.trim().length < 3)
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-stone-200 dark:border-stone-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                  />
                </div>

                {/* Form Error Banner */}
                {formError && (
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                    <span>{formError}</span>
                  </div>
                )}

                {/* Submit Action Button */}
                <div className="flex justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{isRtl ? 'جاري الحفظ...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">send</span>
                        <span>{userReview ? (isRtl ? 'تحديث التقييم' : 'Update Review') : (isRtl ? 'نشر التقييم' : 'Submit Review')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          // Student cannot review (e.g. not enrolled in course)
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-amber-600 shrink-0">info</span>
            <span>
              {cannotReviewReason || (isRtl 
                ? 'يمكنك تقييم هذه الدورة وكتابة مراجعتك فور التسجيل بها والانضمام لطلابها.'
                : 'Enroll in this course to leave your rating and review.')}
            </span>
          </div>
        )
      ) : (
        // Guest user prompt
        <div className="p-5 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-stone-400">lock</span>
            <span>
              {isRtl 
                ? 'يرجى تسجيل الدخول إلى حسابك أولاً لتتمكن من إضافة تقييمك الخاص.'
                : 'Please sign in to share your review and rating.'}
            </span>
          </div>
          <a
            href="/login"
            className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-all text-center shrink-0"
          >
            {isRtl ? 'تسجيل الدخول' : 'Sign In'}
          </a>
        </div>
      )}

      {/* Filter Chips & List Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h4 className="text-base font-bold text-dark dark:text-white flex items-center gap-2">
            <span>{isRtl ? 'آراء ومراجعات الطلاب' : 'Community Reviews'}</span>
            <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-300 font-mono">
              {filteredReviews.length}
            </span>
          </h4>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-stone-400 font-bold me-1">
              {isRtl ? 'تصفية:' : 'Filter:'}
            </span>
            {['all', '5', '4', '3', '2', '1'].map((starKey) => (
              <button
                key={starKey}
                onClick={() => setFilterStar(starKey)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStar === starKey
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {starKey === 'all' 
                  ? (isRtl ? 'الكل' : 'All') 
                  : `${starKey} ★`}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-stone-400 font-bold">
            {t('common.loading')}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-10 rounded-3xl bg-stone-50 dark:bg-stone-900/50 border border-dashed border-stone-200 dark:border-stone-800 text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-stone-400">rate_review</span>
            <p className="text-sm font-bold text-stone-600 dark:text-stone-400">
              {filterStar === 'all'
                ? (isRtl ? 'لا توجد تقييمات حتى الآن. كن أول من يقيّم!' : 'No reviews yet. Be the first to review!')
                : (isRtl ? `لا توجد تقييمات بـ ${filterStar} نجوم.` : `No ${filterStar}-star reviews.`)}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((rev) => {
              const formattedDate = rev.updatedAt?.toDate
                ? rev.updatedAt.toDate().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : (isRtl ? 'مؤخراً' : 'Recently');

              const isOwner = currentUser?.uid === rev.userId;
              const isAdmin = userRole === 'admin';

              return (
                <div
                  key={rev.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-stone-900 border transition-all space-y-3 ${
                    isOwner 
                      ? 'border-amber-500/40 ring-1 ring-amber-500/20' 
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {rev.userAvatar ? (
                        <img 
                          src={rev.userAvatar} 
                          alt={rev.userName} 
                          className="w-10 h-10 rounded-full object-cover border border-amber-500/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-amber-500 to-yellow-400 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {(rev.userName || 'ط')[0].toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-bold text-dark dark:text-white">
                            {rev.userName}
                          </h5>
                          {isOwner && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                              {isRtl ? 'تقييمك' : 'You'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-400 block font-mono">
                          {formattedDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StarRating value={rev.rating} readOnly size="sm" />
                      
                      {/* Admin Delete Action */}
                      {isAdmin && !isOwner && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(isRtl ? 'هل تريد حذف هذا التقييم كأدمن؟' : 'Delete this review as admin?')) {
                              await deleteReview({ targetType, targetId, userId: rev.userId });
                            }
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          title={isRtl ? 'حذف المراجعة (إدارة)' : 'Delete Review (Admin)'}
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed ps-13">
                      {rev.comment}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
