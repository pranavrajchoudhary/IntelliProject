// socket/index.js
function initSocket(io) {
  io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on('joinRoom', (roomId, cb) => {
      socket.join(roomId);
      cb && cb({ status: 'joined', roomId });
    });

    socket.on('drawing', (data) => {
      socket.to(data.roomId).emit('drawing', data);
    });

    socket.on('addShape', (data) => {
      socket.to(data.roomId).emit('addShape', data);
    });

    socket.on('chatMessage', (data) => {
      socket.to(data.roomId).emit('chatMessage', data);
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected', socket.id);
    });
  });
}

module.exports = { initSocket };
