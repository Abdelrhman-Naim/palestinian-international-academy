import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  subscribeToUserChats, 
  subscribeToMessages, 
  sendMessage,
  deleteMessage,
  editMessage,
  syncEnrolledCourseChatsForStudent,
  getOrCreateDirectChat,
  fetchChatMembers,
  uploadChatMedia,
  initiateCall,
  updateCallStatus,
  listenToIncomingCalls,
  listenToCallSession,
  markChatAsRead,
  markMessagesAsRead
} from '../services/chatService';
import VoicePlayer from '../components/chat/VoicePlayer';
import CallModal from '../components/chat/CallModal';

export default function ChatPage() {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { currentUser, userData, userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryChatId = searchParams.get('chatId');

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(queryChatId || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'course_group' | 'direct'
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [isMobileListOpen, setIsMobileListOpen] = useState(!queryChatId);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  // File uploading state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Group members modal state
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Calls state
  const [activeCall, setActiveCall] = useState(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const activeCallRef = useRef(null);

  // Reply & Edit state
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Mention (@) state
  const [participantsList, setParticipantsList] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textInputRef = useRef(null);

  const messagesEndRef = useRef(null);

  // Auto-sync student enrollments with existing course groups
  useEffect(() => {
    if (currentUser?.uid && userRole === 'student') {
      syncEnrolledCourseChatsForStudent(currentUser.uid);
    }
  }, [currentUser, userRole]);

  // Subscribe to all chats for this user
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoadingChats(true);
    const unsubChats = subscribeToUserChats(currentUser.uid, (userChats) => {
      setChats(userChats);
      setLoadingChats(false);

      if (queryChatId) {
        setActiveChatId(queryChatId);
        setIsMobileListOpen(false);
      } else if (!activeChatId && userChats.length > 0 && window.innerWidth >= 768) {
        setActiveChatId(userChats[0].id);
      }
    });

    return () => unsubChats();
  }, [currentUser, queryChatId]);

  // Listen to incoming calls for current user
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubCall = listenToIncomingCalls(currentUser.uid, (incoming) => {
      if (incoming) {
        // If not already in an active connected call, show incoming call modal
        if (!activeCallRef.current || activeCallRef.current.status !== 'connected') {
          setActiveCall(incoming);
          setIsIncomingCall(true);
          setIsCallModalOpen(true);
        }
      } else {
        // Incoming call ended / cancelled before callee answered
        // Only close if we are still waiting in 'ringing' status
        if (activeCallRef.current && activeCallRef.current.status === 'ringing' && activeCallRef.current.calleeId === currentUser.uid) {
          setIsCallModalOpen(false);
          setActiveCall(null);
          setIsIncomingCall(false);
        }
      }
    });

    return () => unsubCall();
  }, [currentUser?.uid]);

  // Listen to active call updates if caller or ongoing
  useEffect(() => {
    if (!activeCall?.id) return;

    const unsubCallSession = listenToCallSession(activeCall.id, (callData) => {
      if (!callData || callData.status === 'ended' || callData.status === 'rejected') {
        setIsCallModalOpen(false);
        setActiveCall(null);
        setIsIncomingCall(false);
      } else {
        setActiveCall(prev => ({ ...(prev || {}), ...callData }));
        if (callData.status === 'connected') {
          setIsIncomingCall(false);
        }
      }
    });

    return () => unsubCallSession();
  }, [activeCall?.id]);

  // Update query param when activeChat changes
  const selectChat = (chatId) => {
    setActiveChatId(chatId);
    setSearchParams({ chatId });
    setIsMobileListOpen(false);
  };

  // Subscribe to messages in active chat
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    const unsubMessages = subscribeToMessages(activeChatId, (msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });

    return () => unsubMessages();
  }, [activeChatId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark chat and messages as read when active chat is open
  useEffect(() => {
    if (!activeChatId || !currentUser?.uid) return;

    // Reset unread count for current user on this chat
    markChatAsRead(activeChatId, currentUser.uid);

    // Mark any unread incoming messages from others as read
    if (messages.length > 0) {
      const unreadIds = messages
        .filter(m => m.senderId !== currentUser.uid && (!m.readBy || !m.readBy.includes(currentUser.uid)))
        .map(m => m.id);

      if (unreadIds.length > 0) {
        markMessagesAsRead(activeChatId, unreadIds, currentUser.uid);
      }
    }
  }, [activeChatId, messages, currentUser?.uid]);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // Helper to extract current user name
  const currentUserName = userData?.name || userData?.fullName || currentUser?.displayName || currentUser?.email || 'مستخدم';

  // Sync participants for @ mentions whenever active chat changes
  useEffect(() => {
    let active = true;
    if (activeChat) {
      fetchChatMembers(activeChat).then(members => {
        if (active) setParticipantsList(members);
      }).catch(err => console.warn('Could not fetch participants for mentions:', err));
    } else {
      setParticipantsList([]);
    }
    setReplyingToMessage(null);
    setEditingMessage(null);
    setActiveActionMenuId(null);
    setShowMentions(false);
    return () => { active = false; };
  }, [activeChatId, activeChat]);

  // Deselect active chat if it does not match the active filter type (B10 fix)
  useEffect(() => {
    if (activeChatId && filterType !== 'all' && chats.length > 0) {
      const currentActive = chats.find(c => c.id === activeChatId);
      if (currentActive && currentActive.type !== filterType) {
        setActiveChatId(null);
        setSearchParams({});
      }
    }
  }, [filterType, activeChatId, chats, setSearchParams]);

  // Input change with @ mention detection
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    const cursorPos = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtMatch = textBeforeCursor.match(/@([^\s@]*)$/);

    if (lastAtMatch && participantsList.length > 0) {
      setShowMentions(true);
      setMentionQuery(lastAtMatch[1].toLowerCase());
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const handleSelectMention = (member) => {
    const input = textInputRef.current;
    const cursorPos = input ? input.selectionStart : inputText.length;
    const textBeforeCursor = inputText.slice(0, cursorPos);
    const textAfterCursor = inputText.slice(cursorPos);

    const newBefore = textBeforeCursor.replace(/@([^\s@]*)$/, `@${member.name} `);
    const newText = newBefore + textAfterCursor;
    setInputText(newText);
    setShowMentions(false);
    setMentionQuery('');
    if (input) {
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(newBefore.length, newBefore.length);
      }, 50);
    }
  };

  const filteredMentions = participantsList.filter(m => {
    if (m.uid === currentUser?.uid) return false;
    if (!mentionQuery) return true;
    return m.name.toLowerCase().includes(mentionQuery);
  });

  // Handle Delete Message
  const handleDeleteMessage = async (msgId) => {
    if (!activeChatId || !msgId) return;
    if (window.confirm(t('chat.deleteConfirm'))) {
      try {
        await deleteMessage(activeChatId, msgId);
        if (editingMessage?.id === msgId) {
          setEditingMessage(null);
          setInputText('');
        }
        if (replyingToMessage?.id === msgId) {
          setReplyingToMessage(null);
        }
      } catch (err) {
        console.error('Failed to delete message:', err);
        alert('فشل حذف الرسالة');
      }
    }
  };

  // Scroll to original message when quoted message is clicked
  const scrollToMessage = (msgId) => {
    if (!msgId) return;
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'rounded-2xl', 'transition-all', 'duration-300');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 1800);
    }
  };

  // Render message text with highlighted @ mentions
  const renderMessageContent = (text, isMe) => {
    if (!text) return null;
    const parts = text.split(/(@[\w\u0600-\u06FF]+(?:\s+[\w\u0600-\u06FF]+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            className={`font-bold inline-block px-1 py-0.2 rounded-md ${
              isMe
                ? 'bg-white/20 text-white underline decoration-white/40'
                : 'bg-primary/15 text-primary dark:text-amber-300 font-bold'
            }`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Handle sending a text message
  const handleSendText = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeChatId || !currentUser) return;

    // Handle Edit Mode Save
    if (editingMessage) {
      const newText = inputText.trim();
      const msgId = editingMessage.id;
      setEditingMessage(null);
      setInputText('');
      try {
        await editMessage(activeChatId, msgId, newText);
      } catch (err) {
        console.error('Failed to edit message:', err);
        alert('فشل تعديل الرسالة');
      }
      return;
    }

    const textToSend = inputText;
    const currentReply = replyingToMessage;
    setInputText('');
    setReplyingToMessage(null);
    setShowMentions(false);

    try {
      await sendMessage(activeChatId, currentUser.uid, currentUserName, userRole, {
        text: textToSend,
        type: 'text',
        ...(currentReply ? { replyTo: currentReply } : {})
      });
    } catch (err) {
      console.error('Failed to send text message:', err);
      setInputText(textToSend);
      setReplyingToMessage(currentReply);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    } else if (e.key === 'Escape') {
      setShowMentions(false);
      if (editingMessage) {
        setEditingMessage(null);
        setInputText('');
      }
      if (replyingToMessage) {
        setReplyingToMessage(null);
      }
    }
  };

  // -------------------------------------------------------------
  // VOICE RECORDING LOGIC
  // -------------------------------------------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      let options = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingStartTimeRef.current = Date.now();

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Could not access microphone:', err);
      alert(t('chat.micBlocked'));
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingStartTimeRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach(t => t.stop());
      recordingStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const sendRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !activeChatId) return;

    const elapsedMs = recordingStartTimeRef.current
      ? Date.now() - recordingStartTimeRef.current
      : recordingSeconds * 1000;
    const actualDuration = Math.max(1, Math.round(elapsedMs / 1000));

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingStartTimeRef.current = null;

    setIsRecording(false);
    setRecordingSeconds(0);
    setIsUploading(true);

    try {
      // 1. Flush any remaining audio data and wait for recorder to cleanly stop
      await new Promise((resolve) => {
        recorder.onstop = resolve;
        if (recorder.state === 'recording') {
          try {
            recorder.requestData();
          } catch (e) {}
          recorder.stop();
        } else if (recorder.state !== 'inactive') {
          recorder.stop();
        } else {
          resolve();
        }
      });

      // 2. Stop microphone tracks
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(t => t.stop());
        recordingStreamRef.current = null;
      }

      // 3. Verify audio chunks exist
      if (!audioChunksRef.current || audioChunksRef.current.length === 0) {
        console.warn('No audio chunks captured');
        alert('لم يتم التقاط أي صوت من الميكروفون، يرجى التأكد من صلاحية الميكروفون والمحاولة ثانية.');
        return;
      }

      const rawMime = recorder.mimeType || 'audio/webm';
      const cleanMime = rawMime.split(';')[0] || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: cleanMime });

      if (audioBlob.size < 100) {
        console.warn('Audio blob too small:', audioBlob.size);
        alert('التسجيل الصوتي فارغ، يرجى التحدث في الميكروفون وإعادة المحاولة.');
        return;
      }

      // 4. Upload and send
      const mediaUrl = await uploadChatMedia(audioBlob, 'voice_notes');
      if (!mediaUrl) {
        throw new Error('فشل معالجة الصوت، الرابط فارغ');
      }
      const currentReply = replyingToMessage;
      setReplyingToMessage(null);

      await sendMessage(activeChatId, currentUser.uid, currentUserName, userRole, {
        type: 'voice',
        mediaUrl,
        duration: actualDuration,
        text: t('chat.voiceNote'),
        ...(currentReply ? { replyTo: currentReply } : {})
      });
    } catch (err) {
      console.error('Error sending voice message:', err);
      alert('فشل إرسال التسجيل الصوتي');
    } finally {
      setIsUploading(false);
      audioChunksRef.current = [];
    }
  };

  // -------------------------------------------------------------
  // FILE UPLOAD LOGIC
  // -------------------------------------------------------------
  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId) return;

    // Reset input so same file can be re-selected if desired
    e.target.value = '';

    setIsUploading(true);
    try {
      const isImage = file.type.startsWith('image/');
      const mediaUrl = await uploadChatMedia(file, isImage ? 'chat_images' : 'chat_files');

      const currentReply = replyingToMessage;
      setReplyingToMessage(null);

      await sendMessage(activeChatId, currentUser.uid, currentUserName, userRole, {
        type: isImage ? 'image' : 'file',
        mediaUrl,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: file.type,
        text: file.name,
        ...(currentReply ? { replyTo: currentReply } : {})
      });
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('فشل رفع الملف، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // -------------------------------------------------------------
  // DIRECT MESSAGING TRIGGER (FROM SENDER OR GROUP MEMBERS MODAL)
  // -------------------------------------------------------------
  const handleStartDirectChatWithUser = async (targetUser) => {
    if (!targetUser?.uid || targetUser.uid === currentUser?.uid) return;

    try {
      const directChatId = await getOrCreateDirectChat(
        { uid: currentUser.uid, name: currentUserName, role: userRole },
        { uid: targetUser.uid, name: targetUser.name || 'مستخدم', role: targetUser.role || 'user' }
      );
      setIsMembersModalOpen(false);
      selectChat(directChatId);
    } catch (err) {
      console.error('Error starting direct chat:', err);
    }
  };

  // -------------------------------------------------------------
  // CALLS INITIATION & MANAGEMENT
  // -------------------------------------------------------------
  const handleStartCall = async (type = 'voice') => {
    if (!activeChat || activeChat.type !== 'direct') return;

    const partnerUid = activeChat.participants?.find(p => p !== currentUser?.uid);
    if (!partnerUid) return;

    const partnerDetails = activeChat.participantDetails?.[partnerUid] || {};
    const partner = {
      uid: partnerUid,
      name: partnerDetails.name || 'مستخدم',
      role: partnerDetails.role || 'user'
    };

    try {
      const callId = await initiateCall({
        chatId: activeChatId,
        caller: { uid: currentUser.uid, name: currentUserName, role: userRole },
        callee: partner,
        type
      });

      setActiveCall({
        id: callId,
        chatId: activeChatId,
        callerId: currentUser.uid,
        callerName: currentUserName,
        calleeId: partner.uid,
        calleeName: partner.name,
        type,
        status: 'ringing'
      });
      setIsIncomingCall(false);
      setIsCallModalOpen(true);
    } catch (err) {
      console.error('Failed to initiate call:', err);
    }
  };

  const handleAnswerCall = async () => {
    if (!activeCall?.id) return;
    const callId = activeCall.id;
    try {
      // 1. Mark status as connected locally immediately
      setIsIncomingCall(false);
      setActiveCall(prev => prev ? ({ ...prev, status: 'connected' }) : null);

      // 2. Update status in Firestore
      await updateCallStatus(callId, 'connected');
    } catch (err) {
      console.error('Failed to answer call:', err);
    }
  };

  const handleRejectCall = async () => {
    if (!activeCall?.id) return;
    const callToReject = activeCall;
    setIsCallModalOpen(false);
    setActiveCall(null);
    setIsIncomingCall(false);
    try {
      await updateCallStatus(callToReject.id, 'rejected');

      if (callToReject.chatId) {
        await sendMessage(callToReject.chatId, currentUser.uid, currentUserName, userRole, {
          type: 'call',
          callDetails: {
            callerId: callToReject.callerId,
            calleeId: callToReject.calleeId,
            callType: callToReject.type || 'voice',
            duration: 0,
            status: 'rejected'
          },
          text: t('chat.callRejected')
        });
      }
    } catch (err) {
      console.error('Failed to reject call:', err);
    }
  };

  const handleEndCall = async (durationSecs = 0) => {
    if (!activeCall?.id) return;
    const callToEnd = activeCall;

    // Immediately close modal locally
    setIsCallModalOpen(false);
    setActiveCall(null);
    setIsIncomingCall(false);

    try {
      await updateCallStatus(callToEnd.id, 'ended', { duration: durationSecs });

      // Send call summary message to chat if chatId available
      if (callToEnd.chatId) {
        const m = Math.floor(durationSecs / 60);
        const s = Math.floor(durationSecs % 60);
        const durFormatted = durationSecs > 0 ? `${m}:${s < 10 ? '0' : ''}${s}` : 'لم يُرد عليها';
        const callTypeLabel = callToEnd.type === 'video' ? t('chat.videoCall') : t('chat.voiceCall');
        const callStatus = durationSecs > 0 ? 'completed' : 'missed';
        
        await sendMessage(callToEnd.chatId, currentUser.uid, currentUserName, userRole, {
          type: 'call',
          callDetails: {
            callerId: callToEnd.callerId,
            calleeId: callToEnd.calleeId,
            callType: callToEnd.type || 'voice',
            duration: durationSecs,
            status: callStatus
          },
          text: `${callTypeLabel} (${durFormatted})`
        });
      }
    } catch (err) {
      console.error('Failed to end call:', err);
    }
  };

  // Open Group Members Modal
  const openMembersModal = async () => {
    if (!activeChat || activeChat.type !== 'course_group') return;
    setIsMembersModalOpen(true);
    setLoadingMembers(true);
    try {
      const members = await fetchChatMembers(activeChat);
      setGroupMembers(members);
    } catch (err) {
      console.error('Error fetching group members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Filter chats by search and tab
  const filteredChats = chats.filter(c => {
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const title = (c.type === 'course_group' ? c.title : getDirectChatTitle(c)).toLowerCase();
    return title.includes(query);
  });

  // Helpers to extract participant details in direct chats
  function getDirectChatTitle(chat) {
    if (chat.type !== 'direct' || !chat.participantDetails) {
      return chat.title || t('chat.directChat');
    }
    const otherUid = chat.participants?.find(p => p !== currentUser?.uid);
    if (!otherUid) return chat.title || t('chat.directChat');
    return chat.participantDetails[otherUid]?.name || t('chat.directChat');
  }

  function getDirectChatRole(chat) {
    if (chat.type !== 'direct' || !chat.participantDetails) return null;
    const otherUid = chat.participants?.find(p => p !== currentUser?.uid);
    if (!otherUid) return null;
    return chat.participantDetails[otherUid]?.role;
  }

  function getDirectChatOtherUser(chat) {
    if (chat.type !== 'direct' || !chat.participantDetails) return null;
    const otherUid = chat.participants?.find(p => p !== currentUser?.uid);
    if (!otherUid) return null;
    return {
      uid: otherUid,
      name: chat.participantDetails[otherUid]?.name || 'مستخدم',
      role: chat.participantDetails[otherUid]?.role || 'user'
    };
  }

  // Format timestamp helper
  const formatTime = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString(dir === 'rtl' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRecDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div dir={dir} className="h-full md:h-[calc(100vh-5rem)] flex flex-col overflow-hidden bg-[#FAF7F2] dark:bg-gray-900 font-alexandria transition-colors">
      
      {/* Outer Shell: 2-Pane WhatsApp Style */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto p-0 sm:p-2 md:p-4 lg:p-6 gap-0 md:gap-4">
        
        {/* ========================================================
            LEFT/RIGHT PANE: CONVERSATIONS LIST
        ======================================================== */}
        <aside className={`${
          isMobileListOpen ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-80 lg:w-96 shrink-0 bg-white dark:bg-gray-800 border-0 md:border border-[#E8E2D5] dark:border-gray-700 rounded-none md:rounded-3xl shadow-none md:shadow-sm overflow-hidden transition-colors`}>
          
          {/* Header & Search */}
          <div className="p-4 border-b border-[#E8E2D5] dark:border-gray-700 bg-[#F3EFE6]/40 dark:bg-gray-800/60 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-lg text-dark dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">forum</span>
                {t('chat.conversations')}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                {chats.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <span className="material-symbols-outlined absolute inset-s-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('chat.searchPlaceholder')}
                className="w-full bg-white dark:bg-gray-700/80 border border-[#E8E2D5] dark:border-gray-600 rounded-xl ps-9 pe-4 py-2 text-xs text-dark dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors shadow-xs"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 p-1 bg-[#FAF7F2] dark:bg-gray-700 rounded-xl border border-[#E8E2D5] dark:border-gray-600 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  filterType === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-dark dark:hover:text-white'
                }`}
              >
                {t('chat.filterAll')}
              </button>
              <button
                type="button"
                onClick={() => setFilterType('course_group')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  filterType === 'course_group'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-dark dark:hover:text-white'
                }`}
              >
                {t('chat.filterGroups')}
              </button>
              <button
                type="button"
                onClick={() => setFilterType('direct')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  filterType === 'direct'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-dark dark:hover:text-white'
                }`}
              >
                {t('chat.filterDirect')}
              </button>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#E8E2D5]/60 dark:divide-gray-700/60">
            {loadingChats ? (
              <div className="p-8 text-center text-gray-400 text-sm font-bold flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-3xl animate-spin text-primary">sync</span>
                {t('chat.loading')}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">
                  chat_bubble_outline
                </span>
                <p className="font-bold text-sm text-dark dark:text-white mb-1">
                  {t('chat.noConversations')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[200px]">
                  {t('chat.noConversationsSub')}
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isActive = chat.id === activeChatId;
                const isGroup = chat.type === 'course_group';
                const chatTitle = isGroup ? chat.title : getDirectChatTitle(chat);
                const role = isGroup ? null : getDirectChatRole(chat);
                const lastMsg = chat.lastMessage?.text || '';
                const lastTime = formatTime(chat.lastMessage?.timestamp || chat.updatedAt);
                const unreadCount = Number(chat.unreadCounts?.[currentUser?.uid]) || 0;

                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                      selectChat(chat.id);
                      if (currentUser?.uid) {
                        markChatAsRead(chat.id, currentUser.uid);
                      }
                    }}
                    className={`p-4 flex items-center gap-3.5 cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 border-s-4 border-primary text-dark dark:text-white'
                        : 'hover:bg-[#FAF7F2] dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {isGroup ? (
                        <div className="w-12 h-12 rounded-2xl bg-[#F3EFE6] dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 flex items-center justify-center text-primary shadow-xs">
                          <span className="material-symbols-outlined text-2xl">groups</span>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex items-center justify-center text-base font-bold shadow-xs">
                          {chatTitle?.[0] || 'م'}
                        </div>
                      )}
                      
                      {isGroup && (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] shadow-xs">
                          <span className="material-symbols-outlined text-[12px]">school</span>
                        </span>
                      )}
                    </div>

                    {/* Chat Text Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h3 className="font-bold text-sm text-dark dark:text-white truncate">
                          {chatTitle}
                        </h3>
                        <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                          {lastTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate flex-1 ${unreadCount > 0 ? 'font-bold text-dark dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          {lastMsg || (isGroup ? t('chat.courseGroup') : t('chat.directChat'))}
                        </p>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-black shadow-xs animate-pulse">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}

                          {isGroup ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3EFE6] dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold border border-[#E8E2D5] dark:border-gray-600">
                              {chat.participants?.length || 0} {t('chat.member')}
                            </span>
                          ) : role && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                              {role === 'instructor' ? t('chat.instructor') : role === 'admin' ? t('chat.admin') : t('chat.student')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ========================================================
            RIGHT/MAIN PANE: ACTIVE CHAT SCREEN
        ======================================================== */}
        <main className={`${
          !isMobileListOpen ? 'flex' : 'hidden'
        } md:flex flex-col flex-1 bg-white dark:bg-gray-800 border-0 md:border border-[#E8E2D5] dark:border-gray-700 rounded-none md:rounded-3xl shadow-none md:shadow-sm overflow-hidden transition-colors`}>
          
          {activeChat ? (
            <>
              {/* Active Chat Header */}
              <header className="h-14 sm:h-16 md:h-20 px-2.5 sm:px-4 md:px-6 border-b border-[#E8E2D5] dark:border-gray-700 bg-[#F3EFE6]/60 dark:bg-gray-800/80 backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setIsMobileListOpen(true)}
                    className="md:hidden w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 flex items-center justify-center text-dark dark:text-white shadow-xs hover:bg-[#FAF7F2] shrink-0"
                    aria-label={t('common.back') || 'Back'}
                    title={t('common.back') || 'Back'}
                  >
                    <span className="material-symbols-outlined text-lg sm:text-xl">
                      {isRtl ? 'arrow_forward' : 'arrow_back'}
                    </span>
                  </button>

                  <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-primary/15 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm sm:text-base md:text-lg shadow-xs shrink-0">
                    {activeChat.type === 'course_group' ? (
                      <span className="material-symbols-outlined text-lg sm:text-2xl">groups</span>
                    ) : (
                      getDirectChatTitle(activeChat)?.[0] || 'م'
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-xs sm:text-sm md:text-base text-dark dark:text-white truncate">
                      {activeChat.type === 'course_group' ? activeChat.title : getDirectChatTitle(activeChat)}
                    </h3>
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                      {activeChat.type === 'course_group' ? (
                        <>
                          <span className="flex items-center gap-1 text-primary font-bold shrink-0">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"></span>
                            {t('chat.courseGroup')}
                          </span>
                          <span>•</span>
                          <span className="shrink-0">{activeChat.participants?.length || 0} {t('chat.members')}</span>
                          {activeChat.instructorName && (
                            <>
                              <span>•</span>
                              <span 
                                onClick={() => activeChat.instructorId && handleStartDirectChatWithUser({
                                  uid: activeChat.instructorId,
                                  name: activeChat.instructorName,
                                  role: 'instructor'
                                })}
                                className="cursor-pointer hover:underline text-secondary font-medium truncate"
                                title={dir === 'rtl' ? "مراسلة المدرب" : "Message Instructor"}
                              >
                                {t('chat.instructor')}: {activeChat.instructorName}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <span className="text-secondary font-semibold">
                          {t('chat.directChat')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Action Buttons (Voice Call, Video Call, Group Members) */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {activeChat.type === 'course_group' ? (
                    <button
                      type="button"
                      onClick={openMembersModal}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-[#FAF7F2] dark:bg-gray-700 hover:bg-[#E8E2D5] dark:hover:bg-gray-600 border border-[#E8E2D5] dark:border-gray-600 text-dark dark:text-white text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-colors shadow-xs"
                      title={t('chat.groupMembers')}
                    >
                      <span className="material-symbols-outlined text-base sm:text-lg text-primary">group</span>
                      <span className="hidden sm:inline">{t('chat.members')}</span>
                    </button>
                  ) : (
                    <>
                      {/* Audio Call Button */}
                      <button
                        type="button"
                        onClick={() => handleStartCall('voice')}
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl bg-[#FAF7F2] dark:bg-gray-700 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 border border-[#E8E2D5] dark:border-gray-600 text-dark dark:text-white flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0"
                        title={t('chat.voiceCall')}
                        aria-label={t('chat.voiceCall')}
                      >
                        <span className="material-symbols-outlined text-base sm:text-xl">call</span>
                      </button>

                      {/* Video Call Button */}
                      <button
                        type="button"
                        onClick={() => handleStartCall('video')}
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl bg-[#FAF7F2] dark:bg-gray-700 hover:bg-primary hover:text-white dark:hover:bg-primary border border-[#E8E2D5] dark:border-gray-600 text-dark dark:text-white flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0"
                        title={t('chat.videoCall')}
                        aria-label={t('chat.videoCall')}
                      >
                        <span className="material-symbols-outlined text-base sm:text-xl">videocam</span>
                      </button>
                    </>
                  )}
                </div>
              </header>

              {/* Messages Flow Container */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-[#FAF7F2]/40 dark:bg-gray-900/40">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      {isRtl ? 'جاري تحميل الرسائل...' : 'Loading messages...'}
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <span className="material-symbols-outlined text-5xl mb-2 text-gray-300 dark:text-gray-600">
                      mark_chat_read
                    </span>
                    <p className="font-bold text-sm text-gray-500 dark:text-gray-400">
                      {t('chat.noMessagesYet')}
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser?.uid;
                    const isSystem = msg.senderRole === 'system' || msg.senderId === 'system' || msg.type === 'system';
                    const isVoice = msg.type === 'voice';
                    const isImage = msg.type === 'image';
                    const isFile = msg.type === 'file';
                    const isCallLog = msg.type === 'call';

                    if (isSystem) {
                      return (
                        <div key={msg.id || idx} className="flex justify-center my-3">
                          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold shadow-xs">
                            <span className="material-symbols-outlined text-sm">info</span>
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        id={`msg-${msg.id}`}
                        key={msg.id || idx}
                        onClick={() => setActiveActionMenuId(prev => prev === msg.id ? null : msg.id)}
                        className={`group relative flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1 transition-all`}
                      >
                        {/* Sender Label for Group Chats (Clickable to open Direct Chat!) */}
                        {!isMe && activeChat.type === 'course_group' && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartDirectChatWithUser({
                                  uid: msg.senderId,
                                  name: msg.senderName,
                                  role: msg.senderRole
                                });
                              }}
                              className="font-bold text-dark dark:text-gray-200 hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                              title={t('chat.directMessage')}
                            >
                              <span>{msg.senderName}</span>
                              <span className="material-symbols-outlined text-[13px] opacity-70">chat</span>
                            </button>

                            {msg.senderRole === 'instructor' && (
                              <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold">
                                {t('chat.instructor')}
                              </span>
                            )}
                            {msg.senderRole === 'admin' && (
                              <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold">
                                {t('chat.admin')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bubble and Action Bar Wrapper */}
                        <div className={`flex items-center gap-2 max-w-[92%] sm:max-w-md md:max-w-lg ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Bubble */}
                          <div
                            className={`flex-1 rounded-2xl p-3 sm:p-3.5 shadow-xs transition-all ${
                              isMe
                                ? 'bg-primary text-white rounded-tr-xs shadow-[0_4px_12px_-2px_rgba(212,175,55,0.3)]'
                                : 'bg-[#F3EFE6] dark:bg-gray-700 text-dark dark:text-white rounded-tl-xs border border-[#E8E2D5] dark:border-gray-600'
                            }`}
                          >
                            {/* Quoted Reply Block */}
                            {msg.replyTo && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  scrollToMessage(msg.replyTo.id);
                                }}
                                className={`mb-2 p-2 rounded-xl border-s-4 text-xs cursor-pointer transition-transform active:scale-[0.98] ${
                                  isMe
                                    ? 'bg-black/15 border-white text-white'
                                    : 'bg-[#FAF7F2] dark:bg-gray-800 border-primary text-gray-700 dark:text-gray-200 shadow-xs'
                                }`}
                                title={dir === 'rtl' ? "انقر للانتقال إلى الرسالة الأصلية" : "Click to scroll to original message"}
                              >
                                <div className="flex items-center gap-1 font-bold text-[11px] mb-0.5 opacity-90">
                                  <span className="material-symbols-outlined text-xs">reply</span>
                                  <span>{msg.replyTo.senderName}</span>
                                </div>
                                <p className="line-clamp-2 text-[11px] opacity-80">
                                  {msg.replyTo.type === 'voice' ? `🎤 ${t('chat.voiceNote')}` :
                                   msg.replyTo.type === 'image' ? '📷 صورة' :
                                   msg.replyTo.type === 'file' ? `📎 ${msg.replyTo.fileName || 'ملف'}` :
                                   msg.replyTo.text}
                                </p>
                              </div>
                            )}

                            {/* 1. Voice Note Message */}
                            {isVoice && (
                              <VoicePlayer 
                                src={msg.mediaUrl} 
                                duration={msg.duration} 
                                isMe={isMe} 
                              />
                            )}

                            {/* 2. Image Attachment */}
                            {isImage && (
                              <div className="space-y-2">
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block overflow-hidden rounded-xl border border-black/10 dark:border-white/10 group"
                                >
                                  <img
                                    src={msg.mediaUrl}
                                    alt={msg.fileName || 'صورة'}
                                    className="w-full max-h-72 object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                  />
                                </a>
                                {msg.fileName && (
                                  <p className="text-xs font-semibold opacity-90 truncate">
                                    {msg.fileName}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* 3. Document / File Attachment */}
                            {isFile && (
                              <div className="flex items-center gap-3 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 min-w-[200px]">
                                <span className="material-symbols-outlined text-3xl opacity-80 shrink-0">
                                  description
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">
                                    {msg.fileName || 'ملف مرفق'}
                                  </p>
                                  <span className="text-[10px] opacity-75 font-mono">
                                    {msg.fileSize || ''}
                                  </span>
                                </div>
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download={msg.fileName}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                                    isMe ? 'bg-white text-primary' : 'bg-primary text-white'
                                  }`}
                                  title={t('chat.download')}
                                >
                                  <span className="material-symbols-outlined text-lg">download</span>
                                </a>
                              </div>
                            )}

                            {/* 4. Call Log Card */}
                            {isCallLog && (() => {
                              const isCaller = currentUser?.uid === msg.callDetails?.callerId;
                              const isCallee = currentUser?.uid === msg.callDetails?.calleeId;
                              const isVideo = msg.callDetails?.callType === 'video' || msg.text?.includes('فيديو') || msg.text?.includes('Video');
                              const duration = msg.callDetails?.duration ?? (msg.duration || 0);
                              const callStatus = msg.callDetails?.status || (duration > 0 ? 'completed' : (msg.text?.includes('رفض') ? 'rejected' : 'missed'));

                              const m = Math.floor(duration / 60);
                              const s = Math.floor(duration % 60);
                              const durStr = `${m}:${s < 10 ? '0' : ''}${s}`;

                              let callTitle = '';
                              let callIcon = '';
                              let iconColor = '';

                              if (callStatus === 'completed' && duration > 0) {
                                if (isCaller) {
                                  callTitle = isVideo ? `${t('chat.outgoingVideoCall')} (${durStr})` : `${t('chat.outgoingVoiceCall')} (${durStr})`;
                                  callIcon = 'call_made';
                                  iconColor = isMe ? 'text-emerald-200' : 'text-emerald-500';
                                } else {
                                  callTitle = isVideo ? `${t('chat.incomingVideoCall')} (${durStr})` : `${t('chat.incomingVoiceCall')} (${durStr})`;
                                  callIcon = 'call_received';
                                  iconColor = isMe ? 'text-emerald-200' : 'text-emerald-500';
                                }
                              } else if (callStatus === 'rejected') {
                                callTitle = isCaller ? t('chat.outgoingCallRejected') : t('chat.incomingCallRejected');
                                callIcon = 'phone_disabled';
                                iconColor = isMe ? 'text-rose-200' : 'text-rose-500';
                              } else {
                                // Missed / No answer
                                if (isCaller) {
                                  callTitle = isVideo ? t('chat.outgoingVideoNoAnswer') : t('chat.outgoingVoiceNoAnswer');
                                  callIcon = 'call_made';
                                  iconColor = isMe ? 'text-amber-200' : 'text-amber-500';
                                } else {
                                  callTitle = isVideo ? t('chat.missedVideoCall') : t('chat.missedVoiceCall');
                                  callIcon = 'call_missed';
                                  iconColor = isMe ? 'text-rose-200' : 'text-rose-500';
                                }
                              }

                              return (
                                <div className="flex items-center gap-2.5 py-1 font-bold text-xs">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    isMe ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'
                                  }`}>
                                    <span className={`material-symbols-outlined text-base ${iconColor}`}>
                                      {callIcon}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="truncate font-semibold">{callTitle}</p>
                                    <p className="text-[10px] opacity-75 font-normal">
                                      {isVideo ? t('chat.videoCall') : t('chat.voiceCall')}
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* 5. Standard Text */}
                            {!isVoice && !isImage && !isFile && !isCallLog && (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {renderMessageContent(msg.text, isMe)}
                              </p>
                            )}

                            {/* Timestamp & Seen status */}
                            <div
                              className={`flex items-center gap-1.5 mt-1 text-[10px] ${
                                isMe ? 'text-white/85 justify-end' : 'text-gray-500 dark:text-gray-400 justify-end'
                              }`}
                            >
                              {msg.isEdited && (
                                <span className="text-[9px] opacity-75 font-medium">
                                  ({t('chat.edited')})
                                </span>
                              )}
                              <span className="font-sans font-medium">{formatTime(msg.timestamp)}</span>
                              {isMe && (() => {
                                const isRead = (msg.readBy && msg.readBy.some(id => id !== currentUser.uid)) || msg.status === 'read';
                                return (
                                  <span 
                                    className="inline-flex items-center shrink-0 ms-0.5 select-none cursor-help"
                                    title={isRead ? t('chat.messageRead') : t('chat.messageSent')}
                                  >
                                    <svg 
                                      width="16" 
                                      height="11" 
                                      viewBox="0 0 16 11" 
                                      fill="none" 
                                      className={`inline-block shrink-0 transition-colors ${
                                        isRead 
                                          ? 'text-[#34B7F1] dark:text-[#53bdeb]' 
                                          : 'text-white/70 dark:text-gray-300/70'
                                      }`}
                                    >
                                      <path 
                                        d="M11 1.5L5.5 7L2 3.5" 
                                        stroke="currentColor" 
                                        strokeWidth="1.7" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                      />
                                      <path 
                                        d="M14.5 1.5L9 7" 
                                        stroke="currentColor" 
                                        strokeWidth="1.7" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </span>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Message Actions Bar (WhatsApp Style: Reply, Edit, Delete) */}
                          <div
                            className={`flex items-center gap-1 transition-all duration-200 shrink-0 ${
                              activeActionMenuId === msg.id
                                ? 'opacity-100 scale-100 pointer-events-auto'
                                : 'opacity-0 sm:group-hover:opacity-100 scale-95 pointer-events-none sm:group-hover:pointer-events-auto'
                            }`}
                          >
                            {/* 1. Reply Button (Available for all messages) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingToMessage({
                                  id: msg.id,
                                  senderName: msg.senderName,
                                  senderId: msg.senderId,
                                  text: msg.text,
                                  type: msg.type,
                                  fileName: msg.fileName
                                });
                                setEditingMessage(null);
                                if (textInputRef.current) textInputRef.current.focus();
                              }}
                              className="w-7 h-7 rounded-full bg-white dark:bg-gray-800 hover:bg-primary hover:text-white dark:hover:bg-primary text-gray-500 dark:text-gray-300 border border-[#E8E2D5] dark:border-gray-700 shadow-xs flex items-center justify-center transition-all cursor-pointer"
                              title={t('chat.reply')}
                              aria-label={t('chat.reply')}
                            >
                              <span className="material-symbols-outlined text-[15px]">reply</span>
                            </button>

                            {/* 2. Edit Button (Only for own text messages) */}
                            {isMe && (!msg.type || msg.type === 'text') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMessage({ id: msg.id, text: msg.text });
                                  setInputText(msg.text || '');
                                  setReplyingToMessage(null);
                                  if (textInputRef.current) textInputRef.current.focus();
                                }}
                                className="w-7 h-7 rounded-full bg-white dark:bg-gray-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 text-amber-600 dark:text-amber-400 border border-[#E8E2D5] dark:border-gray-700 shadow-xs flex items-center justify-center transition-all cursor-pointer"
                                title={t('chat.edit')}
                                aria-label={t('chat.edit')}
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                              </button>
                            )}

                            {/* 3. Delete Button (Only for own messages) */}
                            {isMe && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMessage(msg.id);
                                }}
                                className="w-7 h-7 rounded-full bg-white dark:bg-gray-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 text-rose-500 border border-[#E8E2D5] dark:border-gray-700 shadow-xs flex items-center justify-center transition-all cursor-pointer"
                                title={t('chat.delete')}
                                aria-label={t('chat.delete')}
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Uploading Banner Indicator */}
              {isUploading && (
                <div className="px-6 py-2 bg-primary/10 border-t border-primary/20 text-primary text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base animate-spin">sync</span>
                  <span>{t('chat.uploading')}</span>
                </div>
              )}

              {/* Message Input Box & Voice Recorder Bar */}
              <div className="p-3 sm:p-4 border-t border-[#E8E2D5] dark:border-gray-700 bg-[#F3EFE6]/50 dark:bg-gray-800/60 shrink-0">
                {isRecording ? (
                  /* Live Voice Recording Bar */
                  <div className="flex items-center justify-between gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl px-4 py-3 animate-pulse">
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping"></span>
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 font-mono text-sm">
                        {formatRecDuration(recordingSeconds)}
                      </span>
                      <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 hidden sm:inline">
                        {t('chat.recording')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                        title={t('chat.cancelRecording')}
                        aria-label={t('chat.cancelRecording')}
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                        <span>{t('chat.cancelRecording')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={sendRecording}
                        className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                        title={t('chat.sendVoice')}
                        aria-label={t('chat.sendVoice')}
                      >
                        <span className="material-symbols-outlined text-base">send</span>
                        <span>{t('chat.sendVoice')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* 1. Reply Preview Banner (WhatsApp Style) */}
                    {replyingToMessage && (
                      <div className="mb-2 flex items-center justify-between gap-3 bg-white dark:bg-gray-800 border-s-4 border-primary border border-[#E8E2D5] dark:border-gray-700 rounded-2xl p-2.5 shadow-xs animate-fade-in">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-lg">reply</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-primary">{t('chat.replyingTo')}</span>
                              <span className="text-xs font-extrabold text-dark dark:text-white truncate">{replyingToMessage.senderName}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {replyingToMessage.type === 'voice' 
                                ? `🎤 ${t('chat.voiceNote')}`
                                : replyingToMessage.type === 'image'
                                ? `📷 ${t('chat.attachFile')}`
                                : replyingToMessage.type === 'file'
                                ? `📎 ${replyingToMessage.fileName || t('chat.attachFile')}`
                                : replyingToMessage.text}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyingToMessage(null)}
                          className="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center justify-center shrink-0 transition-colors"
                          title={t('chat.cancelReply')}
                          aria-label={t('chat.cancelReply')}
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    )}

                    {/* 2. Edit Message Banner */}
                    {editingMessage && (
                      <div className="mb-2 flex items-center justify-between gap-3 bg-amber-50/90 dark:bg-amber-950/40 border-s-4 border-amber-500 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-2.5 shadow-xs animate-fade-in">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400">{t('chat.editMessage')}</div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{editingMessage.text}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMessage(null);
                            setInputText('');
                          }}
                          className="w-7 h-7 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 transition-colors"
                          title={t('chat.cancelEdit')}
                          aria-label={t('chat.cancelEdit')}
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    )}

                    {/* 3. Mentions Dropdown Popover */}
                    {showMentions && filteredMentions.length > 0 && (
                      <div className="mb-2 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-[#E8E2D5] dark:border-gray-700 rounded-2xl shadow-xl divide-y divide-[#E8E2D5]/60 dark:divide-gray-700/60 custom-scrollbar animate-fade-in">
                        <div className="px-3 py-1.5 bg-[#F3EFE6]/60 dark:bg-gray-700/50 text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-xs text-primary">alternate_email</span>
                          <span>{t('chat.tagMember')}</span>
                        </div>
                        {filteredMentions.map((member) => (
                          <button
                            key={member.uid}
                            type="button"
                            onClick={() => handleSelectMention(member)}
                            className="w-full text-start px-3 py-2 hover:bg-[#FAF7F2] dark:hover:bg-gray-700/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {member.name?.[0] || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-dark dark:text-white truncate">
                                {member.name}
                              </div>
                              <div className="text-[10px] text-gray-400 truncate">
                                {member.isInstructor ? t('chat.instructor') : t('chat.student')}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Standard Input Bar with Attachments, Mentions & Voice Note Triggers */}
                    <form onSubmit={handleSendText} className="flex items-center gap-1 sm:gap-2">
                      
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {/* Paperclip Attachment Button */}
                      <button
                        type="button"
                        onClick={handleFileClick}
                        disabled={isUploading}
                        className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white dark:bg-gray-700 hover:bg-[#FAF7F2] dark:hover:bg-gray-600 border border-[#E8E2D5] dark:border-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-all shadow-xs hover:text-primary active:scale-95 shrink-0 cursor-pointer"
                        title={t('chat.attachFile')}
                        aria-label={t('chat.attachFile')}
                      >
                        <span className="material-symbols-outlined text-lg sm:text-xl">attach_file</span>
                      </button>

                      {/* Quick @ Mention Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const input = textInputRef.current;
                          if (input) {
                            const pos = input.selectionStart ?? inputText.length;
                            const newText = inputText.slice(0, pos) + '@' + inputText.slice(pos);
                            setInputText(newText);
                            setShowMentions(true);
                            setMentionQuery('');
                            setTimeout(() => {
                              input.focus();
                              input.setSelectionRange(pos + 1, pos + 1);
                            }, 50);
                          } else {
                            setInputText(prev => prev + '@');
                            setShowMentions(true);
                          }
                        }}
                        disabled={isUploading}
                        className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white dark:bg-gray-700 hover:bg-[#FAF7F2] dark:hover:bg-gray-600 border border-[#E8E2D5] dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-primary flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer"
                        title={t('chat.tagMember')}
                        aria-label={t('chat.tagMember')}
                      >
                        <span className="font-mono font-bold text-sm sm:text-base">@</span>
                      </button>

                      {/* Voice Recording Button */}
                      <button
                        type="button"
                        onClick={startRecording}
                        disabled={isUploading}
                        className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white dark:bg-gray-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-[#E8E2D5] dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-rose-500 flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer"
                        title={t('chat.voiceNote')}
                        aria-label={t('chat.voiceNote')}
                      >
                        <span className="material-symbols-outlined text-lg sm:text-xl">mic</span>
                      </button>

                      {/* Text Input */}
                      <input
                        ref={textInputRef}
                        type="text"
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={editingMessage ? t('chat.editMessage') : t('chat.typeMessage')}
                        disabled={isUploading}
                        className="flex-1 min-w-0 bg-white dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-dark dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary shadow-xs transition-colors"
                      />
                      
                      {/* Send / Save Button */}
                      <button
                        type="submit"
                        disabled={!inputText.trim() || isUploading}
                        className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl text-white flex items-center justify-center transition-all duration-200 shadow-md hover:scale-105 active:scale-95 shrink-0 cursor-pointer ${
                          editingMessage
                            ? 'bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:hover:bg-amber-600'
                            : 'bg-primary hover:bg-secondary disabled:opacity-40 disabled:hover:bg-primary'
                        }`}
                        title={editingMessage ? t('chat.saveEdit') : t('chat.send')}
                        aria-label={editingMessage ? t('chat.saveEdit') : t('chat.send')}
                      >
                        <span className="material-symbols-outlined text-lg sm:text-xl">
                          {editingMessage ? 'check' : 'send'}
                        </span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty state when no chat selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF7F2]/40 dark:bg-gray-900/40">
              <div className="w-24 h-24 rounded-3xl bg-[#F3EFE6] dark:bg-gray-700 border border-[#E8E2D5] dark:border-gray-600 flex items-center justify-center text-primary mb-6 shadow-sm">
                <span className="material-symbols-outlined text-5xl">forum</span>
              </div>
              <h3 className="text-xl font-extrabold text-dark dark:text-white mb-2 font-headline-md">
                {t('chat.selectChatPrompt')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-6">
                {t('chat.selectChatSub')}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          GROUP MEMBERS MODAL
      ======================================================== */}
      {isMembersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-alexandria">
          <div 
            dir={dir}
            className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl border border-[#E8E2D5] dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E8E2D5] dark:border-gray-700 bg-[#F3EFE6]/60 dark:bg-gray-800 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-dark dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">group</span>
                {t('chat.groupMembers')}
              </h3>
              <button
                type="button"
                onClick={() => setIsMembersModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 hover:bg-gray-100 flex items-center justify-center text-gray-500 dark:text-gray-300"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Members List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-[#E8E2D5]/60 dark:divide-gray-700/60 custom-scrollbar">
              {loadingMembers ? (
                <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-2xl animate-spin text-primary">sync</span>
                  <span className="text-xs font-bold">{t('chat.loading')}</span>
                </div>
              ) : groupMembers.length === 0 ? (
                <p className="text-center py-6 text-xs text-gray-400 font-semibold">
                  لا يوجد أعضاء مسجلين حالياً
                </p>
              ) : (
                groupMembers.map((member) => {
                  const isCurrentUser = member.uid === currentUser?.uid;

                  return (
                    <div key={member.uid} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#F3EFE6] dark:bg-gray-700 text-primary border border-[#E8E2D5] dark:border-gray-600 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                          {member.name?.[0] || 'م'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-dark dark:text-white truncate">
                            {member.name} {isCurrentUser && `(${t('chat.you')})`}
                          </p>
                          <span className="text-[11px] text-gray-400">
                            {member.isInstructor ? t('chat.instructor') : member.role === 'admin' ? t('chat.admin') : t('chat.student')}
                          </span>
                        </div>
                      </div>

                      {/* Direct Message Action */}
                      {!isCurrentUser && (
                        <button
                          type="button"
                          onClick={() => handleStartDirectChatWithUser(member)}
                          className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary hover:text-white text-primary text-xs font-bold flex items-center gap-1 transition-all shrink-0 shadow-xs"
                          title={t('chat.directMessage')}
                        >
                          <span className="material-symbols-outlined text-sm">chat</span>
                          <span>{t('chat.sendMessage')}</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          VOICE & VIDEO CALL MODAL
      ======================================================== */}
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        activeCall={activeCall}
        currentUser={{ uid: currentUser?.uid, name: currentUserName, role: userRole }}
        isIncoming={isIncomingCall}
        onAnswer={handleAnswerCall}
        onEndCall={handleEndCall}
        onReject={handleRejectCall}
      />

    </div>
  );
}
