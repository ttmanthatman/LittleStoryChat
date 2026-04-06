import express from 'express';
import { db } from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 获取所有用户
router.get('/', authenticateToken, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, avatar, is_admin, is_online, last_seen, created_at 
      FROM users 
      ORDER BY is_online DESC, last_seen DESC
    `).all();

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// 获取单个用户
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, avatar, is_admin, is_online, last_seen, created_at 
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// 获取当前用户信息
router.get('/me/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// 更新头像
router.put('/avatar', authenticateToken, (req, res) => {
  try {
    const { avatar } = req.body;
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.user.id);
    res.json({ message: 'Avatar updated', avatar });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

export default router;
