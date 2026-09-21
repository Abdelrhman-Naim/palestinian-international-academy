import { supabase } from '../supabase/client';

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

    const { data, error } = await supabase.storage
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

export function generateChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export async function getOrCreateChat(currentUserId, targetUserId, currentUserName, targetUserName, currentUserRole, targetUserRole) {
  return getOrCreateDirectChat(currentUserId, targetUserId, currentUserName, targetUserName, currentUserRole, targetUserRole);
}

export async function getOrCreateDirectChat(currentUserId, targetUserId, currentUserName, targetUserName, currentUserRole, targetUserRole) {
  if (!currentUserId || !targetUserId) return null;
  const chatId = generateChatId(currentUserId, targetUserId);

  try {
    const { data: existing } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (existing) return existing;

    const newChat = {
      id: chatId,
      participants: [currentUserId, targetUserId],
      participant_details: {
        [currentUserId]: { name: currentUserName || 'مستخدم', role: currentUserRole || 'student' },
        [targetUserId]: { name: targetUserName || 'مستخدم', role: targetUserRole || 'student' }
      },
      updated_at: new Date()
    };

    const { data } = await supabase.from('chats').upsert(newChat).select().single();
    return data || newChat;
  } catch (e) {
    console.error('Error in getOrCreateDirectChat:', e);
    return { id: chatId };
  }
}

export async function createCourseGroupChat(courseId, courseTitle, instructorId, instructorName) {
  const chatId = `group_${courseId}`;
  return { id: chatId, title: courseTitle };
}

export async function autoEnrollStudentInCourseGroup(studentId, studentName, courseId, courseTitle) {
  if (!studentId || !courseId) return null;
  const chatId = `group_${courseId}`;
  return { id: chatId, title: courseTitle };
}

export async function syncEnrolledCourseChatsForStudent(studentId, studentName) {
  return [];
}

export async function fetchChatMembers(chatId) {
  return [];
}

export function subscribeToUserChats(userId, callback) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const fetchChats = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .order('updated_at', { ascending: false });

    callback(data || []);
  };

  fetchChats();

  const channel = supabase
    .channel(`user_chats_${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
      fetchChats();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function sendMessage({ chatId, senderId, senderName, senderRole, recipientId, text = '', mediaUrl = '', mediaType = 'text', voiceDuration = 0, replyTo = null }) {
  if (!chatId || !senderId) return null;

  const msgData = {
    chat_id: chatId,
    sender_id: senderId,
    sender_name: senderName || 'مستخدم',
    recipient_id: recipientId,
    text: text.trim(),
    media_url: mediaUrl,
    media_type: mediaType,
    voice_duration: voiceDuration,
    reply_to: replyTo,
    is_read: false,
    created_at: new Date()
  };

  const { data, error } = await supabase.from('chat_messages').insert([msgData]).select().single();
  if (error) console.error('Error sending message:', error);
  return data;
}

export async function deleteMessage(chatId, messageId) {
  await supabase.from('chat_messages').delete().eq('id', messageId);
}

export async function editMessage(chatId, messageId, newText) {
  await supabase.from('chat_messages').update({ text: newText }).eq('id', messageId);
}

export async function markChatAsRead(chatId, userId) {
  await supabase.from('chat_messages').update({ is_read: true }).eq('chat_id', chatId).eq('recipient_id', userId);
}

export async function markMessagesAsRead(chatId, userId) {
  await markChatAsRead(chatId, userId);
}

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

export function subscribeToMessages(chatId, callback) {
  if (!chatId) {
    callback([]);
    return () => {};
  }

  const fetchMsgs = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    callback(data || []);
  };

  fetchMsgs();

  const channel = supabase
    .channel(`chat_${chatId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` }, () => {
      fetchMsgs();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
