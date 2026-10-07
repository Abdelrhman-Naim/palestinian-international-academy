# 📘 توثيق مشروع أكاديمية فلسطين الدولية (PIA) — الدليل الشامل وخريطة الملفات

> **آخر تحديث:** أكتوبر 2026  
> **التقنيات الأساسية:** Next.js 15.2 (App Router) · React 19 · Tailwind CSS v4 · Supabase (PostgreSQL & Auth & Storage) · Playwright E2E

---

## 🔑 حسابات تسجيل الدخول التجريبية (Test Accounts)

| الدور (Role) | البريد الإلكتروني (Email) | كلمة المرور (Password) | لوحة التحكم (Route) |
|---|---|---|---|
| **مدير النظام (Admin)** | `admin@gmail.com` | `Admin@2005` | `/admin-dashboard` أو `/login-admin` |
| **المدرب (Instructor)** | `anym46927@gmail.com` | `123123` | `/instructor-dashboard` أو `/login-trainer` |
| **الطالب (Student)** | `abood12.e.m@gmail.com` | `123123` | `/dashboard` أو `/login` |

---

## 🗺️ خريطة بنية المشروع والملفات (Comprehensive File Map)

تم تصميم المشروع وفق معمارية Next.js 15 App Router مع طبقة **Views** مستقلة لضمان سهولة الصيانة ونظافة الكود.

```
Project/
├── public/                     # الأصول الثابتة العامة (Static Public Assets)
├── src/
│   ├── app/                    # مسارات Next.js 15 (App Router Pages & Layouts)
│   ├── assets/                 # صور وأصول محلية مضغوطة بصيغة WebP
│   ├── components/             # المكونات العامة التفاعلية (UI Components)
│   │   ├── chat/               # مكونات الدردشة والمحادثة المباشرة
│   │   └── guards/             # حمايات المسارات والصلاحيات (Auth/Role Guards)
│   ├── context/                # سياقات إدارة الحالة المشتركة (React Context Providers)
│   ├── hooks/                  # الخطافات المخصصة (Custom React Hooks)
│   ├── i18n/                   # قواميس الترجمة الدولية (Arabic / English)
│   ├── lib/                    # مكتبات الربط والمطابقة (Router Compatibility Shim)
│   ├── services/               # خدمات استعلامات Supabase والعمليات الخلفية
│   ├── supabase/               # تهيئة عميل وقاعدة بيانات Supabase
│   ├── utils/                  # دوال المعالجة والمساعدة (Utils & Helpers)
│   └── views/                  # واجهات الصفحات الفعلية (Page Views & Sub-dashboards)
│       ├── admin/              # الشاشات الفرعية للوحة تحكم الأدمن
│       ├── instructor/         # الشاشات الفرعية للوحة تحكم المدرب
│       └── student/            # الشاشات الفرعية للوحة تحكم الطالب
└── tests/                      # حزمة اختبارات الفحص الشامل عبر Playwright E2E
```

---

### 1. مسارات Next.js (`src/app/`) — وظيفة كل مسار

| المسار (Path) | الملف (File) | الوظيفة ودور الملف (Purpose & Function) |
|---|---|---|
| `/` | `src/app/page.jsx` | مدخل الصفحة الرئيسية (Home Page) يستدعي `src/views/Home.jsx`. |
| — | `src/app/layout.jsx` | الغلاف الجذري للتطبيق (Root Layout): تحميل الخطوط (Alexandria/Cairo)، أيقونات Material Symbols، إعدادات SEO العامة، وتغليف التطبيق بـ `Providers`. |
| — | `src/app/globals.css` | ملف التنسيق العام بمحرك Tailwind CSS v4، تعريف لوحة الألوان الذهبية (`#d4af37`) والرمادي الدافئ، الوضع الداكن، وقواعد التنسيق الأساسية `@layer base`. |
| — | `src/app/providers.jsx` | تجميع موفري السياق (`Language`, `Auth`, `Toast`, `Courses`, `Library`, `Categories`, `Call`, `Maintenance`, `ErrorBoundary`). |
| — | `src/app/not-found.jsx` | شاشة الخطأ 404 المخصصة لروابط الصفحات غير الموجودة. |
| `/about` | `src/app/about/page.jsx` | صفحة "من نحن" ورؤية وأهداف الأكاديمية (`About.jsx`). |
| `/courses` | `src/app/courses/page.jsx` | صفحة تصفح وفلترة الدورات التدريبية المتاحة (`Courses.jsx`). |
| `/courses/[id]` | `src/app/courses/[id]/page.jsx` | صفحة تفاصيل الدورة، المحاضرات، التسجيل، والتقييمات (`CourseDetail.jsx`). |
| `/library` | `src/app/library/page.jsx` | صفحة المكتبة الرقمية وقراءة وتنزيل الكتب (`Library.jsx`). |
| `/library/[id]` | `src/app/library/[id]/page.jsx` | صفحة تفاصيل الكتاب وقراءته مباشرة بصيغة PDF (`BookDetail.jsx`). |
| `/login` | `src/app/login/page.jsx` | بوابة تسجيل الدخول المزدوجة للطلاب والمدربين (`Login.jsx`). |
| `/login-admin` | `src/app/login-admin/page.jsx` | بوابة تسجيل الدخول الخاصة بمدير النظام المشفرة (`AdminLogin.jsx`). |
| `/login-trainer` | `src/app/login-trainer/page.jsx` | رابط مباشر لتسجيل دخول المدربين بتبويب المدرب مفعل تلقائياً. |
| `/register` | `src/app/register/page.jsx` | صفحة إنشاء حساب أكاديمي جديد للطلاب أو المدربين (`Register.jsx`). |
| `/forgot-password`| `src/app/forgot-password/page.jsx`| صفحة استعادة كلمة المرور عبر رابط البريد الإلكتروني (`ForgotPassword.jsx`). |
| `/dashboard` | `src/app/dashboard/layout.jsx` & `page.jsx` | لوحة تحكم الطالب الرئيسية والإحصائيات وتتبع المسار (`Dashboard.jsx`). |
| `/dashboard/courses` | `src/app/dashboard/courses/page.jsx` | مساقات الطالب الملتحق بها حالياً. |
| `/dashboard/my-courses` | `src/app/dashboard/my-courses/page.jsx` | قائمة دوراتي المسجلة ومتابعة نسبة الإنجاز. |
| `/dashboard/browse-courses` | `src/app/dashboard/browse-courses/page.jsx` | استكشاف المزيد من الدورات من داخل لوحة الطالب. |
| `/dashboard/assignments` | `src/app/dashboard/assignments/page.jsx` | الواجبات والمهام المطلوبة من الطالب وحالة تسليمها. |
| `/dashboard/certificates` | `src/app/dashboard/certificates/page.jsx` | شهادات التخرج المعتمدة للطالب مع إمكانية التحميل والطباعة. |
| `/dashboard/profile` | `src/app/dashboard/profile/page.jsx` | تعديل الملف الشخصي، الاسم، كلمة المرور، ورفع الصورة الشخصية WebP. |
| `/dashboard/saved-books` | `src/app/dashboard/saved-books/page.jsx` | الكتب والمراجع المحفوظة في قائمة المفضلة للطالب. |
| `/dashboard/messages` | `src/app/dashboard/messages/page.jsx` | المحادثات والرسائل المباشرة مع المدربين والإدارة. |
| `/instructor-dashboard` | `src/app/instructor-dashboard/layout.jsx` & `page.jsx` | لوحة تحكم المدرب، الإحصائيات، الطلاب المشتركين (`InstructorDashboard.jsx`). |
| `/instructor-dashboard/my-courses` | `src/app/instructor-dashboard/my-courses/page.jsx` | إدارة الدورات التابعة للمدرب فقط. |
| `/instructor-dashboard/add-course` | `src/app/instructor-dashboard/add-course/page.jsx` | إنشاء دورة تدريبية جديدة وإضافة أهدافها ومحاضراتها. |
| `/instructor-dashboard/edit-course/[id]` | `.../edit-course/[id]/page.jsx` | تعديل محتوى دورة قائمة، إضافة فيديوهات وروابط محاضرات. |
| `/instructor-dashboard/assignments/[id]` | `.../assignments/[id]/page.jsx` | إنشاء وإدارة واجبات الطلاب الخاصة بدورة محددة. |
| `/instructor-dashboard/submissions/[id]` | `.../submissions/[id]/page.jsx` | مراجعة واجبات الطلاب المسلمة ورصد الدرجات والتقييم. |
| `/instructor-dashboard/exam/[id]` | `.../exam/[id]/page.jsx` | بناء وإدارة اختبار الدورة والأسئلة والاختيارات المتعددة. |
| `/instructor-dashboard/profile` | `.../profile/page.jsx` | تعديل بيانات المدرب، التخصص، والنبذة التعريفية. |
| `/admin-dashboard` | `src/app/admin-dashboard/layout.jsx` & `page.jsx` | لوحة تحكم المدير العام، الإحصائيات الشاملة، النشاطات (`AdminDashboard.jsx`). |
| `/admin-dashboard/requests` | `.../requests/page.jsx` | مراجعة واعتماد طلبات انضمام المدربين الجدد. |
| `/admin-dashboard/instructors` | `.../instructors/page.jsx` | إدارة حسابات المدربين، إيقاف، تفعيل، أو حذف حساباتهم. |
| `/admin-dashboard/users` | `.../users/page.jsx` | إدارة جميع طلاب المنصة وبياناتهم واشتراكاتهم. |
| `/admin-dashboard/courses` | `.../courses/page.jsx` | المراقبة الإدارية لكافة دورات المنصة واعتماد نشرها. |
| `/admin-dashboard/categories` | `.../categories/page.jsx` | إدارة وإضافة تصنيفات الدورات التدريبية وتعديلها. |
| `/admin-dashboard/library` | `.../library/page.jsx` | إدارة المكتبة، الكتب المتوفرة، والروابط الرقمية. |
| `/admin-dashboard/add-book` | `.../add-book/page.jsx` | رفع ونشر كتاب جديد في المكتبة الرقمية مع صورة الغلاف ورابط الـ PDF. |
| `/admin-dashboard/library-categories` | `.../library-categories/page.jsx` | إدارة تصنيفات كتب المكتبة الرقمية (أدب، علوم، هندسة...). |
| `/admin-dashboard/activity-logs` | `.../activity-logs/page.jsx` | سجل العمليات الأمنية والأنشطة الإدارية بالمنصة. |
| `/admin-dashboard/contact-messages` | `.../contact-messages/page.jsx` | استعراض والرد على رسائل "اتصل بنا" والدعم الفني. |
| `/admin-dashboard/settings` | `.../settings/page.jsx` | إعدادات المنصة، وضع الصيانة، ومفاتيح النظام. |
| `/admin-dashboard/profile` | `.../profile/page.jsx` | تعديل الملف الشخصي لمدير النظام ورفع صورة الآدمن. |
| `/chat` | `src/app/chat/page.jsx` | غرفة المحادثة الجماعية والتواصل الفوري (`ChatPage.jsx`). |
| `/virtual-lab` | `src/app/virtual-lab/page.jsx` | بيئة المختبر الافتراضي السحابي لتشغيل الأكواد والذكاء الاصطناعي (`VirtualLab.jsx`). |
| `/verify-certificate` | `src/app/verify-certificate/page.jsx` | بوابة التحقق العام من صحة الشهادات الصادرة عبر الرقم التسلسلي (`CertificateVerificationPage.jsx`). |
| `/partnerships` | `src/app/partnerships/page.jsx` | بوابة الشراكات مع المؤسسات والجامعات والشركات (`Partnerships.jsx`). |
| `/support` | `src/app/support/page.jsx` | مركز الدعم الفني، الأسئلة الشائعة، وفتح التذاكر (`SupportCenter.jsx`). |
| `/contact` | `src/app/contact/page.jsx` | نموذج الاتصال المباشر وفروع الأكاديمية (`ContactUs.jsx`). |
| `/privacy` | `src/app/privacy/page.jsx` | سياسة الخصوصية وحماية بيانات المستخدمين (`PrivacyPolicy.jsx`). |
| `/terms` | `src/app/terms/page.jsx` | الشروط والأحكام الأكاديمية والقانونية (`TermsOfService.jsx`). |

---

### 2. واجهات الصفحات (`src/views/`) — وظيفة كل ملف

* **الصفحات العامة (Public Views):**
  * `Home.jsx`: واجهة الهبوط الرئيسية مع بانر البطل، الدورات الشائعة، المكتبة، والشركاء.
  * `About.jsx`: من نحن، قصة الأكاديمية، الرؤية والرسالة.
  * `Courses.jsx`: كروت الدورات، الفلترة حسب السعر، المستوى، والتصنيف.
  * `CourseDetail.jsx`: معلومات الدورة الشاملة، المنهاج، المدرب، والتسجيل.
  * `Library.jsx`: المكتبة الرقمية، تصنيف الكتب، والبحث السريع.
  * `BookDetail.jsx`: تفاصيل الكتاب ومعاينته وتنزيله أو حفظه للمفضلة.
  * `Login.jsx`: تسجيل دخول الطلاب والمدربين بتصميم جانبي متناسق (Dual-panel).
  * `AdminLogin.jsx`: واجهة تسجيل دخول خاصة ومحمية لمدير النظام.
  * `Register.jsx`: إنشاء حساب جديد مع اختيار الدور المناسب (طالب / مدرب).
  * `ForgotPassword.jsx`: نموذج استعادة الحساب وكلمة المرور عبر البريد.
  * `Partnerships.jsx`: صفحة طلبات الشراكة للمؤسسات.
  * `VirtualLab.jsx`: بيئة المحاكاة التفاعلية السحابية.
  * `VerifyCertificate.jsx`: فحص صحة الشهادات الصادرة بالباركود والكود التسلسلي.
  * `SupportCenter.jsx`: مركز المساعدة وحل المشكلات الفنية.
  * `ContactUs.jsx`: صفحة التواصل وتفاصيل الاتصال.
  * `PrivacyPolicy.jsx` & `TermsOfService.jsx`: بنود الخصوصية والشروط الأكاديمية.
  * `NotFound.jsx`: واجهة 404 التفاعلية للروابط غير الصحيحة.

* **شاشات لوحة تحكم الطالب (`src/views/` + `student/`):**
  * `Dashboard.jsx`: الهيكل الأساسي للوحة الطالب والـ Sidebar.
  * `StudentOverview.jsx`: ملخص التقدم، طاقة اليوم (Streak)، وآخر الكورسات.
  * `StudentMyCourses.jsx`: الكورسات المسجلة مع شريط الإنجاز.
  * `StudentAssignments.jsx`: الواجبات المدرسية ورفع الحلول.
  * `SavedBooks.jsx`: المراجع والكتب المحفوظة للمراجعة السريعة.
  * `student/StudentCertificates.jsx`: عرض الشهادات وإصدار الشهادة الرقمية.
  * `student/StudentProfile.jsx`: إدارة الحساب، تعديل البيانات، ورفع الأفاتار بصيغة WebP.

* **شاشات لوحة تحكم المدرب (`src/views/` + `instructor/`):**
  * `InstructorDashboard.jsx`: هيكل لوحة المدرب والقائمة الجانبية وإشعاراته.
  * `InstructorOverview.jsx`: إحصائيات الطلاب المسجلين بالدورات وتقييمات المدرب.
  * `MyCourses.jsx`: قائمة الدورات التي يقدمها المدرب.
  * `add-courses.jsx`: نموذج إضافة كورس جديد متعدد المراحل والمحاضرات.
  * `EditCourse.jsx`: تعديل فيديوهات ومحتوى دورة موجودة.
  * `ManageCourseExam.jsx`: وضع أسئلة الاختبار النهائي للدورة وتحديد درجات النجاح.
  * `ManageAssignments.jsx` & `SubmittedAssignments.jsx`: طرح واجبات وتصحيح حلول الطلاب.
  * `instructor/InstructorProfile.jsx`: الملف الشخصي للمدرب والسيرة الذاتية والصورة الشخصية.

* **شاشات لوحة تحكم الأدمن (`src/views/admin/`):**
  * `AdminDashboard.jsx`: غلاف لوحة تحكم الإدارة والقوائم الجانبية المتقدمة.
  * `AdminOverview.jsx`: إحصائيات المنصة الكلية، عدد الطلاب، المدربين، الدورات، والنشاط الأخير.
  * `AdminRequests.jsx`: دراسة وقبول/رفض طلبات انضمام المدربين الجدد.
  * `AdminInstructors.jsx`: قائمة المدربين المعتمدين مع صلاحية الحذف والإيقاف.
  * `AdminUsers.jsx`: إدارة كافة حسابات الطلاب والبحث فيهم.
  * `AdminCourses.jsx` & `AdminCourseStudents.jsx`: إدارة وتدقيق ونشر الدورات واستعراض الملتحقين بكل دورة.
  * `AdminCategories.jsx`: إضافة وتعديل وحذف تصنيفات الدورات التدريبية.
  * `AdminLibrary.jsx` & `AdminAddBook.jsx`: إدارة الكتب وإضافة كتب جديدة مع ملفات الـ PDF.
  * `AdminLibraryCategories.jsx`: إدارة أقسام وتصنيفات المكتبة الرقمية الـ 32+ قسماً.
  * `AdminSettings.jsx`: إعدادات النظام العامة ونمط الصيانة.
  * `AdminActivityLogs.jsx`: سجل تحركات وعمليات النظام للأمان.
  * `AdminContactMessages.jsx`: إدارة الرسائل الواردة من صفحة اتصل بنا.
  * `AdminProfile.jsx`: ملف مدير النظام وتغيير الصورة وكلمة المرور.

---

### 3. المكونات المشتركة (`src/components/`)

* `Navbar.jsx`: شريط التنقل العلوي المتجاوب، يدعم تبديل الوضع الليلي، اللغة (عربي/إنجليزي)، روابط الصفحات، وأيقونة الملف الشخصي والأفاتار البديل الذكي.
* `Footer.jsx`: تذييل الصفحة، روابط الوصول السريع، معلومات الاتصال، الشعار، وحقوق الملكية.
* `Hero.jsx`: بانر الصفحة الرئيسية التفاعلي والعبارات التسويقية الفخمة.
* `Features.jsx`: بطاقات مميزات المنصة والاعتمادات الرسمية.
* `PopularCourses.jsx`: عرض أهم الدورات وتقييماتها وجلبها من Supabase.
* `TopBooks.jsx`: استعراض أهم الكتب الرقمية والأكثر قراءة.
* `CloudLab.jsx`: قسم الترويج للمختبر الافتراضي السحابي.
* `PartnersTrust.jsx`: شعارات المؤسسات والجامعات الشريكة.
* `Testimonials.jsx`: آراء وتجارب خريجي الأكاديمية.
* `FAQ.jsx`: الأسئلة الشائعة بنظام الأكورديون السلس.
* `CTA.jsx`: بطاقة الدعوة للتسجيل الفوري في المنصة.
* `SEO.jsx`: إدارة وسوم الميتا تاجز والـ Schema.org لكل صفحة ديناميكياً.
* `CertificateModal.jsx`: نافذة معاينة وطباعة الشهادة الأكاديمية المعتمدة.
* `CustomSelect.jsx` & `CustomDatePicker.jsx`: حقول اختيار مخصصة متوافقة مع الثيم العاجي/الذهبي.
* `ErrorBoundary.jsx`: صائد الأخطاء التفاعلي لمنع انهيار الموقع وعرض رسالة ودية مع زر إعادة المحاولة.
* `OfflineBanner.jsx`: شريط تنبيه ذكي يظهر عند انقطاع الاتصال بالإنترنت لدى المستخدم.
* `chat/ChatWidget.jsx` & `CallModal.jsx`: ودجة الدردشة الفورية والاتصال المباشر.
* `guards/RoleGuards.jsx`: حماية الصفحات وتوجيه المستخدمين غير المصرح لهم فورياً.

---

### 4. إدارة الحالة والسياق (`src/context/`)

* `AuthContext.jsx`: إدارة جلسة المستخدم، تسجيل الدخول، تسجيل الخروج، فحص الصلاحيات، وحفظ الجلسة عبر Supabase Auth مع استرجاع ملف المستخدم وأدواره (`admin`, `instructor`, `student`).
* `LanguageContext.jsx`: إدارة التبديل الفوري بين اللغتين (العربية RTL والإنجليزية LTR)، وحفظ التفضيل، واسترجاع النصوص من قواميس `i18n`.
* `CoursesContext.jsx`: إدارة جلب وتخزين وفلترة الدورات التدريبية من قاعدة البيانات.
* `LibraryContext.jsx`: إدارة جلب والبحث في كتب المكتبة الرقمية والكتب المحفوظة.
* `CategoriesContext.jsx`: إدارة التصنيفات المعتمدة للكورسات والكتب وتحديثها ديناميكياً.
* `ToastContext.jsx`: إظهار الإشعارات العائمة التنبيهية (نجاح، خطأ، تحذير) بأناقة.
* `CallContext.jsx`: إدارة الاتصالات والمكالمات الفورية عبر WebRTC/Realtime.
* `MaintenanceContext.jsx`: إدارة وضع الصيانة وإغلاق المنصة للترقيات عند تفعيله من الأدمن.

---

### 5. الخدمات وقاعدة البيانات (`src/services/` & `src/supabase/`)

* `src/supabase/client.js`: تهيئة عميل Supabase الرسمي عبر متغيرات البيئة (`NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
* `src/supabase/db.js`: توابع الاستعلامات المباشرة لجدول المستخدمين والدورات والكتب والواجبات.
* `src/services/chatService.js`: خدمة إرسال واستقبال المحادثات الفورية وتحديث الرسائل غير المقروءة.
* `src/services/examService.js`: خدمة حفظ الاختبارات، رصد درجات الطلاب، وتصحيح الإجابات.
* `src/services/certificateService.js`: خدمة إصدار الشهادات الرقمية وتوليد الأرقام التسلسلية الموثقة.
* `src/services/savedBooksService.js`: خدمة حفظ وإزالة الكتب من مفضلة الطالب.
* `src/services/reviewService.js`: خدمة إضافة تقييمات الدورات واحتساب النجوم.

---

### 6. الأدوات المساعدة والمكتبات (`src/utils/` & `src/lib/`)

* `src/lib/router-compat.jsx`: **محول التوافقية (Compatibility Layer)** الذي يحول توابع `react-router-dom` (`Link`, `useNavigate`, `useLocation`, `useParams`) لتعمل بسلاسة تامة مع محرك Next.js 15 (`next/navigation`).
* `src/utils/imageUtils.js`: معالجة وضغط وتصدير الصور إلى صيغة **WebP** خفيفة (أقل من 25KB) عبر HTML5 Canvas قبل رفعها لسيرفر Supabase Storage.
* `src/utils/safeStorage.js`: غلاف آمن لقراءة وكتابة `localStorage` يتفادى أي انهيار في بيئات SSR.
* `src/utils/sanitize.js`: تنظيف وتطهير مدخلات النصوص لحماية المنصة من ثغرات XSS.
* `src/utils/translate.js`: دوال ترجمة المفاتيح والنصوص ديناميكياً.
* `src/hooks/useDarkMode.js`: هوك متوافق تماماً مع الـ SSR يمنع أي Hydration Mismatch ويتحكم في تشغيل وتبديل الوضع الداكن والنهاري في المتصفح.

---

## 🚀 سجل المراحل والتعديلات الجذرية المنجزة (Change History)

### 1. التحويل الكامل من Vite/React إلى Next.js 15 (App Router)
* نقل هيكلية الصفحات بالكامل إلى `src/app/` بنظام المجلدات والمسارات الديناميكية (`[id]`, `[courseId]`).
* إنشاء طبقة التوافقية [router-compat.jsx](file:///c:/Users/Abood/Desktop/Project/src/lib/router-compat.jsx) لربط المكونات القديمة مع `next/navigation` بدون كسر أي كود.
* إعداد [next.config.mjs](file:///c:/Users/Abood/Desktop/Project/next.config.mjs) لدعم الـ Aliases (`@/pages`, `@/views`) ودعم نطاقات الصور الخارجية.
* توليد بناء إنتاج ثابت (Static Site Generation) شمل **54 مساراً وصفحة** بنجاح 100%.

### 2. نظام الهوية البصرية (Ivory & Gold Luxury Design System)
* اعتماد خلفية العاج الفخمة (`#FCFBF8` و `#F6F4ED`) للصفحات العامة، وبطاقات بيضاء ناصعة وظلال ذهبية ناعمة.
* تطبيق الثيم الذهبي الملكي (`#d4af37`) عبر تعريفات Tailwind CSS v4 الحديثة.
* وضع ليلي فاخر (`#12100e` مع درجات الزنك والحجر الداكن).

### 3. دعم وتكامل اللغات العالمية (i18n)
* تفعيل التبديل الفوري بين العربية (RTL) والإنجليزية (LTR) بنقرة زر واحدة.
* قواميس ترجمة شاملة في `src/i18n/ar.json` و `src/i18n/en.json`.
* تحديث اتجاه النصوص والخطوط تلقائياً (خط Alexandria للعربية و Hanken Grotesk للإنجليزية).

### 4. معمارية تحسين الصور وضغط WebP الشامل (Next.js Image Optimization)
* تحويل أصول المشروع الثابتة إلى صيغة WebP:
  * شعار الأكاديمية: من 1.55 ميجابايت إلى **82 كيلوبايت** (توفير 95%).
  * صورة المعاينة `screen.webp`: من 674 كيلوبايت إلى **72 كيلوبايت** (توفير 89%).
  * صورة البانر `hero.webp`: بحجم **27 كيلوبايت**.
  * ضغط أيقونات PWA (`icon-512.png` إلى 91KB و `icon-192.png` إلى 20KB).
* حل مشكلة كائنات Next.js المستوردة (`[object Object]`) عبر صمام الأمان `logo?.src || logo`.
* تحويل رفع الأفاتار الشخصي إلى `.webp` تلقائياً عبر Canvas بحجم أقل من 25KB، وإصلاح صيغة روابط Supabase بتضمين مقطع `/public/`.
* بناء أفاتار بديل ذكي ومرن (Initials Avatar) يمنع ظهور أي إطارات صور مكسورة في شاشات المنصة.

### 5. إصلاحات الـ UI والـ Hydration والكونسول
* **صفحة تسجيل الدخول (`Login.jsx` & `Register.jsx`):**
  * حل مشكلة الـ Layout المكسور بحصر وسم `main` في `globals.css` داخل `@layer base` وإعادة هيكلة الحاوية لتكون `max-w-5xl flex-col lg:flex-row min-h-[620px]` لعرض البانر ونموذج الدخول جنباً إلى جنب بشكل أفقي متناسق.
* **خط الروابط بالهيدر (`Navbar.jsx`):**
  * تصحيح كلاس التوسيط إلى `left-1/2 -translate-x-1/2` لإلغاء الإزاحة المعكوسة في الـ RTL وتحقيق توسيط هندسي بنسبة 100% تحت الروابط.
* **استعادة ظهور أيقونات الموقع (`Material Symbols Outlined`):**
  * إزالة القاعدة القديمة التي كانت تفرض `font-size: 0 !important; color: transparent !important;` على الأيقونات، وإضافة تحميل مسبق `preload` لملف الخط المحلي في `layout.jsx`.
* **معالجة خطأ Hydration Mismatch للأزرار:**
  * ضبط الحالة المبدئية في `useDarkMode.js` و `LanguageContext.jsx` لتتطابق تماماً بين السيرفر والعميل، وتأجيل قراءة تفضيلات المتصفح إلى ما بعد الـ Mount في `useEffect`، مع إضافة `suppressHydrationWarning`.
* **منع أخطاء 404:**
  * توفير نسخة `public/manifest.json` لمنع أخطاء طلبات المتصفحات وإضافاتها.

---

## 🧪 أدوات الاختبار والتشغيل (Commands)

```bash
# تشغيل خادم التطوير (Next.js Dev Server)
npm run dev

# بناء نسخة الإنتاج والتحقق من المسارات (Build Production)
npm run build

# تشغيل خادم الإنتاج السريع (Start Production Server)
npm run start

# تشغيل حزمة اختبارات Playwright الشاملة لجميع المسارات والمستخدمين
npx playwright test
```

---

## 📌 ملاحظات مرجعية للوكيل الذكي (AI Assistant Notes)
* عند إضافة صفحة جديدة: قم بإنشاء مجلد داخل `src/app/<route>/page.jsx` واستدعاء الواجهة من `src/views/<View>.jsx`.
* جميع استيرادات `react-router-dom` تعمل تلقائياً عبر Webpack Alias المربوط بـ `src/lib/router-compat.jsx`.
* للتحقق من سلامة الواجهة والصور: اختبر الملف عبر `npx playwright test tests/images-verification.spec.js`.
