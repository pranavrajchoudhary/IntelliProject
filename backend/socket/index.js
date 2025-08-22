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

    // New message status events
    socket.on('messageDelivered', (data) => {
      socket.to(data.roomId).emit('messageDelivered', data);
    });

    socket.on('messageRead', (data) => {
      socket.to(data.roomId).emit('messageRead', data);
    });

    // User typing indicators
    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('typing', data);
    });

    socket.on('stopTyping', (data) => {
      socket.to(data.roomId).emit('stopTyping', data);
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected', socket.id);
    });
  });
}

module.exports = { initSocket };
