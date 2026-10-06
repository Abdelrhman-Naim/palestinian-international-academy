"use client";
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import {
  initiateCall,
  updateCallStatus,
  listenToIncomingCalls,
  listenToCallSession,
  sendMessage
} from '../services/chatService';
import CallModal from '../components/chat/CallModal';

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const { currentUser, userRole, userData } = useAuth();
  const { t } = useLanguage();

  const [activeCall, setActiveCall] = useState(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const activeCallRef = useRef(null);
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const myUid = String(currentUser?.uid || currentUser?.id || '');
  const currentUserName = userData?.name || userData?.fullName || currentUser?.displayName || currentUser?.email || 'مستخدم';

  // 1. Listen for incoming calls for the logged-in user
  useEffect(() => {
    if (!myUid) return;

    const unsubIncoming = listenToIncomingCalls(myUid, (incoming) => {
      if (incoming) {
        // If not currently in an active connected call, ring and open modal
        if (!activeCallRef.current || activeCallRef.current.status !== 'connected') {
          setActiveCall(incoming);
          setIsIncomingCall(true);
          setIsCallModalOpen(true);
        }
      } else {
        // Cancel/hangup before answered
        if (
          activeCallRef.current &&
          activeCallRef.current.status === 'ringing' &&
          String(activeCallRef.current.calleeId) === myUid
        ) {
          setIsCallModalOpen(false);
          setActiveCall(null);
          setIsIncomingCall(false);
        }
      }
    });

    return () => unsubIncoming();
  }, [myUid]);

  // 2. Listen for active call updates (connected, rejected, ended)
  useEffect(() => {
    if (!activeCall?.id) return;

    const unsubSession = listenToCallSession(activeCall.id, (callData) => {
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

    return () => unsubSession();
  }, [activeCall?.id]);

  // 3. Initiate a new call
  const startCall = async ({ chatId, callee, type = 'voice' }) => {
    if (!myUid || !callee?.uid) return;

    try {
      const callId = await initiateCall({
        chatId,
        caller: { uid: myUid, name: currentUserName, role: userRole },
        callee: { uid: callee.uid, name: callee.name || 'مستخدم', role: callee.role || 'user' },
        type
      });

      const initialCallData = {
        id: callId,
        chatId,
        callerId: myUid,
        callerName: currentUserName,
        callerRole: userRole,
        calleeId: callee.uid,
        calleeName: callee.name,
        calleeRole: callee.role,
        type,
        status: 'ringing'
      };

      setActiveCall(initialCallData);
      setIsIncomingCall(false);
      setIsCallModalOpen(true);
      return callId;
    } catch (err) {
      console.error('Failed to start call in CallContext:', err);
    }
  };

  // 4. Answer incoming call
  const handleAnswerCall = async () => {
    if (!activeCall?.id) return;
    const callId = activeCall.id;
    try {
      setIsIncomingCall(false);
      setActiveCall(prev => prev ? ({ ...prev, status: 'connected' }) : null);
      await updateCallStatus(callId, 'connected');
    } catch (err) {
      console.error('Failed to answer call in CallContext:', err);
    }
  };

  // 5. Reject incoming call
  const handleRejectCall = async () => {
    if (!activeCall?.id) return;
    const callToReject = activeCall;

    setIsCallModalOpen(false);
    setActiveCall(null);
    setIsIncomingCall(false);

    try {
      await updateCallStatus(callToReject.id, 'rejected');

      if (callToReject.chatId) {
        await sendMessage(callToReject.chatId, myUid, currentUserName, userRole, {
          type: 'call',
          callDetails: {
            callerId: callToReject.callerId,
            calleeId: callToReject.calleeId,
            callType: callToReject.type || 'voice',
            duration: 0,
            status: 'rejected'
          },
          text: t('chat.callRejected') || 'مكالمة مرفوضة'
        });
      }
    } catch (err) {
      console.error('Failed to reject call in CallContext:', err);
    }
  };

  // 6. End active call (or cancel ringing call)
  const handleEndCall = async (durationSecs = 0) => {
    if (!activeCall?.id) return;
    const callToEnd = activeCall;

    setIsCallModalOpen(false);
    setActiveCall(null);
    setIsIncomingCall(false);

    try {
      await updateCallStatus(callToEnd.id, 'ended', { duration: durationSecs });

      if (callToEnd.chatId) {
        const m = Math.floor(durationSecs / 60);
        const s = Math.floor(durationSecs % 60);
        const durFormatted = durationSecs > 0 ? `${m}:${s < 10 ? '0' : ''}${s}` : (t('chat.missedCall') || 'لم يُرد عليها');
        const callTypeLabel = callToEnd.type === 'video' ? (t('chat.videoCall') || 'مكالمة فيديو') : (t('chat.voiceCall') || 'مكالمة صوتية');
        const callStatus = durationSecs > 0 ? 'completed' : 'missed';

        await sendMessage(callToEnd.chatId, myUid, currentUserName, userRole, {
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
      console.error('Failed to end call in CallContext:', err);
    }
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        isIncomingCall,
        isCallModalOpen,
        startCall,
        answerCall: handleAnswerCall,
        rejectCall: handleRejectCall,
        endCall: handleEndCall
      }}
    >
      {children}

      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => handleEndCall(0)}
        activeCall={activeCall}
        currentUser={{ uid: myUid, name: currentUserName, role: userRole }}
        isIncoming={isIncomingCall}
        onAnswer={handleAnswerCall}
        onEndCall={handleEndCall}
        onReject={handleRejectCall}
      />
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return ctx;
}
