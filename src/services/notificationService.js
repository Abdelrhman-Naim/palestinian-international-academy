import { supabase } from '../supabase/client';

// In-memory deduplication cache: key -> timestamp
const recentNotifCache = new Map();

// Periodic prune every 30 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, ts] of recentNotifCache.entries()) {
      if (now - ts > 60000) {
        recentNotifCache.delete(key);
      }
    }
  }, 30000);
}

export async function createNotification({
  recipientId,
  recipientRole = null,
  title,
  title_en = '',
  message,
  message_en = '',
  type = 'system',
  link = '',
  courseId = null,
  target_id = null,
  target_type = null,
  metadata = {}
}) {
  if (!recipientId) return null;

  try {
    const finalCourseId = courseId || target_id || metadata.courseId || metadata.target_id || null;
    const dedupKey = `${recipientId}:${title || ''}:${message || ''}:${finalCourseId || ''}`;
    const now = Date.now();

    // Prevent duplicate notification within 15-second window
    if (recentNotifCache.has(dedupKey) && now - recentNotifCache.get(dedupKey) < 15000) {
      return null;
    }
    recentNotifCache.set(dedupKey, now);

    const notifObj = {
      recipient_id: recipientId,
      recipient_role: recipientRole,
      title: title || '',
      title_en: title_en || title || '',
      message: message || '',
      message_en: message_en || message || '',
      type,
      link: link || '',
      is_read: false
    };

    if (finalCourseId) notifObj.course_id = finalCourseId;
    if (metadata && Object.keys(metadata).length > 0) notifObj.metadata = metadata;

    const { data, error } = await supabase
      .from('notifications')
      .insert([notifObj])
      .select('id')
      .single();

    if (error) {
      console.warn('Notification insert notice:', error.message);
      return null;
    }
    return data?.id;
  } catch (err) {
    console.warn('Failed to create notification catch:', err);
    return null;
  }
}

export async function notifyEnrolledStudents(courseId, {
  title,
  title_en = '',
  message,
  message_en = '',
  type = 'course',
  link = '/dashboard/my-courses',
  metadata = {}
}) {
  if (!courseId) return 0;

  try {
    const { data: requests } = await supabase
      .from('course_requests')
      .select('student_id')
      .eq('course_id', courseId)
      .eq('status', 'approved');

    if (!requests || requests.length === 0) return 0;

    const studentUids = Array.from(new Set(requests.map(r => r.student_id).filter(Boolean)));
    if (studentUids.length === 0) return 0;

    const notificationsToInsert = studentUids.map(uid => ({
      recipient_id: uid,
      recipient_role: 'student',
      title: title || '',
      title_en: title_en || title || '',
      message: message || '',
      message_en: message_en || message || '',
      type,
      link,
      course_id: courseId,
      metadata: metadata || {},
      is_read: false
    }));

    await supabase.from('notifications').insert(notificationsToInsert);
    return studentUids.length;
  } catch (err) {
    console.error('Failed to notify enrolled students:', err);
    return 0;
  }
}

export async function resolveInstructorUid(courseOrId) {
  let course = null;
  if (typeof courseOrId === 'string') {
    const { data } = await supabase.from('courses').select('*').eq('id', courseOrId).maybeSingle();
    course = data;
  } else if (courseOrId && typeof courseOrId === 'object') {
    course = courseOrId;
  }

  if (!course) return null;
  if (course.instructor_id) return course.instructor_id;
  return null;
}

export async function notifyInstructor(courseOrId, notifData) {
  try {
    const instructorUid = await resolveInstructorUid(courseOrId);
    if (!instructorUid) return null;

    const courseId = typeof courseOrId === 'string' ? courseOrId : (courseOrId?.id || null);

    return await createNotification({
      recipientId: instructorUid,
      recipientRole: 'instructor',
      ...notifData,
      courseId
    });
  } catch (err) {
    console.error('Failed to notify instructor:', err);
    return null;
  }
}

export async function notifyAdmins(notifData) {
  try {
    const dedupKey = `admins:${notifData.title || ''}:${notifData.message || ''}:${notifData.courseId || ''}`;
    const now = Date.now();
    if (recentNotifCache.has(dedupKey) && now - recentNotifCache.get(dedupKey) < 15000) {
      return 0;
    }
    recentNotifCache.set(dedupKey, now);

    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
    if (!admins || admins.length === 0) return 0;

    const notifs = admins.map(admin => ({
      recipient_id: admin.id,
      recipient_role: 'admin',
      title: notifData.title || '',
      title_en: notifData.title_en || notifData.title || '',
      message: notifData.message || '',
      message_en: notifData.message_en || notifData.message || '',
      type: notifData.type || 'system',
      link: notifData.link || '/admin-dashboard',
      course_id: notifData.courseId || null,
      metadata: notifData.metadata || {},
      is_read: false
    }));

    await supabase.from('notifications').insert(notifs);
    return admins.length;
  } catch (err) {
    console.error('Failed to notify admins:', err);
    return 0;
  }
}

export function subscribeToUserNotifications(userId, callback) {
  if (!userId) {
    callback({ notifications: [], unreadCount: 0, loading: false });
    return () => {};
  }

  const fetchNotifs = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        callback({ notifications: [], unreadCount: 0, loading: false });
        return;
      }

      const rawItems = (data || []).map(n => ({
        id: n.id,
        recipientId: n.recipient_id,
        recipientRole: n.recipient_role,
        title: n.title,
        title_en: n.title_en,
        message: n.message,
        message_en: n.message_en,
        type: n.type,
        link: n.link,
        courseId: n.course_id,
        isRead: n.is_read,
        createdAt: n.created_at,
        _timestampMillis: n.created_at ? new Date(n.created_at).getTime() : Date.now()
      }));

      // Aggregate identical notifications with repetition count (keep most recent timestamp)
      const groupedMap = new Map();
      for (const item of rawItems) {
        const titleKey = (item.title || '').trim().toLowerCase();
        const msgKey = (item.message || '').trim().toLowerCase();
        const key = `${titleKey}:${msgKey}:${item.courseId || ''}`;
        if (groupedMap.has(key)) {
          const existing = groupedMap.get(key);
          existing.count = (existing.count || 1) + 1;
          if (!item.isRead) existing.isRead = false;
        } else {
          groupedMap.set(key, { ...item, count: 1 });
        }
      }
      const items = Array.from(groupedMap.values());

      const unreadCount = items.filter(n => !n.isRead).length;

      callback({
        notifications: items,
        unreadCount,
        loading: false
      });
    } catch (e) {
      callback({ notifications: [], unreadCount: 0, loading: false });
    }
  };

  fetchNotifs();

  const channel = supabase
    .channel(`notifs_${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: `recipient_id=eq.${userId}`
    }, () => {
      fetchNotifs();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function markNotificationAsRead(notificationId) {
  if (!notificationId) return;
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
  }
}

export async function markAllNotificationsAsRead(userId) {
  if (!userId) return;
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', userId).eq('is_read', false);
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err);
  }
}

export async function deleteNotification(notificationId) {
  if (!notificationId) return;
  try {
    await supabase.from('notifications').delete().eq('id', notificationId);
  } catch (err) {
    console.error('Failed to delete notification:', err);
  }
}

export async function clearAllNotifications(userId) {
  if (!userId) return;
  try {
    await supabase.from('notifications').delete().eq('recipient_id', userId);
  } catch (err) {
    console.error('Failed to clear notifications:', err);
  }
}

export async function clearReadNotifications(userId) {
  if (!userId) return;
  try {
    await supabase.from('notifications').delete().eq('recipient_id', userId).eq('is_read', true);
  } catch (err) {
    console.error('Failed to clear read notifications:', err);
  }
}
