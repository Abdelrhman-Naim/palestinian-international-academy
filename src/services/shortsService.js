import { supabase } from '../supabase/client';

const STORAGE_KEY = 'pia_tech_shorts_v1';

// Default curated engineering and programming shorts
export const DEFAULT_SHORTS = [
  {
    id: 'short-1',
    title: 'مستقبل الذكاء الاصطناعي التوليدي في البرمجة والهندسة',
    description: 'نظرة سريعة على كيفية تحول وكلاء الذكاء الاصطناعي (AI Agents) لتغيير أسلوب بناء البرمجيات والأنظمة الهندسية الحديثة.',
    video_url: 'https://www.youtube.com/watch?v=aircAruvnKk',
    category: 'ذكاء اصطناعي',
    icon: 'smart_toy',
    created_at: new Date('2026-03-01').toISOString(),
  },
  {
    id: 'short-2',
    title: 'أهم ميزات معمارية Next.js والـ Server Components',
    description: 'كيف تعمل تقنيات التصيير الحديثة على تسريع تحميل صفحات الويب وتحسين أداء المواقع الضخمة بنسبة 70%.',
    video_url: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
    category: 'برمجة',
    icon: 'code',
    created_at: new Date('2026-03-02').toISOString(),
  },
  {
    id: 'short-3',
    title: 'نمذجة معلومات البناء (BIM) في المشاريع الهندسية الكبرى',
    description: 'كيف توفر تكنولوجيا BIM التنسيق المتكامل بين التخصصات المعمارية والإنشائية والكهربائية لمنع التعارضات الميدانية.',
    video_url: 'https://www.youtube.com/watch?v=suZf_DqKzfg',
    category: 'هندسة',
    icon: 'architecture',
    created_at: new Date('2026-03-03').toISOString(),
  },
  {
    id: 'short-4',
    title: 'أمن سلاسل التوريد البرمجية وتأمين خوادم السحاب',
    description: 'نصائح وإرشادات هندسية أساسية لحماية الحاويات وتطبيق سياسات الأمان الصارمة في خطوط الإنتاج السحابية.',
    video_url: 'https://www.youtube.com/watch?v=4b72j8V0_iM',
    category: 'أمن سيبراني',
    icon: 'shield',
    created_at: new Date('2026-03-04').toISOString(),
  },
];

const getLocalShorts = () => {
  if (typeof window === 'undefined') return DEFAULT_SHORTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SHORTS));
      return DEFAULT_SHORTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SHORTS;
  } catch (e) {
    return DEFAULT_SHORTS;
  }
};

const saveLocalShorts = (shorts) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shorts));
    window.dispatchEvent(new CustomEvent('pia:shorts-updated', { detail: shorts }));
  } catch (e) {
    console.warn('Could not save shorts to localStorage:', e);
  }
};

/**
 * Fetch all short videos from Supabase with graceful localStorage fallback
 */
export async function getShortVideos() {
  const localList = getLocalShorts();

  try {
    const { data, error } = await supabase
      .from('short_videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      saveLocalShorts(data);
      return data;
    }
  } catch (err) {
    console.warn('Supabase short_videos fetch error (using cached fallback):', err);
  }

  return localList;
}

/**
 * Add a new short video (Supabase + localStorage fallback)
 */
export async function addShortVideo({ title, description, video_url, category, icon }) {
  const newShort = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `short-${Date.now()}`,
    title: (title || '').trim(),
    description: (description || '').trim(),
    video_url: (video_url || '').trim(),
    category: (category || 'برمجة').trim(),
    icon: (icon || 'smart_display').trim(),
    created_at: new Date().toISOString(),
  };

  // 1. Update local cache immediately
  const current = getLocalShorts();
  const updated = [newShort, ...current];
  saveLocalShorts(updated);

  // 2. Persist to Supabase if available
  try {
    await supabase.from('short_videos').insert([newShort]);
  } catch (err) {
    console.warn('Supabase short_videos insert notice:', err);
  }

  return newShort;
}

/**
 * Update an existing short video
 */
export async function updateShortVideo(id, updates) {
  const current = getLocalShorts();
  const updated = current.map(item => item.id === id ? { ...item, ...updates } : item);
  saveLocalShorts(updated);

  try {
    await supabase
      .from('short_videos')
      .update(updates)
      .eq('id', id);
  } catch (err) {
    console.warn('Supabase short_videos update notice:', err);
  }

  return updated.find(item => item.id === id);
}

/**
 * Delete a short video
 */
export async function deleteShortVideo(id) {
  const current = getLocalShorts();
  const updated = current.filter(item => item.id !== id);
  saveLocalShorts(updated);

  try {
    await supabase
      .from('short_videos')
      .delete()
      .eq('id', id);
  } catch (err) {
    console.warn('Supabase short_videos delete notice:', err);
  }

  return true;
}

/**
 * Helper to convert various video URLs into an embeddable preview/player URL
 */
export function parseVideoEmbed(url) {
  if (!url) return { type: 'unknown', embedUrl: '' };
  const trimmed = url.trim();

  // 1. YouTube Shorts or standard YouTube video
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      videoId: ytMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
    };
  }

  // 2. Google Drive video preview
  const driveMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/i) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    return {
      type: 'drive',
      fileId: driveMatch[1],
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      thumbnailUrl: null,
    };
  }

  // 3. Direct HTML5 video (.mp4, .webm)
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmed)) {
    return {
      type: 'html5',
      embedUrl: trimmed,
      thumbnailUrl: null,
    };
  }

  return {
    type: 'generic',
    embedUrl: trimmed,
    thumbnailUrl: null,
  };
}
