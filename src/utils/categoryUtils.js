/**
 * Bilingual category and status dictionary & helper utilities.
 * Ensures consistent Arabic & English display across Library, BookDetail, Courses, and Admin.
 */

const categoryMap = {
  'برمجة': { ar: 'برمجة', en: 'Programming' },
  'programming': { ar: 'برمجة', en: 'Programming' },
  'كتب برمجية': { ar: 'كتب برمجية', en: 'Programming Books' },
  'programming books': { ar: 'كتب برمجية', en: 'Programming Books' },
  'هندسة البرمجيات': { ar: 'هندسة البرمجيات', en: 'Software Engineering' },
  'software engineering': { ar: 'هندسة البرمجيات', en: 'Software Engineering' },
  'علوم الحاسوب': { ar: 'علوم الحاسوب', en: 'Computer Science' },
  'computer science': { ar: 'علوم الحاسوب', en: 'Computer Science' },
  'تصميم': { ar: 'تصميم', en: 'Design' },
  'design': { ar: 'تصميم', en: 'Design' },
  'تصميم واجهات المستخدم': { ar: 'تصميم واجهات المستخدم', en: 'UI/UX Design' },
  'ui/ux design': { ar: 'تصميم واجهات المستخدم', en: 'UI/UX Design' },
  'ui/ux': { ar: 'تصميم واجهات المستخدم', en: 'UI/UX Design' },
  'تصميم جرافيكي': { ar: 'تصميم جرافيكي', en: 'Graphic Design' },
  'graphic design': { ar: 'تصميم جرافيكي', en: 'Graphic Design' },
  'أمن سيبراني': { ar: 'أمن سيبراني', en: 'Cybersecurity' },
  'الأمن السيبراني': { ar: 'الأمن السيبراني', en: 'Cybersecurity' },
  'cybersecurity': { ar: 'أمن سيبراني', en: 'Cybersecurity' },
  'شبكات': { ar: 'شبكات', en: 'Networking' },
  'networking': { ar: 'شبكات', en: 'Networking' },
  'networks': { ar: 'شبكات', en: 'Networking' },
  'ذكاء اصطناعي': { ar: 'ذكاء اصطناعي', en: 'Artificial Intelligence' },
  'الذكاء الاصطناعي': { ar: 'الذكاء الاصطناعي', en: 'Artificial Intelligence' },
  'artificial intelligence': { ar: 'الذكاء الاصطناعي', en: 'Artificial Intelligence' },
  'ai': { ar: 'الذكاء الاصطناعي', en: 'Artificial Intelligence' },
  'تعلم الآلة': { ar: 'تعلم الآلة', en: 'Machine Learning' },
  'machine learning': { ar: 'تعلم الآلة', en: 'Machine Learning' },
  'علم البيانات': { ar: 'علم البيانات', en: 'Data Science' },
  'data science': { ar: 'علم البيانات', en: 'Data Science' },
  'قواعد بيانات': { ar: 'قواعد بيانات', en: 'Databases' },
  'قواعد البيانات': { ar: 'قواعد البيانات', en: 'Databases' },
  'databases': { ar: 'قواعد البيانات', en: 'Databases' },
  'database': { ar: 'قواعد البيانات', en: 'Databases' },
  'إدارة أعمال': { ar: 'إدارة أعمال', en: 'Business' },
  'إدارة الأعمال': { ar: 'إدارة الأعمال', en: 'Business Administration' },
  'business': { ar: 'إدارة أعمال', en: 'Business' },
  'business administration': { ar: 'إدارة الأعمال', en: 'Business Administration' },
  'إدارة': { ar: 'إدارة', en: 'Management' },
  'management': { ar: 'إدارة', en: 'Management' },
  'هندسة معمارية': { ar: 'هندسة معمارية', en: 'Architecture' },
  'عمارة': { ar: 'عمارة', en: 'Architecture' },
  'architecture': { ar: 'هندسة معمارية', en: 'Architecture' },
  'تطوير الويب': { ar: 'تطوير الويب', en: 'Web Development' },
  'web development': { ar: 'تطوير الويب', en: 'Web Development' },
  'تطوير الموبايل': { ar: 'تطوير الموبايل', en: 'Mobile Development' },
  'mobile development': { ar: 'تطوير الموبايل', en: 'Mobile Development' },
  'عام': { ar: 'عام', en: 'General' },
  'general': { ar: 'عام', en: 'General' },
  'أخرى': { ar: 'أخرى', en: 'Other' },
  'other': { ar: 'أخرى', en: 'Other' },
  'الكل': { ar: 'الكل', en: 'All' },
  'all': { ar: 'الكل', en: 'All' }
};

const statusMap = {
  'available': { ar: 'متاح للقراءة', en: 'Available for Reading' },
  'متاح': { ar: 'متاح للقراءة', en: 'Available for Reading' },
  'متاح للقراءة': { ar: 'متاح للقراءة', en: 'Available for Reading' },
  'reading': { ar: 'قيد القراءة', en: 'Currently Reading' },
  'قيد القراءة': { ar: 'قيد القراءة', en: 'Currently Reading' },
  'completed': { ar: 'مكتمل', en: 'Completed' },
  'مكتمل': { ar: 'مكتمل', en: 'Completed' },
  'saved': { ar: 'محفوظ', en: 'Saved' },
  'محفوظ': { ar: 'محفوظ', en: 'Saved' },
  'new': { ar: 'جديد', en: 'New' },
  'جديد': { ar: 'جديد', en: 'New' }
};

/**
 * Returns localized category name based on current language ('ar' or 'en')
 */
export function getLocalizedCategory(category, lang = 'ar') {
  if (!category) return lang === 'en' ? 'General' : 'عام';
  const trimmed = String(category).trim();
  const lower = trimmed.toLowerCase();

  const entry = categoryMap[lower] || categoryMap[trimmed];
  if (entry) {
    return lang === 'en' ? entry.en : entry.ar;
  }
  return trimmed;
}

/**
 * Returns localized book reading/availability status based on current language ('ar' or 'en')
 */
export function getLocalizedStatus(status, lang = 'ar') {
  if (!status) return lang === 'en' ? 'Available' : 'متاح';
  const trimmed = String(status).trim();
  const lower = trimmed.toLowerCase();

  const entry = statusMap[lower] || statusMap[trimmed];
  if (entry) {
    return lang === 'en' ? entry.en : entry.ar;
  }
  return trimmed;
}

/**
 * Canonical comparison helper to check whether a book/course belongs to a selected category,
 * agnostic of language or casing.
 */
export function matchesCategory(itemCategory, selectedFilter) {
  if (!selectedFilter || selectedFilter === 'All' || selectedFilter === 'الكل' || selectedFilter === '') {
    return true;
  }
  if (!itemCategory) return false;

  const itemNorm = String(itemCategory).trim().toLowerCase();
  const filterNorm = String(selectedFilter).trim().toLowerCase();

  if (itemNorm === filterNorm) return true;

  const itemEntry = categoryMap[itemNorm] || categoryMap[String(itemCategory).trim()];
  const filterEntry = categoryMap[filterNorm] || categoryMap[String(selectedFilter).trim()];

  if (itemEntry && filterEntry) {
    return itemEntry.ar === filterEntry.ar || itemEntry.en.toLowerCase() === filterEntry.en.toLowerCase();
  }

  if (itemEntry) {
    return itemEntry.ar.toLowerCase() === filterNorm || itemEntry.en.toLowerCase() === filterNorm;
  }

  if (filterEntry) {
    return filterEntry.ar.toLowerCase() === itemNorm || filterEntry.en.toLowerCase() === itemNorm;
  }

  return false;
}
