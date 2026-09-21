import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot, 
  getDocs, 
  serverTimestamp, 
  arrayUnion,
  increment
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../firebase/config';

/**
 * Upload chat media (voice blobs, images, documents) to Firebase Storage
 * with instant Base64 for voice notes and automatic fallback for files.
 */
export async function uploadChatMedia(fileOrBlob, pathPrefix = 'chat_media') {
  if (!fileOrBlob) throw new Error('No file provided');

  const convertToDataUrl = () => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) resolve(reader.result);
        else reject(new Error('Empty result from FileReader'));
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBlob);
    });
  };

  // 1. Voice notes (<1.5MB audio blobs): convert to Base64 Data URL immediately (<10ms).
  // This guarantees instant sending without any storage timeouts or upload freezes.
  const isAudio = fileOrBlob.type?.includes('audio') || pathPrefix.includes('voice');
  if (isAudio && fileOrBlob.size < 1500000) {
    return await convertToDataUrl();
  }

  // 2. Images & files: Try uploadBytes with a strict 3.5s timeout, then fallback to Data URL.
  try {
    const ext = fileOrBlob.name 
      ? fileOrBlob.name.split('.').pop() 
      : (isAudio ? 'webm' : 'dat');
    const filename = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storageRef = ref(storage, filename);

    const uploadPromise = uploadBytes(storageRef, fileOrBlob).then(snap => getDownloadURL(snap.ref));
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Storage upload timed out')), 3500)
    );

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (storageErr) {
    console.warn('Firebase Storage upload failed or timed out, falling back to Data URL:', storageErr);
    return await convertToDataUrl();
  }
}

/**
 * Get or create a 1-to-1 direct conversation between two users (e.g. Admin & Instructor, or Student & Instructor).
 */
export async function getOrCreateDirectChat(user1, user2) {
  if (!user1?.uid || !user2?.uid) throw new Error('Both users must have valid UIDs');

  // Deterministic chatId so two users always map to the same conversation
  const chatId = [user1.uid, user2.uid].sort().join('_direct_');
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  const u1Name = user1.name || user1.fullName || user1.displayName || 'مستخدم';
  const u2Name = user2.name || user2.fullName || user2.displayName || 'مستخدم';

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      id: chatId,
      type: 'direct',
      participants: [user1.uid, user2.uid],
      participantDetails: {
        [user1.uid]: {
          name: u1Name,
          role: user1.role || 'user',
          photoURL: user1.photoURL || null
        },
        [user2.uid]: {
          name: u2Name,
          role: user2.role || 'user',
          photoURL: user2.photoURL || null
        }
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null
    });
  } else {
    // Update participant details if names changed or missing
    const currentData = chatSnap.data();
    const details = currentData.participantDetails || {};
    if (!details[user1.uid] || !details[user2.uid]) {
      await updateDoc(chatRef, {
        [`participantDetails.${user1.uid}`]: {
          name: u1Name,
          role: user1.role || 'user'
        },
        [`participantDetails.${user2.uid}`]: {
          name: u2Name,
          role: user2.role || 'user'
        },
        updatedAt: serverTimestamp()
      });
    }
  }

  return chatId;
}

/**
 * Create or open a group chat for a specific course.
 * Automatically adds the course instructor and all currently enrolled students.
 */
export async function createCourseGroupChat(course, instructorUser) {
  if (!course?.id) throw new Error('Course ID is required');

  const chatId = `course_group_${course.id}`;
  const chatRef = doc(db, 'chats', chatId);

  // Fetch all enrolled students for this course
  let studentUids = [];
  try {
    const enrollmentsQ = query(collection(db, 'enrollments'), where('courseId', '==', course.id));
    const enrollmentsSnap = await getDocs(enrollmentsQ);
    studentUids = enrollmentsSnap.docs.map(d => d.data().uid).filter(Boolean);
  } catch (err) {
    console.warn('Could not fetch enrollments for group creation:', err);
  }

  const instructorUid = instructorUser?.uid || course.instructorId || '';
  const allParticipants = Array.from(new Set([instructorUid, ...studentUids])).filter(Boolean);

  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    // If it already exists, ensure instructor and all current students are in participants
    await updateDoc(chatRef, {
      participants: arrayUnion(...allParticipants),
      updatedAt: serverTimestamp()
    });
  } else {
    // Create new group chat
    await setDoc(chatRef, {
      id: chatId,
      type: 'course_group',
      courseId: course.id,
      title: course.title || 'مجموعة الدورة',
      instructorId: instructorUid,
      instructorName: instructorUser?.name || instructorUser?.fullName || course.instructor || 'المدرب',
      participants: allParticipants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: {
        text: 'تم إنشاء مجموعة الدورة الرسمية. مرحباً بجميع الطلاب والمدربين!',
        senderName: 'النظام',
        senderRole: 'system',
        timestamp: new Date()
      }
    });

    // Add opening system message into subcollection
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: 'تم إنشاء مجموعة الدورة الرسمية. مرحباً بجميع الطلاب والمدربين!',
      senderId: 'system',
      senderName: 'النظام',
      senderRole: 'system',
      type: 'system',
      timestamp: serverTimestamp()
    });
  }

  return chatId;
}

/**
 * Auto-enroll newly registered student into the course group chat if it exists.
 */
export async function autoEnrollStudentInCourseGroup(courseId, studentUid) {
  if (!courseId || !studentUid) return;

  try {
    const chatId = `course_group_${courseId}`;
    const chatRef = doc(db, 'chats', chatId);
    const snap = await getDoc(chatRef);

    if (snap.exists()) {
      await updateDoc(chatRef, {
        participants: arrayUnion(studentUid),
        updatedAt: serverTimestamp()
      });
      console.log(`Student ${studentUid} auto-enrolled in group chat ${chatId}`);
    } else {
      // Check if course group exists under matching courseId
      const q = query(
        collection(db, 'chats'), 
        where('courseId', '==', courseId),
        where('type', '==', 'course_group')
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        await updateDoc(querySnap.docs[0].ref, {
          participants: arrayUnion(studentUid),
          updatedAt: serverTimestamp()
        });
      }
    }
  } catch (err) {
    console.error('Error auto-enrolling student in course group chat:', err);
  }
}

/**
 * Ensure all course groups for courses a student is enrolled in include this student.
 */
export async function syncEnrolledCourseChatsForStudent(studentUid) {
  if (!studentUid) return;
  try {
    const q = query(collection(db, 'enrollments'), where('uid', '==', studentUid));
    const snap = await getDocs(q);
    const courseIds = snap.docs.map(d => d.data().courseId).filter(Boolean);

    for (const courseId of courseIds) {
      await autoEnrollStudentInCourseGroup(courseId, studentUid);
    }
  } catch (err) {
    console.warn('Error syncing student enrolled course chats:', err);
  }
}

/**
 * Real-time subscription to chats that the user participates in.
 */
export function subscribeToUserChats(userId, onChatsUpdate) {
  if (!userId) return () => {};

  const q = query(
    collection(db, 'chats'), 
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort client-side by updatedAt descending
    chats.sort((a, b) => {
      const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : 0);
      const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : 0);
      return timeB - timeA;
    });

    onChatsUpdate(chats);
  }, (error) => {
    console.error('Error subscribing to user chats:', error);
  });
}

/**
 * Real-time subscription to messages inside an active chat.
 */
export function subscribeToMessages(chatId, onMessagesUpdate) {
  if (!chatId) return () => {};

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    onMessagesUpdate(messages);
  }, (error) => {
    console.error('Error subscribing to messages:', error);
  });
}

/**
 * Send a message inside a chat (supports text, voice, image, file, call-log).
 */
export async function sendMessage(chatId, senderId, senderName, senderRole, payload) {
  if (!chatId) return;

  // Normalize payload (supports string or object)
  const obj = (typeof payload === 'object' && payload !== null) ? payload : null;
  const messageType = obj ? (obj.type || 'text') : 'text';
  const messageText = obj ? (obj.text || '') : (payload || '').trim();

  if (!messageText && !obj?.mediaUrl && !obj?.fileUrl) return;

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const chatRef = doc(db, 'chats', chatId);

  const messageDoc = {
    senderId,
    senderName,
    senderRole: senderRole || 'user',
    type: messageType,
    text: messageText,
    timestamp: serverTimestamp(),
    readBy: [senderId],
    status: 'sent',
    ...(obj?.mediaUrl ? { mediaUrl: obj.mediaUrl } : {}),
    ...(obj?.fileName ? { fileName: obj.fileName } : {}),
    ...(obj?.fileSize ? { fileSize: obj.fileSize } : {}),
    ...(obj?.fileType ? { fileType: obj.fileType } : {}),
    ...(obj?.duration !== undefined && obj?.duration !== null ? { duration: Number(obj.duration) || 1 } : {}),
    ...(obj?.replyTo ? { replyTo: obj.replyTo } : {}),
    ...(obj?.mentions?.length ? { mentions: obj.mentions } : {}),
    ...(obj?.callDetails ? { callDetails: obj.callDetails } : {})
  };

  await addDoc(messagesRef, messageDoc);

  // Summary string for last message display
  let summary = messageText;
  if (messageType === 'voice') summary = '🎤 تسجيل صوتي';
  else if (messageType === 'image') summary = '📷 صورة';
  else if (messageType === 'file') summary = `📎 ملف: ${obj?.fileName || ''}`;
  else if (messageType === 'call') summary = `📞 ${messageText}`;

  // Read chat document to increment unread count for other participants
  const chatSnap = await getDoc(chatRef);
  const chatData = chatSnap.exists() ? chatSnap.data() : null;
  const participants = chatData?.participants || [];

  const updateData = {
    updatedAt: serverTimestamp(),
    lastMessage: {
      text: summary,
      senderId,
      senderName,
      senderRole: senderRole || 'user',
      timestamp: new Date()
    }
  };

  participants.forEach(pUid => {
    if (pUid !== senderId) {
      updateData[`unreadCounts.${pUid}`] = increment(1);
    }
  });

  await updateDoc(chatRef, updateData);
}

/**
 * Reset unread count for a user in a specific chat.
 */
export async function markChatAsRead(chatId, userId) {
  if (!chatId || !userId) return;
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`unreadCounts.${userId}`]: 0
    });
  } catch (err) {
    console.warn('Could not reset unread count in chat:', err);
  }
}

/**
 * Mark a batch of messages as read for a specific user.
 */
export async function markMessagesAsRead(chatId, messageIds, userId) {
  if (!chatId || !userId || !messageIds?.length) return;
  try {
    const toUpdate = messageIds.slice(0, 30);
    await Promise.all(toUpdate.map(msgId => 
      updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
        readBy: arrayUnion(userId),
        status: 'read'
      })
    ));
  } catch (err) {
    console.warn('Could not mark messages as read:', err);
  }
}

/**
 * Delete a message from Firestore and update the chat's lastMessage if needed.
 */
export async function deleteMessage(chatId, messageId) {
  if (!chatId || !messageId) return;
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  await deleteDoc(msgRef);

  // Resync chat lastMessage if the deleted message was the last one
  try {
    const chatRef = doc(db, 'chats', chatId);
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const latest = snap.docs[0].data();
      let summary = latest.text || '';
      if (latest.type === 'voice') summary = '🎤 تسجيل صوتي';
      else if (latest.type === 'image') summary = '📷 صورة';
      else if (latest.type === 'file') summary = `📎 ملف: ${latest.fileName || ''}`;
      else if (latest.type === 'call') summary = `📞 ${latest.text || ''}`;

      await updateDoc(chatRef, {
        lastMessage: {
          text: summary,
          senderId: latest.senderId,
          senderName: latest.senderName,
          senderRole: latest.senderRole || 'user',
          timestamp: latest.timestamp?.toDate ? latest.timestamp.toDate() : new Date()
        }
      });
    } else {
      await updateDoc(chatRef, { lastMessage: null });
    }
  } catch (err) {
    console.warn('Could not sync lastMessage after message deletion:', err);
  }
}

/**
 * Edit a text message in Firestore.
 */
export async function editMessage(chatId, messageId, newText) {
  if (!chatId || !messageId || !newText?.trim()) return;
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(msgRef, {
    text: newText.trim(),
    isEdited: true,
    editedAt: serverTimestamp()
  });

  // Also update chat lastMessage preview if this was the last message
  try {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      const chatData = chatSnap.data();
      if (chatData.lastMessage && chatData.lastMessage.senderId) {
        await updateDoc(chatRef, {
          'lastMessage.text': newText.trim()
        });
      }
    }
  } catch (err) {
    console.warn('Could not update lastMessage on message edit:', err);
  }
}

/**
 * Fetch detailed participant list for a chat (useful for group members modal & direct messaging)
 */
export async function fetchChatMembers(chat) {
  if (!chat || !chat.participants) return [];

  const members = [];
  for (const uid of chat.participants) {
    if (chat.participantDetails && chat.participantDetails[uid]) {
      members.push({
        uid,
        name: chat.participantDetails[uid].name,
        role: chat.participantDetails[uid].role,
        isInstructor: uid === chat.instructorId
      });
      continue;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const u = userDoc.data();
        members.push({
          uid,
          name: u.fullName || u.name || u.email || 'مستخدم',
          role: u.role || 'student',
          email: u.email,
          isInstructor: uid === chat.instructorId
        });
      } else {
        members.push({
          uid,
          name: uid === chat.instructorId ? (chat.instructorName || 'المدرب') : 'مستخدم',
          role: uid === chat.instructorId ? 'instructor' : 'student',
          isInstructor: uid === chat.instructorId
        });
      }
    } catch (e) {
      members.push({ uid, name: 'مستخدم', role: 'student' });
    }
  }
  return members;
}

/**
 * ---------------------------------------------------------------------
 * CALL SIGNALING (WebRTC & In-App Voice/Video Calling)
 * ---------------------------------------------------------------------
 */

/**
 * Initiate an audio or video call session.
 */
export async function initiateCall({ chatId, caller, callee, type = 'voice' }) {
  if (!caller?.uid || !callee?.uid) throw new Error('Caller and callee are required');

  const callDocRef = await addDoc(collection(db, 'calls'), {
    chatId: chatId || null,
    callerId: caller.uid,
    callerName: caller.name || caller.fullName || 'متصل',
    callerRole: caller.role || 'user',
    calleeId: callee.uid,
    calleeName: callee.name || callee.fullName || 'مستقبل',
    type, // 'voice' | 'video'
    status: 'ringing', // 'ringing' | 'connected' | 'ended' | 'rejected' | 'busy'
    offer: null,
    answer: null,
    createdAt: serverTimestamp(),
    endedAt: null
  });

  return callDocRef.id;
}

/**
 * Update the status of an ongoing or incoming call.
 */
export async function updateCallStatus(callId, status, extra = {}) {
  if (!callId) return;
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, {
    status,
    ...extra,
    ...(status === 'ended' || status === 'rejected' ? { endedAt: serverTimestamp() } : {})
  });
}

/**
 * Listen to incoming ringing calls for a user.
 */
export function listenToIncomingCalls(userId, onIncomingCall) {
  if (!userId) return () => {};

  const q = query(
    collection(db, 'calls'),
    where('calleeId', '==', userId),
    where('status', '==', 'ringing')
  );

  return onSnapshot(q, (snap) => {
    if (!snap.empty) {
      const docData = snap.docs[0];
      onIncomingCall({ id: docData.id, ...docData.data() });
    } else {
      onIncomingCall(null);
    }
  }, (err) => {
    if (err.code !== 'permission-denied') {
      console.warn('Error listening to incoming calls:', err);
    }
  });
}

/**
 * Listen to updates for a specific active call session.
 */
export function listenToCallSession(callId, onUpdate) {
  if (!callId) return () => {};
  const callRef = doc(db, 'calls', callId);
  return onSnapshot(callRef, (snap) => {
    if (snap.exists()) {
      onUpdate({ id: snap.id, ...snap.data() });
    } else {
      onUpdate(null);
    }
  }, (err) => {
    if (err.code !== 'permission-denied') {
      console.warn('Error listening to call session:', err);
    }
  });
}
