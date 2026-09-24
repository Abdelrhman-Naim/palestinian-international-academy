import { supabase } from '../supabase/client';

const LOCAL_CHATS_KEY_PREFIX = 'pia_chats_';
const LOCAL_MSGS_KEY_PREFIX = 'pia_chat_msgs_';

// -------------------------------------------------------------
// HELPER: LocalStorage Fallback Handlers
// -------------------------------------------------------------
function getLocalChats(userId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_CHATS_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalChats(userId, chats) {
  try {
    localStorage.setItem(`${LOCAL_CHATS_KEY_PREFIX}${userId}`, JSON.stringify(chats));
  } catch (e) {}
}

function getLocalMessages(chatId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_MSGS_KEY_PREFIX}${chatId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalMessages(chatId, msgs) {
  try {
    localStorage.setItem(`${LOCAL_MSGS_KEY_PREFIX}${chatId}`, JSON.stringify(msgs));
  } catch (e) {}
}

// Global in-memory broadcast for instant reactivity within the same window
const chatListeners = new Map(); // chatId -> Set of callbacks
const userChatListeners = new Map(); // userId -> Set of callbacks

function notifyChatListeners(chatId, msgs) {
  const set = chatListeners.get(chatId);
  if (set) {
    set.forEach(cb => {
      try { cb(msgs); } catch (e) {}
    });
  }
}

function notifyUserChatListeners(userId, chats) {
  const set = userChatListeners.get(userId);
  if (set) {
    set.forEach(cb => {
      try { cb(chats); } catch (e) {}
    });
  }
}

// -------------------------------------------------------------
// MEDIA UPLOAD
// -------------------------------------------------------------
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

  const isAudio = fileOrBlob.type?.includes('audio') || pathPrefix.includes('voice');
  if (isAudio && fileOrBlob.size < 1500000) {
    return await convertToDataUrl();
  }

  try {
    const ext = fileOrBlob.name 
      ? fileOrBlob.name.split('.').pop() 
      : (isAudio ? 'webm' : 'dat');
    const filename = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from('courses')
      .upload(filename, fileOrBlob, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('courses')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (err) {
    console.warn('Storage upload fallback to DataURL:', err);
    return await convertToDataUrl();
  }
}

// -------------------------------------------------------------
// CHAT ID GENERATOR
// -------------------------------------------------------------
export function generateChatId(uid1, uid2) {
  return [String(uid1), String(uid2)].sort().join('_');
}

// -------------------------------------------------------------
// DIRECT CHATS CREATION & RETRIEVAL
// -------------------------------------------------------------
export async function getOrCreateChat(currentUserId, targetUserId, currentUserName, targetUserName, currentUserRole, targetUserRole) {
  return getOrCreateDirectChat(currentUserId, targetUserId, currentUserName, targetUserName, currentUserRole, targetUserRole);
}

export async function getOrCreateDirectChat(user1OrId, user2OrId, currentUserName, targetUserName, currentUserRole, targetUserRole) {
  let uid1, uid2, name1, name2, role1, role2;

  if (typeof user1OrId === 'object' && user1OrId !== null) {
    uid1 = user1OrId.uid || user1OrId.id;
    name1 = user1OrId.name || user1OrId.fullName || 'مستخدم';
    role1 = user1OrId.role || 'student';
  } else {
    uid1 = user1OrId;
    name1 = currentUserName || 'مستخدم';
    role1 = currentUserRole || 'student';
  }

  if (typeof user2OrId === 'object' && user2OrId !== null) {
    uid2 = user2OrId.uid || user2OrId.id;
    name2 = user2OrId.name || user2OrId.fullName || 'مستخدم';
    role2 = user2OrId.role || 'user';
  } else {
    uid2 = user2OrId;
    name2 = targetUserName || 'مستخدم';
    role2 = targetUserRole || 'user';
  }

  if (!uid1 || !uid2) return null;
  const chatId = generateChatId(uid1, uid2);

  const directChat = {
    id: chatId,
    type: 'direct',
    title: name2,
    participants: [uid1, uid2],
    participantDetails: {
      [uid1]: { name: name1, role: role1 },
      [uid2]: { name: name2, role: role2 }
    },
    participant_details: {
      [uid1]: { name: name1, role: role1 },
      [uid2]: { name: name2, role: role2 }
    },
    unreadCounts: { [uid1]: 0, [uid2]: 0 },
    lastMessage: null,
    updatedAt: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 1. Try Supabase
  try {
    const { data: existing, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .maybeSingle();

    if (!error && existing) {
      return existing.id || chatId;
    }

    if (!error) {
      await supabase.from('chats').insert([{
        id: chatId,
        type: 'direct',
        title: name2,
        participants: [uid1, uid2],
        participant_details: directChat.participant_details,
        unread_counts: directChat.unreadCounts,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    }
  } catch (e) {
    console.warn('Supabase direct chat notice:', e);
  }

  // 2. Always persist to LocalStorage for user 1 & 2
  [uid1, uid2].forEach(uId => {
    const userChats = getLocalChats(uId);
    if (!userChats.some(c => c.id === chatId)) {
      saveLocalChats(uId, [directChat, ...userChats]);
      notifyUserChatListeners(uId, [directChat, ...userChats]);
    }
  });

  return chatId;
}

// -------------------------------------------------------------
// COURSE GROUP CHATS
// -------------------------------------------------------------
export async function createCourseGroupChat(courseId, courseTitle, instructorId, instructorName) {
  const chatId = `group_${courseId}`;
  return { id: chatId, title: courseTitle, type: 'course_group' };
}

export async function autoEnrollStudentInCourseGroup(studentId, studentName, courseId, courseTitle) {
  if (!studentId || !courseId) return null;
  const chatId = `group_${courseId}`;
  return { id: chatId, title: courseTitle, type: 'course_group' };
}

export async function syncEnrolledCourseChatsForStudent(studentId, studentName) {
  if (!studentId) return [];
  try {
    // Fetch courses student is enrolled in
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id, course_title')
      .eq('student_id', studentId);

    const { data: approvedReqs } = await supabase
      .from('course_requests')
      .select('course_id, course_title')
      .eq('student_id', studentId)
      .eq('status', 'approved');

    const courseMap = new Map();
    (enrollments || []).forEach(e => {
      if (e.course_id) courseMap.set(e.course_id, e.course_title || 'دورة تدريبية');
    });
    (approvedReqs || []).forEach(r => {
      if (r.course_id && !courseMap.has(r.course_id)) {
        courseMap.set(r.course_id, r.course_title || 'دورة تدريبية');
      }
    });

    return Array.from(courseMap.entries()).map(([cId, cTitle]) => ({
      id: `group_${cId}`,
      courseId: cId,
      title: cTitle,
      type: 'course_group'
    }));
  } catch (e) {
    return [];
  }
}

// -------------------------------------------------------------
// SYSTEM MESSAGES & GROUP SETTINGS
// -------------------------------------------------------------
export async function sendSystemMessage(chatId, text) {
  if (!chatId || !text) return null;
  return await sendMessage({
    chatId,
    senderId: 'system',
    senderName: 'نظام المجموعة',
    senderRole: 'system',
    text,
    type: 'system'
  });
}

export async function updateGroupChatSettings(chatId, newSettings = {}) {
  if (!chatId) return false;

  const now = new Date().toISOString();
  let updatedChat = null;

  // 1. Update in LocalStorage for all stored user chats
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_CHATS_KEY_PREFIX)) {
        const uId = key.replace(LOCAL_CHATS_KEY_PREFIX, '');
        const list = getLocalChats(uId);
        let changed = false;
        const mapped = list.map(c => {
          if (c.id === chatId) {
            changed = true;
            const metaSettings = {
              ...(c.participantDetails?._group_settings || {}),
              ...(c.participant_details?._group_settings || {})
            };
            if (newSettings.onlyAdminsCanSend !== undefined) metaSettings.onlyAdminsCanSend = newSettings.onlyAdminsCanSend;
            if (newSettings.assistantAdmins !== undefined) metaSettings.assistantAdmins = newSettings.assistantAdmins;
            if (newSettings.removedMembers !== undefined) metaSettings.removedMembers = newSettings.removedMembers;

            const next = {
              ...c,
              onlyAdminsCanSend: newSettings.onlyAdminsCanSend !== undefined ? newSettings.onlyAdminsCanSend : (c.onlyAdminsCanSend ?? metaSettings.onlyAdminsCanSend ?? false),
              assistantAdmins: newSettings.assistantAdmins !== undefined ? newSettings.assistantAdmins : (c.assistantAdmins || metaSettings.assistantAdmins || []),
              removedMembers: newSettings.removedMembers !== undefined ? newSettings.removedMembers : (c.removedMembers || metaSettings.removedMembers || []),
              participantDetails: {
                ...(c.participantDetails || {}),
                _group_settings: metaSettings
              },
              participant_details: {
                ...(c.participant_details || {}),
                _group_settings: metaSettings
              },
              updatedAt: now,
              updated_at: now
            };
            updatedChat = next;
            return next;
          }
          return c;
        });

        if (changed) {
          saveLocalChats(uId, mapped);
          notifyUserChatListeners(uId, mapped);
        }
      }
    }
  } catch (lsErr) {
    console.warn('LocalStorage chat settings update error:', lsErr);
  }

  // 2. Update Supabase
  try {
    const payload = {
      updated_at: now
    };

    if (newSettings.onlyAdminsCanSend !== undefined) {
      payload.only_admins_can_send = newSettings.onlyAdminsCanSend;
    }
    if (newSettings.assistantAdmins !== undefined) {
      payload.assistant_admins = newSettings.assistantAdmins;
    }
    if (newSettings.removedMembers !== undefined) {
      payload.removed_members = newSettings.removedMembers;
    }

    // Try column-based update
    const { error } = await supabase.from('chats').update(payload).eq('id', chatId);

    // If custom columns don't exist yet, save inside participant_details._group_settings
    if (error) {
      const { data: existingChat } = await supabase
        .from('chats')
        .select('participant_details')
        .eq('id', chatId)
        .maybeSingle();

      const pDetails = existingChat?.participant_details || {};
      const currentMeta = pDetails._group_settings || {};

      await supabase.from('chats').update({
        participant_details: {
          ...pDetails,
          _group_settings: {
            ...currentMeta,
            ...(newSettings.onlyAdminsCanSend !== undefined ? { onlyAdminsCanSend: newSettings.onlyAdminsCanSend } : {}),
            ...(newSettings.assistantAdmins !== undefined ? { assistantAdmins: newSettings.assistantAdmins } : {}),
            ...(newSettings.removedMembers !== undefined ? { removedMembers: newSettings.removedMembers } : {})
          }
        },
        updated_at: now
      }).eq('id', chatId);
    }
  } catch (sbErr) {
    console.warn('Supabase updateGroupChatSettings error:', sbErr);
  }

  return updatedChat || true;
}

export async function toggleGroupLock(chatId, onlyAdminsCanSend, actorName = 'المشرف') {
  await updateGroupChatSettings(chatId, { onlyAdminsCanSend });
  const text = onlyAdminsCanSend
    ? `🔒 قام ${actorName} بتعديل إعدادات المجموعة: فقط المشرفون ومساعدوهم يمكنهم إرسال الرسائل.`
    : `🌐 قام ${actorName} بتعديل إعدادات المجموعة: يمكن لكافة الأعضاء إرسال الرسائل.`;
  await sendSystemMessage(chatId, text);
}

export async function promoteToAssistantAdmin(chatId, memberId, memberName = 'العضو', currentAssistantAdmins = [], actorName = 'المشرف') {
  if (!chatId || !memberId) return;
  const set = new Set(currentAssistantAdmins.map(String));
  set.add(String(memberId));
  const nextList = Array.from(set);
  await updateGroupChatSettings(chatId, { assistantAdmins: nextList });
  await sendSystemMessage(chatId, `🛡️ قام ${actorName} بتعيين "${memberName}" كمساعد مشرف في المجموعة.`);
}

export async function demoteAssistantAdmin(chatId, memberId, memberName = 'العضو', currentAssistantAdmins = [], actorName = 'المشرف') {
  if (!chatId || !memberId) return;
  const nextList = currentAssistantAdmins.filter(id => String(id) !== String(memberId));
  await updateGroupChatSettings(chatId, { assistantAdmins: nextList });
  await sendSystemMessage(chatId, `👤 قام ${actorName} بإلغاء صفة مساعد المشرف عن "${memberName}".`);
}

export async function kickMemberFromGroup(chatId, memberId, memberName = 'الطالب', currentRemoved = [], currentAssistants = [], actorName = 'المشرف') {
  if (!chatId || !memberId) return;
  const setRemoved = new Set(currentRemoved.map(String));
  setRemoved.add(String(memberId));
  const nextRemoved = Array.from(setRemoved);
  const nextAssistants = currentAssistants.filter(id => String(id) !== String(memberId));

  await updateGroupChatSettings(chatId, {
    removedMembers: nextRemoved,
    assistantAdmins: nextAssistants
  });
  await sendSystemMessage(chatId, `⚠️ قام ${actorName} بطرد "${memberName}" من المجموعة.`);
}

// -------------------------------------------------------------
// CHAT MEMBERS
// -------------------------------------------------------------
export async function fetchChatMembers(chatOrId) {
  if (!chatOrId) return [];
  const chat = typeof chatOrId === 'object' ? chatOrId : { id: chatOrId, participants: [] };

  // A) Course Group Chat: Resolve Instructor as Admin, Approved Students, and Assistant Admins
  if (chat.type === 'course_group' || chat.type === 'group' || String(chat.id).startsWith('group_')) {
    const courseId = chat.courseId || String(chat.id).replace('group_', '');
    const membersMap = new Map();

    // 1. Instructor details
    let instructorUid = chat.instructorId ? String(chat.instructorId) : null;
    let instructorName = chat.instructorName || 'المدرب';

    if ((!instructorUid || instructorUid === 'undefined') && courseId) {
      try {
        const { data: courseData } = await supabase
          .from('courses')
          .select('id, title, instructor, instructor_name, instructor_id')
          .eq('id', courseId)
          .maybeSingle();

        if (courseData) {
          if (courseData.instructor_id) instructorUid = String(courseData.instructor_id);
          instructorName = courseData.instructor || courseData.instructor_name || instructorName;
        }
      } catch (e) {}
    }

    if (instructorUid) {
      membersMap.set(instructorUid, {
        uid: instructorUid,
        name: instructorName,
        role: 'instructor',
        groupRole: 'admin',
        isInstructor: true,
        isGroupAdmin: true,
        isAssistantAdmin: false
      });
    }

    // 2. Fetch approved enrolled students from course_requests
    try {
      const { data: requests } = await supabase
        .from('course_requests')
        .select('student_id, student_name, student_email')
        .eq('course_id', courseId)
        .eq('status', 'approved');

      if (requests && requests.length > 0) {
        requests.forEach(r => {
          if (r.student_id) {
            const sid = String(r.student_id);
            if (!membersMap.has(sid)) {
              membersMap.set(sid, {
                uid: sid,
                name: r.student_name || 'طالب',
                email: r.student_email || '',
                role: 'student',
                groupRole: 'member',
                isInstructor: false,
                isGroupAdmin: false,
                isAssistantAdmin: false
              });
            }
          }
        });
      }
    } catch (e) {}

    // 3. Fetch from enrollments table if exists
    try {
      const { data: enrolls } = await supabase
        .from('enrollments')
        .select('student_id, student_name, student_email')
        .eq('course_id', courseId);

      if (enrolls && enrolls.length > 0) {
        enrolls.forEach(e => {
          if (e.student_id) {
            const sid = String(e.student_id);
            if (!membersMap.has(sid)) {
              membersMap.set(sid, {
                uid: sid,
                name: e.student_name || 'طالب',
                email: e.student_email || '',
                role: 'student',
                groupRole: 'member',
                isInstructor: false,
                isGroupAdmin: false,
                isAssistantAdmin: false
              });
            }
          }
        });
      }
    } catch (e) {}

    // 4. Participants already in chat.participantDetails
    const pDetails = chat.participantDetails || chat.participant_details;
    if (pDetails && typeof pDetails === 'object') {
      Object.entries(pDetails).forEach(([uid, details]) => {
        if (uid.startsWith('_')) return; // ignore metadata keys like _group_settings
        const sid = String(uid);
        if (!membersMap.has(sid)) {
          const isInst = details.role === 'instructor' || sid === instructorUid;
          membersMap.set(sid, {
            uid: sid,
            name: details.name || 'مستخدم',
            role: details.role || (isInst ? 'instructor' : 'student'),
            groupRole: isInst ? 'admin' : (details.groupRole || 'member'),
            isInstructor: isInst,
            isGroupAdmin: isInst,
            isAssistantAdmin: details.groupRole === 'assistant_admin'
          });
        }
      });
    }

    // 5. If instructor still not mapped, add entry with fallback ID
    if (instructorName && (!instructorUid || !membersMap.has(instructorUid))) {
      const fallbackId = instructorUid || `inst_${courseId}`;
      membersMap.set(fallbackId, {
        uid: fallbackId,
        name: instructorName,
        role: 'instructor',
        groupRole: 'admin',
        isInstructor: true,
        isGroupAdmin: true,
        isAssistantAdmin: false
      });
    }

    // 5.5. Include all participants in chat.participants array
    if (Array.isArray(chat.participants)) {
      chat.participants.forEach(pId => {
        if (!pId) return;
        const sid = String(pId);
        if (!membersMap.has(sid)) {
          const isInst = sid === instructorUid;
          membersMap.set(sid, {
            uid: sid,
            name: isInst ? instructorName : 'عضو في المجموعة',
            role: isInst ? 'instructor' : 'student',
            groupRole: isInst ? 'admin' : 'member',
            isInstructor: isInst,
            isGroupAdmin: isInst,
            isAssistantAdmin: false
          });
        }
      });
    }

    // 5.6. Include creator if not yet mapped
    if (chat.created_by && !membersMap.has(String(chat.created_by))) {
      const cId = String(chat.created_by);
      membersMap.set(cId, {
        uid: cId,
        name: chat.created_by_name || 'منشئ المجموعة',
        role: 'instructor',
        groupRole: 'admin',
        isInstructor: true,
        isGroupAdmin: true,
        isAssistantAdmin: false
      });
    }

    // 6. Enrich with profiles from Supabase
    try {
      const uids = Array.from(membersMap.keys()).filter(id => !id.startsWith('inst_'));
      if (uids.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, avatar_url')
          .in('id', uids);

        if (profs && profs.length > 0) {
          profs.forEach(p => {
            const sid = String(p.id);
            if (membersMap.has(sid)) {
              const current = membersMap.get(sid);
              membersMap.set(sid, {
                ...current,
                name: p.full_name || current.name,
                email: p.email || current.email,
                avatarUrl: p.avatar_url,
                role: current.isInstructor ? 'instructor' : (p.role || current.role)
              });
            }
          });
        }
      }
    } catch (e) {}

    // 7. Apply Assistant Admins and Removed (kicked) members
    const assistantAdminsList = (chat.assistantAdmins || chat.assistant_admins || chat.participant_details?._group_settings?.assistantAdmins || []).map(String);
    const removedMembersList = (chat.removedMembers || chat.removed_members || chat.participant_details?._group_settings?.removedMembers || []).map(String);

    const memberList = [];
    membersMap.forEach((member) => {
      // Exclude kicked members
      if (removedMembersList.includes(String(member.uid))) {
        return;
      }

      if (member.isInstructor || String(member.uid) === instructorUid) {
        member.isGroupAdmin = true;
        member.groupRole = 'admin';
      } else if (assistantAdminsList.includes(String(member.uid))) {
        member.isAssistantAdmin = true;
        member.groupRole = 'assistant_admin';
      } else {
        member.isAssistantAdmin = false;
        member.groupRole = 'member';
      }

      memberList.push(member);
    });

    // Sort: Instructor (Admin) first, then Assistant Admins, then members
    memberList.sort((a, b) => {
      if (a.isGroupAdmin && !b.isGroupAdmin) return -1;
      if (!a.isGroupAdmin && b.isGroupAdmin) return 1;
      if (a.isAssistantAdmin && !b.isAssistantAdmin) return -1;
      if (!a.isAssistantAdmin && b.isAssistantAdmin) return 1;
      return (a.name || '').localeCompare(b.name || '', 'ar');
    });

    return memberList;
  }

  // B) Direct / Other Chats
  if (chat.participantDetails || chat.participant_details) {
    const detailsObj = chat.participantDetails || chat.participant_details;
    const fromDetails = Object.entries(detailsObj)
      .filter(([uid]) => !uid.startsWith('_'))
      .map(([uid, details]) => ({
        uid: String(uid),
        name: details.name || 'مستخدم',
        role: details.role || 'student',
        isInstructor: details.role === 'instructor' || String(uid) === String(chat.instructorId)
      }));
    if (fromDetails.length > 0) return fromDetails;
  }

  if (Array.isArray(chat.participants) && chat.participants.length > 0) {
    const pUids = chat.participants.map(String).filter(Boolean);
    try {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, avatar_url')
        .in('id', pUids);

      if (profs && profs.length > 0) {
        return profs.map(p => ({
          uid: String(p.id),
          name: p.full_name || p.email || 'مستخدم',
          role: p.role || 'student',
          email: p.email,
          avatarUrl: p.avatar_url,
          isInstructor: p.role === 'instructor' || String(p.id) === String(chat.instructorId)
        }));
      }
    } catch (e) {}

    return pUids.map(uid => ({
      uid,
      name: uid === String(chat.instructorId) ? (chat.instructorName || 'المدرب') : 'عضو في المحادثة',
      role: uid === String(chat.instructorId) ? 'instructor' : 'student',
      isInstructor: uid === String(chat.instructorId)
    }));
  }

  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, role');

    if (profiles && profiles.length > 0) {
      return profiles.map(p => ({
        uid: String(p.id),
        name: p.full_name || p.email,
        role: p.role,
        email: p.email,
        isInstructor: p.role === 'instructor'
      }));
    }
  } catch (e) {}

  return [];
}

// -------------------------------------------------------------
// SUBSCRIBE TO ALL CHATS FOR A USER
// -------------------------------------------------------------
export function subscribeToUserChats(userId, callback) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  // Register in local in-memory listeners
  if (!userChatListeners.has(userId)) {
    userChatListeners.set(userId, new Set());
  }
  userChatListeners.get(userId).add(callback);

  let isCancelled = false;

  const loadAllChats = async () => {
    try {
      let remoteChats = [];
      try {
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          remoteChats = data.filter(c => {
            const parts = c.participants || [];
            const removed = (c.removed_members || c.removedMembers || c.participant_details?._group_settings?.removedMembers || []).map(String);
            if (removed.includes(String(userId))) return false;
            return c.type === 'course_group' || parts.includes(userId);
          }).map(normalizeChat);
        }
      } catch (err) {
        // Table doesn't exist or offline - proceed gracefully
      }

      // Fetch active courses to automatically provide course group chats
      let courseGroups = [];
      try {
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title, instructor, instructor_name, instructor_id');

        if (courses && courses.length > 0) {
          courseGroups = courses.map(course => ({
            id: `group_${course.id}`,
            type: 'course_group',
            title: course.title,
            courseId: course.id,
            instructorId: course.instructor_id,
            instructorName: course.instructor || course.instructor_name || 'المدرب',
            participants: [userId],
            participantDetails: {},
            unreadCounts: {},
            lastMessage: null,
            updatedAt: new Date().toISOString()
          }));
        }
      } catch (cErr) {}

      // Get local chats
      const localChats = getLocalChats(userId);

      // Merge remote + local + course groups
      const mergedMap = new Map();

      // 1. Add course groups
      courseGroups.forEach(cg => mergedMap.set(cg.id, cg));

      // 2. Add local chats
      localChats.forEach(lc => mergedMap.set(lc.id, lc));

      // 3. Add remote chats (overwriting with latest state)
      remoteChats.forEach(rc => mergedMap.set(rc.id, rc));

      const finalList = Array.from(mergedMap.values())
        .filter(c => {
          const removed = (c.removedMembers || c.removed_members || c.participantDetails?._group_settings?.removedMembers || []).map(String);
          return !removed.includes(String(userId));
        })
        .sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.updated_at || 0).getTime();
          const timeB = new Date(b.updatedAt || b.updated_at || 0).getTime();
          return timeB - timeA;
        });

      saveLocalChats(userId, finalList);

      if (!isCancelled) {
        callback(finalList);
      }
    } catch (finalErr) {
      console.warn('loadAllChats notice:', finalErr);
      if (!isCancelled) {
        callback(getLocalChats(userId));
      }
    }
  };

  // Initial immediate load
  loadAllChats();

  // Realtime Supabase subscription if available
  let channel = null;
  try {
    channel = supabase
      .channel(`user_chats_rt_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
        loadAllChats();
      })
      .subscribe();
  } catch (rtErr) {}

  return () => {
    isCancelled = true;
    if (userChatListeners.has(userId)) {
      userChatListeners.get(userId).delete(callback);
    }
    if (channel) {
      try { supabase.removeChannel(channel); } catch (e) {}
    }
  };
}

// -------------------------------------------------------------
// SUBSCRIBE TO MESSAGES IN A CHAT
// -------------------------------------------------------------
export function subscribeToMessages(chatId, callback) {
  if (!chatId) {
    callback([]);
    return () => {};
  }

  // Register in local in-memory listeners
  if (!chatListeners.has(chatId)) {
    chatListeners.set(chatId, new Set());
  }
  chatListeners.get(chatId).add(callback);

  let isCancelled = false;

  const loadMessages = async () => {
    try {
      let remoteMsgs = [];
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });

        if (!error && Array.isArray(data)) {
          remoteMsgs = data.map(normalizeMessage);
        }
      } catch (e) {}

      const localMsgs = getLocalMessages(chatId);

      // Merge avoiding duplicates by id
      const msgMap = new Map();
      localMsgs.forEach(m => msgMap.set(m.id, m));
      remoteMsgs.forEach(m => msgMap.set(m.id, m));

      const finalList = Array.from(msgMap.values()).sort((a, b) => {
        const tA = new Date(a.timestamp || a.created_at || 0).getTime();
        const tB = new Date(b.timestamp || b.created_at || 0).getTime();
        return tA - tB;
      });

      saveLocalMessages(chatId, finalList);

      if (!isCancelled) {
        callback(finalList);
      }
    } catch (err) {
      if (!isCancelled) {
        callback(getLocalMessages(chatId));
      }
    }
  };

  // Immediate fetch
  loadMessages();

  // Realtime Supabase subscription if available
  let channel = null;
  try {
    channel = supabase
      .channel(`chat_msgs_rt_${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` }, () => {
        loadMessages();
      })
      .subscribe();
  } catch (e) {}

  return () => {
    isCancelled = true;
    if (chatListeners.has(chatId)) {
      chatListeners.get(chatId).delete(callback);
    }
    if (channel) {
      try { supabase.removeChannel(channel); } catch (e) {}
    }
  };
}

// -------------------------------------------------------------
// SEND MESSAGE
// -------------------------------------------------------------
export async function sendMessage(chatIdOrObj, senderId, senderName, senderRole, extraObj = {}) {
  let chatId, sId, sName, sRole, extra;

  if (typeof chatIdOrObj === 'object' && chatIdOrObj !== null) {
    chatId = chatIdOrObj.chatId || chatIdOrObj.chat_id;
    sId = chatIdOrObj.senderId || chatIdOrObj.sender_id;
    sName = chatIdOrObj.senderName || chatIdOrObj.sender_name || 'مستخدم';
    sRole = chatIdOrObj.senderRole || chatIdOrObj.sender_role || 'student';
    extra = chatIdOrObj;
  } else {
    chatId = chatIdOrObj;
    sId = senderId;
    sName = senderName || 'مستخدم';
    sRole = senderRole || 'student';
    extra = extraObj || {};
  }

  if (!chatId || !sId) return null;

  const now = new Date();
  const msgId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const textContent = (extra.text || '').trim();

  let summary = textContent;
  const msgType = extra.type || extra.mediaType || 'text';
  if (msgType === 'voice') summary = '🎤 تسجيل صوتي';
  else if (msgType === 'image') summary = '📷 صورة';
  else if (msgType === 'file') summary = `📎 ملف: ${extra.fileName || ''}`;
  else if (msgType === 'call') summary = `📞 ${textContent || 'مكالمة'}`;

  const messageDoc = {
    id: msgId,
    chatId,
    chat_id: chatId,
    senderId: sId,
    sender_id: sId,
    senderName: sName,
    sender_name: sName,
    senderRole: sRole,
    sender_role: sRole,
    text: textContent,
    type: msgType,
    mediaUrl: extra.mediaUrl || '',
    media_url: extra.mediaUrl || '',
    fileName: extra.fileName || '',
    file_name: extra.fileName || '',
    fileSize: extra.fileSize || '',
    file_size: extra.fileSize || '',
    duration: extra.duration || extra.voice_duration || 0,
    voice_duration: extra.duration || extra.voice_duration || 0,
    replyTo: extra.replyTo || null,
    reply_to: extra.replyTo || null,
    readBy: [sId],
    read_by: [sId],
    isEdited: false,
    is_edited: false,
    timestamp: now.toISOString(),
    created_at: now.toISOString()
  };

  // 1. Immediately store in LocalStorage and notify open UI
  const existingMsgs = getLocalMessages(chatId);
  const updatedMsgs = [...existingMsgs, messageDoc];
  saveLocalMessages(chatId, updatedMsgs);
  notifyChatListeners(chatId, updatedMsgs);

  // Update chat lastMessage locally
  const updateChatMeta = (c) => {
    if (c.id === chatId) {
      return {
        ...c,
        lastMessage: {
          text: summary,
          senderId: sId,
          senderName: sName,
          senderRole: sRole,
          timestamp: now.toISOString()
        },
        last_message: {
          text: summary,
          sender_id: sId,
          sender_name: sName,
          sender_role: sRole,
          timestamp: now.toISOString()
        },
        updatedAt: now.toISOString(),
        updated_at: now.toISOString()
      };
    }
    return c;
  };

  // 2. Try inserting into Supabase
  try {
    await supabase.from('chat_messages').insert([{
      chat_id: chatId,
      sender_id: sId,
      sender_name: sName,
      sender_role: sRole,
      text: textContent,
      type: msgType,
      media_url: messageDoc.mediaUrl,
      file_name: messageDoc.fileName,
      file_size: messageDoc.fileSize,
      voice_duration: messageDoc.duration,
      reply_to: messageDoc.replyTo,
      created_at: now.toISOString()
    }]);

    await supabase.from('chats').update({
      last_message: messageDoc.last_message,
      updated_at: now.toISOString()
    }).eq('id', chatId);
  } catch (err) {
    console.warn('Supabase message insert notice:', err);
  }

  // Update in user chats cache
  try {
    const userChats = getLocalChats(sId);
    const updatedChats = userChats.map(updateChatMeta);
    saveLocalChats(sId, updatedChats);
    notifyUserChatListeners(sId, updatedChats);
  } catch (e) {}

  return messageDoc;
}

// -------------------------------------------------------------
// EDIT / DELETE MESSAGE
// -------------------------------------------------------------
export async function editMessage(chatId, messageId, newText) {
  if (!chatId || !messageId) return;

  const msgs = getLocalMessages(chatId);
  const updated = msgs.map(m => {
    if (m.id === messageId) {
      return { ...m, text: newText.trim(), isEdited: true, is_edited: true };
    }
    return m;
  });
  saveLocalMessages(chatId, updated);
  notifyChatListeners(chatId, updated);

  try {
    await supabase.from('chat_messages').update({ text: newText.trim(), is_edited: true }).eq('id', messageId);
  } catch (e) {}
}

export async function deleteMessage(chatId, messageId) {
  if (!chatId || !messageId) return;

  const msgs = getLocalMessages(chatId);
  const updated = msgs.filter(m => m.id !== messageId);
  saveLocalMessages(chatId, updated);
  notifyChatListeners(chatId, updated);

  try {
    await supabase.from('chat_messages').delete().eq('id', messageId);
  } catch (e) {}
}

// -------------------------------------------------------------
// MARK AS READ
// -------------------------------------------------------------
export async function markChatAsRead(chatId, userId) {
  if (!chatId || !userId) return;

  const chats = getLocalChats(userId);
  const updated = chats.map(c => {
    if (c.id === chatId) {
      const counts = { ...(c.unreadCounts || c.unread_counts || {}) };
      counts[userId] = 0;
      return { ...c, unreadCounts: counts, unread_counts: counts };
    }
    return c;
  });
  saveLocalChats(userId, updated);
  notifyUserChatListeners(userId, updated);

  try {
    await supabase.from('chat_messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', userId);
  } catch (e) {}
}

export async function markMessagesAsRead(chatId, messageIds, userId) {
  await markChatAsRead(chatId, userId);
}

// -------------------------------------------------------------
// CALLS SIGNALING (Stubs)
// -------------------------------------------------------------
export async function initiateCall({ chatId, callerId, callerName, recipientId, isVideo = false }) {
  return null;
}

export async function updateCallStatus(callId, status) {
  return null;
}

export function listenToIncomingCalls(userId, callback) {
  callback(null);
  return () => {};
}

export function listenToCallSession(callId, callback) {
  callback(null);
  return () => {};
}

// -------------------------------------------------------------
// NORMALIZERS
// -------------------------------------------------------------
function normalizeChat(c) {
  const metaSettings = c.participant_details?._group_settings || c.participantDetails?._group_settings || {};
  return {
    ...c,
    id: c.id,
    type: c.type || 'direct',
    title: c.title,
    courseId: c.course_id || c.courseId,
    instructorId: c.instructor_id || c.instructorId,
    instructorName: c.instructor_name || c.instructorName,
    participants: c.participants || [],
    participantDetails: c.participant_details || c.participantDetails || {},
    unreadCounts: c.unread_counts || c.unreadCounts || {},
    lastMessage: c.last_message || c.lastMessage || null,
    updatedAt: c.updated_at || c.updatedAt || new Date().toISOString(),
    onlyAdminsCanSend: c.only_admins_can_send !== undefined ? c.only_admins_can_send : (c.onlyAdminsCanSend !== undefined ? c.onlyAdminsCanSend : (metaSettings.onlyAdminsCanSend ?? false)),
    assistantAdmins: c.assistant_admins || c.assistantAdmins || metaSettings.assistantAdmins || [],
    removedMembers: c.removed_members || c.removedMembers || metaSettings.removedMembers || []
  };
}

function normalizeMessage(m) {
  return {
    ...m,
    id: m.id,
    chatId: m.chat_id || m.chatId,
    senderId: m.sender_id || m.senderId,
    senderName: m.sender_name || m.senderName,
    senderRole: m.sender_role || m.senderRole,
    text: m.text || '',
    type: m.type || 'text',
    mediaUrl: m.media_url || m.mediaUrl,
    fileName: m.file_name || m.fileName,
    fileSize: m.file_size || m.fileSize,
    duration: m.voice_duration || m.duration || 0,
    replyTo: m.reply_to || m.replyTo,
    readBy: m.read_by || m.readBy || [],
    isEdited: m.is_edited || m.isEdited || false,
    timestamp: m.created_at || m.timestamp || new Date().toISOString()
  };
}
