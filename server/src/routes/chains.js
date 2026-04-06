import express from 'express';
import { db } from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 获取所有接龙
router.get('/', authenticateToken, (req, res) => {
  try {
    const chains = db.prepare(`
      SELECT wc.*, u.username as creator_name,
             (SELECT COUNT(*) FROM chain_entries WHERE chain_id = wc.id) as entry_count
      FROM word_chains wc
      JOIN users u ON wc.creator_id = u.id
      WHERE wc.is_active = 1
      ORDER BY wc.created_at DESC
    `).all();

    res.json({ chains });
  } catch (error) {
    console.error('Get chains error:', error);
    res.status(500).json({ error: 'Failed to get chains' });
  }
});

// 获取单个接龙详情
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const chain = db.prepare(`
      SELECT wc.*, u.username as creator_name,
             (SELECT COUNT(*) FROM chain_entries WHERE chain_id = wc.id) as entry_count
      FROM word_chains wc
      JOIN users u ON wc.creator_id = u.id
      WHERE wc.id = ?
    `).get(req.params.id);

    if (!chain) {
      return res.status(404).json({ error: 'Chain not found' });
    }

    // 获取接龙记录
    const entries = db.prepare(`
      SELECT ce.*, u.username, u.avatar
      FROM chain_entries ce
      JOIN users u ON ce.user_id = u.id
      WHERE ce.chain_id = ?
      ORDER BY ce.id ASC
    `).all(req.params.id);

    res.json({ chain, entries });
  } catch (error) {
    console.error('Get chain error:', error);
    res.status(500).json({ error: 'Failed to get chain' });
  }
});

// 创建接龙
router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, word } = req.body;

    if (!title || !word) {
      return res.status(400).json({ error: 'Title and word are required' });
    }

    const result = db.prepare(
      'INSERT INTO word_chains (creator_id, title, current_word) VALUES (?, ?, ?)'
    ).run(req.user.id, title, word);

    const chain = db.prepare(`
      SELECT wc.*, u.username as creator_name
      FROM word_chains wc
      JOIN users u ON wc.creator_id = u.id
      WHERE wc.id = ?
    `).get(result.lastInsertRowid);

    // 添加创建者作为第一条记录
    db.prepare(
      'INSERT INTO chain_entries (chain_id, user_id, word) VALUES (?, ?, ?)'
    ).run(result.lastInsertRowid, req.user.id, word);

    res.status(201).json({ chain });
  } catch (error) {
    console.error('Create chain error:', error);
    res.status(500).json({ error: 'Failed to create chain' });
  }
});

// 参与接龙
router.post('/:id/join', authenticateToken, (req, res) => {
  try {
    const { word } = req.body;
    const chainId = req.params.id;

    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const chain = db.prepare('SELECT * FROM word_chains WHERE id = ? AND is_active = 1').get(chainId);
    if (!chain) {
      return res.status(404).json({ error: 'Chain not found or inactive' });
    }

    // 验证词语是否接得上
    const lastChar = chain.current_word.slice(-1);
    const firstChar = word.charAt(0);
    
    // 忽略声调
    const normalizeChar = (char) => {
      const map = { 'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
                    'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
                    'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
                    'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
                    'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u' };
      return map[char] || char;
    };

    if (normalizeChar(lastChar) !== normalizeChar(firstChar)) {
      return res.status(400).json({ 
        error: `Words must connect! Last word ends with "${chain.current_word.slice(-1)}", but your word starts with "${firstChar}"` 
      });
    }

    // 添加接龙记录
    db.prepare(
      'INSERT INTO chain_entries (chain_id, user_id, word) VALUES (?, ?, ?)'
    ).run(chainId, req.user.id, word);

    // 更新接龙的当前词语
    db.prepare(
      'UPDATE word_chains SET current_word = ?, last_word = ? WHERE id = ?'
    ).run(word, chain.current_word, chainId);

    res.json({ message: 'Joined chain successfully', word });
  } catch (error) {
    console.error('Join chain error:', error);
    res.status(500).json({ error: 'Failed to join chain' });
  }
});

// 结束接龙
router.post('/:id/end', authenticateToken, (req, res) => {
  try {
    const chain = db.prepare('SELECT * FROM word_chains WHERE id = ?').get(req.params.id);
    
    if (!chain) {
      return res.status(404).json({ error: 'Chain not found' });
    }

    if (chain.creator_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Only the creator or admin can end this chain' });
    }

    db.prepare(
      'UPDATE word_chains SET is_active = 0, ended_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(req.params.id);

    res.json({ message: 'Chain ended successfully' });
  } catch (error) {
    console.error('End chain error:', error);
    res.status(500).json({ error: 'Failed to end chain' });
  }
});

export default router;
