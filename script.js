const socket = io('http://localhost:3000');
const auth = document.getElementById('auth');
const lobby = document.getElementById('lobby');
const chatRoom = document.getElementById('chat-room');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authBtn = document.getElementById('auth-btn');
const switchLink = document.getElementById('switch-link');
const searchIcon = document.getElementById('search-icon');
const searchContainer = document.getElementById('search-container');
const searchUser = document.getElementById('search-user');
const onlineUsers = document.getElementById('online-users');
const notifications = document.getElementById('notifications');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const addBtn = document.getElementById('add-btn');
const attachmentMenu = document.getElementById('attachment-menu');
const fileOption = document.getElementById('file-option');
const imageOption = document.getElementById('image-option');
const fileUpload = document.getElementById('file-upload');
const imageUpload = document.getElementById('image-upload');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const backBtn = document.getElementById('back-btn');
const chatPartner = document.getElementById('chat-partner');
const userIcon = document.getElementById('user-icon');
const profileModal = document.getElementById('profile-modal');
const closeBtn = document.getElementById('close-btn');
const avatarUpload = document.getElementById('avatar-upload');
const changeAvatarBtn = document.getElementById('change-avatar-btn');
const profileName = document.getElementById('profile-name');
const profilePhone = document.getElementById('profile-phone');
const profileBio = document.getElementById('profile-bio');
const saveProfileBtn = document.getElementById('save-profile-btn');
const profileAvatar = document.getElementById('profile-avatar');
const moreBtn = document.getElementById('more-btn');
const partnerProfileModal = document.getElementById('partner-profile-modal');
const partnerCloseBtn = document.getElementById('partner-close-btn');
const partnerProfileAvatar = document.getElementById('partner-profile-avatar');
const partnerProfileName = document.getElementById('partner-profile-name');
const partnerProfilePhone = document.getElementById('partner-profile-phone');
const partnerProfileBio = document.getElementById('partner-profile-bio');
const chatHeaderAvatar = document.getElementById('chat-header-avatar');

let currentUserData = null;
let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let currentChatWith = null;
let isRegisterMode = false;
let notificationsData = {};
let userProfile = {
  avatar: 'https://i.imgur.com/1QbL8kM.png',
  name: '',
  phone: '',
  bio: ''
};

const users = {};

const conversations = {};
const avatars = [
  'https://i.imgur.com/1QbL8kM.png',
  'https://i.imgur.com/2QbL8kM.png',
  'https://i.imgur.com/3QbL8kM.png',
  'https://i.imgur.com/4QbL8kM.png',
  'https://i.imgur.com/5QbL8kM.png'
];

let partnerProfiles = {};

// Chuyển đổi giữa đăng nhập và đăng ký
switchLink.addEventListener('click', () => {
  isRegisterMode = !isRegisterMode;
  authBtn.textContent = isRegisterMode ? 'Đăng Ký' : 'Đăng Nhập';
  switchLink.textContent = isRegisterMode ? 'Đã có tài khoản? Đăng Nhập' : 'Chưa có tài khoản? Đăng Ký';
});

// Xử lý đăng ký/đăng nhập
authBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) {
    alert('Vui lòng nhập tên người dùng và mật khẩu!');
    return;
  }
  if (isRegisterMode) {
    socket.emit('register', { username, password });
  } else {
    socket.emit('login', { username, password });
  }
});

// Xử lý phản hồi từ server
socket.on('registerSuccess', () => {
  alert('Đăng ký thành công! Vui lòng đăng nhập.');
});

socket.on('registerError', (data) => {
  alert(data.message);
});

socket.on('loginSuccess', (data) => {
  currentUserData = data;
  auth.style.display = 'none';
  lobby.style.display = 'flex';
  socket.emit('joinRoom', { username: data.username, room: 'global' });
  userProfile.name = data.username || '';
  profileName.value = userProfile.name;
  profilePhone.value = userProfile.phone || '';
  profileBio.value = userProfile.bio || '';
  userProfile.avatar = avatars[Math.floor(Math.random() * avatars.length)];
  profileAvatar.src = userProfile.avatar;
  chatHeaderAvatar.src = userProfile.avatar; // Cập nhật avatar header
  socket.emit('updateProfile', { username: data.username, profile: userProfile });
  socket.emit('getAllProfiles'); // Yêu cầu tất cả profile từ server
});

socket.on('loginError', (data) => {
  alert(data.message);
});

// Tìm kiếm người dùng bằng kính lúp (tên hoặc số điện thoại)
searchIcon.addEventListener('click', () => {
  searchContainer.classList.toggle('active');
  searchUser.placeholder = 'Tìm tên hoặc số điện thoại...';
  searchUser.focus();
});

searchUser.addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase();
  if (query) {
    socket.emit('searchUsersByNameOrPhone', query);
  } else {
    socket.emit('getOnlineUsers'); // Hiển thị tất cả người dùng online nếu không có query
  }
});

socket.on('searchResultsByNameOrPhone', (results) => {
  onlineUsers.innerHTML = '';
  results.forEach(user => {
    if (user.username !== currentUserData.username) {
      const userItem = document.createElement('div');
      userItem.classList.add('user-item');
      const avatar = document.createElement('img');
      avatar.classList.add('avatar');
      avatar.src = partnerProfiles[user.username]?.avatar || avatars[Math.floor(Math.random() * avatars.length)];
      const usernameSpan = document.createElement('span');
usernameSpan.classList.add('user-name');
      usernameSpan.textContent = partnerProfiles[user.username]?.name || user.username;
      const phoneSpan = document.createElement('span');
      phoneSpan.style.fontSize = '12px';
      phoneSpan.style.color = '#6c757d';
      phoneSpan.textContent = partnerProfiles[user.username]?.phone ? `(${partnerProfiles[user.username].phone})` : '';
      const status = document.createElement('span');
      status.classList.add('status');
      userItem.appendChild(avatar);
      userItem.appendChild(usernameSpan);
      if (phoneSpan.textContent) userItem.appendChild(phoneSpan);
      userItem.appendChild(status);
      userItem.addEventListener('click', () => openChat(user.username));
      onlineUsers.appendChild(userItem);
    }
  });
});

// Cập nhật danh sách người online
socket.on('updateOnlineUsers', (onlineList) => {
  onlineList = onlineList.filter(user => user !== currentUserData.username);
  onlineUsers.innerHTML = '';
  onlineList.forEach(user => {
    const userItem = document.createElement('div');
    userItem.classList.add('user-item');
    const avatar = document.createElement('img');
    avatar.classList.add('avatar');
    avatar.src = partnerProfiles[user]?.avatar || avatars[Math.floor(Math.random() * avatars.length)];
    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('user-name');
    usernameSpan.textContent = partnerProfiles[user]?.name || user;
    const phoneSpan = document.createElement('span');
    phoneSpan.style.fontSize = '12px';
    phoneSpan.style.color = '#6c757d';
    phoneSpan.textContent = partnerProfiles[user]?.phone ? `(${partnerProfiles[user].phone})` : '';
    const status = document.createElement('span');
    status.classList.add('status');
    userItem.appendChild(avatar);
    userItem.appendChild(usernameSpan);
    if (phoneSpan.textContent) userItem.appendChild(phoneSpan);
    userItem.appendChild(status);
    userItem.addEventListener('click', () => openChat(user));
    onlineUsers.appendChild(userItem);
  });
});

// Nhận tất cả profile từ server
socket.on('allProfiles', (profilesData) => {
  partnerProfiles = profilesData;
  socket.emit('getOnlineUsers');
});

// Nhận cập nhật profile từ người khác
socket.on('profileUpdate', (data) => {
  partnerProfiles[data.username] = data.profile;
  if (currentChatWith === data.username) {
    chatPartner.textContent = data.profile.name || data.username;
    chatHeaderAvatar.src = data.profile.avatar || avatars[Math.floor(Math.random() * avatars.length)];
  }
  socket.emit('getOnlineUsers');
});

// Xử lý thông báo tin nhắn
socket.on('newMessageNotification', (data) => {
  if (data.recipient === currentUserData.username) {
    notificationsData[data.user] = data;
    updateNotifications();
    if (currentChatWith === data.user) {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message');
messageDiv.classList.add(data.user === currentUserData.username ? 'sent' : 'received');
      messageDiv.innerHTML = `${data.text || (data.file ? `<a href="${data.file}" target="_blank">${data.fileName}</a><br><small>${data.time}</small>` : (data.audio ? `<audio controls src="${data.audio}"></audio><br><small>${data.time}</small>` : '<img src="' + data.image + '" width="100"><br><small>' + data.time + '</small>'))}`;
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
});

function updateNotifications() {
  notifications.innerHTML = '';
  Object.values(notificationsData).forEach((notification) => {
    const notifItem = document.createElement('div');
    notifItem.classList.add('notification-item');
    const avatar = document.createElement('img');
    avatar.classList.add('avatar');
    avatar.src = partnerProfiles[notification.user]?.avatar || avatars[Math.floor(Math.random() * avatars.length)];
    const content = document.createElement('span');
    content.classList.add('content');
    content.innerHTML = `<strong>${partnerProfiles[notification.user]?.name || notification.user}</strong>: ${notification.text ? notification.text : (notification.file ? `Tệp: ${notification.fileName}` : (notification.audio ? 'Ghi âm' : 'Hình ảnh'))}<small>${notification.time}</small>`;
    const deleteBtn = document.createElement('span');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => {
      delete notificationsData[notification.user];
      updateNotifications();
    });
    notifItem.appendChild(avatar);
    notifItem.appendChild(content);
    notifItem.appendChild(deleteBtn);
    notifications.appendChild(notifItem);
  });
}

// Mở giao diện chat riêng
function openChat(user) {
  currentChatWith = user;
  chatPartner.textContent = partnerProfiles[user]?.name || user;
  chatHeaderAvatar.src = partnerProfiles[user]?.avatar || avatars[Math.floor(Math.random() * avatars.length)];
  lobby.style.display = 'none';
  chatRoom.style.display = 'flex';
  chatMessages.innerHTML = '';
  const userMessages = Object.values(conversations).filter(msg => (msg.user === user && msg.recipient === currentUserData.username) || (msg.user === currentUserData.username && msg.recipient === user));
  userMessages.sort((a, b) => new Date(a.time) - new Date(b.time));
  userMessages.forEach(msg => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(msg.user === currentUserData.username ? 'sent' : 'received');
    messageDiv.innerHTML = `${msg.text || (msg.file ? `<a href="${msg.file}" target="_blank">${msg.fileName}</a><br><small>${msg.time}</small>` : (msg.audio ? `<audio controls src="${msg.audio}"></audio><br><small>${msg.time}</small>` : '<img src="' + msg.image + '" width="100"><br><small>' + msg.time + '</small>'))}`;
chatMessages.appendChild(messageDiv);
  });
  delete notificationsData[user];
  updateNotifications();
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Đóng giao diện chat
backBtn.addEventListener('click', () => {
  chatRoom.style.display = 'none';
  lobby.style.display = 'flex';
  currentChatWith = null;
});

// Gửi tin nhắn
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim() && currentUserData && currentChatWith) {
    const data = { user: currentUserData.username, text: chatInput.value.trim(), recipient: currentChatWith, time: new Date().toLocaleTimeString() };
    socket.emit('privateMessage', data);
    chatInput.value = '';
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'sent');
    messageDiv.innerHTML = `${data.text}<br><small>${data.time}</small>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

sendBtn.addEventListener('click', () => {
  const message = chatInput.value.trim();
  if (message && currentUserData && currentChatWith) {
    const data = { user: currentUserData.username, text: message, recipient: currentChatWith, time: new Date().toLocaleTimeString() };
    socket.emit('privateMessage', data);
    chatInput.value = '';
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'sent');
    messageDiv.innerHTML = `${data.text}<br><small>${data.time}</small>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

// Xử lý menu thả xuống
addBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  attachmentMenu.classList.toggle('active');
  if (attachmentMenu.classList.contains('active')) {
    const rect = addBtn.getBoundingClientRect();
    attachmentMenu.style.top = rect.top - attachmentMenu.offsetHeight > 0 ? '-90px' : 'auto';
    attachmentMenu.style.bottom = rect.top - attachmentMenu.offsetHeight > 0 ? '100%' : 'auto';
  }
});

document.addEventListener('click', (e) => {
  if (!attachmentMenu.contains(e.target) && e.target !== addBtn) {
    attachmentMenu.classList.remove('active');
  }
});

// Xử lý gửi file
fileOption.addEventListener('click', () => {
  fileUpload.click();
  attachmentMenu.classList.remove('active');
});

fileUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && currentUserData && currentChatWith) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = {
        user: currentUserData.username,
        file: event.target.result,
        fileName: file.name,
        recipient: currentChatWith,
        time: new Date().toLocaleTimeString()
      };
      socket.emit('privateFile', data);
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', 'sent');
messageDiv.innerHTML = `<a href="${data.file}" target="_blank">${data.fileName}</a><br><small>${data.time}</small>`;
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    reader.readAsDataURL(file);
    fileUpload.value = '';
  }
});

// Xử lý gửi ảnh
imageOption.addEventListener('click', () => {
  imageUpload.click();
  attachmentMenu.classList.remove('active');
});

imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && currentUserData && currentChatWith) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = {
        user: currentUserData.username,
        image: event.target.result,
        recipient: currentChatWith,
        time: new Date().toLocaleTimeString()
      };
      socket.emit('privateImage', data);
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', 'sent');
      messageDiv.innerHTML = `<img src="${data.image}" width="100"><br><small>${data.time}</small>`;
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    reader.readAsDataURL(file);
    imageUpload.value = '';
  }
});

// Xử lý ghi âm từ Mic
micBtn.addEventListener('click', () => {
  if (!isRecording) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const reader = new FileReader();
          reader.onload = (event) => {
            const data = {
              user: currentUserData.username,
              audio: event.target.result,
              recipient: currentChatWith,
              time: new Date().toLocaleTimeString()
            };
            socket.emit('privateAudio', data);
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', 'sent');
            messageDiv.innerHTML = `<audio controls src="${data.audio}"></audio><br><small>${data.time}</small>`;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
          };
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
        isRecording = true;
        micBtn.classList.add('recording');
      })
      .catch(err => {
        console.error('Lỗi ghi âm:', err);
        alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền!');
      });
  } else {
    mediaRecorder.stop();
    isRecording = false;
    micBtn.classList.remove('recording');
  }
});

// Nhận tin nhắn
socket.on('privateMessage', (data) => {
  if (data.recipient === currentUserData.username) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(data.user === currentUserData.username ? 'sent' : 'received');
    messageDiv.innerHTML = `${data.text}<br><small>${data.time}</small>`;
    if (currentChatWith === data.user) {
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    if (data.recipient === currentUserData.username && currentChatWith !== data.user) {
      socket.emit('newMessageNotification', data);
    }
    conversations[data.user] = data;
  }
});

socket.on('privateFile', (data) => {
  if (data.recipient === currentUserData.username) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(data.user === currentUserData.username ? 'sent' : 'received');
    messageDiv.innerHTML = `<a href="${data.file}" target="_blank">${data.fileName}</a><br><small>${data.time}</small>`;
    if (currentChatWith === data.user) {
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    if (data.recipient === currentUserData.username && currentChatWith !== data.user) {
      socket.emit('newMessageNotification', data);
    }
    conversations[data.user] = data;
  }
});

socket.on('privateImage', (data) => {
  if (data.recipient === currentUserData.username) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(data.user === currentUserData.username ? 'sent' : 'received');
    messageDiv.innerHTML = `<img src="${data.image}" width="100"><br><small>${data.time}</small>`;
    if (currentChatWith === data.user) {
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    if (data.recipient === currentUserData.username && currentChatWith !== data.user) {
      socket.emit('newMessageNotification', data);
    }
    conversations[data.user] = data;
  }
});

socket.on('privateAudio', (data) => {
  if (data.recipient === currentUserData.username) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(data.user === currentUserData.username ? 'sent' : 'received');
    messageDiv.innerHTML = `<audio controls src="${data.audio}"></audio><br><small>${data.time}</small>`;
    if (currentChatWith === data.user) {
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    if (data.recipient === currentUserData.username && currentChatWith !== data.user) {
      socket.emit('newMessageNotification', data);
    }
    conversations[data.user] = data;
  }
});

// Xử lý mở và đóng profile modal
userIcon.addEventListener('click', () => {
  profileModal.style.display = 'block';
profileName.value = userProfile.name;
  profilePhone.value = userProfile.phone || '';
  profileBio.value = userProfile.bio || '';
  profileAvatar.src = userProfile.avatar;
});

closeBtn.addEventListener('click', () => {
  profileModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === profileModal) {
    profileModal.style.display = 'none';
  }
});

// Xử lý thay đổi avatar
changeAvatarBtn.addEventListener('click', () => {
  avatarUpload.click();
});

avatarUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      userProfile.avatar = event.target.result;
      profileAvatar.src = userProfile.avatar;
      chatHeaderAvatar.src = userProfile.avatar; // Cập nhật avatar header
      socket.emit('updateProfile', { username: currentUserData.username, profile: userProfile });
    };
    reader.readAsDataURL(file);
    avatarUpload.value = '';
  }
});

// Lưu thông tin profile
saveProfileBtn.addEventListener('click', () => {
  userProfile.name = profileName.value.trim();
  userProfile.phone = profilePhone.value.trim();
  userProfile.bio = profileBio.value.trim();
  socket.emit('updateProfile', { username: currentUserData.username, profile: userProfile });
  alert('Thông tin đã được lưu!');
  profileModal.style.display = 'none';
});

// Xử lý mở profile của người kia
moreBtn.addEventListener('click', () => {
  if (currentChatWith) {
    partnerProfileModal.style.display = 'block';
    const partnerData = partnerProfiles[currentChatWith] || { avatar: avatars[Math.floor(Math.random() * avatars.length)], name: currentChatWith, phone: '', bio: '' };
    partnerProfileAvatar.src = partnerData.avatar;
    partnerProfileName.value = partnerData.name || currentChatWith;
    partnerProfilePhone.value = partnerData.phone || '';
    partnerProfileBio.value = partnerData.bio || '';
  }
});

partnerCloseBtn.addEventListener('click', () => {
  partnerProfileModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === partnerProfileModal) {
    partnerProfileModal.style.display = 'none';
  }
});
