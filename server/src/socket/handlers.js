import jwt from 'jsonwebtoken';
import { db } from '../db/init.js';

// 在线用户Map: socketId -> user
const onlineUsers = new Map();
// 用户socketMap: userId -> Set<socketId>
const userSockets = new Map();

export function setupSocketHandlers(io) {
  // JWT认证中间件
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = db.prepare('SELECT id, username, avatar, is_admin FROM users WHERE id = ?').get(decoded.userId);
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[Socket] User connected: ${user.username} (${socket.id})`);

    // 添加到在线列表
    onlineUsers.set(socket.id, user);
    if (!userSockets.has(user.id)) {
      userSockets.set(user.id, new Set());
    }
    userSockets.get(user.id).add(socket.id);

    // 更新数据库在线状态
    db.prepare('UPDATE users SET is_online = 1, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // 广播用户上线
    socket.broadcast.emit('notification', {
      type: 'online',
      userId: user.id,
      username: user.username,
      message: `${user.username} is online`
    });

    // 发送在线用户列表
    io.emit('online_users', Array.from(onlineUsers.values()));

    // 广播更新后的用户列表
    broadcastUserList(io);

    // 加入群聊房间
    socket.join('global');

    // 处理消息
    socket.on('message', (data) => {
      try {
        const { content, type = 'normal', reply_to } = data;

        if (!content || content.trim().length === 0) {
          return;
        }

        // 保存消息
        const result = db.prepare(
          'INSERT INTO messages (user_id, content, type, reply_to) VALUES (?, ?, ?, ?)'
        ).run(user.id, content.trim(), type, reply_to || null);

        const message = db.prepare(`
          SELECT m.*, u.username, u.avatar, u.is_admin
          FROM messages m
          JOIN users u ON m.user_id = u.id
          WHERE m.id = ?
        `).get(result.lastInsertRowid);

        // 获取回复内容
        if (message.reply_to) {
          const reply = db.prepare(`
            SELECT m.*, u.username 
            FROM messages m 
            JOIN users u ON m.user_id = u.id 
            WHERE m.id = ?
          `).get(message.reply_to);
          message.reply_content = reply?.content;
          message.reply_username = reply?.username;
        }

        io.to('global').emit('message', message);

        // 如果是回复，通知被回复者
        if (reply_to) {
          const originalMsg = db.prepare('SELECT user_id FROM messages WHERE id = ?').get(reply_to);
          if (originalMsg && originalMsg.user_id !== user.id) {
            sendNotification(io, originalMsg.user_id, {
              type: 'reply',
              content: `${user.username} replied to your message`,
              messageId: message.id
            });
          }
        }
      } catch (error) {
        console.error('Message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // 处理私信
    socket.on('private', (data) => {
      try {
        const { receiver_id, content } = data;

        if (!receiver_id || !content || content.trim().length === 0) {
          return;
        }

        // 保存私信
        const result = db.prepare(
          'INSERT INTO private_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)'
        ).run(user.id, receiver_id, content.trim());

        const message = {
          id: result.lastInsertRowid,
          sender_id: user.id,
          sender_username: user.username,
          sender_avatar: user.avatar,
          receiver_id,
          content: content.trim(),
          created_at: new Date().toISOString()
        };

        // 发送给接收者（如果在线）
        const receiverSockets = userSockets.get(receiver_id);
        if (receiverSockets) {
          receiverSockets.forEach(socketId => {
            io.to(socketId).emit('private', message);
          });
        }

        // 发送确认给发送者
        socket.emit('private_sent', message);

        // 未读通知
        if (!receiverSockets) {
          db.prepare(
            'INSERT INTO notifications (user_id, type, content) VALUES (?, ?, ?)'
          ).run(receiver_id, 'private', `New private message from ${user.username}`);
        }
      } catch (error) {
        console.error('Private message error:', error);
        socket.emit('error', { message: 'Failed to send private message' });
      }
    });

    // 正在输入
    socket.on('typing', (data) => {
      const { type, receiver_id } = data;
      
      if (type === 'private' && receiver_id) {
        const receiverSockets = userSockets.get(receiver_id);
        if (receiverSockets) {
          receiverSockets.forEach(socketId => {
            io.to(socketId).emit('user_typing', {
              userId: user.id,
              username: user.username,
              type: 'private'
            });
          });
        }
      } else {
        socket.to('global').emit('user_typing', {
          userId: user.id,
          username: user.username,
          type: 'group'
        });
      }
    });

    // 接龙更新
    socket.on('chain_update', (data) => {
      io.to('global').emit('chain_update', data);
    });

    // 通告更新
    socket.on('announcement_update', (data) => {
      io.to('global').emit('announcement', data);
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${user.username} (${socket.id})`);

      // 从在线列表移除
      onlineUsers.delete(socket.id);
      
      const sockets = userSockets.get(user.id);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(user.id);
          // 更新数据库在线状态
          db.prepare('UPDATE users SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

          // 广播用户离线
          socket.broadcast.emit('notification', {
            type: 'offline',
            userId: user.id,
            username: user.username,
            message: `${user.username} is offline`
          });
        }
      }

      // 广播更新后的用户列表
      broadcastUserList(io);
    });
  });
}

// 广播用户列表
function broadcastUserList(io) {
  const users = db.prepare(`
    SELECT id, username, avatar, is_admin, is_online, last_seen 
    FROM users 
    ORDER BY is_online DESC, last_seen DESC
  `).all();
  io.emit('users_list', users);
}

// 发送通知
function sendNotification(io, userId, notification) {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.forEach(socketId => {
      io.to(socketId).emit('notification', notification);
    });
  } else {
    db.prepare(
      'INSERT INTO notifications (user_id, type, content) VALUES (?, ?, ?)'
    ).run(userId, notification.type, notification.content);
  }
}
