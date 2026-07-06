const db = require('../database/db');

exports.getAll = (req, res) => {
  const { userId } = req.user;
  const rows = db.prepare('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY deadline ASC, created_at ASC').all(userId);
  res.json(rows);
};

exports.create = (req, res) => {
  const { userId } = req.user;
  const { name, target_amount, deadline } = req.body;

  if (!name || !target_amount || Number(target_amount) <= 0) {
    return res.status(400).json({ error: 'Nome e valor da meta são obrigatórios' });
  }

  const result = db.prepare('INSERT INTO savings_goals (user_id, name, target_amount, deadline) VALUES (?, ?, ?, ?)').run(userId, name, Number(target_amount), deadline || null);
  const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(goal);
};

exports.update = (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { name, target_amount, deadline } = req.body;

  const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?').get(id, userId);
  if (!goal) return res.status(404).json({ error: 'Meta não encontrada' });

  db.prepare('UPDATE savings_goals SET name = ?, target_amount = ?, deadline = ? WHERE id = ?').run(
    name || goal.name,
    target_amount ? Number(target_amount) : goal.target_amount,
    deadline !== undefined ? (deadline || null) : goal.deadline,
    id
  );

  const updated = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);
  res.json(updated);
};

exports.deposit = (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { deposit_amount } = req.body;

  if (!deposit_amount || Number(deposit_amount) <= 0) {
    return res.status(400).json({ error: 'Valor do depósito deve ser maior que zero' });
  }

  const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?').get(id, userId);
  if (!goal) return res.status(404).json({ error: 'Meta não encontrada' });

  const newAmount = Math.min(goal.current_amount + Number(deposit_amount), goal.target_amount);
  db.prepare('UPDATE savings_goals SET current_amount = ? WHERE id = ?').run(newAmount, id);

  const updated = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);
  res.json(updated);
};

exports.remove = (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?').get(id, userId);
  if (!goal) return res.status(404).json({ error: 'Meta não encontrada' });

  db.prepare('DELETE FROM savings_goals WHERE id = ?').run(id);
  res.json({ success: true });
};
