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
