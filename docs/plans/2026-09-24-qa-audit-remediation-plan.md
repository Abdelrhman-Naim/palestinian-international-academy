# خطة العمل التنفيذية لمعالجة عيوب فحص الجودة والأمان (QA & Security Audit Remediation Plan)

> **الهدف:** معالجة وحل جميع المشاكل الـ 14 الواردة في تقرير التدقيق وفحص الجودة لعام 2026، وضمان استقرار كامل في لوحات التحكم (المدرب، الطالب، الإدارة)، المكتبة الرقمية، المحادثات، ونماذج التعديل والاختبارات.

---

## 📋 نظرة عامة على مراحل العمل (Phased Breakdown)

| الحزمة | النطاق | المشاكل المشمولة | الملفات المستهدفة |
| :--- | :--- | :--- | :--- |
| **المرحلة 1: الأخطاء عالية الخطورة** | High Severity | HIGH-01, HIGH-02, HIGH-03, HIGH-04, HIGH-05, HIGH-06 | `InstructorProfile.jsx`, `NotificationDropdown.jsx`, `savedBooksService.js`, `useSavedBooks.js`, `ReviewSection.jsx`, `reviewService.js` |
| **المرحلة 2: الأخطاء متوسطة الخطورة** | Medium Severity | MEDIUM-01, MEDIUM-02, MEDIUM-03, MEDIUM-04 | `ManageAssignments.jsx`, `StudentAssignments.jsx`, `chatService.js`, `ChatPage.jsx`, `ManageCourseExam.jsx`, `EditCourse.jsx` |
| **المرحلة 3: الملاحظات المنخفضة وتجربة المستخدم** | Low / UX | LOW-01, LOW-02, LOW-03, LOW-04 | `CoursesContext.jsx`, `LibraryContext.jsx`, `StudentProfile.jsx`, `InstructorProfile.jsx`, `index.css` |
| **المرحلة 4: الاختبار والتحقق الشامل** | Verification & Build | فحص Build، فحص الروابط، اختبار التدفقات | `npm run build`, Git Commit |

---

## 🔴 المرحلة 1: معالجة الأخطاء عالية الخطورة (High Severity Defects)

### المهمة 1.1: إصلاح تحديث الملف الشخصي وتغيير كلمة المرور واستعادة كلمة المرور للمدرب (HIGH-01, HIGH-02, HIGH-03)
* **الموقع والملفات:**
  - `src/pages/instructor/InstructorProfile.jsx`
* **السبب الجذري (Root Cause):**
  - تم استدعاء `supabase.from('profiles').update(...)` في السطر 200 و `supabase.auth.signInWithPassword` في السطر 271 و `supabase.auth.updateUser` في السطر 285 دون استيراد `supabase` من `../../supabase/client`. هذا يتسبب فوراً بانهيار العملية وظهور خطأ `ReferenceError: supabase is not defined`.
  - في السطر 317 تم استدعاء `sendPasswordResetEmail(auth, email)` دون استيراد الدالة من أي مكان، بينما دالة `resetPassword` متوفرة بالفعل ومستخرجة من `useAuth()` أو يمكن استخدام `supabase.auth.resetPasswordForEmail`.
* **خطوات التنفيذ البرمجية:**
  1. استيراد عميل Supabase:
     ```javascript
     import { supabase } from '../../supabase/client';
     ```
  2. في `handleSaveProfile`:
     - التأكد من تحديث جدول `profiles` باستخدام `supabase.from('profiles').update(...)`.
     - مزامنة الاسم المحدث مع `supabase.auth.updateUser`.
     - تحديث رسائل النجاح والخطأ بحيث تكون واضحة ومترجمة ولا تسرب أخطاء تقنية للمستخدم.
  3. في `handleChangePassword`:
     - استدعاء `supabase.auth.signInWithPassword` للتحقق من كلمة المرور الحالية.
     - معالجة أخطاء كلمة المرور غير الصحيحة برسالة عربية واضحة ("كلمة المرور الحالية غير صحيحة").
     - تحديث كلمة المرور عبر `supabase.auth.updateUser({ password: pwdData.newPassword })`.
  4. في `handleSendResetEmail`:
     - استبدال الاستدعاء المكسور بـ:
     ```javascript
     const { error } = await supabase.auth.resetPasswordForEmail(email, {
       redirectTo: `${window.location.origin}/login`
     });
     if (error) throw error;
     ```
     - إظهار رسالة نجاح واضحة للمدرب: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح".
* **طريقة التحقق:**
  - فتح صفحة البروفايل `/trainer-dashboard/profile`، حفظ البيانات بدون تعديل ثم مع تعديل والتأكد من ظهور رسالة النجاح الخضراء.
  - إدخال كلمة مرور خاطئة والتأكد من ظهور تنبيه "كلمة المرور الحالية غير صحيحة" بدون كشف `supabase is not defined`.
  - النقر على "نسيت كلمة المرور؟" والتحقق من إرسال الرابط بنجاح.

---

### المهمة 1.2: إصلاح توجيه إشعارات الطلاب الجدد في لوحة المدرب (HIGH-04)
* **الموقع والملفات:**
  - `src/components/NotificationDropdown.jsx`
  - `src/components/AnimatedRoutes.jsx`
* **السبب الجذري (Root Cause):**
  - في السطر 214 من `NotificationDropdown.jsx`، عندما يكون دور المستخدم `instructor` ونوع الإشعار `enrollment`، يُرجع الكود رابط لوحة الإدارة:
    `/admin-dashboard/course-students/${courseId}`
    بينما المدرب ليس لديه صلاحية دخول لوحة الإدارة، فيتم توقيفه بواسطة `AdminGuard` وتظهر شاشة "وصول مرفوض (Access Denied / 403)".
* **خطوات التنفيذ البرمجية:**
  1. تعديل مسار التوجيه للمدرب في `NotificationDropdown.jsx`:
     - توجيه المدرب إلى صفحة دوراته مع تمييز الدورة المحددة:
     ```javascript
     if (userRole === 'instructor') {
       if (type === 'enrollment') {
         if (courseId) {
           return `/instructor-dashboard/my-courses?highlightCourse=${courseId}`;
         }
         return '/instructor-dashboard/my-courses';
       }
     }
     ```
  2. في صفحة `MyCourses.jsx`: التأكد من تمييز الدورة المحددة أو إظهار طلابها.
* **طريقة التحقق:**
  - النقر على إشعار "طالب جديد مسجل في دورتك" بحساب مدرب، والتأكد من فتح صفحة دورات المدرب بدون ظهور أي شاشة 403 أو "وصول مرفوض".

---

### المهمة 1.3: إصلاح ميزة حفظ الكتب والمراجع وقائمتها المحفوظة (HIGH-05)
* **الموقع والملفات:**
  - `src/services/savedBooksService.js`
  - `src/hooks/useSavedBooks.js`
  - `src/pages/SavedBooks.jsx`
  - `src/pages/BookDetail.jsx`
  - `src/pages/Library.jsx`
* **السبب الجذري (Root Cause):**
  - اعتماد خدمة الحفظ فقط على استعلام Supabase لجدول `saved_books` الذي قد لا يحتوي سياسات RLS كاملة أو يتأخر في التزامن اللحظي، وعدم وجود طبقة تخزين محلي احتياطية (Dual-Storage Fallback).
  - وجود عدم تطابق بين `book.id` كـ `string` أو `number` في فحص `savedBookIds.has(book.id)`.
* **خطوات التنفيذ البرمجية:**
  1. تحديث `savedBooksService.js`:
     - إضافة تخزين محلي متزامن فوري `pia_saved_books` في `localStorage` بجانب محاولة المزامنة مع جدول `saved_books` في Supabase.
     - توحيد معرفات الكتب كـ نصوص `String(book.id)`.
     - دعم العمل بدون انقطاع (Graceful Fallback) بحيث تعمل ميزة الحفظ والإلغاء والعد 100% حتى لو كان الاتصال ضعيفاً أو الجدول مقيداً.
  2. تحديث `useSavedBooks.js`:
     - قراءة البيانات فورياً من التخزين المحلي أولاً، ثم المزامنة عبر Supabase.
     - التأكد من فحص `savedBookIds.has(String(bookId))` لمطابقة كافة أنواع المعرفات (UUIDs والأرقام).
  3. تحديث `SavedBooks.jsx`:
     - قراءة بطاقات الكتب من `savedList` والتأكد من عرض أسماء الكتب وتصنيفاتها وأزرار الإزالة الفورية.
* **طريقة التحقق:**
  - الدخول إلى صفحة تفاصيل كتاب `/library/:id` أو المكتبة والضغط على زر "حفظ الكتاب".
  - التأكد من تحول الزر إلى "محفوظ في حسابك" فوراً.
  - الانتقال إلى `/student-dashboard/saved-books` والتحقق من ظهور الكتاب المحفوظ بدون إفراغ القائمة.

---

### المهمة 1.4: منع التقييمات الفارغة ومراجعات 0 نجوم في الكتب (HIGH-06)
* **الموقع والملفات:**
  - `src/components/ReviewSection.jsx`
  - `src/services/reviewService.js`
* **السبب الجذري (Root Cause):**
  - دالة `handleSubmit` في `ReviewSection.jsx` لا تتحقق من أن `rating >= 1` وأن التعليق `comment.trim().length >= 3`، وتقبل إرسال حقول فارغة وتدرجها في قاعدة البيانات.
* **خطوات التنفيذ البرمجية:**
  1. إضافة حالة خطأ التحقق `formError` في `ReviewSection.jsx`:
     ```javascript
     if (!rating || rating < 1) {
       setFormError(isRtl ? 'يرجى اختيار عدد النجوم للتقييم (نجمة واحدة على الأقل)' : 'Please select a star rating (at least 1 star)');
       return;
     }
     if (!comment.trim() || comment.trim().length < 3) {
       setFormError(isRtl ? 'يرجى كتابة تعليق توضيحي حول رأيك (3 أحرف على الأقل)' : 'Please provide a written review (at least 3 characters)');
       return;
     }
     ```
  2. إضافة رسالة تنبيه حمراء واضحة داخل النموذج عند وجود خطأ.
  3. في `reviewService.js`: التأكد برمجياً من عدم قبول أي تقييم يكون فيه `rating < 1` أو `comment.trim() === ''`.
* **طريقة التحقق:**
  - محاولة إرسال تقييم بدون تحديد نجوم أو بنص فارغ -> ظهور التنبيه ومنع الإرسال.
  - إدخال تقييم صحيح (مثلاً 5 نجوم وتعليق "كتاب ممتاز ومفيد") -> الإرسال بنجاح وإدراجه في القائمة فوراً.

---

## 🟠 المرحلة 2: معالجة الأخطاء متوسطة الخطورة (Medium Severity Defects)

### المهمة 2.1: إصلاح ظهور "Invalid Date" في تكليفات الطلاب والمدرب (MEDIUM-01)
* **الموقع والملفات:**
  - `src/pages/ManageAssignments.jsx`
  - `src/pages/StudentAssignments.jsx`
* **السبب الجذري (Root Cause):**
  - في `ManageAssignments.jsx` السطر 50، دالة `formatDueDate` تقوم بـ `dateStr.split('-')`. إذا كان التاريخ مخزناً بالفعل بصيغة منسقة سابقة (مثل "15 سبتمبر 2026") أو كان ISO Timestamp، فإن ناتج التقسيم يعطي `NaN`، وينتج عن `new Date(NaN)` كائن `Invalid Date` وتخرج الدالة كلمة `"Invalid Date"`.
  - في `StudentAssignments.jsx` السطر 73، يتم استدعاء `new Date(a.due_date)` دون فحص مسبق أو معالجة الحقول البديلة (`dueDate`, `rawDueDate`).
* **خطوات التنفيذ البرمجية:**
  1. بناء دالة معالجة وتنسيق تواريخ آمنة (Robust Safe Date Formatter):
     ```javascript
     export function safeFormatDueDate(dateVal, isRtl) {
       if (!dateVal) return '—';
       if (typeof dateVal === 'string' && !dateVal.includes('Invalid') && (dateVal.includes('سبتمبر') || dateVal.includes('يناير') || dateVal.includes('/'))) {
         return dateVal;
       }
       try {
         if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
           const [y, m, d] = dateVal.split('-').map(Number);
           const dt = new Date(y, m - 1, d);
           if (!isNaN(dt.getTime())) {
             return dt.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
           }
         }
         const parsed = new Date(dateVal?.toDate ? dateVal.toDate() : dateVal);
         if (!isNaN(parsed.getTime())) {
           return parsed.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
         }
       } catch (e) {}
       return typeof dateVal === 'string' && !dateVal.includes('Invalid') ? dateVal : '—';
     }
     ```
  2. تطبيق هذه الدالة في `ManageAssignments.jsx` و `StudentAssignments.jsx`.
* **طريقة التحقق:**
  - مراجعة قائمة التكليفات للمدرب وقائمة الواجبات للطالب، والتأكد من ظهور كافة التواريخ بصيغة عربية صحيحة واختفاء نص `Invalid Date` نهائياً.

---

### المهمة 2.2: توحيد عداد أعضاء المجموعات وحل تضارب العدد (MEDIUM-02)
* **الموقع والملفات:**
  - `src/services/chatService.js`
  - `src/pages/ChatPage.jsx`
* **السبب الجذري (Root Cause):**
  - في `chatService.js` دالة `fetchChatMembers`: إذا كان هناك معرفات UIDs مسجلة داخل مصفوفة `chat.participants`، ولكن لم يتم العثور عليها في جدول `course_requests`، فإن الدالة كانت تتجاهلها ولا تضيفها إلى `membersMap`.
  - في `ChatPage.jsx`: رأس المحادثة يقرأ `activeChat.participants?.length` (الذي يساوي 1)، بينما نافذة تفاصيل المجموعة تقرأ `groupMembers.length` (الذي كان يُرجع 0)، مما يسبب التناقض "1 عضو" مقابل "الأعضاء (0)".
* **خطوات التنفيذ البرمجية:**
  1. في `fetchChatMembers` داخل `chatService.js`:
     - فحص كل معرف موجود في `chat.participants`؛ وإذا لم يكن موجوداً بعد في `membersMap`، يتم جلبه فوراً من جدول `profiles` أو إضافته كعضو أساسي بمعلوماته الافتراضية.
  2. في `ChatPage.jsx`:
     - توحيد الحساب بحيث يكون عدد الأعضاء متطابقاً في شريط البطاقة، أعلى المحادثة، ونافذة إعدادات المجموعة:
     ```javascript
     const effectiveMemberCount = Math.max(groupMembers.length, activeChat.participants?.length || 0, 1);
     ```
* **طريقة التحقق:**
  - فتح مجموعة دورة في `/conversations` ومقارنة العدد في أعلى المحادثة مع العدد داخل نافذة "معلومات وإعدادات المجموعة" والتأكد من تطابقهما التام.

---

### المهمة 2.3: تحسين التحقق البصري المباشر وتوسيع الأسئلة في منشئ الاختبارات (MEDIUM-03)
* **الموقع والملفات:**
  - `src/pages/ManageCourseExam.jsx`
* **السبب الجذري (Root Cause):**
  - في `handleSave`، عند وجود سؤال ناقص النص أو خيارات فارغة، يطلق الكود `alert()` فقط، دون أن يقوم بفك طي السؤال (`collapsedQuestions[qIndex] = false`)، ودون تلوين حواف السؤال بالأحمر أو التمرير التلقائي إليه (Auto-scroll).
* **خطوات التنفيذ البرمجية:**
  1. إضافة حالة لتسجيل أخطاء الحقول في الأسئلة `questionErrors: { [qIndex]: { text: true, options: [0, 2] } }`.
  2. عند الضغط على "حفظ الاختبار" واكتشاف سؤال ناقص:
     - فك طي السؤال المعيب فوراً:
     ```javascript
     setCollapsedQuestions(prev => ({ ...prev, [i]: false }));
     ```
     - تعيين الخطأ وتطبيق كلاسات التحذير البصري: إطار أحمر `border-rose-500 ring-2 ring-rose-500/20` على بطاقة السؤال والحقل الناقص.
     - التمرير السلس إلى موضع السؤال المعيب:
     ```javascript
     document.getElementById(`exam-question-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
     ```
* **طريقة التحقق:**
  - إنشاء 3 أسئلة، طي السؤال الثاني مع ترك خيار فارغ فيه، ثم الضغط على "حفظ".
  - التأكد من فتح السؤال الثاني تلقائياً، وظهور إطار أحمر على الخيار الفارغ، وتمرير الشاشة إليه مباشرة.

---

### المهمة 2.4: إضافة قيود الإدخال والتحقق المسبق في نموذج تعديل الدورة (MEDIUM-04)
* **الموقع والملفات:**
  - `src/pages/EditCourse.jsx`
* **السبب الجذري (Root Cause):**
  - حقول مثل عدد المحاضرات وروابط الدروس تقبل أرقاماً سالبة وروابط غير صالحة لغياب قيود HTML5 والتحقق البرمجي التعبيري (Regex).
* **خطوات التنفيذ البرمجية:**
  1. ضبط سمات HTML لحقول الأرقام: `min="1"`, `step="1"`, ومنع إدخال إشارات السالب.
  2. في دالة `validateEditCourseForm`:
     - فحص أن عدد المحاضرات أكبر من صفر `Number(lecturesCount) > 0`.
     - فحص روابط الدروس غير الفارغة بواسطة تعبير منتظم للروابط (URL Regex):
     ```javascript
     const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
     ```
     - في حال وجود رابط غير صالح، إظهار رسالة خطأ حمراء تحت الحقل المعين ومنع حفظ الدورة.
* **طريقة التحقق:**
  - محاولة إدخال `-5` في عدد المحاضرات أو كتابة نص عادي في رابط الدرس، والتأكد من رفض النموذج وظهور رسائل خطأ واضحة.

---

## 🟡 المرحلة 3: الملاحظات المنخفضة وتجربة المستخدم (Low / UX Flaws)

### المهمة 3.1: دعم ترجمة أسماء الدورات التجريبية بين العربية والإنجليزية (LOW-01)
* **الموقع والملفات:**
  - `src/context/CoursesContext.jsx`
* **السبب الجذري (Root Cause):**
  - في `CoursesContext.jsx`، دالة التحويل `courses.map` تطبق قاموس الترجمة البديل فقط عند التبديل للإنجليزية `lang === 'en'`، ولكن إذا كانت الدورة مسجلة بعنوان إنجليزي في الأصل ("Introduction to React")، فإنها تظل بالإنجليزية حتى في الواجهة العربية لغياب قاموس المعاكسة.
* **خطوات التنفيذ البرمجية:**
  1. تزويد `CoursesContext.jsx` بقاموس ترجمة ثنائي الاتجاه يشمل العناوين الشائعة والمصطلحات.
  2. دعم قراءة `course.title_ar` أو الترجمة العربية عند كون `lang === 'ar'`.
* **طريقة التحقق:**
  - التبديل بين اللغتين في صفحة الدورات والتأكد من اتساق العناوين دون ظهور نصوص إنجليزية شاذة في الواجهة العربية.

---

### المهمة 3.2: منع تسرب نصوص رموز الأيقونات كنصوص عادية (LOW-02)
* **الموقع والملفات:**
  - `src/index.css`
* **السبب الجذري (Root Cause):**
  - عند بطء تحميل الخطوط أو تأخر قراءة Ligatures، قد تظهر كلمات الرموز مثل `school` أو `person` كنصوص عادية قبل تفعيل الخط.
* **خطوات التنفيذ البرمجية:**
  1. تحديث قواعد CSS لفئة `.material-symbols-outlined` في `src/index.css`:
     - ضبط `font-variant-ligatures: normal`.
     - تطبيق إخفاء مشدد للنص الخام في حال عدم اكتمال تحميل الخط `html:not(.fonts-loaded) .material-symbols-outlined`:
     ```css
     html:not(.fonts-loaded) .material-symbols-outlined {
       color: transparent !important;
       text-indent: -9999px;
       overflow: hidden;
     }
     ```
* **طريقة التحقق:**
  - فحص العناوين وترويسات الجداول في وضع تقييد السرعة (Throttling / Slow 3G) والتأكد من عدم ظهور نصوص الرموز.

---

### المهمة 3.3: تنسيق تاريخ الانضمام وبيانات الملف الشخصي (LOW-03)
* **الموقع والملفات:**
  - `src/pages/instructor/InstructorProfile.jsx`
  - `src/pages/student/StudentProfile.jsx`
* **السبب الجذري (Root Cause):**
  - كود قراءة تاريخ الانضمام يبحث عن `userData?.createdAt` (صيغة كمل كيس)، بينما حقل التخزين في Supabase هو `created_at` (صيغة سنيك كيس) أو موجود في `currentUser?.created_at`.
* **خطوات التنفيذ البرمجية:**
  1. تحديث منطق استخراج التاريخ لدعم كافة الصيغ:
     ```javascript
     const rawJoined = userData?.created_at || userData?.createdAt || currentUser?.created_at;
     const joinedDate = rawJoined ? new Date(rawJoined).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
     ```
* **طريقة التحقق:**
  - فتح الملف الشخصي والتأكد من ظهور تاريخ الانضمام الفعلي للمدرب والطالب بدلاً من الشرطة `—`.

---

### المهمة 3.4: تنقية وإزالة الكتب التجريبية المكررة في المكتبة (LOW-04)
* **الموقع والملفات:**
  - `src/context/LibraryContext.jsx`
* **السبب الجذري (Root Cause):**
  - في `fetchBooks`، يتم دمج `remoteBooks` بالاعتماد على `rb.id` فقط دون فحص تكرار العنوان `existingTitles.has(titleKey)` على السجلات القادمة من قاعدة البيانات، مما يتسبب بتكرار الكتب إذا تم إدراجها مسبقاً بمعرفات مختلفة.
* **خطوات التنفيذ البرمجية:**
  1. في `fetchBooks`: تطبيق تنقية (Deduplication) على كتب `remoteBooks` بناءً على تطابق العنوان والمؤلف.
* **طريقة التحقق:**
  - فتح صفحة المكتبة العامة والتأكد من عدم تكرار أي كتاب في نفس التصنيف.

---

## 🏁 المرحلة 4: التحقق النهائي وبناء المشروع (Verification & Build)

1. **فحص سلامة البناء (Build Validation):**
   - تشغيل `npm run build` للتأكد من عدم وجود أي خطأ في تجميع المشروع وحزم Vite.
2. **فحص الروابط والـ Routes:**
   - التأكد من عدم وجود مسارات معطلة تؤدي لـ 403 أو 404.
3. **التوثيق والحفظ (Commit & Push):**
   - إعداد تقرير ختامي بالإصلاحات وعمل Commit موثق على Git.
