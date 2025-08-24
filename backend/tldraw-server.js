const { WebSocketServer } = require('ws');
const { TLSocketServer } = require('@tldraw/sync');

const tldrawRooms = {};

function initTldrawSync(io) {
  io.of('/tldraw-sync').on('connection', (socket) => {
    console.log('tldraw-sync socket connected:', socket.id);

    const roomId = socket.handshake.query.roomId;

    if (!roomId) {
      console.error('No roomId provided for tldraw-sync connection');
      socket.disconnect();
      return;
    }

    if (!tldrawRooms[roomId]) {
      console.log(`Creating new tldraw room: ${roomId}`);
      tldrawRooms[roomId] = new TLSocketServer({
        // For a simple in-memory store
        store: {},
      });
    }

    // Connect the socket to the TLSocketServer instance for the room
    tldrawRooms[roomId].connect(socket);

    socket.on('disconnect', () => {
      console.log('tldraw-sync socket disconnected:', socket.id);
      // Clean up the room if all participants have left
      if (io.of('/tldraw-sync').adapter.rooms.get(roomId)?.size === 0) {
        console.log(`Closing tldraw room: ${roomId}`);
        delete tldrawRooms[roomId];
      }
    });
  });
}

module.exports = { initTldrawSync };