import express from 'express';
import { db } from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 获取所有有效通告
router.get('/', authenticateToken, (req, res) => {
  try {
    const announcements = db.prepare(`
      SELECT a.*, u.username as creator_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.is_active = 1 
        AND (a.expires_at IS NULL OR a.expires_at > datetime('now'))
      ORDER BY a.priority DESC, a.created_at DESC
    `).all();

    res.json({ announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to get announcements' });
  }
});

// 创建通告 (仅管理员)
router.post('/', authenticateToken, (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Only admin can create announcements' });
    }

    const { content, priority = 0, expires_at } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = db.prepare(
      'INSERT INTO announcements (content, priority, expires_at, created_by) VALUES (?, ?, ?, ?)'
    ).run(content, priority, expires_at || null, req.user.id);

    const announcement = db.prepare(`
      SELECT a.*, u.username as creator_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ announcement });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// 更新通告
router.put('/:id', authenticateToken, (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Only admin can update announcements' });
    }

    const { content, priority, is_active, expires_at } = req.body;

    db.prepare(`
      UPDATE announcements 
      SET content = COALESCE(?, content),
          priority = COALESCE(?, priority),
          is_active = COALESCE(?, is_active),
          expires_at = ?
      WHERE id = ?
    `).run(content, priority, is_active, expires_at, req.params.id);

    res.json({ message: 'Announcement updated' });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// 删除通告
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Only admin can delete announcements' });
    }

    db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

export default router;
