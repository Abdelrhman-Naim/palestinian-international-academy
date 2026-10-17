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
  // Library Categories
  'الأدب العربي': { ar: 'الأدب العربي', en: 'Arabic Literature' },
  'ادب عربي': { ar: 'الأدب العربي', en: 'Arabic Literature' },
  'arabic literature': { ar: 'الأدب العربي', en: 'Arabic Literature' },
  'الأدب العالمي': { ar: 'الأدب العالمي', en: 'World Literature' },
  'ادب عالمي': { ar: 'الأدب العالمي', en: 'World Literature' },
  'world literature': { ar: 'الأدب العالمي', en: 'World Literature' },
  'علوم إسلامية': { ar: 'علوم إسلامية', en: 'Islamic Studies' },
  'علوم اسلامية': { ar: 'علوم إسلامية', en: 'Islamic Studies' },
  'islamic studies': { ar: 'علوم إسلامية', en: 'Islamic Studies' },
  'islamic sciences': { ar: 'علوم إسلامية', en: 'Islamic Studies' },
  'كتب دينية': { ar: 'كتب دينية', en: 'Religious Books' },
  'religious books': { ar: 'كتب دينية', en: 'Religious Books' },
  'إقتصاد وأعمال': { ar: 'إقتصاد وأعمال', en: 'Economy & Business' },
  'اقتصاد وأعمال': { ar: 'إقتصاد وأعمال', en: 'Economy & Business' },
  'اقتصاد': { ar: 'إقتصاد وأعمال', en: 'Economy & Business' },
  'إقتصاد': { ar: 'إقتصاد وأعمال', en: 'Economy & Business' },
  'economy & business': { ar: 'إقتصاد وأعمال', en: 'Economy & Business' },
  'economics & business': { ar: 'إقتصاد وأعمال', en: 'Economy & Business' },
  'economics': { ar: 'إقتصاد وأعمال', en: 'Economy & Business' },
  'كتب منوعة': { ar: 'كتب منوعة', en: 'Miscellaneous Books' },
  'منوعة': { ar: 'كتب منوعة', en: 'Miscellaneous Books' },
  'miscellaneous books': { ar: 'كتب منوعة', en: 'Miscellaneous Books' },
  'miscellaneous': { ar: 'كتب منوعة', en: 'Miscellaneous Books' },
  'كتب سياسية': { ar: 'كتب سياسية', en: 'Political Books' },
  'سياسة': { ar: 'كتب سياسية', en: 'Political Books' },
  'political books': { ar: 'كتب سياسية', en: 'Political Books' },
  'politics': { ar: 'كتب سياسية', en: 'Political Books' },
  'قضايا فكرية': { ar: 'قضايا فكرية', en: 'Intellectual Issues' },
  'فكر': { ar: 'قضايا فكرية', en: 'Intellectual Issues' },
  'intellectual issues': { ar: 'قضايا فكرية', en: 'Intellectual Issues' },
  'تاريخ وجغرافيا': { ar: 'تاريخ وجغرافيا', en: 'History & Geography' },
  'تاريخ': { ar: 'تاريخ وجغرافيا', en: 'History & Geography' },
  'جغرافيا': { ar: 'تاريخ وجغرافيا', en: 'History & Geography' },
  'history & geography': { ar: 'تاريخ وجغرافيا', en: 'History & Geography' },
  'history and geography': { ar: 'تاريخ وجغرافيا', en: 'History & Geography' },
  'history': { ar: 'تاريخ وجغرافيا', en: 'History & Geography' },
  'العلوم والطبيعة': { ar: 'العلوم والطبيعة', en: 'Science & Nature' },
  'علوم وطبيعة': { ar: 'العلوم والطبيعة', en: 'Science & Nature' },
  'science & nature': { ar: 'العلوم والطبيعة', en: 'Science & Nature' },
  'science and nature': { ar: 'العلوم والطبيعة', en: 'Science & Nature' },
  'science': { ar: 'العلوم والطبيعة', en: 'Science & Nature' },
  'علم النفس': { ar: 'علم النفس', en: 'Psychology' },
  'psychology': { ar: 'علم النفس', en: 'Psychology' },
  'صحافة وإعلام': { ar: 'صحافة وإعلام', en: 'Journalism & Media' },
  'صحافة واعلام': { ar: 'صحافة وإعلام', en: 'Journalism & Media' },
  'إعلام': { ar: 'صحافة وإعلام', en: 'Journalism & Media' },
  'journalism & media': { ar: 'صحافة وإعلام', en: 'Journalism & Media' },
  'journalism and media': { ar: 'صحافة وإعلام', en: 'Journalism & Media' },
  'media': { ar: 'صحافة وإعلام', en: 'Journalism & Media' },
  'كتب الفلسفة': { ar: 'كتب الفلسفة', en: 'Philosophy Books' },
  'فلسفة': { ar: 'كتب الفلسفة', en: 'Philosophy Books' },
  'philosophy books': { ar: 'كتب الفلسفة', en: 'Philosophy Books' },
  'philosophy': { ar: 'كتب الفلسفة', en: 'Philosophy Books' },
  'كتب التنمية البشرية': { ar: 'كتب التنمية البشرية', en: 'Self-Development' },
  'تنمية بشرية': { ar: 'كتب التنمية البشرية', en: 'Self-Development' },
  'self-development': { ar: 'كتب التنمية البشرية', en: 'Self-Development' },
  'human development': { ar: 'كتب التنمية البشرية', en: 'Self-Development' },
  'بيوغرافيا ومذكرات': { ar: 'بيوغرافيا ومذكرات', en: 'Biography & Memoirs' },
  'سير ذاتية ومذكرات': { ar: 'بيوغرافيا ومذكرات', en: 'Biography & Memoirs' },
  'سير ذاتية': { ar: 'بيوغرافيا ومذكرات', en: 'Biography & Memoirs' },
  'biography & memoirs': { ar: 'بيوغرافيا ومذكرات', en: 'Biography & Memoirs' },
  'biography and memoirs': { ar: 'بيوغرافيا ومذكرات', en: 'Biography & Memoirs' },
  'biography': { ar: 'بيوغرافيا ومذكرات', en: 'Biography & Memoirs' },
  'علوم إجتماعية': { ar: 'علوم إجتماعية', en: 'Social Sciences' },
  'علوم اجتماعية': { ar: 'علوم إجتماعية', en: 'Social Sciences' },
  'social sciences': { ar: 'علوم إجتماعية', en: 'Social Sciences' },
  'كتب تعليم لغات': { ar: 'كتب تعليم لغات', en: 'Language Learning' },
  'تعليم لغات': { ar: 'كتب تعليم لغات', en: 'Language Learning' },
  'لغات': { ar: 'كتب تعليم لغات', en: 'Language Learning' },
  'language learning': { ar: 'كتب تعليم لغات', en: 'Language Learning' },
  'languages': { ar: 'كتب تعليم لغات', en: 'Language Learning' },
  'كتب علوم الهندسة': { ar: 'كتب علوم الهندسة', en: 'Engineering Sciences' },
  'علوم الهندسة': { ar: 'كتب علوم الهندسة', en: 'Engineering Sciences' },
  'engineering sciences': { ar: 'كتب علوم الهندسة', en: 'Engineering Sciences' },
  'engineering': { ar: 'كتب علوم الهندسة', en: 'Engineering Sciences' },
  'كتب تعليمية': { ar: 'كتب تعليمية', en: 'Educational Books' },
  'تعليم': { ar: 'كتب تعليمية', en: 'Educational Books' },
  'educational books': { ar: 'كتب تعليمية', en: 'Educational Books' },
  'education': { ar: 'كتب تعليمية', en: 'Educational Books' },
  'فنون': { ar: 'فنون', en: 'Arts' },
  'فن': { ar: 'فنون', en: 'Arts' },
  'arts': { ar: 'فنون', en: 'Arts' },
  'art': { ar: 'فنون', en: 'Arts' },
  'صحة وطب': { ar: 'صحة وطب', en: 'Health & Medicine' },
  'طب وصحة': { ar: 'صحة وطب', en: 'Health & Medicine' },
  'طب': { ar: 'صحة وطب', en: 'Health & Medicine' },
  'health & medicine': { ar: 'صحة وطب', en: 'Health & Medicine' },
  'health and medicine': { ar: 'صحة وطب', en: 'Health & Medicine' },
  'medicine': { ar: 'صحة وطب', en: 'Health & Medicine' },
  'قانون': { ar: 'قانون', en: 'Law' },
  'law': { ar: 'قانون', en: 'Law' },
  'كتب الخيال العلمي': { ar: 'كتب الخيال العلمي', en: 'Science Fiction' },
  'خيال علمي': { ar: 'كتب الخيال العلمي', en: 'Science Fiction' },
  'science fiction': { ar: 'كتب الخيال العلمي', en: 'Science Fiction' },
  'sci-fi': { ar: 'كتب الخيال العلمي', en: 'Science Fiction' },
  'مراجع': { ar: 'مراجع', en: 'References' },
  'references': { ar: 'مراجع', en: 'References' },
  'علوم عسكرية': { ar: 'علوم عسكرية', en: 'Military Sciences' },
  'military sciences': { ar: 'علوم عسكرية', en: 'Military Sciences' },
  'رياضة وتسالي': { ar: 'رياضة وتسالي', en: 'Sports & Entertainment' },
  'sports & entertainment': { ar: 'رياضة وتسالي', en: 'Sports & Entertainment' },
  'غرائب وأساطير': { ar: 'غرائب وأساطير', en: 'Curiosities & Legends' },
  'curiosities & legends': { ar: 'غرائب وأساطير', en: 'Curiosities & Legends' },
  'طبخ وطعام': { ar: 'طبخ وطعام', en: 'Cooking & Food' },
  'cooking & food': { ar: 'طبخ وطعام', en: 'Cooking & Food' },
  'كتب أطفال': { ar: 'كتب أطفال', en: "Children's Books" },
  "children's books": { ar: 'كتب أطفال', en: "Children's Books" },
  'علوم الحيوان': { ar: 'علوم الحيوان', en: 'Zoology & Animal Sciences' },
  'zoology & animal sciences': { ar: 'علوم الحيوان', en: 'Zoology & Animal Sciences' },
  'المرأة والعائلة': { ar: 'المرأة والعائلة', en: 'Women & Family' },
  'women & family': { ar: 'المرأة والعائلة', en: 'Women & Family' },
  'كتب طرائف و نوادر': { ar: 'كتب طرائف و نوادر', en: 'Anecdotes & Curiosities' },
  'كتب طرائف ونوادر': { ar: 'كتب طرائف و نوادر', en: 'Anecdotes & Curiosities' },
  'anecdotes & curiosities': { ar: 'كتب طرائف و نوادر', en: 'Anecdotes & Curiosities' },
  'سفر ورحلات': { ar: 'سفر ورحلات', en: 'Travel & Voyages' },
  'travel & voyages': { ar: 'سفر ورحلات', en: 'Travel & Voyages' },
  'سلاسل وموسوعات': { ar: 'سلاسل وموسوعات', en: 'Series & Encyclopedias' },
  'series & encyclopedias': { ar: 'سلاسل وموسوعات', en: 'Series & Encyclopedias' },
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
