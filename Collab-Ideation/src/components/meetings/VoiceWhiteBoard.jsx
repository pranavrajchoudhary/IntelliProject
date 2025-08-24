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
  const lastRecordMap = useRef(new Map());

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

  // Filter syncable records (exclude viewport/camera changes)
  const getSyncableRecords = useCallback((records) => {
    return records.filter(record => {
      // Only sync actual drawing content, not UI state
      return !['camera', 'instance', 'instance_page_state', 'pointer'].includes(record.typeName);
    });
  }, []);

  // Socket connection for whiteboard sync
  useEffect(() => {
    if (!socket || !meetingId || !tldrawLoaded) return;

    const handleWhiteboardUpdate = (data) => {
      if (data?.meetingId !== meetingId || !editorRef.current || data.userId === user._id) return;
      
      console.log('Received whiteboard update from:', data.userName);
      isApplyingRemoteChange.current = true;
      
      try {
        const editor = editorRef.current;
        
        if (data.changes) {
          // Apply changes using proper tldraw methods
          editor.store.mergeRemoteChanges(() => {
            if (data.changes.toPut && data.changes.toPut.length > 0) {
              editor.store.put(data.changes.toPut);
            }
            if (data.changes.toRemove && data.changes.toRemove.length > 0) {
              editor.store.remove(data.changes.toRemove);
            }
          });
        }
      } catch (err) {
        console.error('Error applying whiteboard update:', err);
      }
      
      setTimeout(() => {
        isApplyingRemoteChange.current = false;
      }, 50);
    };

    const handleWhiteboardSync = (data) => {
      if (data?.meetingId !== meetingId || !editorRef.current) return;
      
      try {
        const editor = editorRef.current;
        if (data.snapshot && data.snapshot.records) {
          isApplyingRemoteChange.current = true;
          
          editor.store.mergeRemoteChanges(() => {
            const syncableRecords = getSyncableRecords(data.snapshot.records);
            editor.store.put(syncableRecords);
          });
          
          setTimeout(() => {
            isApplyingRemoteChange.current = false;
          }, 50);
        }
      } catch (err) {
        console.error('Error applying whiteboard sync:', err);
      }
    };

    socket.on('whiteboardUpdate', handleWhiteboardUpdate);
    socket.on('whiteboardSync', handleWhiteboardSync);

    socket.emit('joinWhiteboard', { meetingId, userId: user._id, userName: user.name });
    socket.emit('requestWhiteboardSync', { meetingId });

    return () => {
      socket.off('whiteboardUpdate', handleWhiteboardUpdate);
      socket.off('whiteboardSync', handleWhiteboardSync);
      socket.emit('leaveWhiteboard', { meetingId, userId: user._id });
    };
  }, [socket, meetingId, tldrawLoaded, user, getSyncableRecords]);

  // Track changes properly - detect inserts and deletes
  const handleStoreChange = useCallback(() => {
    if (!editorRef.current || !socket || !meetingId || !canEdit || isApplyingRemoteChange.current) {
      return;
    }

    try {
      const editor = editorRef.current;
      const currentRecords = getSyncableRecords(editor.store.allRecords());
      
      // Create maps for comparison
      const currentMap = new Map();
      currentRecords.forEach(record => {
        currentMap.set(record.id, JSON.stringify(record));
      });
      
      // Find changes
      const toPut = [];
      const toRemove = [];
      
      // Find new/changed records
      for (const [id, recordStr] of currentMap) {
        if (lastRecordMap.current.get(id) !== recordStr) {
          const record = currentRecords.find(r => r.id === id);
          if (record) toPut.push(record);
        }
      }
      
      // Find deleted records
      for (const [id] of lastRecordMap.current) {
        if (!currentMap.has(id)) {
          toRemove.push(id);
        }
      }
      
      // Only send if there are actual changes
      if (toPut.length > 0 || toRemove.length > 0) {
        console.log(`Sending changes: ${toPut.length} puts, ${toRemove.length} removes`);
        
        // Update our tracking map
        lastRecordMap.current = currentMap;
        
        socket.emit('whiteboardUpdate', {
          meetingId,
          type: 'document',
          changes: {
            toPut: toPut.length > 0 ? toPut : [],
            toRemove: toRemove.length > 0 ? toRemove : []
          },
          userId: user._id,
          userName: user.name,
          timestamp: Date.now()
        });
      }
      
    } catch (err) {
      console.error('Error sending whiteboard update:', err);
    }
  }, [socket, meetingId, canEdit, user, getSyncableRecords]);

  // Debounced change handler
  let debounceTimeout;
  const debouncedHandleStoreChange = useCallback(() => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(handleStoreChange, 100);
  }, [handleStoreChange]);

  const onMount = useCallback((editor) => {
    editorRef.current = editor;
    console.log('Tldraw mounted successfully');
    
    // Initialize tracking map
    const initialRecords = getSyncableRecords(editor.store.allRecords());
    const initialMap = new Map();
    initialRecords.forEach(record => {
      initialMap.set(record.id, JSON.stringify(record));
    });
    lastRecordMap.current = initialMap;
    
    // Listen for store changes
    const dispose = editor.store.listen(() => {
      if (isApplyingRemoteChange.current) return;
      debouncedHandleStoreChange();
    });
    
    editor._disposeStoreListener = dispose;
  }, [debouncedHandleStoreChange, getSyncableRecords]);

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
