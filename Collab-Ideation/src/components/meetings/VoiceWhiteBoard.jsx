import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import '@tldraw/tldraw/tldraw.css';

const VoiceWhiteboard = ({ meetingId, canEdit = true }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const editorRef = useRef(null);
  const [TldrawComp, setTldrawComp] = useState(null);
  const [tldrawLoaded, setTldrawLoaded] = useState(false);
  const isApplyingRemoteChange = useRef(false);

  // Load Tldraw component
  useEffect(() => {
    let mounted = true;
    
    const loadTldraw = async () => {
      try {
        const mod = await import('@tldraw/tldraw');
        const Tldraw = mod?.Tldraw || mod?.default;
        
        if (mounted && Tldraw) {
          setTldrawComp(() => Tldraw);
          setTldrawLoaded(true);
        }
      } catch (err) {
        console.warn('Tldraw not available:', err);
        setTldrawLoaded(false);
      }
    };

    loadTldraw();
    return () => { mounted = false; };
  }, []);

  // Socket connection for whiteboard sync
  useEffect(() => {
    if (!socket || !meetingId || !tldrawLoaded) return;

    const handleWhiteboardUpdate = (data) => {
      if (data?.meetingId !== meetingId || !editorRef.current || data.userId === user._id) return;
      
      console.log('Received whiteboard update from:', data.userName);
      
      // Set flag to prevent echo
      isApplyingRemoteChange.current = true;
      
      try {
        const editor = editorRef.current;
        
        if (data.changes && data.changes.records) {
          // Simple put - let tldraw handle conflicts
          editor.store.put(data.changes.records);
        }
      } catch (err) {
        console.error('Error applying whiteboard update:', err);
      }
      
      // Reset flag quickly
      setTimeout(() => {
        isApplyingRemoteChange.current = false;
      }, 10);
    };

    const handleWhiteboardSync = (data) => {
      if (data?.meetingId !== meetingId || !editorRef.current) return;
      
      try {
        const editor = editorRef.current;
        if (data.snapshot && data.snapshot.records) {
          isApplyingRemoteChange.current = true;
          editor.store.put(data.snapshot.records);
          setTimeout(() => {
            isApplyingRemoteChange.current = false;
          }, 10);
        }
      } catch (err) {
        console.error('Error applying whiteboard sync:', err);
      }
    };

    socket.on('whiteboardUpdate', handleWhiteboardUpdate);
    socket.on('whiteboardSync', handleWhiteboardSync);

    // Join whiteboard room and request initial sync
    socket.emit('joinWhiteboard', { meetingId, userId: user._id, userName: user.name });
    socket.emit('requestWhiteboardSync', { meetingId });

    return () => {
      socket.off('whiteboardUpdate', handleWhiteboardUpdate);
      socket.off('whiteboardSync', handleWhiteboardSync);
      socket.emit('leaveWhiteboard', { meetingId, userId: user._id });
    };
  }, [socket, meetingId, tldrawLoaded, user]);

  // Simple change handler with light debouncing
  const handleStoreChange = useCallback(() => {
    if (!editorRef.current || !socket || !meetingId || !canEdit || isApplyingRemoteChange.current) {
      return;
    }

    try {
      const editor = editorRef.current;
      const allRecords = editor.store.allRecords();
      
      console.log('Sending whiteboard update with', allRecords.length, 'records');
      
      socket.emit('whiteboardUpdate', {
        meetingId,
        type: 'document',
        changes: {
          records: allRecords
        },
        userId: user._id,
        userName: user.name,
        timestamp: Date.now()
      });
      
    } catch (err) {
      console.error('Error sending whiteboard update:', err);
    }
  }, [socket, meetingId, canEdit, user]);

  // Debounced version with shorter delay
  let debounceTimeout;
  const debouncedHandleStoreChange = useCallback(() => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(handleStoreChange, 50); // Much shorter debounce
  }, [handleStoreChange]);

  const onMount = useCallback((editor) => {
    editorRef.current = editor;
    console.log('Tldraw mounted successfully');
    
    // Listen for store changes
    const dispose = editor.store.listen(() => {
      // Skip if we're applying remote changes
      if (isApplyingRemoteChange.current) return;
      
      debouncedHandleStoreChange();
    });
    
    editor._disposeStoreListener = dispose;
  }, [debouncedHandleStoreChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current?._disposeStoreListener) {
        editorRef.current._disposeStoreListener();
      }
    };
  }, []);

  if (!tldrawLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  if (!TldrawComp) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Whiteboard not available</p>
          <p className="text-sm text-gray-500">Install @tldraw/tldraw to enable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <TldrawComp
        onMount={onMount}
        autoFocus={canEdit}
        readOnly={!canEdit}
      />
    </div>
  );
};

export default VoiceWhiteboard;
