import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { throttle } from 'lodash';
import '@tldraw/tldraw/tldraw.css';

const VoiceWhiteboard = ({ meetingId, canEdit = true, meeting, user }) => {
  const { socket } = useSocket();
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
        const { getSnapshot, loadSnapshot } = mod;
        
        if (mounted && Tldraw) {
          setTldrawComp(() => ({ Tldraw, getSnapshot, loadSnapshot }));
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

  // Handle snapshot updates (throttled to avoid spam)
  const sendSnapshot = useCallback(
    throttle(() => {
      if (!editorRef.current || !socket || !meetingId || isApplyingRemoteChange.current) {
        return;
      }

      try {
        const snapshot = TldrawComp.getSnapshot(editorRef.current.store);
        
        // Filter out camera and pointer data to exclude movement
        const filteredSnapshot = {
          document: snapshot.document,
          // Exclude session data which contains camera/viewport info
        };

        console.log('Sending whiteboard snapshot');
        
        socket.emit('whiteboardUpdate', {
          meetingId,
          snapshot: filteredSnapshot,
          userId: user._id,
          userName: user.name,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('Error sending whiteboard snapshot:', err);
      }
    }, 500),
    [socket, meetingId, user, TldrawComp]
  );

  // Socket connection for whiteboard sync
  useEffect(() => {
    if (!socket || !meetingId || !tldrawLoaded || !TldrawComp) return;

    const handleWhiteboardUpdate = (data) => {
      if (data?.meetingId !== meetingId || !editorRef.current || data.userId === user._id) return;
      
      console.log('Received whiteboard update from:', data.userName);
      
      if (data.snapshot) {
        isApplyingRemoteChange.current = true;
        
        try {
          TldrawComp.loadSnapshot(editorRef.current.store, data.snapshot);
          console.log('Applied whiteboard update');
        } catch (err) {
          console.error('Error applying whiteboard update:', err);
        }
        
        setTimeout(() => {
          isApplyingRemoteChange.current = false;
        }, 100);
      }
    };

    const handleWhiteboardSync = (data) => {
      if (data?.meetingId !== meetingId || !editorRef.current) return;
      
      console.log('Received whiteboard sync:', data);
      
      if (data.snapshot) {
        isApplyingRemoteChange.current = true;
        
        try {
          TldrawComp.loadSnapshot(editorRef.current.store, data.snapshot);
          console.log('Loaded whiteboard from sync');
        } catch (err) {
          console.error('Error loading whiteboard sync:', err);
        }
        
        setTimeout(() => {
          isApplyingRemoteChange.current = false;
        }, 100);
      }
    };

    socket.on('whiteboardUpdate', handleWhiteboardUpdate);
    socket.on('whiteboardSync', handleWhiteboardSync);

    socket.emit('joinWhiteboard', { meetingId, userId: user._id, userName: user.name });
    
    // Request sync after a small delay
    setTimeout(() => {
      console.log('Requesting whiteboard sync');
      socket.emit('requestWhiteboardSync', { meetingId });
    }, 1000);

    return () => {
      socket.off('whiteboardUpdate', handleWhiteboardUpdate);
      socket.off('whiteboardSync', handleWhiteboardSync);
      socket.emit('leaveWhiteboard', { meetingId, userId: user._id });
    };
  }, [socket, meetingId, tldrawLoaded, user, TldrawComp]);

  // Handle permission changes
  useEffect(() => {
    if (!socket || !meetingId || !tldrawLoaded || !editorRef.current) return;

    const handlePermissionUpdate = (data) => {
      if (data?.meetingId !== meetingId) return;
      
      console.log('Updating whiteboard permissions:', data);
      
      const canEditNow = hasEditPermission();
      if (editorRef.current) {
        editorRef.current.updateInstanceState({ isReadonly: !canEditNow });
      }
    };

    socket.on('whiteboardAccessUpdated', handlePermissionUpdate);
    socket.on('settingsUpdated', handlePermissionUpdate);

    return () => {
      socket.off('whiteboardAccessUpdated', handlePermissionUpdate);
      socket.off('settingsUpdated', handlePermissionUpdate);
    };
  }, [socket, meetingId, tldrawLoaded, meeting, user]);

  const onMount = useCallback((editor) => {
    editorRef.current = editor;
    console.log('Tldraw mounted successfully');
    
    // Set read-only state based on permissions
    const canEditNow = hasEditPermission();
    editor.updateInstanceState({ isReadonly: !canEditNow });
    
    // Listen for store changes and send snapshots
    const dispose = editor.store.listen(() => {
      if (isApplyingRemoteChange.current || !canEditNow) return;
      sendSnapshot();
    });
    
    editor._disposeStoreListener = dispose;
  }, [sendSnapshot]);

  useEffect(() => {
    return () => {
      if (editorRef.current?._disposeStoreListener) {
        editorRef.current._disposeStoreListener();
      }
    };
  }, []);

  // Check permissions before rendering
  const hasEditPermission = () => {
    if (!canEdit) return false;
    if (!meeting?.settings) return true;
    
    const { whiteboardAccess, whiteboardAllowedUsers } = meeting.settings;
    const isHost = meeting.host._id === user._id;
    
    switch (whiteboardAccess) {
      case 'all': return true;
      case 'host-only': return isHost;
      case 'specific': return whiteboardAllowedUsers?.includes(user._id) || isHost;
      case 'disabled': return false;
      default: return true;
    }
  };

  const actualCanEdit = hasEditPermission();

  return (
    <div className="w-full h-full relative">
      {!tldrawLoaded ? (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading whiteboard...</p>
          </div>
        </div>
      ) : !TldrawComp ? (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Whiteboard not available</p>
            <p className="text-sm text-gray-500">Install @tldraw/tldraw to enable</p>
          </div>
        </div>
      ) : (
        <TldrawComp.Tldraw
          persistenceKey={`meeting-${meetingId}`} // Enable local persistence
          onMount={onMount}
          autoFocus={actualCanEdit}
          readOnly={!actualCanEdit}
        />
      )}
      
      {/* Permission status indicator */}
      {!actualCanEdit && tldrawLoaded && TldrawComp && (
        <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm">
          Read-only mode
        </div>
      )}
    </div>
  );
};

export default VoiceWhiteboard;
