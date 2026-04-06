import express from 'express';
import { db } from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 获取群聊消息历史
router.get('/', authenticateToken, (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    
    let query = `
      SELECT m.id, m.content, m.type, m.reply_to, m.created_at,
             u.id as user_id, u.username, u.avatar, u.is_admin,
             r.content as reply_content, r.username as reply_username
      FROM messages m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN (
        SELECT m2.id, m2.content, u2.username
        FROM messages m2
        JOIN users u2 ON m2.user_id = u2.id
      ) r ON m.reply_to = r.id
    `;
    
    const params = [];
    if (before) {
      query += ' WHERE m.id < ?';
      params.push(parseInt(before));
    }
    
    query += ' ORDER BY m.id DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const messages = db.prepare(query).all(...params);
    
    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// 获取与某用户的私信记录
router.get('/private/:userId', authenticateToken, (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    const otherUserId = parseInt(req.params.userId);
    
    let query = `
      SELECT pm.*,
             sender.username as sender_username, sender.avatar as sender_avatar,
             receiver.username as receiver_username, receiver.avatar as receiver_avatar
      FROM private_messages pm
      JOIN users sender ON pm.sender_id = sender.id
      JOIN users receiver ON pm.receiver_id = receiver.id
      WHERE (pm.sender_id = ? AND pm.receiver_id = ?)
         OR (pm.sender_id = ? AND pm.receiver_id = ?)
    `;
    
    const params = [req.user.id, otherUserId, otherUserId, req.user.id];
    
    if (before) {
      query += ' AND pm.id < ?';
      params.push(parseInt(before));
    }
    
    query += ' ORDER BY pm.id DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const messages = db.prepare(query).all(...params);
    
    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get private messages error:', error);
    res.status(500).json({ error: 'Failed to get private messages' });
  }
});

// 获取私信会话列表
router.get('/conversations', authenticateToken, (req, res) => {
  try {
    // 获取与当前用户有私信往来的用户列表
    const conversations = db.prepare(`
      SELECT 
        CASE 
          WHEN sender_id = ? THEN receiver_id 
          ELSE sender_id 
        END as user_id,
        u.username, u.avatar, u.is_online,
        (
          SELECT content FROM private_messages 
          WHERE (sender_id = ? AND receiver_id = u.id) 
             OR (sender_id = u.id AND receiver_id = ?)
          ORDER BY id DESC LIMIT 1
        ) as last_message,
        (
          SELECT created_at FROM private_messages 
          WHERE (sender_id = ? AND receiver_id = u.id) 
             OR (sender_id = u.id AND receiver_id = ?)
          ORDER BY id DESC LIMIT 1
        ) as last_time,
        (
          SELECT COUNT(*) FROM private_messages 
          WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0
        ) as unread_count
      FROM (
        SELECT DISTINCT sender_id, receiver_id FROM private_messages
        WHERE sender_id = ? OR receiver_id = ?
      ) pm
      JOIN users u ON u.id = CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
      ORDER BY last_time DESC
    `).all(
      req.user.id, req.user.id, req.user.id,
      req.user.id, req.user.id, req.user.id,
      req.user.id, req.user.id, req.user.id
    );

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

export default router;
