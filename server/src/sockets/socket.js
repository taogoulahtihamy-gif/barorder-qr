export default function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('CLIENT CONNECTED', socket.id);

    socket.on('joinTable', (tableId) => {
      socket.join(`table:${tableId}`);
    });

    socket.on('joinAdmin', () => {
      socket.join('admin');
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
