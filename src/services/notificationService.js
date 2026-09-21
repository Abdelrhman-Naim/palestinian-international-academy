import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Creates a single notification document in Firestore.
 */
export async function createNotification({
  recipientId,
  recipientRole = null,
  title,
  title_en = '',
  message,
  message_en = '',
  type = 'system', // 'lecture' | 'assignment' | 'course' | 'enrollment' | 'submission' | 'system' | 'exam'
  link = '',
  courseId = null,
  target_id = null,
  target_type = null,
  metadata = {}
}) {
  if (!recipientId) return null;

  try {
    const finalCourseId = courseId || target_id || metadata.courseId || metadata.target_id || null;
    const finalTargetType = target_type || type || metadata.target_type || null;

    const docRef = await addDoc(collection(db, 'notifications'), {
      recipientId,
      recipientRole,
      title: title || '',
      title_en: title_en || title || '',
      message: message || '',
      message_en: message_en || message || '',
      type,
      link: link || '',
      courseId: finalCourseId,
      target_id: target_id || finalCourseId,
      target_type: finalTargetType,
      metadata: metadata || {},
      isRead: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

/**
 * Notifies all students enrolled in a specific course.
 */
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
    const enrollmentsQ = query(
      collection(db, 'enrollments'),
      where('courseId', '==', courseId)
    );
    const snap = await getDocs(enrollmentsQ);
    if (snap.empty) return 0;

    const studentUids = Array.from(
      new Set(snap.docs.map(d => d.data().uid).filter(Boolean))
    );

    if (studentUids.length === 0) return 0;

    // Firestore batch limit is 500 ops
    const batches = [];
    let currentBatch = writeBatch(db);
    let countInBatch = 0;

    for (const uid of studentUids) {
      const notifRef = doc(collection(db, 'notifications'));
      currentBatch.set(notifRef, {
        recipientId: uid,
        recipientRole: 'student',
        title: title || '',
        title_en: title_en || title || '',
        message: message || '',
        message_en: message_en || message || '',
        type,
        link,
        courseId,
        metadata: metadata || {},
        isRead: false,
        createdAt: serverTimestamp(),
      });

      countInBatch++;
      if (countInBatch === 450) {
        batches.push(currentBatch.commit());
        currentBatch = writeBatch(db);
        countInBatch = 0;
      }
    }

    if (countInBatch > 0) {
      batches.push(currentBatch.commit());
    }

    await Promise.all(batches);
    return studentUids.length;
  } catch (err) {
    console.error('Failed to notify enrolled students:', err);
    return 0;
  }
}

/**
 * Helper to resolve an instructor's UID for a given course.
 */
export async function resolveInstructorUid(courseOrId) {
  let course = null;
  if (typeof courseOrId === 'string') {
    const snap = await getDoc(doc(db, 'courses', courseOrId));
    if (snap.exists()) {
      course = { id: snap.id, ...snap.data() };
    }
  } else if (courseOrId && typeof courseOrId === 'object') {
    course = courseOrId;
  }

  if (!course) return null;

  // Direct UID if available
  if (course.instructorId) return course.instructorId;
  if (course.instructorUid) return course.instructorUid;

  // If instructor name is given, search in users
  const instructorName = course.instructor;
  if (instructorName) {
    try {
      const uQuery = query(collection(db, 'users'), where('role', '==', 'instructor'));
      const uSnap = await getDocs(uQuery);
      const match = uSnap.docs.find(d => {
        const data = d.data();
        return (
          data.fullName === instructorName ||
          data.name === instructorName ||
          data.displayName === instructorName
        );
      });
      if (match) return match.id;
    } catch (err) {
      console.warn('Error resolving instructor UID by name:', err);
    }
  }

  return null;
}

/**
 * Notifies the instructor of a course.
 */
export async function notifyInstructor(courseOrId, {
  title,
  title_en = '',
  message,
  message_en = '',
  type = 'course',
  link = '/instructor-dashboard/my-courses',
  metadata = {}
}) {
  try {
    const instructorUid = await resolveInstructorUid(courseOrId);
    if (!instructorUid) return null;

    const courseId = typeof courseOrId === 'string' ? courseOrId : (courseOrId?.id || null);

    return await createNotification({
      recipientId: instructorUid,
      recipientRole: 'instructor',
      title,
      title_en,
      message,
      message_en,
      type,
      link,
      courseId,
      metadata
    });
  } catch (err) {
    console.error('Failed to notify instructor:', err);
    return null;
  }
}

/**
 * Notifies all admins on the platform.
 */
export async function notifyAdmins({
  title,
  title_en = '',
  message,
  message_en = '',
  type = 'system',
  link = '/admin-dashboard',
  courseId = null,
  metadata = {}
}) {
  try {
    const adminQ = query(collection(db, 'users'), where('role', '==', 'admin'));
    const adminSnap = await getDocs(adminQ);
    if (adminSnap.empty) return 0;

    const batch = writeBatch(db);
    adminSnap.docs.forEach(adminDoc => {
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        recipientId: adminDoc.id,
        recipientRole: 'admin',
        title: title || '',
        title_en: title_en || title || '',
        message: message || '',
        message_en: message_en || message || '',
        type,
        link,
        courseId: courseId || metadata.courseId || null,
        metadata: metadata || {},
        isRead: false,
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
    return adminSnap.size;
  } catch (err) {
    console.error('Failed to notify admins:', err);
    return 0;
  }
}

/**
 * Subscribes in real time to notifications for a specific user UID.
 * Sorts client-side by createdAt descending to avoid requiring composite indexes in Firestore.
 */
export function subscribeToUserNotifications(userId, callback) {
  if (!userId) {
    callback({ notifications: [], unreadCount: 0, loading: false });
    return () => {};
  }

  const notifQ = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId)
  );

  const unsubscribe = onSnapshot(
    notifQ,
    (snapshot) => {
      const items = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let timestampMillis = 0;
        if (data.createdAt?.toMillis) {
          timestampMillis = data.createdAt.toMillis();
        } else if (data.createdAt?.seconds) {
          timestampMillis = data.createdAt.seconds * 1000;
        } else if (data.createdAt instanceof Date) {
          timestampMillis = data.createdAt.getTime();
        }

        return {
          id: docSnap.id,
          ...data,
          _timestampMillis: timestampMillis,
        };
      });

      // Sort newest first
      items.sort((a, b) => b._timestampMillis - a._timestampMillis);

      const unreadCount = items.filter(n => !n.isRead).length;

      callback({
        notifications: items,
        unreadCount,
        loading: false
      });
    },
    (err) => {
      if (err.code !== 'permission-denied') {
        console.warn('Notifications snapshot error:', err);
      }
      callback({ notifications: [], unreadCount: 0, loading: false });
    }
  );

  return unsubscribe;
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(notificationId) {
  if (!notificationId) return;
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true,
      readAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
  }
}

/**
 * Marks all unread notifications for a user as read.
 */
export async function markAllNotificationsAsRead(userId) {
  if (!userId) return;
  try {
    const unreadQ = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('isRead', '==', false)
    );
    const snap = await getDocs(unreadQ);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      batch.update(doc(db, 'notifications', d.id), {
        isRead: true,
        readAt: serverTimestamp()
      });
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err);
  }
}

/**
 * Deletes a single notification.
 */
export async function deleteNotification(notificationId) {
  if (!notificationId) return;
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (err) {
    console.error('Failed to delete notification:', err);
  }
}

/**
 * Deletes all notifications for a user.
 */
export async function clearAllNotifications(userId) {
  if (!userId) return;
  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      batch.delete(doc(db, 'notifications', d.id));
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to clear notifications:', err);
  }
}
