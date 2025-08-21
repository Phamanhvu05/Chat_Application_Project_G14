const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const users = {}; // Lưu thông tin người dùng
const onlineUsers = new Set();
const profiles = {}; // Lưu thông tin profile của người dùng

io.on('connection', (socket) => {
  console.log('Người dùng kết nối:', socket.id);
 // Xử lý đăng ký
  socket.on('register', (data) => {
    if (!users[data.username]) {
      users[data.username] = { password: data.password };
      socket.emit('registerSuccess', { message: 'Đăng ký thành công' });
    } else {
      socket.emit('registerError', { message: 'Tên người dùng đã tồn tại' });
    }
  });
 // Xử lý đăng nhập
  socket.on('login', (data) => {
    if (users[data.username] && users[data.username].password === data.password) {
      socket.username = data.username;
      onlineUsers.add(data.username);
      io.emit('updateOnlineUsers', Array.from(onlineUsers));
      socket.emit('loginSuccess', { username: data.username });
    } else {
      socket.emit('loginError', { message: 'Tên người dùng hoặc mật khẩu không đúng' });
    }
  });
 // Tham gia phòng chat
  socket.on('joinRoom', (data) => {
    socket.join(data.room);
    socket.username = data.username;
    onlineUsers.add(data.username);
    io.emit('updateOnlineUsers', Array.from(onlineUsers));
  });
// Tìm kiếm người dùng bằng tên hoặc số điện thoại
  socket.on('searchUsersByNameOrPhone', (query) => {
    const filteredResults = Object.entries(profiles).filter(([username, profile]) => {
      const nameMatch = profile.name.toLowerCase().includes(query);
      const phoneMatch = profile.phone && profile.phone.toLowerCase().includes(query);
      return nameMatch || phoneMatch;
    }).map(([username, profile]) => ({ username, ...profile }));
    socket.emit('searchResultsByNameOrPhone', filteredResults);
  });
// Lấy tất cả profile
  socket.on('getAllProfiles', () => {
    socket.emit('allProfiles', profiles);
  });
 // Xử lý tin nhắn riêng
  socket.on('privateMessage', (data) => {
    const recipientSocket = Array.from(io.sockets.sockets).find(([id, sock]) => sock.username === data.recipient);
    if (recipientSocket) {
      io.to(recipientSocket[0]).emit('privateMessage', data);
      io.to(socket.id).emit('privateMessage', data);
      if (data.recipient !== data.user) {
        io.to(recipientSocket[0]).emit('newMessageNotification', data);
        socket.emit('newMessageNotification', data);
      }
    }
  });
  // Xử lý file riêng
  socket.on('privateFile', (data) => {
    const recipientSocket = Array.from(io.sockets.sockets).find(([id, sock]) => sock.username === data.recipient);
    if (recipientSocket) {
      io.to(recipientSocket[0]).emit('privateFile', data);
io.to(socket.id).emit('privateFile', data);
      if (data.recipient !== data.user) {
        io.to(recipientSocket[0]).emit('newMessageNotification', data);
        socket.emit('newMessageNotification', data);
      }
    }
  });
 // Xử lý ảnh riêng
  socket.on('privateImage', (data) => {
    const recipientSocket = Array.from(io.sockets.sockets).find(([id, sock]) => sock.username === data.recipient);
    if (recipientSocket) {
      io.to(recipientSocket[0]).emit('privateImage', data);
      io.to(socket.id).emit('privateImage', data);
      if (data.recipient !== data.user) {
        io.to(recipientSocket[0]).emit('newMessageNotification', data);
        socket.emit('newMessageNotification', data);
      }
    }
  });
