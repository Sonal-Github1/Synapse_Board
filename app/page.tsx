'use client';

import { use, useEffect, useState, useRef } from 'react';
import { Tldraw, Editor } from 'tldraw';
import { RoomProvider, ClientSideSuspense } from '@liveblocks/react';
import { LiveblocksProvider } from '@liveblocks/react';
import { getOrCreateRoom, saveRoomCanvas } from '../app/actions/roomActions';
import 'tldraw/tldraw.css';

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default function WhiteboardRoomPage({ params }: RoomPageProps) {
  // Unwraps the dynamic room ID parameter from the URL in Next.js
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);
  const editorRef = useRef<Editor | null>(null);

  // 1. Load the canvas data from MongoDB when the page opens
  useEffect(() => {
    async function loadRoom() {
      const result = await getOrCreateRoom(roomId, `Board - ${roomId}`);
      if (result.success && result.room?.canvasData) {
        setInitialData(result.room.canvasData);
      }
      setLoading(false);
    }
    loadRoom();
  }, [roomId]);

  // 2. Handle saving data with a 1.5-second debounce buffer
  const handleMount = (editor: Editor) => {
    editorRef.current = editor;

    // If MongoDB had saved shapes, inject them into our canvas
    if (initialData && Object.keys(initialData).length > 0) {
      editor.loadSnapshot(initialData);
    }

    let saveTimeout: NodeJS.Timeout;

    // Listen to changes made by the local user
    const unsubscribe = editor.store.listen(
      () => {
        clearTimeout(saveTimeout);
        
        saveTimeout = setTimeout(async () => {
          const snapshot = editor.getSnapshot();
          console.log('💾 Auto-saving canvas snapshot to MongoDB...');
          await saveRoomCanvas(roomId, snapshot);
        }, 1500); // 1500ms delay window
      },
      { source: 'user', scope: 'document' }
    );

    return () => {
      unsubscribe();
      clearTimeout(saveTimeout);
    };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        Loading Synapse Workspace...
      </div>
    );
  }

  return (
    // Wrap the viewport with your Liveblocks API credentials 
    <LiveblocksProvider publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "YOUR_LIVEBLOCKS_KEY_HERE"}>
      <RoomProvider id={roomId} initialPresence={{}}>
        <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}>
          <ClientSideSuspense fallback={<div>Connecting to multiplayer sync...</div>}>
            <Tldraw onMount={handleMount} />
          </ClientSideSuspense>
        </div>
      </RoomProvider>
    </LiveblocksProvider>
  );
}